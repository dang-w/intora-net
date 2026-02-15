import { notFound } from 'next/navigation';
import Link from 'next/link';
import { pieces, getPiece } from '@/lib/registry';

export function generateStaticParams() {
  return pieces.filter(p => p.hasAnalysis).map(p => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const piece = getPiece(id);
  if (!piece) return { title: 'SIGNAL NOT FOUND | INT ARCHIVE' };
  return {
    title: `ANALYSIS: ${piece.designation} — ${piece.subtitle} | INT ARCHIVE`,
    description: `Signal analysis for ${piece.designation} — ${piece.subtitle}`,
  };
}

export default async function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const piece = getPiece(id);

  if (!piece || !piece.hasAnalysis) {
    notFound();
  }

  // Dynamic import of piece-specific analysis content
  let AnalysisContent: React.ComponentType;
  try {
    const mod = await import(`@/components/analysis/INT${piece.id}Analysis`);
    AnalysisContent = mod.default;
  } catch {
    notFound();
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg font-mono">
      <div className="flex h-8 shrink-0 items-center justify-between px-4 text-xs text-text-subtle">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-text-subtle hover:text-text-muted transition-colors">
            ← INT ARCHIVE
          </Link>
          <Link href={`/int/${piece.id}`} className="text-text-subtle hover:text-text-muted transition-colors">
            {piece.designation} — {piece.subtitle}
          </Link>
          <span className="text-accent">ANALYSIS</span>
        </div>
        <span>intora.net</span>
      </div>
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <AnalysisContent />
      </div>
    </div>
  );
}
