'use client';

import { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    let raf: number;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      const target = e.target as HTMLElement;
      const hovering =
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        !!target.closest('a') ||
        !!target.closest('button');

      setIsHovering(hovering);
    };

    const animate = () => {
      cursorX += (mouseX - cursorX) * 0.25;
      cursorY += (mouseY - cursorY) * 0.25;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
      }
      raf = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMove);
    animate();

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 pointer-events-none z-[999999] mix-blend-normal"
      style={{
        transform: 'translate(-100px, -100px)', // Start offscreen
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="black"
        stroke="white"
        strokeWidth="1.5"
        className="drop-shadow-md"
        style={{
          transform: isHovering ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform 0.2s ease',
        }}
      >
        <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.42a.5.5 0 0 0 .35-.85L5.5 3.21z" />
      </svg>
      <div 
        className="absolute left-5 top-5 bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-md tracking-wide"
        style={{
          opacity: isHovering ? 1 : 0,
          transform: isHovering ? 'scale(1)' : 'scale(0.8)',
          transformOrigin: 'top left',
          transition: 'all 0.2s ease',
        }}
      >
        you
      </div>
    </div>
  );
}
