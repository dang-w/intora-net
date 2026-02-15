'use client';

import { useState, useEffect, useRef } from 'react';
import { PIECE_COMPONENTS } from '@/lib/pieceComponents';
import { PALETTE } from '@/lib/palette';

interface PieceThumbnailProps {
  pieceId: string;
  width: number;
  height: number;
}

export default function PieceThumbnail({ pieceId, width, height }: PieceThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: '100px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const PieceComponent = PIECE_COMPONENTS[pieceId];

  // Render canvas at 2x internal resolution for better density, display at 1x
  const scale = 2;

  return (
    <div
      ref={containerRef}
      style={{ width, height, background: PALETTE.bg, overflow: 'hidden' }}
    >
      {isVisible && PieceComponent && (
        <div style={{ width: width * scale, height: height * scale, transform: `scale(${1 / scale})`, transformOrigin: 'top left' }}>
          <PieceComponent width={width * scale} height={height * scale} fps={10} />
        </div>
      )}
    </div>
  );
}
