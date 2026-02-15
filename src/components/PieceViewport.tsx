'use client';

import Link from 'next/link';
import { PieceMeta } from '@/lib/types';
import { AudioProvider } from '@/lib/audioContext';
import AudioToggle from '@/components/AudioToggle';

interface PieceViewportProps {
  piece: PieceMeta;
  children: React.ReactNode;
}

export default function PieceViewport({ piece, children }: PieceViewportProps) {
  const content = (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg font-mono">
      <div className="flex h-8 shrink-0 items-center justify-between px-4 text-xs text-text-subtle">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-text-subtle hover:text-text-muted transition-colors">
            ← INT ARCHIVE
          </Link>
          <span>
            {piece.designation} — {piece.subtitle}
          </span>
          {piece.hasAnalysis && (
            <Link
              href={`/int/${piece.id}/analysis`}
              className="text-accent hover:text-amber transition-colors"
            >
              ANALYSIS
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          {piece.hasAudio && <AudioToggle />}
          <span>intora.net</span>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );

  if (piece.hasAudio) {
    return <AudioProvider>{content}</AudioProvider>;
  }

  return content;
}
