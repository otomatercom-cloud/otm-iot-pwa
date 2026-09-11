// components/BottomNav.tsx
'use client';

import { Home, Boxes, Share2, MonitorPlay, Settings } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

const ITEMS = [
  { key: 'home', label: 'Home', icon: Home, href: '/dashboard' },
  { key: 'devices', label: 'Devices', icon: Boxes, href: '/devices' },
  { key: 'automation', label: 'Automation', icon: Share2, href: '/dashboard' },
  { key: 'remote', label: 'Remote', icon: MonitorPlay, href: '/dashboard' },
  { key: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-panel-border bg-panel-bg/95 backdrop-blur px-2 py-2 flex justify-around z-20">
      {ITEMS.map(({ key, label, icon: Icon, href }) => {
        const active = pathname === href;
        return (
          <button
            key={key}
            onClick={() => router.push(href)}
            className="flex flex-col items-center gap-1 px-3 py-1"
          >
            <Icon size={20} className={active ? 'text-amber' : 'text-panel-muted'} strokeWidth={1.75} />
            <span className={`text-[10px] ${active ? 'text-amber' : 'text-panel-muted'}`}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
