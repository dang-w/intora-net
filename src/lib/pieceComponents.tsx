import dynamic from 'next/dynamic';
import { PALETTE } from '@/lib/palette';

const INT001Drift = dynamic(() => import('@/components/pieces/INT001Drift'), {
  ssr: false,
  loading: () => <div style={{ background: PALETTE.bg, width: '100%', height: '100%' }} />,
});

const INT002Station = dynamic(() => import('@/components/pieces/INT002Station'), {
  ssr: false,
  loading: () => <div style={{ background: PALETTE.bg, width: '100%', height: '100%' }} />,
});

export const PIECE_COMPONENTS: Record<
  string,
  React.ComponentType<{ width: number; height: number; fps?: number }>
> = {
  '001': INT001Drift,
  '002': INT002Station,
};
