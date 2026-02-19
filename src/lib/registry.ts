import { PieceMeta } from './types';

export const pieces: PieceMeta[] = [
  {
    id: '001',
    designation: 'INT/001',
    subtitle: 'DRIFT',
    status: 'live',
    date: '2026-02-15',
    description: 'Flow field rendered through oriented text characters',
    hasAnalysis: true,
    version: '1.0',
    lastModified: '2026-02-15',
  },
  {
    id: '002',
    designation: 'INT/002',
    subtitle: 'STATION',
    status: 'live',
    date: '2026-02-19',
    description: 'Number station intercept — signal emerges from noise, transmits, decodes, and is lost',
    hasAudio: true,
    hasAnalysis: true,
    version: '1.0',
    lastModified: '2026-02-19',
  },
];

export function getPiece(id: string): PieceMeta | undefined {
  return pieces.find(p => p.id === id);
}

export function getLivePieces(): PieceMeta[] {
  return pieces.filter(p => p.status === 'live');
}
