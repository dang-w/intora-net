'use client';

import { useState, useEffect } from 'react';
import MobileFallback from './MobileFallback';

export default function ClientGate({ children }: { children: React.ReactNode }) {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!isDesktop) return <MobileFallback />;
  return <>{children}</>;
}
