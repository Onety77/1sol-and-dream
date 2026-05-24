import { useEffect, useRef } from 'react';

export default function StarField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let frame = 0;
    const isMobile = window.innerWidth < 768;

    const W = () => canvas.width;
    const H = () => canvas.height;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Smooth mouse — lerped toward target
    const mouse    = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const target   = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    // ── Star factory ──────────────────────────────────────────────────
    // 3 depth layers: far (slow), mid, close (fast)
    const makeStar = (layerDepth) => {
      const angle = Math.random() * Math.PI * 2;
      // close stars drift faster, far stars drift almost imperceptibly
      const speed = (0.018 + Math.random() * 0.022) * layerDepth;
      const sizeBase = layerDepth < 0.4 ? 0.25 + Math.random() * 0.5
                     : layerDepth < 0.7 ? 0.5  + Math.random() * 0.9
                     :                    0.9  + Math.random() * 1.3;
      // star color: mostly cool-white, warm for big, rare neon
      const roll = Math.random();
      const color = roll > 0.97 ? [0, 240, 255]       // electric blue
                  : roll > 0.94 ? [255, 200, 80]       // warm gold
                  : roll > 0.91 ? [180, 120, 255]      // violet
                  : sizeBase > 1.2 ? [255, 245, 220]   // warm white
                  :                 [190, 210, 255];    // cool white
      return {
        x: Math.random(),
        y: Math.random(),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: sizeBase,
        depth: layerDepth,
        baseOpacity: 0.2 + Math.random() * 0.6,
        twinkleSpeed: 0.005 + Math.random() * 0.025,
        twinklePhase: Math.random() * Math.PI * 2,
        color,
      };
    };

    const stars = [
      ...Array.from({ length: isMobile ? 30 : 80  }, () => makeStar(0.2 + Math.random() * 0.2)), // far
      ...Array.from({ length: isMobile ? 40 : 100 }, () => makeStar(0.4 + Math.random() * 0.3)), // mid
      ...Array.from({ length: isMobile ? 20 : 50  }, () => makeStar(0.7 + Math.random() * 0.3)), // close
    ];

    // ── Nebula orbs ───────────────────────────────────────────────────
    const orbs = [
      { bx: 0.12, by: 0.22, r: 0.35, rgb: [120, 60, 255], driftX: 0.08, driftY: 0.05, phase: 0 },
      { bx: 0.88, by: 0.70, r: 0.28, rgb: [0, 200, 255],  driftX: 0.06, driftY: 0.09, phase: 1.2 },
      { bx: 0.50, by: 0.02, r: 0.22, rgb: [255, 160, 0],  driftX: 0.04, driftY: 0.10, phase: 2.4 },
      { bx: 0.75, by: 0.92, r: 0.20, rgb: [255, 0, 140],  driftX: 0.07, driftY: 0.04, phase: 3.8 },
      { bx: 0.03, by: 0.75, r: 0.18, rgb: [0, 255, 180],  driftX: 0.05, driftY: 0.06, phase: 5.1 },
    ];

    // ── Shooting stars ─────────────────────────────────────────────────
    const shooters = [];
    let nextShoot = 180 + Math.random() * 240;

    const spawnShooter = () => {
      const sx = Math.random() * 0.6;
      const sy = Math.random() * 0.4;
      const ang = (Math.PI / 5) + (Math.random() - 0.5) * 0.5;
      const len = 0.08 + Math.random() * 0.12;
      shooters.push({
        x: sx, y: sy, angle: ang, length: len,
        speed: 0.006 + Math.random() * 0.007,
        life: 1.0, decay: 0.018 + Math.random() * 0.012,
        size: 1 + Math.random() * 1.5,
      });
    };

    let t = 0;

    const draw = () => {
      t    += 0.003;
      frame++;
      const cw = W(), ch = H();

      // ── Smooth mouse lerp ──
      mouse.x += (target.x - mouse.x) * 0.04;
      mouse.y += (target.y - mouse.y) * 0.04;

      // ── Background ──
      ctx.fillStyle = '#000005';
      ctx.fillRect(0, 0, cw, ch);

      // Deep radial — slowly breathes
      const breathe = 0.5 + Math.sin(t * 0.4) * 0.08;
      const bg2 = ctx.createRadialGradient(cw * 0.5, ch * 0.35, 0, cw * 0.5, ch * 0.5, cw * breathe);
      bg2.addColorStop(0, 'rgba(15,5,40,0.9)');
      bg2.addColorStop(1, 'rgba(0,0,5,0)');
      ctx.fillStyle = bg2;
      ctx.fillRect(0, 0, cw, ch);

      // ── Nebula orbs ──
      orbs.forEach(orb => {
        const ox = (orb.bx + Math.sin(t * orb.driftX + orb.phase) * 0.09) * cw;
        const oy = (orb.by + Math.cos(t * orb.driftY + orb.phase) * 0.09) * ch;
        const r  = orb.r * Math.min(cw, ch);
        const pulse = 0.85 + Math.sin(t * 0.7 + orb.phase) * 0.15;
        const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, r * pulse);
        const [R, G, B] = orb.rgb;
        g.addColorStop(0,   `rgba(${R},${G},${B},0.09)`);
        g.addColorStop(0.4, `rgba(${R},${G},${B},0.04)`);
        g.addColorStop(0.8, `rgba(${R},${G},${B},0.01)`);
        g.addColorStop(1,   'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, cw, ch);
      });

      // ── Stars ──
      stars.forEach(s => {
        // drift
        s.x += s.vx / 60;
        s.y += s.vy / 60;
        // wrap
        if (s.x < -0.02) s.x = 1.02;
        if (s.x > 1.02)  s.x = -0.02;
        if (s.y < -0.02) s.y = 1.02;
        if (s.y > 1.02)  s.y = -0.02;

        // twinkle
        s.twinklePhase += s.twinkleSpeed;
        const tw = (Math.sin(s.twinklePhase) + 1) * 0.5;
        const opacity = s.baseOpacity * (0.35 + tw * 0.65);

        // parallax — 70px total range, deeper stars move more
        const parallaxRange = isMobile ? 20 : 70;
        const px = s.x * cw - (mouse.x / cw - 0.5) * parallaxRange * s.depth;
        const py = s.y * ch - (mouse.y / ch - 0.5) * parallaxRange * s.depth;

        // skip if off canvas
        if (px < -4 || px > cw + 4 || py < -4 || py > ch + 4) return;

        const [R, G, B] = s.color;
        ctx.beginPath();
        ctx.arc(px, py, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${R},${G},${B},${opacity})`;
        ctx.fill();

        // glow halo on bright/close stars
        if (s.depth > 0.6 && s.size > 1.0) {
          const glowR = s.size * (2.5 + tw * 2);
          const glow = ctx.createRadialGradient(px, py, 0, px, py, glowR);
          glow.addColorStop(0, `rgba(${R},${G},${B},${opacity * 0.3})`);
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(px, py, glowR, 0, Math.PI * 2);
          ctx.fill();
        }

        // cross sparkle for peak-twinkle large stars
        if (s.size > 1.2 && tw > 0.82) {
          ctx.save();
          ctx.strokeStyle = `rgba(${R},${G},${B},${opacity * 0.5})`;
          ctx.lineWidth = 0.6;
          const arm = s.size * (3 + tw * 3);
          ctx.beginPath();
          ctx.moveTo(px - arm, py); ctx.lineTo(px + arm, py);
          ctx.moveTo(px, py - arm); ctx.lineTo(px, py + arm);
          ctx.stroke();
          ctx.restore();
        }
      });

      // ── Shooting stars ──
      nextShoot--;
      if (nextShoot <= 0) {
        spawnShooter();
        nextShoot = 200 + Math.random() * 400;
      }

      for (let i = shooters.length - 1; i >= 0; i--) {
        const ss = shooters[i];
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;
        ss.life -= ss.decay;

        if (ss.life <= 0 || ss.x > 1.2 || ss.y > 1.2) {
          shooters.splice(i, 1);
          continue;
        }

        const tailX = (ss.x - Math.cos(ss.angle) * ss.length) * cw;
        const tailY = (ss.y - Math.sin(ss.angle) * ss.length) * ch;
        const headX = ss.x * cw;
        const headY = ss.y * ch;

        const g = ctx.createLinearGradient(tailX, tailY, headX, headY);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.6, `rgba(200,230,255,${ss.life * 0.5})`);
        g.addColorStop(1, `rgba(255,255,255,${ss.life})`);

        ctx.save();
        ctx.strokeStyle = g;
        ctx.lineWidth = ss.size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.stroke();

        // tiny head dot
        ctx.beginPath();
        ctx.arc(headX, headY, ss.size * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${ss.life * 0.9})`;
        ctx.fill();
        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    };

    const onMouse = e => { target.x = e.clientX; target.y = e.clientY; };
    const onTouch = e => {
      if (e.touches[0]) { target.x = e.touches[0].clientX; target.y = e.touches[0].clientY; }
    };

    window.addEventListener('mousemove', onMouse);
    window.addEventListener('touchmove', onTouch, { passive: true });
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('touchmove', onTouch);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
}
