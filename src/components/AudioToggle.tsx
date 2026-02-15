'use client';

import { useAudio } from '@/lib/audioContext';

export default function AudioToggle() {
  const { isMuted, toggleMute } = useAudio();

  return (
    <button
      onClick={toggleMute}
      className={`text-xs transition-colors ${
        isMuted
          ? 'text-text-subtle hover:text-text-muted'
          : 'text-accent hover:text-amber'
      }`}
    >
      {isMuted ? '◁ MUTED' : '◁ SIGNAL'}
    </button>
  );
}
