import { notFound } from 'next/navigation';
import { pieces, getPiece } from '@/lib/registry';
import PieceViewport from '@/components/PieceViewport';
import PieceClient from './PieceClient';

export function generateStaticParams() {
  return pieces.map(p => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const piece = getPiece(id);
  if (!piece) return { title: 'SIGNAL NOT FOUND | INT ARCHIVE' };
  return {
    title: `${piece.designation} — ${piece.subtitle} | INT ARCHIVE`,
    description: piece.description,
  };
}

export default async function PiecePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const piece = getPiece(id);

  if (!piece || piece.status !== 'live') {
    notFound();
  }

  return (
    <PieceViewport piece={piece}>
      <PieceClient pieceId={piece.id} />
    </PieceViewport>
  );
}
