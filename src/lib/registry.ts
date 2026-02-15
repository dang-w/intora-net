import { PieceMeta } from './types';

export const pieces: PieceMeta[] = [
  {
    id: '001',
    designation: 'INT/001',
    subtitle: 'DRIFT',
    status: 'live',
    date: '2026-02-15',
    description: 'Flow field rendered through oriented text characters',
  },
];

export function getPiece(id: string): PieceMeta | undefined {
  return pieces.find(p => p.id === id);
}

export function getLivePieces(): PieceMeta[] {
  return pieces.filter(p => p.status === 'live');
}
