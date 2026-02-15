'use client';

import { useRef, useState, useEffect } from 'react';
import PiecePlaceholder from '@/components/pieces/PiecePlaceholder';

interface PieceClientProps {
  pieceId: string;
}

export default function PieceClient({ pieceId: _pieceId }: PieceClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full">
      {dimensions.width > 0 && dimensions.height > 0 && (
        <PiecePlaceholder width={dimensions.width} height={dimensions.height} />
      )}
    </div>
  );
}
