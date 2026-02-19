'use client';

import { useAudio } from '@/lib/audioContext';

export default function AudioToggle() {
  const { isMuted, toggleMute } = useAudio();

  return (
    <button
      onClick={toggleMute}
      className={`text-xs transition-colors ${
        isMuted
          ? 'text-text-muted hover:text-amber'
          : 'text-accent hover:text-amber'
      }`}
      style={isMuted ? { animation: 'muted-pulse 3s ease-in-out infinite' } : undefined}
    >
      {isMuted ? '[ ◁ UNMUTE SIGNAL ]' : '◁ SIGNAL ACTIVE'}
    </button>
  );
}
