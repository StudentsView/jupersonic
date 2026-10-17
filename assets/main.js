(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wide = window.matchMedia('(min-width: 901px)');
  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  const $ = (s) => document.querySelector(s);

  const nav = $('#nav');
  const hero = $('.hero');
  const heroInner = $('#heroInner');
  const word = $('#word');
  const partJ = $('#partJ');
  const runner = $('#runner');

  /* Hero: measure S and J so the slot can change width as the letter rolls,
     then size the whole word to fill the column. */
  const fitWord = () => {
    const h1 = word.parentElement;
    h1.style.fontSize = '100px';
    const s = partJ.querySelector('.s').getBoundingClientRect().width / 100;
    const j = partJ.querySelector('.j').getBoundingClientRect().width / 100;
    hero.style.setProperty('--s-w', `${s}em`);
    hero.style.setProperty('--j-w', `${j}em`);
    const prev = partJ.style.transition;
    partJ.style.transition = 'none';
    const wasJ = hero.classList.contains('is-j');
    hero.classList.add('is-j');
    const total = word.getBoundingClientRect().width;
    if (!wasJ) hero.classList.remove('is-j');
    void partJ.offsetWidth;
    partJ.style.transition = prev;
    const avail = heroInner.clientWidth - parseFloat(getComputedStyle(heroInner).paddingLeft) * 2;
    h1.style.fontSize = '';
    hero.style.setProperty('--word-size', `${Math.min((avail / total) * 100, window.innerHeight * 0.42)}px`);
  };

  const play = () => {
    if (reduce) {
      hero.classList.add('is-ready', 'is-j', 'is-noted');
      return;
    }
    setTimeout(() => hero.classList.add('is-ready'), 40);
    setTimeout(() => hero.classList.add('is-j'), 1300);
    setTimeout(() => hero.classList.add('is-noted'), 2150);
  };

  // Hovering the J shows where it came from.
  partJ.addEventListener('mouseenter', () => { if (hero.classList.contains('is-noted')) hero.classList.remove('is-j'); });
  partJ.addEventListener('mouseleave', () => { if (hero.classList.contains('is-noted')) hero.classList.add('is-j'); });

  /* Intro paragraph lights up word by word as it scrolls past */
  const reveal = $('#reveal');
  reveal.innerHTML = reveal.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
  const words = [...reveal.querySelectorAll('.w')];
  let lit = -1;

  /* Fromise features */
  const features = [...document.querySelectorAll('.feature')];
  const shots = [...document.querySelectorAll('.shot')];
  let activeFeature = 0;
  const setFeature = (i) => {
    if (i === activeFeature) return;
    activeFeature = i;
    features.forEach((f, k) => f.classList.toggle('is-active', k === i));
    shots.forEach((s, k) => s.classList.toggle('is-active', k === i));
  };

  /* Runner: translate one line at a time */
  const xlate = $('#xlate');
  const codeX = [...document.querySelectorAll('#codeX li')];
  const codeA = [...document.querySelectorAll('#codeA li')];
  let translated = -1;

  const update = () => {
    const vh = window.innerHeight;
    const y = window.scrollY;

    // hero recedes as the sheet covers it
    const hp = clamp(y / vh);
    if (!reduce) {
      heroInner.style.transform = `translateY(${(-hp * 14).toFixed(2)}vh) scale(${(1 - hp * 0.04).toFixed(4)})`;
      heroInner.style.opacity = (1 - hp * 1.1).toFixed(3);
    }
    hero.style.visibility = hp >= 1 ? 'hidden' : '';

    nav.classList.toggle('is-solid', y > vh * 0.85);
    const rr = runner.getBoundingClientRect();
    nav.classList.toggle('is-dark', rr.top <= 30 && rr.bottom > 30);

    // intro words
    const r = reveal.getBoundingClientRect();
    const p = reduce ? 1 : clamp((vh * 0.82 - r.top) / (r.height + vh * 0.2));
    const n = Math.round(p * words.length) - 1;
    if (n !== lit) {
      words.forEach((w, i) => w.classList.toggle('is-on', i <= n));
      lit = n;
    }

    // feature closest to the middle of the screen
    if (wide.matches) {
      let best = 0, dist = Infinity;
      features.forEach((f, i) => {
        const b = f.getBoundingClientRect();
        const d = Math.abs(b.top + b.height / 2 - vh / 2);
        if (d < dist) { dist = d; best = i; }
      });
      setFeature(best);
    }

    // code translation
    const xr = xlate.getBoundingClientRect();
    const xp = reduce ? 1 : clamp((vh * 0.8 - xr.top) / (vh * 0.45));
    const t = Math.round(xp * codeX.length) - 1;
    if (t !== translated) {
      translated = t;
      codeX.forEach((li, i) => li.classList.toggle('is-cur', i === t));
      codeA.forEach((li, i) => {
        li.classList.toggle('is-on', i <= t);
        li.classList.toggle('is-cur', i === t && t < codeA.length - 1);
      });
    }
  };

  const init = () => { fitWord(); update(); };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', init);
  wide.addEventListener('change', () => { activeFeature = -1; update(); });

  init();
  const fontsReady = document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]) : Promise.resolve();
  fontsReady.then(() => { init(); play(); });
})();
