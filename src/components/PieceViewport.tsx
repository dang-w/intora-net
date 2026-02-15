'use client';

import Link from 'next/link';
import { PieceMeta } from '@/lib/types';

interface PieceViewportProps {
  piece: PieceMeta;
  children: React.ReactNode;
}

export default function PieceViewport({ piece, children }: PieceViewportProps) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg font-mono">
      <div className="flex h-8 shrink-0 items-center justify-between px-4 text-xs text-text-subtle">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-text-subtle hover:text-text-muted transition-colors">
            ← INT ARCHIVE
          </Link>
          <span>
            {piece.designation} — {piece.subtitle}
          </span>
        </div>
        <span>intora.net</span>
      </div>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
