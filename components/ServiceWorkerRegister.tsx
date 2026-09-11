// components/ServiceWorkerRegister.tsx
'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Non-fatal: app still works without offline caching / push
      });
    }
  }, []);
  return null;
}
