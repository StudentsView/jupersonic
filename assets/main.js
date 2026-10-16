(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

  const bar = document.querySelector('.bar');
  const hero = document.querySelector('.hero');
  const heroPin = document.querySelector('.hero-pin');
  const word = document.getElementById('heroWord');
  const machValue = document.getElementById('machValue');
  const mach = machValue.parentElement;
  const speedFill = document.getElementById('speedFill');
  const runner = document.getElementById('runner');
  const flow = document.getElementById('flow');
  const flowFill = document.getElementById('flowFill');
  const steps = [...document.querySelectorAll('.flow-step')];
  const closing = document.getElementById('closingLine');
  const vertical = window.matchMedia('(max-width: 860px)');

  // Size the hero word so that at full width ("wdth" 150) it spans the column exactly.
  const fitHero = () => {
    const prev = word.style.fontVariationSettings;
    word.style.fontSize = '100px';
    word.style.fontVariationSettings = '"wdth" 150';
    const natural = word.getBoundingClientRect().width;
    const styles = getComputedStyle(heroPin);
    const avail = heroPin.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
    word.style.fontVariationSettings = prev;
    word.style.fontSize = '';
    if (natural > 0) document.documentElement.style.setProperty('--hero-size', `${(avail / natural) * 100 * 0.995}px`);
  };

  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;

    // Hero: condensed to expanded, Mach 0 to 1.2
    const rect = hero.getBoundingClientRect();
    const travel = hero.offsetHeight - vh;
    const p = clamp(-rect.top / travel);
    const eased = 1 - Math.pow(1 - p, 2);
    if (!reduce) word.style.fontVariationSettings = `"wdth" ${(50 + 100 * eased).toFixed(2)}`;
    const m = reduce ? 1.2 : eased * 1.2;
    machValue.textContent = m.toFixed(2);
    mach.classList.toggle('is-super', m >= 1);
    speedFill.style.transform = `scaleX(${reduce ? 1 : p})`;

    bar.classList.toggle('is-solid', rect.bottom <= vh + 1);
    const rr = runner.getBoundingClientRect();
    bar.classList.toggle('on-dark', rr.top <= 30 && rr.bottom > 30);

    if (reduce) return;

    // Runner flow: fill the track as the diagram travels up through the screen
    const fr = flow.getBoundingClientRect();
    const fp = clamp((vh * 0.85 - fr.top) / (vh * 0.5));
    flowFill.style.transform = vertical.matches ? `scaleY(${fp})` : `scaleX(${fp})`;
    steps.forEach((s, i) => s.classList.toggle('is-on', fp >= (i / steps.length) + 0.02 || (i === 0 && fp > 0)));

    // Closing line fills like a progress bar
    const cr = closing.getBoundingClientRect();
    const cp = clamp((vh * 0.85 - cr.top) / (vh * 0.6));
    closing.style.setProperty('--fill', `${(cp * 100).toFixed(1)}%`);
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

  // One-time reveals
  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      reveal.unobserve(e.target);
    });
  }, { threshold: 0.35 });
  document.querySelectorAll('.equation').forEach((el) => reveal.observe(el));
  document.querySelectorAll('.work-item').forEach((el, i) => {
    el.style.setProperty('--d', `${i * 90}ms`);
    reveal.observe(el);
  });

  const init = () => { fitHero(); update(); };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { fitHero(); onScroll(); });
  init();
  if (document.fonts) {
    document.fonts.load('700 100px "Anybody"', 'Jupersonic').then(init).catch(() => {});
    document.fonts.ready.then(init);
  }
})();
