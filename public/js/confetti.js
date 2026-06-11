/**
 * 卡片解锁庆祝礼花 — 全屏 Canvas，无外部依赖
 */
(function () {
  let canvas = null;
  let ctx = null;
  let rafId = null;
  let particles = [];
  let running = false;

  const DEFAULT_COLORS = [
    '#f7cf67',
    '#ff8d4d',
    '#00d4ff',
    '#59f1ff',
    '#ff6bb5',
    '#89f06a',
    '#b695ff',
    '#ffffff',
  ];

  function ensureCanvas() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.id = 'celebration-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
  }

  function resizeCanvas() {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
  }

  function spawnBurst(x, y, count, colors, power) {
    for (let i = 0; i < count; i += 1) {
      const angle = rand(-Math.PI, Math.PI);
      const speed = rand(power * 0.45, power);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - rand(2, 6),
        w: rand(5, 10),
        h: rand(3, 8),
        rot: rand(0, Math.PI * 2),
        spin: rand(-0.22, 0.22),
        color: pick(colors),
        life: rand(1.4, 2.4),
        age: 0,
        shape: Math.random() > 0.35 ? 'rect' : 'circle',
        drag: rand(0.985, 0.992),
        gravity: rand(0.16, 0.24),
      });
    }
  }

  function spawnFountain(x, y, count, colors) {
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x: x + rand(-16, 16),
        y,
        vx: rand(-2.2, 2.2),
        vy: rand(-10, -16),
        w: rand(4, 8),
        h: rand(3, 7),
        rot: rand(0, Math.PI * 2),
        spin: rand(-0.18, 0.18),
        color: pick(colors),
        life: rand(1.8, 2.8),
        age: 0,
        shape: 'rect',
        drag: 0.988,
        gravity: 0.22,
      });
    }
  }

  function tick(now, start) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);

    particles = particles.filter((p) => {
      p.age += 0.016;
      if (p.age >= p.life) return false;

      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.spin;

      const alpha = 1 - p.age / p.life;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.w * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w * 0.5, -p.h * 0.5, p.w, p.h);
      }
      ctx.restore();
      return true;
    });

    if (particles.length === 0 && now - start > 3200) {
      stopCelebration();
      return;
    }

    rafId = requestAnimationFrame((t) => tick(t, start));
  }

  function stopCelebration() {
    running = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    particles = [];
    if (ctx && canvas) {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
    canvas?.classList.remove('is-active');
  }

  function fireCardCelebration(options = {}) {
    if (running) stopCelebration();

    const colors = options.colors?.length ? options.colors : DEFAULT_COLORS;
    ensureCanvas();
    canvas.classList.add('is-active');
    running = true;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const cardTop = options.originY ?? h * 0.38;

    spawnBurst(w * 0.5, cardTop, 90, colors, 11);
    spawnFountain(w * 0.18, h * 0.92, 28, colors);
    spawnFountain(w * 0.82, h * 0.92, 28, colors);

    window.setTimeout(() => {
      if (!running) return;
      spawnBurst(w * 0.5, cardTop * 0.82, 55, colors, 9);
      spawnBurst(w * 0.28, cardTop * 1.05, 24, colors, 7);
      spawnBurst(w * 0.72, cardTop * 1.05, 24, colors, 7);
    }, 420);

    window.setTimeout(() => {
      if (!running) return;
      spawnFountain(w * 0.5, h * 0.95, 20, colors);
    }, 780);

    const start = performance.now();
    rafId = requestAnimationFrame((t) => tick(t, start));
  }

  window.SoccerConfetti = {
    fireCardCelebration,
    stopCelebration,
  };
})();
