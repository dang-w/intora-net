'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getLivePieces } from '@/lib/registry';

const livePieces = getLivePieces();

function MonitoringDots() {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount(prev => (prev % 3) + 1);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-block w-12">
      {Array.from({ length: dotCount }, () => '·').join(' ')}
    </span>
  );
}

export default function CataloguePage() {
  const entryCount = livePieces.length;

  return (
    <div className="flex h-screen w-screen flex-col bg-bg px-8 py-8 font-mono">
      <header className="mb-8">
        <h1 className="text-lg text-text">INT ARCHIVE</h1>
        <div className="text-text-subtle">═══════════════════════════════════════════</div>
        <div className="text-sm text-text-muted">SIGNAL CATALOGUE · INTORA SYSTEMS</div>
        <div className="text-sm text-text-muted">
          STATUS: <span className="text-accent">ACTIVE</span> · ENTRIES: {entryCount}
        </div>
      </header>

      <main className="flex-1">
        {entryCount === 0 ? (
          <div className="mt-16 text-text-subtle">
            <div>NO SIGNALS ACQUIRED</div>
            <div className="mt-2">
              MONITORING <MonitoringDots />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {livePieces.map(piece => (
              <div key={piece.id}>
                <Link
                  href={`/int/${piece.id}`}
                  className="group block text-sm hover:bg-surface-raised transition-colors px-2 py-1 -mx-2"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="text-amber">{piece.designation}</span>
                    <span className="text-text-subtle">──</span>
                    <span className="text-text">{piece.subtitle}</span>
                    <span className="flex-1 text-text-subtle overflow-hidden whitespace-nowrap">
                      {'─'.repeat(60)}
                    </span>
                    <span className="text-accent">[LIVE]</span>
                    {piece.date && (
                      <span className="text-text-subtle">{piece.date}</span>
                    )}
                  </div>
                  {piece.description && (
                    <div className="pl-22 text-text-muted">
                      {piece.description}
                    </div>
                  )}
                </Link>
                {piece.hasAnalysis && (
                  <Link
                    href={`/int/${piece.id}/analysis`}
                    className="block text-sm text-text-subtle hover:text-text-muted transition-colors px-2 -mx-2"
                  >
                    <span className="pl-22">└─ ANALYSIS</span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="text-xs text-text-subtle">
        <div>INTORA SYSTEMS · intora.net</div>
      </footer>
    </div>
  );
}
