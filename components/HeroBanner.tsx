// components/HeroBanner.tsx
'use client';

import { Bell } from 'lucide-react';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function HeroBanner({ subtitle }: { subtitle: string }) {
  return (
    <div
      className="relative px-5 pt-6 pb-8 overflow-hidden"
      style={{
        background:
          'radial-gradient(120% 100% at 20% -10%, rgba(232,163,77,0.28) 0%, rgba(232,163,77,0) 55%), linear-gradient(160deg, #1B2028 0%, #12151A 70%)',
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-panel-text">
            {getGreeting()}
          </h1>
          <p className="text-sm text-panel-muted mt-1">{subtitle}</p>
        </div>
        <button
          aria-label="Notifications"
          className="h-9 w-9 rounded-full border border-panel-border flex items-center justify-center shrink-0"
        >
          <Bell size={16} className="text-panel-muted" />
        </button>
      </div>
    </div>
  );
}
