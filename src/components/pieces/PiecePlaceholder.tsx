'use client';

import { useRef, useEffect } from 'react';
import { PALETTE } from '@/lib/palette';

interface PieceProps {
  width: number;
  height: number;
}

export default function PiecePlaceholder({ width, height }: PieceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = PALETTE.textSubtle;
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('AWAITING SIGNAL', width / 2, height / 2);
  }, [width, height]);

  return <canvas ref={canvasRef} width={width} height={height} />;
}
