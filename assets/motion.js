// Doodiez Studio — motion and small interactions.
// Ideas adapted from the Subframe Motion Library (subframe.com/motion, MIT):
// word-reveal (masked rise), project-index (preview reel), magnetic-button (spring pull).
// Everything here is an enhancement: with reduced motion, no JavaScript or a touch screen,
// the page works and reads the same, just without movement.
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const phone = matchMedia('(max-width: 900px)');
  if (reduce.matches) return;
  root.classList.add('motion');

  // 1. Hero wordmark: each letter rises out of the line's mask (word-reveal, per letter).
  //    The brand name isn't translated, so splitting it doesn't affect the language switch.
  const mark = document.querySelector('.wordmark');
  if (mark) {
    const text = mark.textContent;
    mark.textContent = '';
    [...text].forEach((ch, i) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--i', i);
      s.textContent = ch;
      mark.appendChild(s);
    });
  }

  // 2. Scroll reveals: content rises 24px and fades in once as it enters the screen.
  //    On phones, swipeable rows reveal as one block so off-screen cards aren't left hidden.
  const groups = phone.matches
    ? ['.featured', '.proj-teaser', '.proj-shots']
    : ['.featured .item', '.proj-teaser .pt', '.proj-shots .item'];
  const targets = [
    '.head', '.cat', '.gallery .item', '.proj-hero', '.proj-body', '.service', '.brief > div',
    '.about .mosaic', '.about .prose > *', '.edu li', '.other-list li', '.band-inner', ...groups
  ].join(',');
  const els = [...document.querySelectorAll(targets)].filter(el => !el.closest('.hero, .page-head, .lb'));
  if ('IntersectionObserver' in window) {
    els.forEach(el => el.classList.add('rv'));
    const io = new IntersectionObserver(entries => {
      // Stagger only what arrives together, 60ms apart, capped so the batch stays short.
      entries.filter(e => e.isIntersecting).forEach((e, n) => {
        e.target.style.setProperty('--d', Math.min(n, 6) * 60 + 'ms');
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(el => io.observe(el));
    // Printing or saving as PDF shows everything.
    addEventListener('beforeprint', () => els.forEach(el => el.classList.add('in')));
    // Gallery filters show items that were hidden; reveal those straight away.
    document.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
      document.querySelectorAll('.gallery .item.rv:not(.in)').forEach(el => {
        if (!el.hidden) { el.style.setProperty('--d', '0ms'); el.classList.add('in'); io.unobserve(el); }
      });
    }));
  }

  if (!finePointer.matches) return;

  // 3. "What I design" rows: a preview window follows the cursor, and a reel of sample
  //    work slides to the hovered category (project-index). Mouse only, purely decorative.
  const cats = [...document.querySelectorAll('.cat[data-preview]')];
  if (cats.length) {
    const win = document.createElement('div');
    win.className = 'peek';
    win.setAttribute('aria-hidden', 'true');
    win.innerHTML = '<div class="peek-reel">' +
      cats.map(c => `<img src="${c.dataset.preview}" alt="" loading="lazy">`).join('') + '</div>';
    document.body.appendChild(win);
    const reel = win.firstChild;
    reel.style.height = cats.length * 100 + '%';
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0, showing = false, snap = true;
    const tick = () => {
      x += (tx - x) * 0.18; y += (ty - y) * 0.18;               // soft follow
      win.style.transform = `translate3d(${x}px,${y}px,0)`;
      raf = (showing || Math.abs(tx - x) + Math.abs(ty - y) > 0.5) ? requestAnimationFrame(tick) : 0;
    };
    const list = cats[0].parentElement;
    list.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      tx = e.clientX + 24; ty = e.clientY - win.offsetHeight / 2;
      if (snap) { x = tx; y = ty; snap = false; }               // appear at the cursor, then follow
      if (!raf) raf = requestAnimationFrame(tick);
    });
    cats.forEach((c, i) => c.addEventListener('pointerenter', e => {
      if (e.pointerType !== 'mouse') return;
      reel.style.transform = `translateY(-${(i * 100) / cats.length}%)`;
      if (!showing) { reel.style.transition = 'none'; reel.offsetHeight; reel.style.transition = ''; }
      showing = true; win.classList.add('on');
    }));
    const hide = () => { showing = false; snap = true; win.classList.remove('on'); };
    list.addEventListener('pointerleave', hide);
    window.addEventListener('scroll', () => { if (showing) hide(); }, { passive: true });
  }

  // 4. Main buttons lean toward the cursor and spring back (magnetic-button).
  //    Pull is up to 28% of the offset, fading to nothing 160px from the centre.
  document.querySelectorAll('.band .btn, .proj-btns .btn:not(.ghost)').forEach(btn => {
    let tx = 0, ty = 0, x = 0, y = 0, vx = 0, vy = 0, raf = 0, last = 0;
    const k = 180, c = 18, m = 0.3;                              // spring: stiffness, damping, mass
    const step = t => {
      const dt = Math.min((t - (last || t)) / 1000, 1 / 30); last = t;
      vx += ((k * (tx - x) - c * vx) / m) * dt; x += vx * dt;
      vy += ((k * (ty - y) - c * vy) / m) * dt; y += vy * dt;
      btn.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`;
      const moving = Math.abs(tx - x) + Math.abs(ty - y) + Math.abs(vx) + Math.abs(vy) > 0.05;
      if (moving) raf = requestAnimationFrame(step);
      else { raf = 0; last = 0; if (!tx && !ty) btn.style.translate = ''; }
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
    window.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left - x + r.width / 2), dy = e.clientY - (r.top - y + r.height / 2);
      const s = Math.max(0, 1 - Math.hypot(dx, dy) / 160) * 0.28;
      if (s === 0 && !tx && !ty) return;
      tx = dx * s; ty = dy * s; kick();
    }, { passive: true });
    document.addEventListener('pointerleave', () => { tx = ty = 0; kick(); });
  });
})();
