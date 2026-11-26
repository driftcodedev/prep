// README pop-up, copied as is from readme-button-kit.html (Part 6).
// Only NS is changed: 'prep' keeps these notes apart from the other sites on driftcodedev.github.io
// (the funding site uses 'funding'). The site's pages are the JSON in index.html, written from
// shell/readme-pages.js by `npm run readme`.
// ---- README pop-up (page_readme.py) ----
(function () {
  const $ = id => document.getElementById(id);
  const modal = $('rmmodal'), btn = $('readmebtn');
  if (!modal || !btn) return;
  const box = $('rmbox'), body = $('rmbody'), nav = $('rmnav'), sel = $('rmsel'), name = $('rmname'), heading = $('rmheading');
  const tools = $('rmtools'), pagebar = $('rmpagebar'), state = $('rmstate'), grip = $('rmgrip');
  const NS = 'prep';   // a short name for this site. Two sites on the same domain must not share a name.
  const KEY = NS + '-readme-v1', SIZE = NS + '-readme-size-v1';
  let SITE = [];
  try { SITE = JSON.parse($('rmpages').textContent) || []; } catch (e) {}
  const siteById = {};
  SITE.forEach(p => { siteById[p.id] = p; });
  const WORDS = {
    del: ['Delete page', 'Delete this page? Click again'],
    page: ["Back to the site's version of this page", 'Discard my changes to this page? Click again'],
    all: ['Reset the whole README', 'Discard all my pages and changes? Click again'],
  };
  const ARM = { del: $('rmdel'), page: $('rmresetpage'), all: $('rmresetall') };
  let store = null, active = '', editing = false, range = null, timer = null, lastFocus = null, armed = '', armTimer = null, mergedFor = '';
  const SITEHEAD = '<div class="rmsitehead">Site notes · kept up to date by the site</div>';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function drop(k) { try { localStorage.removeItem(k); } catch (e) {} }
  // keep only plain formatting: no scripts, no event handlers, no embedded frames
  function clean(html) {
    const doc = new DOMParser().parseFromString('<div>' + String(html == null ? '' : html) + '</div>', 'text/html');
    doc.querySelectorAll('script,style,iframe,object,embed,link,meta,form,input,button').forEach(n => n.remove());
    doc.querySelectorAll('*').forEach(n => {
      [...n.attributes].forEach(a => {
        const v = String(a.value || '').replace(/\s+/g, '').toLowerCase();
        if (a.name.toLowerCase().startsWith('on') || v.startsWith('javascript:') || a.name === 'contenteditable') n.removeAttribute(a.name);
      });
    });
    return doc.body.firstChild.innerHTML;
  }
  function when(iso) {
    const d = new Date(iso);
    return !iso || isNaN(d) ? '' : d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  // what this browser keeps: only what the reader changed
  function load() {
    const raw = get(KEY) || {};
    const s = { v: 2, order: [], pages: {}, gone: [], active: typeof raw.active === 'string' ? raw.active : '', moved: !!raw.moved };
    if (Array.isArray(raw.order)) s.order = raw.order.filter(x => typeof x === 'string');
    if (Array.isArray(raw.gone)) s.gone = raw.gone.filter(x => typeof x === 'string');
    if (raw.pages && typeof raw.pages === 'object') {
      Object.keys(raw.pages).forEach(id => {
        const p = raw.pages[id];
        if (p && typeof p === 'object') s.pages[id] = { title: String(p.title || 'Untitled').slice(0, 80), html: String(p.html || ''), at: p.at || '', base: p.base || '',
          takes: typeof p.takes === 'string' ? p.takes : '', absorbed: typeof p.absorbed === 'string' ? p.absorbed : '' };
      });
    }
    // A site page the reader gave a name of their own is the reader's page. It moves to an id of its own, so the
    // site's page is free again and nothing of the reader's can be hidden behind it.
    let moved = false;
    Object.keys(s.pages).forEach(id => {
      const site = siteById[id];
      if (!site || (site.aka || []).indexOf(norm(s.pages[id].title)) >= 0) return;
      let nid = 'own-' + id, k = 1;
      while (s.pages[nid]) nid = 'own-' + id + '-' + (++k);
      s.pages[nid] = s.pages[id]; s.pages[nid].base = ''; delete s.pages[id];
      s.order = s.order.map(x => x === id ? nid : x);
      if (s.order.indexOf(nid) < 0) s.order.push(nid);
      if (s.active === id) s.active = nid;
      moved = true;
    });
    if (moved) put(KEY, s);
    store = s;
  }
  // the pages as shown: the reader's order, their version of a page where they have one, else the site's
  function norm(t) { return String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, ''); }
  // a page of the reader's own with the same name as a site page takes that page in: the site's notes show under theirs
  function taken() {
    const bySite = {}, byOwn = {};
    let fresh = false;
    Object.keys(store.pages).forEach(id => {          // links made earlier stay, whatever the page is called now
      const t = store.pages[id].takes;
      if (!siteById[id] && t && siteById[t] && !bySite[t] && !store.pages[t]) { bySite[t] = id; byOwn[id] = t; }
    });
    Object.keys(store.pages).forEach(id => {          // a new link is made by name
      if (siteById[id] || byOwn[id]) return;
      const n = norm(store.pages[id].title);
      if (!n) return;
      SITE.forEach(p => { if (!bySite[p.id] && !byOwn[id] && !store.pages[p.id] && (p.aka || []).indexOf(n) >= 0) { bySite[p.id] = id; byOwn[id] = p.id; store.pages[id].takes = p.id; fresh = true; } });
    });
    if (fresh) persist();
    return { bySite: bySite, byOwn: byOwn };
  }
  function list() {
    const out = [], seen = {}, tk = taken();
    function add(id) {
      if (seen[id] || tk.bySite[id]) return;
      const mine = store.pages[id], site = siteById[id];
      if (mine) {
        const row = { id: id, title: mine.title, html: mine.html, mine: true, site: !!site, at: mine.at, stale: !!(site && mine.base && mine.base !== site.base) };
        if (tk.byOwn[id]) {
          const sp = siteById[tk.byOwn[id]];
          if (mine.absorbed) row.stale = mine.absorbed !== sp.base;   // the site's notes were edited into the reader's page
          else row.extra = sp.html;
        }
        out.push(row);
      }
      else if (site && store.gone.indexOf(id) < 0) out.push({ id: id, title: site.title, html: site.html, mine: false, site: true });
      else return;
      seen[id] = 1;
    }
    store.order.forEach(add);
    SITE.forEach(p => add(p.id));
    Object.keys(store.pages).forEach(add);
    return out;
  }
  function cur() { const all = list(); return all.filter(p => p.id === active)[0] || all[0] || null; }
  function changed() { return Object.keys(store.pages).length > 0 || store.gone.length > 0 || store.order.length > 0; }
  function persist() { store.active = active; return put(KEY, store); }

  function disarm() { armed = ''; clearTimeout(armTimer); Object.keys(ARM).forEach(k => { ARM[k].textContent = WORDS[k][0]; ARM[k].classList.remove('warn'); }); }
  function arm(k) { disarm(); armed = k; ARM[k].textContent = WORDS[k][1]; if (k === 'del') ARM[k].classList.add('warn'); armTimer = setTimeout(disarm, 5000); }

  function drawNav() {
    const all = list();
    if (!all.some(p => p.id === active)) active = all[0] ? all[0].id : '';
    nav.innerHTML = all.map(p => '<button type="button" class="rmpage' + (p.id === active ? ' on' : '') + '" data-id="' + esc(p.id) + '" title="Drag to reorder"' +
      (p.id === active ? ' aria-current="page"' : '') + '>' + esc(p.title) + '</button>').join('');
    sel.innerHTML = all.map(p => '<option value="' + esc(p.id) + '"' + (p.id === active ? ' selected' : '') + '>' + esc(p.title) + '</option>').join('');
    const i = all.findIndex(p => p.id === active);
    $('rmup').disabled = i <= 0; $('rmdown').disabled = i < 0 || i >= all.length - 1; $('rmdel').disabled = all.length < 2;
  }
  function stateLine(saved) {
    const p = cur();
    let t = '';
    if (saved === false) t = 'Could not save in this browser';
    else if (!p) t = '';
    else if (!p.mine) t = "The site's version of this page";
    else t = (p.site ? 'Your version of this page' : 'Your page') + ', saved in this browser' + (p.at ? ' · ' + when(p.at) : '') +
      (p.stale ? " · the site's version has changed since" : '') + (p.extra ? (editing ? " · the site's notes are in the box under yours, ready to edit" : " · the site's notes are shown under yours") : '');
    state.textContent = t;
    $('rmresetpage').hidden = !(p && p.mine && p.site);
    $('rmresetall').hidden = !changed();
  }
  // text that is meant to be pasted somewhere else gets a Copy button. The button is not part of the notes: clean() drops it on save.
  function copyButtons(root) {
    root.querySelectorAll('pre.rmcopy').forEach(pre => {
      const b = document.createElement('button'), label = 'Copy';
      b.type = 'button'; b.className = 'rmbtn rmcopybtn'; b.textContent = label; b.contentEditable = 'false';
      b.addEventListener('click', () => {
        const done = ok => { b.textContent = ok ? 'Copied' : 'Could not copy: select the text below instead'; setTimeout(() => { b.textContent = label; }, 2500); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(pre.textContent).then(() => done(true), () => done(false));
        else done(false);
      });
      pre.parentNode.insertBefore(b, pre);
    });
  }
  // While editing, the site's notes sit in the same yellow box as the reader's text, so all of it can be changed.
  // Nothing is stored until the reader changes something; then the whole box is their page (absorbed).
  function fill(p) {
    const merge = !!(editing && p && p.extra), more = $('rmsite');
    mergedFor = merge ? p.id : '';
    body.innerHTML = p ? clean(p.html) + (merge ? '<h3>Site notes</h3>' + clean(p.extra) : '') : '';
    more.hidden = !(p && p.extra) || merge;
    more.innerHTML = p && p.extra && !merge ? SITEHEAD + '<div class="rmbody">' + clean(p.extra) + '</div>' : '';
    copyButtons(body); copyButtons(more);
  }
  function paint() {
    disarm(); drawNav();
    const p = cur();
    name.value = p ? p.title : '';
    heading.textContent = p ? p.title : '';
    fill(p);
    range = null;
    stateLine();
  }
  function save() {
    timer = null;
    if (!active) return;
    const order = list().map(p => p.id), site = siteById[active], prev = store.pages[active];
    const title = (name.value || '').trim().slice(0, 80) || 'Untitled';
    let html = clean(body.innerHTML);
    const words = h => String(h || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    // a change of name must never cost the notes: if the name changed and the text came back empty, the stored text is kept
    if (prev && prev.title !== title && words(prev.html) && !words(html)) { html = prev.html; body.innerHTML = clean(html); }
    const sid = taken().byOwn[active];
    store.pages[active] = { title: title, html: html, at: new Date().toISOString(), base: prev ? prev.base : (site ? site.base : ''),
      takes: prev ? prev.takes || '' : '',
      absorbed: mergedFor === active && sid ? siteById[sid].base : (prev ? prev.absorbed || '' : '') };
    store.order = order;
    const ok = persist();
    drawNav(); heading.textContent = store.pages[active].title; stateLine(ok);
    const pg = cur(), more = $('rmsite');
    if (!!(pg && pg.extra) === more.hidden) {
      more.hidden = !(pg && pg.extra);
      more.innerHTML = pg && pg.extra ? SITEHEAD + '<div class="rmbody">' + clean(pg.extra) + '</div>' : '';
    }
  }
  function later() { clearTimeout(timer); timer = setTimeout(save, 400); state.textContent = 'Saving…'; }
  function flush() { if (timer) { clearTimeout(timer); save(); } }
  function setEdit(on) {
    if (!on) flush();
    editing = on;
    body.contentEditable = on ? 'true' : 'false';
    tools.hidden = !on; pagebar.hidden = !on; heading.hidden = on;
    $('rmedit').textContent = on ? 'Done' : 'Edit';
    $('rmedit').classList.toggle('on', on);
    $('rmedit').setAttribute('aria-pressed', String(on));
    disarm();
    const p = cur();
    if (p && (p.extra || mergedFor)) { fill(p); stateLine(); }
  }
  function go(id) {
    if (id === active) return;
    flush(); active = id; persist(); paint();
    $('rmscroll').scrollTop = 0;
  }
  function addPage() {
    flush();
    const ids = list().map(p => p.id), id = 'p' + Date.now().toString(36);
    store.pages[id] = { title: 'New page', html: '<p><br></p>', at: new Date().toISOString(), base: '' };
    store.order = ids.concat([id]); active = id; persist();
    setEdit(true); paint();
    name.focus(); name.select();
  }
  function move(d) {
    flush();
    const ids = list().map(p => p.id), i = ids.indexOf(active), j = i + d;
    if (i < 0 || j < 0 || j >= ids.length) return;
    const t = ids[i]; ids[i] = ids[j]; ids[j] = t;
    store.order = ids; persist(); drawNav(); stateLine();
  }
  function delPage() {
    const all = list();
    if (all.length < 2) return;
    if (armed !== 'del') { arm('del'); return; }
    clearTimeout(timer); timer = null;
    const i = all.findIndex(p => p.id === active);
    if (siteById[active] && store.gone.indexOf(active) < 0) store.gone.push(active);
    delete store.pages[active];
    store.order = all.map(p => p.id).filter(id => id !== active);
    active = store.order[Math.min(i, store.order.length - 1)];
    persist(); paint();
  }
  function resetPage() {
    if (armed !== 'page') { arm('page'); return; }
    clearTimeout(timer); timer = null;
    delete store.pages[active];
    persist(); paint();
  }
  function resetAll() {
    if (armed !== 'all') { arm('all'); return; }
    clearTimeout(timer); timer = null;
    drop(KEY); load(); active = '';
    setEdit(false); paint();
  }
  function keep() {
    const s = window.getSelection();
    if (s && s.rangeCount && body.contains(s.anchorNode)) range = s.getRangeAt(0).cloneRange();
  }
  function run(cmd, val) {
    body.focus();
    if (range) { const s = window.getSelection(); s.removeAllRanges(); s.addRange(range); }
    try { document.execCommand('styleWithCSS', false, true); } catch (e) {}
    document.execCommand(cmd, false, val == null ? null : val);
    keep(); later();
  }

  // size: remembered between visits; drag the corner, or fill the screen
  function applySize() {
    const z = get(SIZE) || {}, small = window.innerWidth <= 700;
    box.classList.toggle('max', !!z.max && !small);
    box.style.width = !small && !z.max && z.w ? z.w + 'px' : '';
    box.style.height = !small && !z.max && z.h ? z.h + 'px' : '';
    $('rmmax').textContent = z.max ? 'Smaller' : 'Full screen';
    $('rmmax').setAttribute('aria-pressed', String(!!z.max));
  }
  $('rmmax').addEventListener('click', () => {
    const z = get(SIZE) || {};
    z.max = !z.max; put(SIZE, z); applySize();
  });
  grip.addEventListener('pointerdown', e => {
    if (box.classList.contains('max')) return;
    e.preventDefault();
    try { grip.setPointerCapture(e.pointerId); } catch (x) {}
    const r = box.getBoundingClientRect(), x0 = e.clientX, y0 = e.clientY;
    // the box sits in the middle of the screen, so it grows on both sides: twice the drag keeps the corner under the pointer
    function drag(ev) {
      box.style.width = Math.max(380, Math.min(window.innerWidth - 16, r.width + 2 * (ev.clientX - x0))) + 'px';
      box.style.height = Math.max(300, Math.min(window.innerHeight - 16, r.height + 2 * (ev.clientY - y0))) + 'px';
    }
    function end() {
      grip.removeEventListener('pointermove', drag); grip.removeEventListener('pointerup', end); grip.removeEventListener('pointercancel', end);
      const q = box.getBoundingClientRect();
      put(SIZE, { w: Math.round(q.width), h: Math.round(q.height), max: false });
    }
    grip.addEventListener('pointermove', drag); grip.addEventListener('pointerup', end); grip.addEventListener('pointercancel', end);
  });

  function open() {
    lastFocus = document.activeElement;
    load(); active = store.active || '';
    applySize(); setEdit(false); paint();
    modal.hidden = false;
    $('rmclose').focus();
  }
  function close() {
    if (editing) setEdit(false);
    modal.hidden = true;
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  btn.addEventListener('click', open);
  $('rmclose').addEventListener('click', close);
  $('rmedit').addEventListener('click', () => { setEdit(!editing); if (editing) body.focus(); else paint(); });
  modal.addEventListener('mousedown', e => { modal._down = e.target; });
  modal.addEventListener('click', e => { if (e.target === modal && modal._down === modal) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) close(); });
  nav.addEventListener('click', e => {
    if (nav._moved) { nav._moved = false; return; }   // the end of a drag is not a click
    const b = e.target.closest('.rmpage'); if (b) go(b.dataset.id);
  });
  // drag a page up or down the list to reorder (pointer events: mouse, pen and touch alike)
  let dragging = null;
  function unmark() { nav.querySelectorAll('.rmpage').forEach(x => x.classList.remove('dragging', 'dropbefore', 'dropafter')); nav.classList.remove('dragging'); }
  nav.addEventListener('pointerdown', e => {
    const b = e.target.closest('.rmpage');
    nav._moved = false;
    if (b && e.button === 0) dragging = { id: b.dataset.id, el: b, y0: e.clientY, on: false, pid: e.pointerId, to: '', after: false };
  });
  nav.addEventListener('pointermove', e => {
    const d = dragging;
    if (!d) return;
    if (!d.on) {
      if (Math.abs(e.clientY - d.y0) < 6) return;
      d.on = true; d.el.classList.add('dragging'); nav.classList.add('dragging');
      try { nav.setPointerCapture(d.pid); } catch (x) {}
    }
    e.preventDefault();
    const r0 = nav.getBoundingClientRect();     // near the top or bottom edge, the list scrolls
    if (e.clientY < r0.top + 24) nav.scrollTop -= 12; else if (e.clientY > r0.bottom - 24) nav.scrollTop += 12;
    const items = [...nav.querySelectorAll('.rmpage')];
    items.forEach(x => x.classList.remove('dropbefore', 'dropafter'));
    let t = items.find(x => { const r = x.getBoundingClientRect(); return e.clientY < r.top + r.height / 2; });
    d.after = !t; t = t || items[items.length - 1];
    d.to = t.dataset.id;
    if (d.to !== d.id) t.classList.add(d.after ? 'dropafter' : 'dropbefore');
  });
  function endDrag(apply) {
    const d = dragging;
    dragging = null;
    if (!d || !d.on) return;
    nav._moved = true; setTimeout(() => { nav._moved = false; }, 0);
    unmark();
    if (!apply || !d.to || d.to === d.id) return;
    flush();
    const ids = list().map(p => p.id).filter(x => x !== d.id);
    let i = ids.indexOf(d.to);
    if (i < 0) return;
    ids.splice(d.after ? i + 1 : i, 0, d.id);
    store.order = ids; persist(); drawNav(); stateLine();
  }
  nav.addEventListener('pointerup', () => endDrag(true));
  nav.addEventListener('pointercancel', () => endDrag(false));
  sel.addEventListener('change', () => go(sel.value));
  $('rmadd').addEventListener('click', addPage);
  $('rmadd2').addEventListener('click', addPage);
  $('rmup').addEventListener('click', () => move(-1));
  $('rmdown').addEventListener('click', () => move(1));
  $('rmdel').addEventListener('click', delPage);
  $('rmresetpage').addEventListener('click', resetPage);
  $('rmresetall').addEventListener('click', resetAll);
  name.addEventListener('input', () => { if (editing) later(); });
  name.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); body.focus(); } });
  body.addEventListener('input', () => { if (editing) later(); });
  document.addEventListener('selectionchange', () => { if (editing) keep(); });
  tools.addEventListener('mousedown', e => { if (e.target.closest('button')) e.preventDefault(); });
  tools.addEventListener('click', e => { const b = e.target.closest('button[data-cmd]'); if (b) run(b.dataset.cmd, b.dataset.val); });
  $('rmfont').addEventListener('change', e => { if (e.target.value) run('fontName', e.target.value); e.target.value = ''; });
  $('rmsize').addEventListener('change', e => { if (e.target.value) run('fontSize', e.target.value); e.target.value = ''; });
  $('rmcolor').addEventListener('input', e => run('foreColor', e.target.value));
  $('rmexport').addEventListener('click', () => {
    flush();
    const html = '<!doctype html><meta charset="utf-8"><title>README (' + esc(NS) + ')</title>\n' +
      list().map(p => '<h1>' + esc(p.title) + '</h1>\n' + clean(p.html) + (p.extra ? '\n<h2>Site notes</h2>\n' + clean(p.extra) : '')).join('\n<hr>\n') + '\n';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    a.download = NS + '-readme.html';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
})();
