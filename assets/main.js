// Doodiez Studio — shared behaviour for every page
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  // Header border once you scroll
  const header = $('header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Dark / light toggle (dark by default, choice remembered)
  const root = document.documentElement, themeBtn = $('#themeBtn');
  const syncTheme = () => themeBtn.setAttribute('aria-label', (window.t || (s => s))(root.dataset.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'));
  document.addEventListener('langchange', () => syncTheme());
  themeBtn.addEventListener('click', () => {
    const light = root.dataset.theme !== 'light';
    if (light) root.dataset.theme = 'light'; else root.removeAttribute('data-theme');
    try { localStorage.setItem('theme', light ? 'light' : 'dark'); } catch (e) {}
    syncTheme();
  });
  syncTheme();

  // Mobile menu
  const menuBtn = $('#menuBtn'), drawer = $('#drawer');
  const setMenu = open => { drawer.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', open); };
  if (menuBtn) {
    menuBtn.addEventListener('click', () => setMenu(!drawer.classList.contains('open')));
    $$('a', drawer).forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', () => { if (window.innerWidth > 900) setMenu(false); });
  }

  // Work filters (work page). Links like work.html#poster open on that category.
  const items = $$('.item');
  const chips = $$('.chip');
  if (chips.length) {
    const apply = f => {
      chips.forEach(c => c.setAttribute('aria-pressed', c.dataset.filter === f));
      items.forEach(i => i.hidden = !(f === 'all' || i.dataset.cat === f));
    };
    chips.forEach(chip => {
      const f = chip.dataset.filter;
      const n = f === 'all' ? items.length : items.filter(i => i.dataset.cat === f).length;
      chip.insertAdjacentHTML('beforeend', `<small>${n}</small>`);
      chip.addEventListener('click', () => {
        apply(f);
        history.replaceState(null, '', f === 'all' ? location.pathname : '#' + f);
      });
    });
    const start = location.hash.slice(1);
    apply(chips.some(c => c.dataset.filter === start) ? start : 'all');
  }

  // Lightbox (any page with .item)
  const lb = $('#lb');
  if (!lb || !items.length) return;
  const lbImg = $('#lbImg'), stage = $('#lbStage');
  let list = [], idx = 0, lastFocus = null;
  function show(i) {
    idx = (i + list.length) % list.length;
    const it = list[idx], img = $('img', it);
    lbImg.src = it.dataset.full || img.src;
    lbImg.alt = img.alt;
    stage.classList.toggle('tall', it.hasAttribute('data-tall'));
    stage.scrollTop = 0;
    $('#lbTitle').textContent = $('.cap b', it).textContent;
    $('#lbType').textContent = $('.cap span', it).textContent;
    $('#lbCount').textContent = `${idx + 1} / ${list.length}`;
  }
  function open(item) {
    list = items.filter(i => !i.hidden);
    lastFocus = item;
    lb.hidden = false; lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    show(list.indexOf(item));
    $('#lbClose').focus();
  }
  function close() {
    lb.classList.remove('open'); lb.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  items.forEach(i => i.addEventListener('click', () => open(i)));
  $('#lbClose').addEventListener('click', close);
  $('#lbPrev').addEventListener('click', () => show(idx - 1));
  $('#lbNext').addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', e => { if (e.target === lb || e.target === stage) close(); });
  // Swipe on phones: left/right to move, down to close
  let sx = 0, sy = 0;
  stage.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(idx + (dx < 0 ? 1 : -1));
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx) && !stage.classList.contains('tall')) close();
  }, { passive: true });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
})();
