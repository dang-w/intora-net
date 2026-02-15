'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import * as Tone from 'tone';

interface AudioContextValue {
  isMuted: boolean;
  toggleMute: () => void;
  isAudioReady: boolean;
}

const AudioCtx = createContext<AudioContextValue>({
  isMuted: true,
  toggleMute: () => {},
  isAudioReady: false,
});

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isMuted, setIsMuted] = useState(true);
  const [isAudioReady, setIsAudioReady] = useState(false);

  const toggleMute = useCallback(async () => {
    if (!isAudioReady) {
      await Tone.start();
      setIsAudioReady(true);
    }
    setIsMuted(prev => !prev);
  }, [isAudioReady]);

  return (
    <AudioCtx.Provider value={{ isMuted, toggleMute, isAudioReady }}>
      {children}
    </AudioCtx.Provider>
  );
}

export function useAudio() {
  return useContext(AudioCtx);
}
