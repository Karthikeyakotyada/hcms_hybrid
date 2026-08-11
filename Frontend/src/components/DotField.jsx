import React, { useEffect, useRef } from 'react';

/**
 * React Bits - Dot Field Background Component
 * 
 * An interactive, performant canvas-based dot grid background
 * featuring smooth wave animations and subtle cursor micro-interactions.
 */
const DotField = ({
  dotColor = 'rgba(0, 240, 255, 0.25)',
  accentColor = 'rgba(168, 85, 247, 0.18)',
  glowColor = 'rgba(0, 240, 255, 0.65)',
  backgroundColor = '#060911',
  dotSize = 1.6,
  gap = 26,
  speed = 0.5,
  waveAmplitude = 2.0,
  cursorRadius = 140,
  cursorForce = 0.8,
  className = '',
  style = {},
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const effectiveSpeed = prefersReducedMotion ? 0 : speed;
    const effectiveAmplitude = prefersReducedMotion ? 0 : waveAmplitude;

    // Mouse state with smooth interpolation
    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      active: false,
    };

    // Resize handler
    const handleResize = () => {
      const container = containerRef.current || canvas.parentElement || document.body;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    handleResize();

    // Resize observer
    let resizeObserver;
    if (window.ResizeObserver && containerRef.current) {
      resizeObserver = new ResizeObserver(() => handleResize());
      resizeObserver.observe(containerRef.current);
    } else {
      window.addEventListener('resize', handleResize);
    }

    // Mouse event handlers attached to window so they track smoothly across the viewport
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    let startTime = performance.now();

    // Animation render loop
    const render = (currentTime) => {
      const elapsed = (currentTime - startTime) * 0.001;

      // Smooth mouse interpolation
      if (mouse.active) {
        mouse.x += (mouse.targetX - mouse.x) * 0.15;
        mouse.y += (mouse.targetY - mouse.y) * 0.15;
      } else {
        mouse.x += (-1000 - mouse.x) * 0.1;
        mouse.y += (-1000 - mouse.y) * 0.1;
      }

      // Draw background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      // Calculate grid dimensions
      // Add margin to cover edges seamlessly
      const cols = Math.ceil(width / gap) + 2;
      const rows = Math.ceil(height / gap) + 2;
      const offsetX = (width - (cols - 1) * gap) / 2;
      const offsetY = (height - (rows - 1) * gap) / 2;

      for (let r = 0; r < rows; r++) {
        const baseY = offsetY + r * gap;
        
        for (let c = 0; c < cols; c++) {
          const baseX = offsetX + c * gap;

          // Wave equation
          const wavePhase = (baseX * 0.008) + (baseY * 0.008) + (elapsed * effectiveSpeed);
          const waveSin = Math.sin(wavePhase);
          const waveCos = Math.cos(wavePhase * 0.7);

          // Subtle idle displacement
          let posX = baseX + waveCos * (effectiveAmplitude * 0.5);
          let posY = baseY + waveSin * effectiveAmplitude;

          // Dot size and opacity variation
          let currentSize = dotSize * (0.85 + 0.25 * waveSin);
          let alpha = 0.20 + 0.12 * waveSin;
          let isHovered = false;

          // Mouse interaction (subtle bulge / repulsion)
          if (mouse.x > -500 && mouse.y > -500) {
            const dx = posX - mouse.x;
            const dy = posY - mouse.y;
            const dist = Math.hypot(dx, dy);

            if (dist < cursorRadius) {
              const normDist = dist / cursorRadius;
              const influence = Math.pow(1 - normDist, 2);

              // Gentle displacement away from cursor
              const push = influence * cursorForce * 10;
              posX += (dx / (dist || 1)) * push;
              posY += (dy / (dist || 1)) * push;

              // Size and brightness boost
              currentSize = dotSize * (1 + influence * 0.75);
              alpha = Math.min(1, alpha + influence * 0.55);
              isHovered = influence > 0.3;
            }
          }

          // Render dot
          ctx.beginPath();
          ctx.arc(posX, posY, Math.max(0.5, currentSize), 0, Math.PI * 2);

          if (isHovered) {
            ctx.fillStyle = glowColor;
            ctx.shadowBlur = 6;
            ctx.shadowColor = glowColor;
          } else if (waveSin > 0.6 && accentColor) {
            ctx.fillStyle = accentColor;
            ctx.shadowBlur = 0;
          } else {
            ctx.fillStyle = dotColor.replace(/[\d.]+\)$/, `${alpha.toFixed(3)})`);
            ctx.shadowBlur = 0;
          }

          ctx.fill();
        }
      }

      ctx.shadowBlur = 0;
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, [
    dotColor,
    accentColor,
    glowColor,
    backgroundColor,
    dotSize,
    gap,
    speed,
    waveAmplitude,
    cursorRadius,
    cursorForce,
  ]);

  return (
    <div
      ref={containerRef}
      className={`dot-field-container ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        backgroundColor,
        ...style,
      }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
};

export default DotField;
