'use client'
import { useEffect, useRef } from 'react';

// Simple particle‑based fluid‑like animation.
// This is intentionally lightweight – no external deps –
// and works on both desktop and mobile browsers.
// It creates a field of small circles that drift and
// respond to mouse / touch movement, giving the impression
// of a liquid reacting to a probe.

const ParticleCount = 120;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

export default function FluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let width = rect.width;
    let height = rect.height;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const particles: Particle[] = [];
    for (let i = 0; i < ParticleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 1,
      });
    }

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    window.addEventListener('resize', handleResize);

    const handleMouse = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      let clientX: number, clientY: number;
      if (e instanceof MouseEvent) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
      mousePos.current = {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };
    const clearMouse = () => (mousePos.current = null);
    canvas.addEventListener('mousemove', handleMouse);
    canvas.addEventListener('touchmove', handleMouse);
    canvas.addEventListener('mouseleave', clearMouse);
    canvas.addEventListener('touchend', clearMouse);

    const loop = () => {
      ctx.clearRect(0, 0, width, height);

      // draw particles
      for (const p of particles) {
        // simple attraction to mouse pointer
        if (mousePos.current) {
          const dx = mousePos.current.x - p.x;
          const dy = mousePos.current.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            // pull particle towards cursor proportionally
            const force = (120 - dist) / 120 * 0.12;
            p.vx += dx / dist * force;
            p.vy += dy / dist * force;
          }
        }
        // apply velocity damping
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.x += p.vx;
        p.y += p.vy;
        // wrap around edges for continuity
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        ctx.beginPath();
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        grad.addColorStop(0, 'rgba(255,215,0,0.4)'); // gold-like glow
        grad.addColorStop(1, 'rgba(255,215,0,0)');
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouse);
      canvas.removeEventListener('touchmove', handleMouse);
      canvas.removeEventListener('mouseleave', clearMouse);
      canvas.removeEventListener('touchend', clearMouse);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none"/>;
}
