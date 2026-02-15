import { PieceMeta } from './types';

export const pieces: PieceMeta[] = [
  // INT/001 will be added here when built
];

export function getPiece(id: string): PieceMeta | undefined {
  return pieces.find(p => p.id === id);
}

export function getLivePieces(): PieceMeta[] {
  return pieces.filter(p => p.status === 'live');
}
