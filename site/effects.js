/* Fresh and vibrant ambient effects: floating botanical petals, green leaves and dewdrops.
   Smooth, lightweight and respects prefers-reduced-motion. */
(() => {
  'use strict';
  function create({ bookFrame }) {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    // Fresh botanical palette: sage green, soft mint, blush rose, floral peach, morning dew gold
    const palette = ['#7ea18b', '#9ec6b0', '#f4c6bd', '#e4d3aa', '#6b9080'];
    
    const scene = document.createElement('div');
    scene.className = 'ambient-scene';
    scene.setAttribute('aria-hidden', 'true');

    const ambient = document.createElement('canvas');
    ambient.className = 'ambient-canvas';
    ambient.setAttribute('aria-hidden', 'true');
    scene.append(ambient);
    document.body.prepend(scene);

    const confetti = document.createElement('canvas');
    confetti.className = 'effects-canvas';
    confetti.setAttribute('aria-hidden', 'true');
    document.body.append(confetti);

    const glow = ambient.getContext('2d');
    const ctx = confetti.getContext('2d');

    let width = innerWidth, height = innerHeight;
    let ambientFrame = 0, confettiFrame = 0, lastDraw = 0;
    let particles = [];

    // Floating dewdrops/sparkles in background
    const stars = Array.from({ length: 24 }, (_, i) => ({
      x: ((i * 41 + 11) % 101) / 100,
      y: ((i * 29 + 17) % 97) / 100,
      phase: i * 1.7,
      size: 1.5 + (i % 3) * 0.7
    }));

    function resize() {
      width = innerWidth;
      height = innerHeight;
      const scale = Math.min(devicePixelRatio || 1, 2);
      for (const canvas of [ambient, confetti]) {
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        canvas.getContext('2d')?.setTransform(scale, 0, 0, scale, 0, 0);
      }
    }

    // Draw little botanical leaf or petal
    function drawLeaf(context, x, y, size, angle, color) {
      context.save();
      context.translate(x, y);
      context.rotate(angle);
      context.fillStyle = color;
      context.beginPath();
      context.moveTo(0, -size);
      context.quadraticCurveTo(size * 0.6, 0, 0, size);
      context.quadraticCurveTo(-size * 0.6, 0, 0, -size);
      context.fill();
      context.restore();
    }

    function ambientLoop(time) {
      if (reduced.matches || document.hidden) {
        ambientFrame = 0;
        return;
      }
      ambientFrame = requestAnimationFrame(ambientLoop);
      if (time - lastDraw < 45) return;
      lastDraw = time;

      glow.clearRect(0, 0, width, height);
      stars.forEach(s => {
        const alpha = 0.15 + (Math.sin(time * 0.0014 + s.phase) + 1) * 0.22;
        const x = s.x * width;
        const y = s.y * height + Math.sin(time * 0.0006 + s.phase) * 8;
        glow.fillStyle = `rgba(168, 204, 185, ${alpha})`;
        glow.beginPath();
        glow.arc(x, y, s.size, 0, Math.PI * 2);
        glow.fill();
      });
    }

    function startAmbient() {
      if (glow && !ambientFrame && !reduced.matches && !document.hidden) {
        ambientFrame = requestAnimationFrame(ambientLoop);
      }
    }

    function stopFrames() {
      cancelAnimationFrame(ambientFrame);
      cancelAnimationFrame(confettiFrame);
      ambientFrame = 0;
      confettiFrame = 0;
      particles = [];
      glow?.clearRect(0, 0, width, height);
      ctx?.clearRect(0, 0, width, height);
    }

    function confettiLoop(time) {
      if (reduced.matches || document.hidden) {
        particles = [];
        ctx?.clearRect(0, 0, width, height);
        confettiFrame = 0;
        return;
      }
      ctx.clearRect(0, 0, width, height);
      particles = particles.filter(p => time - p.birth < p.life);

      particles.forEach(p => {
        const t = (time - p.birth) / 1000;
        const alpha = Math.min(1, (p.life - (time - p.birth)) / 800);
        const x = p.x + p.vx * t + Math.sin(t * 2.5 + p.phase) * 16;
        const y = p.y + p.vy * t + 28 * t * t;
        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        drawLeaf(ctx, x, y, p.size, p.rotation + t * p.spin, p.color);
        ctx.restore();
      });

      if (particles.length) {
        confettiFrame = requestAnimationFrame(confettiLoop);
      } else {
        confettiFrame = 0;
        ctx.clearRect(0, 0, width, height);
      }
    }

    function burst(big = false) {
      if (reduced.matches || document.hidden || !ctx) return;
      const now = performance.now();
      const rect = bookFrame.getBoundingClientRect();
      const small = width < 761;
      const count = big ? (small ? 45 : 75) : (small ? 18 : 28);

      for (let i = 0; i < count; i++) {
        const fromLeft = i % 2 === 0;
        particles.push({
          x: fromLeft ? rect.left + rect.width * 0.15 : rect.right - rect.width * 0.15,
          y: big ? rect.top + rect.height * 0.25 : rect.top + 30,
          vx: (fromLeft ? 1 : -1) * (20 + Math.random() * 140),
          vy: big ? -100 - Math.random() * 120 : -25 + Math.random() * 40,
          size: 4 + Math.random() * 6,
          color: palette[i % palette.length],
          rotation: Math.random() * 6.28,
          spin: (Math.random() - 0.5) * 5,
          phase: Math.random() * 6.28,
          birth: now,
          life: big ? 3800 + Math.random() * 800 : 2200 + Math.random() * 600
        });
      }
      particles = particles.slice(-100);
      if (!confettiFrame) confettiFrame = requestAnimationFrame(confettiLoop);
    }

    function decorate(spread, page) {
      // Add decorative botanical touch on chapters
      if (page.kind === 'cover') {
        burst(false);
      }
    }

    function onPage(page) {
      if (page.kind === 'letter') {
        burst(true);
      }
      startAmbient();
    }

    resize();
    if (glow) startAmbient();
    addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => document.hidden ? stopFrames() : startAmbient());
    reduced.addEventListener?.('change', () => reduced.matches ? stopFrames() : startAmbient());
    addEventListener('pagehide', stopFrames);
    addEventListener('pageshow', startAmbient);

    return { decorate, onPage, burst };
  }

  window.BossEffects = Object.freeze({ create });
})();

