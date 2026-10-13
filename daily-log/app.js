(function () {
  'use strict';

  /* ================= config ================= */

  var APP_NAME = 'Daily Log';
  var K = {
    entries: 'dl_entries',
    active: 'dl_active',
    puzzle: 'dl_puzzle',
    done: 'dl_done',
    settings: 'dl_settings'
  };
  var IDLE_MS = 10 * 60 * 1000;
  var MIN_FOR_INSIGHTS = 7;
  var DEFAULT_TAGS = ['coffee', 'spicy food', 'alcohol', 'travel', 'stress', 'period', 'new meds', 'blood', 'black stool'];
  var BRISTOL = [
    '',
    'Type 1: separate hard lumps',
    'Type 2: lumpy, sausage-shaped',
    'Type 3: sausage with cracks',
    'Type 4: smooth, soft sausage',
    'Type 5: soft blobs',
    'Type 6: mushy, ragged edges',
    'Type 7: watery, no solid pieces'
  ];

  /* ================= pictures ================= */

  var PICS = [
    { id: 'smiley', name: 'Smiley', bg: '#7fb3d5', pal: { y: '#ffd54f', k: '#2a2438' },
      rows: ['.yyy.', 'ykyky', 'yyyyy', 'ykkky', '.yyy.'] },
    { id: 'heart', name: 'Heart', bg: '#fff1e0', pal: { r: '#e63950', p: '#ff9aa8', d: '#a8203a' },
      rows: ['.rr..rr.', 'rrrrrrrr', 'rprrrrrr', 'rrrrrrrd', '.rrrrrd.', '..rrrd..', '...rd...'] },
    { id: 'mushroom', name: 'Mushroom', bg: '#3b7a57', pal: { r: '#e04848', w: '#ffffff', c: '#f5deb3', s: '#d9b98a' },
      rows: ['..rrrr..', '.rwrrwr.', 'rrrwrrrr', 'rwrrrrwr', 'rrrrrrrr', '..cccc..', '..cscc..', '..cccc..'] },
    { id: 'cat', name: 'Cat', bg: '#cde7f0', pal: { o: '#f0a04b', k: '#2a2438', p: '#ff8fa3' },
      rows: ['o......o', 'oo....oo', 'oooooooo', 'ookookoo', 'oooooooo', 'oooppooo', '.oooooo.', '..oooo..'] },
    { id: 'icecream', name: 'Ice cream', bg: '#fff4d6', pal: { p: '#ff8fb1', w: '#ffffff', c: '#e0a458', b: '#b9772f' },
      rows: ['..pppp..', '.pppppp.', '.pppwpp.', '.pppppp.', '.bcbcbc.', '..cbcb..', '...bcb..', '....b...'] },
    { id: 'flower', name: 'Flower', bg: '#e8f5e9', pal: { p: '#f06292', y: '#ffd54f', g: '#43a047' },
      rows: ['..pppp..', '.ppyypp.', '.ppyypp.', '..pppp..', '...gg...', '.g.gg...', '.ggggg..', '...gg...'] },
    { id: 'house', name: 'House', bg: '#a5d8ff', pal: { r: '#c0392b', w: '#fff3d6', b: '#4aa3df', d: '#7b4a2d' },
      rows: ['...rr...', '..rrrr..', '.rrrrrr.', 'rrrrrrrr', '.wwwwww.', '.wbwwbw.', '.wwwddw.', '.wwwddw.'] },
    { id: 'apple', name: 'Apple', bg: '#fff3e0', pal: { r: '#e53935', w: '#ff8a80', d: '#a31515', b: '#6d4c41', g: '#43a047' },
      rows: ['...bg...', '.rrrrrr.', 'rrrrrrrr', 'rwrrrrrr', 'rrrrrrrr', 'rrrrrrrd', '.rrrrrd.', '..rrrr..'] },
    { id: 'cactus', name: 'Cactus', bg: '#f6e3b4', pal: { g: '#3f9b4f', f: '#ff6fa5', p: '#c9674a' },
      rows: ['...ff...', '...gg.g.', '.g.gg.g.', '.gggggg.', '...gg...', '...gg...', '.pppppp.', '..pppp..'] },
    { id: 'rocket', name: 'Rocket', bg: '#1a1b4b', pal: { r: '#e53935', w: '#f5f5f5', b: '#4fc3f7', y: '#ffca28', o: '#fb8c00' },
      rows: ['...rr...', '..rrrr..', '..wwww..', '..wbbw..', '..wwww..', '.rwwwwr.', 'rr.yy.rr', '...oo...'] }
  ];

  PICS.forEach(function (p) {
    p.h = p.rows.length;
    p.w = p.rows[0].length;
    p.target = p.rows.join('').split('');
  });

  function picById(id) {
    for (var i = 0; i < PICS.length; i++) if (PICS[i].id === id) return PICS[i];
    return null;
  }

  function colorOf(pic, ch) { return ch === '.' ? pic.bg : pic.pal[ch]; }

  /* ================= helpers ================= */

  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function pad(n) { return String(n).padStart(2, '0'); }

  function fmtDur(sec) {
    sec = Math.max(0, Math.round(sec));
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return h ? h + ':' + pad(m) + ':' + pad(s) : m + ':' + pad(s);
  }
  function fmtMin(sec) {
    if (sec == null) return 'no duration';
    var m = sec / 60;
    return (m < 10 ? String(Math.round(m * 10) / 10) : String(Math.round(m))) + ' min';
  }
  function fmtTime(ms) {
    return new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  function dayKey(ms) {
    var d = new Date(ms);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function fmtDay(ms) {
    var k = dayKey(ms);
    if (k === dayKey(Date.now())) return 'Today';
    if (k === dayKey(Date.now() - 864e5)) return 'Yesterday';
    return new Date(ms).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
  }
  function fmtStamp(ms) {
    var d = new Date(ms);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function toLocalInput(ms) {
    var d = new Date(ms);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function vibrate(n) { try { if (navigator.vibrate) navigator.vibrate(n); } catch (e) { /* ignore */ } }

  var toastTimer = null;
  function toast(msg) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  /* ================= storage ================= */

  var storageOK = true;
  var store = {
    get: function (k, d) {
      try {
        var v = localStorage.getItem(k);
        return v == null ? d : JSON.parse(v);
      } catch (e) { return d; }
    },
    set: function (k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); return true; }
      catch (e) { storageOK = false; return false; }
    },
    remove: function (k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };

  (function probe() {
    try { localStorage.setItem('dl_probe', '1'); localStorage.removeItem('dl_probe'); }
    catch (e) { storageOK = false; }
  })();

  function validEntry(e) {
    return e && typeof e === 'object' && typeof e.id === 'string' && typeof e.start === 'number' && isFinite(e.start);
  }
  function cleanEntry(e) {
    return {
      id: String(e.id),
      start: e.start,
      durationSec: typeof e.durationSec === 'number' && isFinite(e.durationSec) && e.durationSec >= 0 ? Math.round(e.durationSec) : null,
      bristol: e.bristol >= 1 && e.bristol <= 7 ? Math.round(e.bristol) : null,
      tags: Array.isArray(e.tags) ? e.tags.map(String).slice(0, 20) : [],
      note: typeof e.note === 'string' ? e.note.slice(0, 2000) : '',
      source: e.source === 'quick' ? 'quick' : 'session'
    };
  }

  var entries = store.get(K.entries, []);
  entries = Array.isArray(entries) ? entries.filter(validEntry).map(cleanEntry) : [];
  var active = store.get(K.active, null);
  if (!active || typeof active.start !== 'number') active = null;
  var puzzle = store.get(K.puzzle, null);
  var done = store.get(K.done, []);
  done = Array.isArray(done) ? done.filter(function (id) { return picById(id); }) : [];
  var settings = store.get(K.settings, {});
  if (!settings || typeof settings !== 'object') settings = {};
  if (!Array.isArray(settings.customTags)) settings.customTags = [];

  function saveEntries() { store.set(K.entries, entries); }
  function saveActive() { if (active) store.set(K.active, active); else store.remove(K.active); }
  function savePuzzle() { store.set(K.puzzle, puzzle); }
  function saveDone() { store.set(K.done, done); }
  function saveSettings() { store.set(K.settings, settings); }

  var persisted = null;
  try {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then(function (p) { persisted = p; }, function () {});
    }
  } catch (e) { /* ignore */ }

  /* ================= puzzle ================= */

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function newPuzzle(id) {
    var pic = picById(id);
    var best = null, bestFixed = Infinity;
    for (var n = 0; n < 40; n++) {
      var cells = shuffle(pic.target.slice());
      var fixed = 0;
      for (var i = 0; i < cells.length; i++) if (cells[i] === pic.target[i]) fixed++;
      if (fixed < cells.length && fixed < bestFixed) { best = cells; bestFixed = fixed; }
    }
    if (!best) best = pic.target.slice().reverse();
    return {
      id: id,
      cells: best,
      locked: best.map(function (c, i) { return c === pic.target[i]; })
    };
  }

  function nextPicId() {
    var undone = PICS.filter(function (p) { return done.indexOf(p.id) < 0; });
    if (undone.length) return undone[0].id;
    return PICS[Math.floor(Math.random() * PICS.length)].id;
  }

  function ensurePuzzle() {
    var pic = puzzle && picById(puzzle.id);
    var ok = pic && Array.isArray(puzzle.cells) && Array.isArray(puzzle.locked) &&
      puzzle.cells.length === pic.target.length && puzzle.locked.length === pic.target.length &&
      !puzzle.locked.every(Boolean);
    if (!ok) { puzzle = newPuzzle(nextPicId()); savePuzzle(); }
  }

  var sel = null;
  var lastSwap = [];

  function picSVG(pic, cells, ghost) {
    var out = '';
    var src = cells || pic.target;
    for (var y = 0; y < pic.h; y++) {
      for (var x = 0; x < pic.w; x++) {
        var ch = src[y * pic.w + x];
        if (ghost) {
          out += '<rect x="' + x + '" y="' + y + '" width="1.02" height="1.02" fill="currentColor" opacity="' + (pic.target[y * pic.w + x] === '.' ? 0.07 : 0.22) + '"/>';
        } else {
          out += '<rect x="' + x + '" y="' + y + '" width="1.02" height="1.02" fill="' + colorOf(pic, ch) + '"/>';
        }
      }
    }
    return '<svg class="pic" viewBox="0 0 ' + pic.w + ' ' + pic.h + '" shape-rendering="crispEdges" aria-hidden="true">' + out + '</svg>';
  }

  function puzzleHTML() {
    var pic = picById(puzzle.id);
    var placed = puzzle.locked.filter(Boolean).length;
    var h = '<div class="grid" style="--w:' + pic.w + '">';
    puzzle.cells.forEach(function (ch, i) {
      var lk = puzzle.locked[i];
      var cls = 'cell' + (lk ? ' locked' : '') + (sel === i ? ' sel' : '') + (lastSwap.indexOf(i) >= 0 ? ' pop' : '');
      h += '<button class="' + cls + '" data-action="cell" data-i="' + i + '" style="background:' + colorOf(pic, ch) + '" aria-label="Tile ' + (i + 1) + (lk ? ', in place' : '') + '"' + (lk ? ' tabindex="-1"' : '') + '></button>';
    });
    h += '</div><div class="progress">' + placed + ' of ' + pic.target.length + ' tiles in place</div>';
    return h;
  }

  function renderPuzzle() {
    var w = $('#puzzle-wrap');
    if (w) w.innerHTML = puzzleHTML();
  }

  function onCell(i) {
    if (!puzzle || puzzle.locked[i]) return;
    touch();
    lastSwap = [];
    if (sel === null) { sel = i; renderPuzzle(); return; }
    if (sel === i) { sel = null; renderPuzzle(); return; }
    var a = sel, b = i;
    sel = null;
    var t = picById(puzzle.id).target;
    var tmp = puzzle.cells[a];
    puzzle.cells[a] = puzzle.cells[b];
    puzzle.cells[b] = tmp;
    [a, b].forEach(function (x) { if (puzzle.cells[x] === t[x]) puzzle.locked[x] = true; });
    lastSwap = [a, b];
    savePuzzle();
    vibrate(8);
    renderPuzzle();
    if (puzzle.locked.every(Boolean)) onSolved();
  }

  function onSolved() {
    if (done.indexOf(puzzle.id) < 0) { done.push(puzzle.id); saveDone(); }
    vibrate([20, 40, 20]);
    sheet = { kind: 'solved', id: puzzle.id };
    renderSheet();
  }

  /* ================= session ================= */

  var view = 'home';
  var sheet = null;
  var wl = null;

  function lockScreen() {
    try {
      if ('wakeLock' in navigator && !wl) {
        navigator.wakeLock.request('screen').then(function (l) {
          wl = l;
          l.addEventListener('release', function () { wl = null; });
        }, function () {});
      }
    } catch (e) { /* ignore */ }
  }
  function unlockScreen() {
    try { if (wl) { wl.release(); wl = null; } } catch (e) { /* ignore */ }
  }

  function touch() {
    if (!active) return;
    active.lastActive = Date.now();
    saveActive();
  }

  function startSession() {
    var now = Date.now();
    active = { id: uid(), start: now, lastActive: now, bristol: null };
    saveActive();
    ensurePuzzle();
    sel = null; lastSwap = [];
    view = 'session';
    lockScreen();
    render();
  }

  function finishSession() {
    if (!active) return;
    if (Date.now() - active.lastActive > IDLE_MS) { openIdle(); return; }
    beginSummary(Date.now());
  }

  function beginSummary(endMs) {
    var sec = Math.max(0, Math.round((endMs - active.start) / 1000));
    openEntrySheet('summary', {
      start: active.start, durationSec: sec, bristol: active.bristol, tags: [], note: '', source: 'session'
    });
  }

  function openIdle() {
    sheet = { kind: 'idle' };
    renderSheet();
  }

  function checkIdle() {
    if (!active || sheet) return;
    if (Date.now() - active.lastActive > IDLE_MS) openIdle();
  }

  /* ================= sheets ================= */

  function allTags(extra) {
    var list = DEFAULT_TAGS.concat(settings.customTags);
    (extra || []).forEach(function (t) { if (list.indexOf(t) < 0) list.push(t); });
    return list;
  }

  function bristolPicker(v, action) {
    var h = '<div class="bristol" role="group" aria-label="Bristol stool type">';
    for (var i = 1; i <= 7; i++) {
      h += '<button class="bb' + (v === i ? ' on' : '') + '" data-action="' + action + '" data-v="' + i + '" aria-pressed="' + (v === i) + '">' + i + '</button>';
    }
    h += '</div><div class="blabel">' + (v ? esc(BRISTOL[v]) : 'Tap a type on the Bristol scale') + '</div>';
    return h;
  }

  function tagsHTML(selected) {
    return allTags(selected).map(function (t) {
      var on = selected.indexOf(t) >= 0;
      return '<button type="button" class="chip' + (on ? ' on' : '') + '" data-action="chip" data-tag="' + esc(t) + '" aria-pressed="' + on + '">' + esc(t) + '</button>';
    }).join('');
  }

  function openEntrySheet(mode, base) {
    var durInit = base.durationSec == null ? '' : (base.durationSec / 60).toFixed(1);
    sheet = {
      kind: 'entry',
      mode: mode,
      draft: {
        id: base.id,
        start: base.start,
        durationSec: base.durationSec,
        bristol: base.bristol || null,
        tags: (base.tags || []).slice(),
        note: base.note || '',
        source: base.source || 'session'
      },
      durInit: durInit
    };
    renderSheet();
  }

  function renderSheet() {
    var root = $('#sheet-root');
    document.body.classList.toggle('noscroll', !!sheet);
    if (!sheet) { root.innerHTML = ''; return; }
    var h = '';

    if (sheet.kind === 'entry') {
      var d = sheet.draft, m = sheet.mode;
      var title = m === 'summary' ? 'Session finished' : m === 'quick' ? 'Quick log' : 'Edit entry';
      h += '<div class="backdrop" data-action="sheet-close"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="' + title + '">';
      h += '<h2>' + title + '</h2>';
      if (m === 'summary') {
        h += '<div class="big-time">' + fmtDur(d.durationSec) + '</div><p class="muted small">Started at ' + fmtTime(d.start) + '</p>';
      } else {
        h += '<div class="field"><label for="f-when">When</label><input class="input" id="f-when" type="datetime-local" value="' + toLocalInput(d.start) + '"></div>';
      }
      h += '<div class="field"><label for="f-dur">Duration in minutes' + (m === 'summary' ? ' (change it if you forgot to stop)' : ', optional') + '</label>' +
        '<input class="input" id="f-dur" type="number" inputmode="decimal" min="0" step="0.5" value="' + sheet.durInit + '"></div>';
      h += '<div class="field"><div class="label">Bristol type</div><div data-bwrap="sheet">' + bristolPicker(d.bristol, 'sheet-bristol') + '</div></div>';
      h += '<div class="field"><div class="label">Tags</div><div class="chips" data-tags>' + tagsHTML(d.tags) + '</div>' +
        '<div class="addtag"><input class="input" id="f-newtag" maxlength="24" placeholder="New tag" aria-label="New tag name"><button type="button" class="btn inline" data-action="addtag">Add</button></div></div>';
      h += '<div class="field"><label for="f-note">Note</label><textarea class="input" id="f-note" maxlength="2000">' + esc(d.note) + '</textarea></div>';
      h += '<button class="btn primary" data-action="sheet-save">Save entry</button>';
      if (m === 'summary') h += '<button class="btn quiet" data-action="sheet-discard">Discard this session</button>';
      else if (m === 'edit') h += '<button class="btn danger" data-action="sheet-delete">Delete entry</button><button class="btn quiet" data-action="sheet-close">Cancel</button>';
      else h += '<button class="btn quiet" data-action="sheet-close">Cancel</button>';
      h += '</div>';
    } else if (sheet.kind === 'idle') {
      var lastMin = fmtMin((active.lastActive - active.start) / 1000);
      var nowMin = fmtMin((Date.now() - active.start) / 1000);
      h += '<div class="backdrop"></div><div class="sheet" role="dialog" aria-modal="true" aria-label="Session still open">';
      h += '<h2>Still on the toilet?</h2><p class="muted">Nothing was tapped since ' + fmtTime(active.lastActive) + '. When did you finish?</p>';
      h += '<button class="btn primary" data-action="idle-last">Around ' + fmtTime(active.lastActive) + ' (' + lastMin + ')</button>';
      h += '<button class="btn" data-action="idle-now">Just now (' + nowMin + ')</button>';
      h += '<button class="btn" data-action="idle-resume">Still going</button>';
      h += '<button class="btn quiet" data-action="idle-discard">Throw this session away</button>';
      h += '</div>';
    } else if (sheet.kind === 'solved') {
      var pic = picById(sheet.id);
      h += '<div class="backdrop"></div><div class="sheet center" role="dialog" aria-modal="true" aria-label="Picture restored">';
      h += '<h2>' + esc(pic.name) + ' restored</h2><div class="solved-pic">' + picSVG(pic) + '</div>';
      h += '<p class="muted">' + done.length + ' of ' + PICS.length + ' pictures in your gallery.</p>';
      h += '<button class="btn primary" data-action="next-pic">Next picture</button>';
      h += '</div>';
    } else if (sheet.kind === 'pic') {
      var p2 = picById(sheet.id);
      h += '<div class="backdrop" data-action="sheet-close"></div><div class="sheet center" role="dialog" aria-modal="true" aria-label="' + esc(p2.name) + '">';
      h += '<h2>' + esc(p2.name) + '</h2><div class="solved-pic">' + picSVG(p2) + '</div>';
      h += '<button class="btn" data-action="sheet-close">Close</button></div>';
    }
    root.innerHTML = h;
  }

  function closeSheet() { sheet = null; renderSheet(); }

  function saveEntrySheet() {
    var d = sheet.draft, mode = sheet.mode;
    var start = d.start, dur = d.durationSec;
    if (mode !== 'summary') {
      var w = $('#f-when').value;
      var t = w ? new Date(w).getTime() : NaN;
      if (!isNaN(t)) start = t;
    }
    var di = $('#f-dur').value.trim();
    if (di !== sheet.durInit) {
      if (di === '') dur = null;
      else {
        var mm = parseFloat(di);
        if (!isNaN(mm) && mm >= 0) dur = Math.round(mm * 60);
      }
    }
    var entry = cleanEntry({
      id: d.id || uid(),
      start: start,
      durationSec: dur,
      bristol: d.bristol,
      tags: d.tags,
      note: ($('#f-note').value || '').trim(),
      source: d.source
    });
    var idx = -1;
    entries.forEach(function (e, i) { if (e.id === entry.id) idx = i; });
    if (idx >= 0) entries[idx] = entry; else entries.push(entry);
    saveEntries();
    if (mode === 'summary') {
      active = null; saveActive(); unlockScreen();
      view = 'home';
    }
    sheet = null;
    renderSheet();
    render();
    toast('Entry saved');
  }

  /* ================= views ================= */

  function sortedEntries() { return entries.slice().sort(function (a, b) { return b.start - a.start; }); }

  function viewHome() {
    var last = sortedEntries()[0];
    var pic = picById(puzzle.id);
    var placed = puzzle.locked.filter(Boolean).length;
    var h = '<h1>' + APP_NAME + '</h1>';
    if (!storageOK) h += '<div class="notice">This browser is blocking storage, so entries will not be saved. Open the app in a normal Chrome tab.</div>';
    if (active) {
      h += '<div class="card live"><div class="muted small">Session in progress</div><div class="big-time" id="timer">' + fmtDur((Date.now() - active.start) / 1000) + '</div><button class="btn primary" style="margin-top:14px" data-action="resume">Resume</button></div>';
    } else {
      h += '<button class="btn primary hero" data-action="start">Start session</button>';
    }
    h += '<div style="margin-top:12px"><button class="btn" data-action="quick">Quick log, no game</button></div>';
    h += '<div class="card"><div class="muted small">Last entry</div>';
    if (last) {
      h += '<div style="font-weight:800">' + fmtDay(last.start) + ', ' + fmtTime(last.start) + '</div>' +
        '<div class="muted">' + fmtMin(last.durationSec) + (last.bristol ? ', Bristol type ' + last.bristol : '') + '</div>';
    } else {
      h += '<div>No entries yet. Start a session or add one with Quick log.</div>';
    }
    h += '</div>';
    h += '<div class="card home-puzzle">' + picSVG(pic, puzzle.cells) +
      '<div><div class="name">Current picture</div><div class="muted">' + placed + ' of ' + pic.target.length + ' tiles in place.<br>' + done.length + ' of ' + PICS.length + ' in the gallery.</div></div></div>';
    return h;
  }

  function viewSession() {
    var pic = picById(puzzle.id);
    return '<div class="session-top"><div><div class="what">Session</div><div class="timer" id="timer">' + fmtDur((Date.now() - active.start) / 1000) + '</div></div>' +
      '<button class="peek" data-action="preview-current" aria-label="Show the finished picture">' + picSVG(pic) + '</button></div>' +
      '<div id="puzzle-wrap">' + puzzleHTML() + '</div>' +
      '<div class="session-bottom"><div class="label muted small" style="margin:0 0 8px;font-weight:700">How did it go?</div><div data-bwrap="session">' + bristolPicker(active.bristol, 'bristol') + '</div>' +
      '<button class="btn primary" data-action="finish">I\'m done</button></div>';
  }

  function viewHistory() {
    var list = sortedEntries();
    var h = '<h1>History</h1>';
    if (!list.length) return h + '<p class="muted">Nothing here yet. Entries show up after your first session or quick log.</p>';
    var lastDay = '';
    list.forEach(function (e) {
      var dk = dayKey(e.start);
      if (dk !== lastDay) { h += '<div class="day">' + esc(fmtDay(e.start)) + '</div>'; lastDay = dk; }
      h += '<button class="entry" data-action="edit-entry" data-id="' + esc(e.id) + '">' +
        '<span class="type' + (e.bristol ? ' has' : '') + '">' + (e.bristol || '–') + '</span>' +
        '<span class="main"><span class="time">' + fmtTime(e.start) + ', ' + fmtMin(e.durationSec) + '</span>' +
        (e.tags.length ? '<span class="tags" style="display:block">' + esc(e.tags.join(', ')) + '</span>' : '') +
        (e.note ? '<span class="note" style="display:block">' + esc(e.note) + '</span>' : '') +
        '</span></button>';
    });
    return h;
  }

  /* ----- charts: one series, one hue, thin bars, value on hover/long-press via <title> ----- */

  function barChart(vals, labels, label) {
    var W = 300, H = 90, n = vals.length, bw = W / n;
    var max = Math.max.apply(null, vals.concat([1]));
    var s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + (H + 16) + '" role="img" aria-label="' + esc(label) + '">';
    s += '<line class="gridline" x1="0" x2="' + W + '" y1="' + H + '" y2="' + H + '"/>';
    vals.forEach(function (v, i) {
      var hh = Math.round((v / max) * (H - 4));
      if (v > 0 && hh < 3) hh = 3;
      var x = i * bw + Math.min(2, bw * 0.15);
      var w = Math.max(1, bw - Math.min(2, bw * 0.15) * 2);
      if (hh > 0) s += '<rect class="bar" x="' + x.toFixed(1) + '" y="' + (H - hh) + '" width="' + w.toFixed(1) + '" height="' + hh + '" rx="3"><title>' + esc(labels[i] + ': ' + v) + '</title></rect>';
    });
    labels.forEach(function (l, i) {
      if (l !== '') s += '<text class="axis" x="' + (i * bw + bw / 2).toFixed(1) + '" y="' + (H + 13) + '" text-anchor="middle">' + esc(l) + '</text>';
    });
    return s + '</svg>';
  }

  function bristolChart(list) {
    var W = 300, H = 126, L = 20, T = 8, B = 8;
    var s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Bristol type for your most recent entries">';
    function y(v) { return T + (v - 1) * (H - T - B) / 6; }
    for (var v = 1; v <= 7; v++) {
      s += '<line class="gridline" x1="' + L + '" x2="' + W + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="axis" x="0" y="' + (y(v) + 3) + '">' + v + '</text>';
    }
    list.forEach(function (e, i) {
      var x = list.length === 1 ? (L + W) / 2 : L + 6 + i * (W - L - 12) / (list.length - 1);
      s += '<circle class="dot" cx="' + x.toFixed(1) + '" cy="' + y(e.bristol).toFixed(1) + '" r="4"><title>' + esc(fmtDay(e.start) + ', type ' + e.bristol) + '</title></circle>';
    });
    return s + '</svg>';
  }

  function weekStart(ms) {
    var d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.getTime();
  }

  function viewInsights() {
    var n = entries.length;
    var h = '<h1>Insights</h1>';
    if (n < MIN_FOR_INSIGHTS) {
      return h + '<div class="card"><p>Charts show up once you have ' + MIN_FOR_INSIGHTS + ' entries. You have ' + n + '.</p><div class="meter"><span style="width:' + Math.round(n / MIN_FOR_INSIGHTS * 100) + '%"></span></div></div>';
    }
    var withDur = entries.filter(function (e) { return e.durationSec != null; });
    var avg = withDur.length ? withDur.reduce(function (a, e) { return a + e.durationSec; }, 0) / withDur.length : null;
    var first = Math.min.apply(null, entries.map(function (e) { return e.start; }));
    var weeks = Math.max(1, (Date.now() - first) / (7 * 864e5));
    h += '<div class="stats"><div class="stat"><b>' + n + '</b><span>entries</span></div>' +
      '<div class="stat"><b>' + (n / weeks).toFixed(1) + '</b><span>per week</span></div>' +
      '<div class="stat"><b>' + (avg == null ? '–' : fmtMin(avg).replace(' min', '')) + '</b><span>average minutes</span></div></div>';

    var hours = []; for (var i = 0; i < 24; i++) hours.push(0);
    entries.forEach(function (e) { hours[new Date(e.start).getHours()]++; });
    h += '<h2>Time of day</h2>' + barChart(hours, hours.map(function (_, i) { return i % 6 === 0 ? String(i) : ''; }), 'Entries by hour of day');

    var withB = sortedEntries().filter(function (e) { return e.bristol; }).slice(0, 30).reverse();
    h += '<h2>Bristol type, latest ' + withB.length + '</h2>';
    h += withB.length ? bristolChart(withB) : '<p class="muted">No entries have a Bristol type yet.</p>';

    var ws0 = weekStart(Date.now());
    var counts = [], mins = [], labels = [];
    for (var k = 7; k >= 0; k--) {
      var a = new Date(ws0); a.setDate(a.getDate() - k * 7);
      var b = new Date(a); b.setDate(b.getDate() + 7);
      var inWeek = entries.filter(function (e) { return e.start >= a.getTime() && e.start < b.getTime(); });
      counts.push(inWeek.length);
      var dd = inWeek.filter(function (e) { return e.durationSec != null; });
      mins.push(dd.length ? Math.round(dd.reduce(function (s, e) { return s + e.durationSec; }, 0) / dd.length / 60 * 10) / 10 : 0);
      labels.push(a.toLocaleDateString([], { day: 'numeric', month: 'short' }));
    }
    h += '<h2>Entries per week</h2>' + barChart(counts, labels, 'Entries per week, last 8 weeks');
    h += '<h2>Average minutes per week</h2>' + barChart(mins, labels, 'Average duration per week, last 8 weeks');
    return h;
  }

  function viewGallery() {
    var h = '<h1>Gallery</h1><p class="muted">' + done.length + ' of ' + PICS.length + ' pictures restored.</p><div class="gallery" style="margin-top:12px">';
    PICS.forEach(function (p) {
      var isDone = done.indexOf(p.id) >= 0;
      var cur = puzzle && puzzle.id === p.id && !isDone;
      if (isDone) {
        h += '<button class="gcard" data-action="preview" data-id="' + p.id + '">' + picSVG(p) + '<div class="gname">' + esc(p.name) + '</div></button>';
      } else {
        var placed = cur ? puzzle.locked.filter(Boolean).length : 0;
        h += '<div class="gcard locked' + (cur ? ' current' : '') + '">' + picSVG(p, null, true) + '<div class="gname">' + (cur ? 'In progress' : 'Not restored yet') + '</div>' +
          (cur ? '<div class="small">' + placed + ' of ' + p.target.length + ' tiles</div>' : '') + '</div>';
      }
    });
    return h + '</div>';
  }

  var deferredInstall = null;

  function viewSettings() {
    var h = '<h1>Settings</h1>';
    h += '<div class="setting"><b>Your data</b><p class="muted">Everything stays on this phone. Nothing is sent anywhere. ' + entries.length + ' entries saved.' +
      (persisted === true ? ' The browser has marked this storage as protected.' : '') + '</p>' +
      '<p class="muted small">Clearing browser data erases it, so make a backup now and then.</p></div>';
    h += '<div class="setting"><b>Backup</b><button class="btn" data-action="export-json">Download backup (JSON)</button>' +
      '<button class="btn" data-action="import-pick">Restore from backup</button>' +
      '<input type="file" id="importFile" accept="application/json,.json" hidden></div>';
    h += '<div class="setting"><b>Export</b><button class="btn" data-action="export-csv">Download CSV</button>' +
      '<button class="btn" data-action="open-report">Doctor report (print or save as PDF)</button></div>';
    h += '<div class="setting"><b>Your tags</b>';
    if (settings.customTags.length) {
      settings.customTags.forEach(function (t, i) {
        h += '<div class="tagrow"><span>' + esc(t) + '</span><button class="btn inline quiet" data-action="remove-tag" data-i="' + i + '">Remove</button></div>';
      });
    } else {
      h += '<p class="muted">No custom tags yet. Add them while logging an entry.</p>';
    }
    h += '</div>';
    if (deferredInstall) h += '<div class="setting"><b>Install</b><button class="btn" data-action="install">Add to home screen</button></div>';
    else h += '<div class="setting"><b>Install</b><p class="muted">In Chrome, open the menu and choose Add to Home screen.</p></div>';
    h += '<div class="setting"><b>Reset</b><button class="btn danger" data-action="delete-all">Delete all data</button></div>';
    return h;
  }

  var reportRange = '30';

  function viewReport() {
    var now = Date.now();
    var days = reportRange === 'all' ? null : parseInt(reportRange, 10);
    var list = entries.filter(function (e) { return !days || e.start >= now - days * 864e5; }).sort(function (a, b) { return a.start - b.start; });
    var span = days || (list.length ? Math.max(1, Math.ceil((now - list[0].start) / 864e5)) : 1);
    var wd = list.filter(function (e) { return e.durationSec != null; });
    var avg = wd.length ? wd.reduce(function (a, e) { return a + e.durationSec; }, 0) / wd.length : null;
    var bc = [0, 0, 0, 0, 0, 0, 0, 0];
    list.forEach(function (e) { if (e.bristol) bc[e.bristol]++; });
    var tagCount = {};
    list.forEach(function (e) { e.tags.forEach(function (t) { tagCount[t] = (tagCount[t] || 0) + 1; }); });
    var h = '<div class="report"><div class="row between noprint"><button class="btn inline quiet" data-action="close-report">Back</button><button class="btn inline primary" data-action="print">Print or save PDF</button></div>';
    h += '<h1>Bowel movement log</h1><p class="muted small">Self-recorded. Generated ' + new Date().toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' }) + '. This is a personal record, not a medical document.</p>';
    h += '<div class="seg noprint">' + [['30', 'Last 30 days'], ['90', 'Last 90 days'], ['all', 'All']].map(function (r) {
      return '<button class="btn' + (reportRange === r[0] ? ' on' : '') + '" data-action="range" data-v="' + r[0] + '">' + r[1] + '</button>';
    }).join('') + '</div>';
    h += '<div class="stats"><div class="stat"><b>' + list.length + '</b><span>entries</span></div>' +
      '<div class="stat"><b>' + (list.length / span * 7).toFixed(1) + '</b><span>per week</span></div>' +
      '<div class="stat"><b>' + (avg == null ? '–' : fmtMin(avg).replace(' min', '')) + '</b><span>average minutes</span></div></div>';
    h += '<p><b>Bristol types:</b> ' + [1, 2, 3, 4, 5, 6, 7].map(function (i) { return 'type ' + i + ': ' + bc[i]; }).join(', ') + '</p>';
    var tk = Object.keys(tagCount).sort(function (a, b) { return tagCount[b] - tagCount[a]; });
    if (tk.length) h += '<p><b>Tags:</b> ' + tk.map(function (t) { return esc(t) + ' (' + tagCount[t] + ')'; }).join(', ') + '</p>';
    h += '<table><thead><tr><th>Date and time</th><th>Minutes</th><th>Type</th><th>Tags and notes</th></tr></thead><tbody>';
    list.forEach(function (e) {
      h += '<tr><td>' + esc(fmtStamp(e.start)) + '</td><td>' + (e.durationSec == null ? '' : (e.durationSec / 60).toFixed(1)) + '</td><td>' + (e.bristol || '') + '</td><td>' + esc(e.tags.join(', ')) + (e.note ? (e.tags.length ? '. ' : '') + esc(e.note) : '') + '</td></tr>';
    });
    h += '</tbody></table></div>';
    return h;
  }

  var TABS = [['home', 'Home'], ['history', 'History'], ['insights', 'Insights'], ['gallery', 'Gallery'], ['settings', 'Settings']];

  function render() {
    var app = $('#app');
    var inSession = view === 'session' && active;
    app.className = inSession ? 'in-session' : '';
    var body;
    if (inSession) body = viewSession();
    else if (view === 'history') body = viewHistory();
    else if (view === 'insights') body = viewInsights();
    else if (view === 'gallery') body = viewGallery();
    else if (view === 'settings') body = viewSettings();
    else if (view === 'report') body = viewReport();
    else { view = 'home'; body = viewHome(); }
    var tabs = '';
    if (!inSession) {
      var cur = view === 'report' ? 'settings' : view;
      tabs = '<nav class="tabbar" aria-label="Main"><div class="tabbar-inner">' + TABS.map(function (t) {
        return '<button class="tab" data-action="nav" data-v="' + t[0] + '"' + (cur === t[0] ? ' aria-current="page"' : '') + '>' + t[1] + '</button>';
      }).join('') + '</div></nav>';
    }
    app.innerHTML = body + tabs;
    window.scrollTo(0, 0);
  }

  /* ================= export / import ================= */

  function csvCell(v) {
    var s = v == null ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    if (/[",\r\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function toCSV() {
    var rows = [['id', 'start', 'duration_min', 'bristol_type', 'tags', 'note', 'source']];
    entries.slice().sort(function (a, b) { return a.start - b.start; }).forEach(function (e) {
      rows.push([e.id, fmtStamp(e.start), e.durationSec == null ? '' : (e.durationSec / 60).toFixed(1), e.bristol || '', e.tags.join('; '), e.note, e.source]);
    });
    return rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n');
  }

  function download(name, text, mime) {
    var blob = new Blob([text], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  function backupObject() {
    return {
      app: 'daily-log', version: 1, exportedAt: new Date().toISOString(),
      entries: entries, done: done, customTags: settings.customTags, puzzle: puzzle
    };
  }

  function importBackup(file) {
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var data = JSON.parse(fr.result);
        if (!data || data.app !== 'daily-log' || !Array.isArray(data.entries)) throw new Error('shape');
        var have = {};
        entries.forEach(function (e) { have[e.id] = true; });
        var added = 0;
        data.entries.filter(validEntry).map(cleanEntry).forEach(function (e) {
          if (!have[e.id]) { entries.push(e); have[e.id] = true; added++; }
        });
        if (Array.isArray(data.done)) data.done.forEach(function (id) { if (picById(id) && done.indexOf(id) < 0) done.push(id); });
        if (Array.isArray(data.customTags)) data.customTags.forEach(function (t) {
          t = String(t).slice(0, 24);
          if (t && settings.customTags.indexOf(t) < 0 && DEFAULT_TAGS.indexOf(t) < 0) settings.customTags.push(t);
        });
        saveEntries(); saveDone(); saveSettings();
        render();
        toast('Restored ' + added + ' new ' + (added === 1 ? 'entry' : 'entries'));
      } catch (e) {
        toast('That file is not a Daily Log backup.');
      }
    };
    fr.readAsText(file);
  }

  /* ================= actions ================= */

  var actions = {
    nav: function (t) { view = t.dataset.v; render(); },
    start: startSession,
    resume: function () { view = 'session'; ensurePuzzle(); lockScreen(); render(); },
    quick: function () { openEntrySheet('quick', { start: Math.floor(Date.now() / 60000) * 60000, durationSec: null, bristol: null, tags: [], note: '', source: 'quick' }); },
    cell: function (t) { onCell(parseInt(t.dataset.i, 10)); },
    bristol: function (t) {
      var v = parseInt(t.dataset.v, 10);
      active.bristol = active.bristol === v ? null : v;
      touch();
      $('[data-bwrap="session"]').innerHTML = bristolPicker(active.bristol, 'bristol');
    },
    finish: finishSession,
    'preview-current': function () { sheet = { kind: 'pic', id: puzzle.id }; renderSheet(); },
    preview: function (t) { sheet = { kind: 'pic', id: t.dataset.id }; renderSheet(); },
    'next-pic': function () {
      puzzle = newPuzzle(nextPicId()); savePuzzle(); sel = null; lastSwap = [];
      sheet = null; renderSheet(); renderPuzzle();
    },
    'sheet-close': function () { if (sheet && sheet.kind === 'entry' && sheet.mode === 'summary') return; closeSheet(); },
    'sheet-bristol': function (t) {
      var v = parseInt(t.dataset.v, 10);
      sheet.draft.bristol = sheet.draft.bristol === v ? null : v;
      $('[data-bwrap="sheet"]').innerHTML = bristolPicker(sheet.draft.bristol, 'sheet-bristol');
    },
    chip: function (t) {
      var tag = t.dataset.tag, tags = sheet.draft.tags, i = tags.indexOf(tag);
      if (i >= 0) tags.splice(i, 1); else tags.push(tag);
      t.classList.toggle('on', i < 0);
      t.setAttribute('aria-pressed', String(i < 0));
    },
    addtag: function () {
      var inp = $('#f-newtag');
      var name = (inp.value || '').trim().toLowerCase().slice(0, 24);
      if (!name) return;
      if (allTags(sheet.draft.tags).indexOf(name) < 0) { settings.customTags.push(name); saveSettings(); }
      if (sheet.draft.tags.indexOf(name) < 0) sheet.draft.tags.push(name);
      inp.value = '';
      $('[data-tags]').innerHTML = tagsHTML(sheet.draft.tags);
    },
    'sheet-save': saveEntrySheet,
    'sheet-discard': function () {
      if (!confirm('Discard this session? Nothing will be saved.')) return;
      active = null; saveActive(); unlockScreen(); view = 'home'; sheet = null; renderSheet(); render();
    },
    'sheet-delete': function () {
      if (!confirm('Delete this entry?')) return;
      var id = sheet.draft.id;
      entries = entries.filter(function (e) { return e.id !== id; });
      saveEntries(); sheet = null; renderSheet(); render(); toast('Entry deleted');
    },
    'edit-entry': function (t) {
      var e = entries.filter(function (x) { return x.id === t.dataset.id; })[0];
      if (e) openEntrySheet('edit', e);
    },
    'idle-last': function () { sheet = null; renderSheet(); beginSummary(active.lastActive); },
    'idle-now': function () { sheet = null; renderSheet(); beginSummary(Date.now()); },
    'idle-resume': function () { touch(); sheet = null; renderSheet(); view = 'session'; ensurePuzzle(); lockScreen(); render(); },
    'idle-discard': function () {
      active = null; saveActive(); unlockScreen(); sheet = null; renderSheet(); view = 'home'; render();
    },
    'export-csv': function () { download('daily-log-' + dayKey(Date.now()) + '.csv', '﻿' + toCSV(), 'text/csv;charset=utf-8'); },
    'export-json': function () { download('daily-log-backup-' + dayKey(Date.now()) + '.json', JSON.stringify(backupObject(), null, 1), 'application/json'); },
    'import-pick': function () { var f = $('#importFile'); if (f) f.click(); },
    'open-report': function () { view = 'report'; render(); },
    'close-report': function () { view = 'settings'; render(); },
    range: function (t) { reportRange = t.dataset.v; render(); },
    print: function () { window.print(); },
    'remove-tag': function (t) {
      settings.customTags.splice(parseInt(t.dataset.i, 10), 1); saveSettings(); render();
    },
    install: function () {
      if (!deferredInstall) return;
      deferredInstall.prompt();
      deferredInstall.userChoice.then(function () { deferredInstall = null; render(); });
    },
    'delete-all': function () {
      if (!confirm('Delete every entry and reset the gallery? This cannot be undone.')) return;
      if (!confirm('Really delete everything?')) return;
      entries = []; active = null; puzzle = null; done = []; settings = { customTags: [] };
      Object.keys(K).forEach(function (k) { store.remove(K[k]); });
      ensurePuzzle(); view = 'home'; render(); toast('All data deleted');
    }
  };

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-action]') : null;
    if (!t) return;
    var fn = actions[t.dataset.action];
    if (fn) fn(t, e);
  });

  document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'importFile' && e.target.files && e.target.files[0]) {
      importBackup(e.target.files[0]);
      e.target.value = '';
    }
  });

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredInstall = e;
    if (view === 'settings') render();
  });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && active) {
      if (view === 'session') lockScreen();
      checkIdle();
    }
  });

  setInterval(function () {
    var t = $('#timer');
    if (t && active) t.textContent = fmtDur((Date.now() - active.start) / 1000);
  }, 1000);

  /* ================= start ================= */

  function init() {
    ensurePuzzle();
    view = active ? 'session' : 'home';
    render();
    if (active) { lockScreen(); checkIdle(); }
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    }
  }

  // read-only handle for tests
  window.DailyLog = {
    PICS: PICS,
    state: function () { return { entries: entries, active: active, puzzle: puzzle, done: done, settings: settings }; },
    toCSV: toCSV,
    backupObject: backupObject
  };

  init();
})();
