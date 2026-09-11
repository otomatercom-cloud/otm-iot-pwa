// app/settings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ChevronRight } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

export default function SettingsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [subscriptionActive, setSubscriptionActive] = useState<boolean | null>(null);
  const [validUntil, setValidUntil] = useState<string>('');

  useEffect(() => {
    fetch('/api/auth/me').then((res) => {
      if (res.status === 401) {
        router.push('/');
        return;
      }
      res.json().then((data) => setUserName(data.name));
    });
    fetch('/api/devices').then((res) => res.json()).then((data) => {
      if (typeof data.subscription_active === 'boolean') {
        setSubscriptionActive(data.subscription_active);
        setValidUntil(data.subscription_valid_until || '');
      }
    });
  }, [router]);

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  return (
    <main className="min-h-screen pb-20">
      <header className="border-b border-panel-border px-4 py-3.5">
        <h1 className="font-medium">Settings</h1>
      </header>

      <div className="px-4 pt-4 max-w-md mx-auto space-y-3">
        <div className="rounded border border-panel-border bg-panel-surface p-4">
          <p className="text-xs text-panel-muted mb-1">Signed in as</p>
          <p className="text-sm font-medium text-panel-text">{userName || '…'}</p>
        </div>

        <button
          onClick={() => router.push('/subscribe')}
          className="w-full rounded border border-panel-border bg-panel-surface p-4 flex items-center justify-between text-left"
        >
          <div>
            <p className="text-sm font-medium text-panel-text">Subscription</p>
            <p className="text-xs text-panel-muted mt-0.5">
              {subscriptionActive === null
                ? 'Loading…'
                : subscriptionActive
                ? `Active until ${new Date(validUntil).toLocaleDateString()}`
                : 'Inactive - tap to subscribe'}
            </p>
          </div>
          <ChevronRight size={16} className="text-panel-muted" />
        </button>

        <button
          onClick={() => router.push('/devices')}
          className="w-full rounded border border-panel-border bg-panel-surface p-4 flex items-center justify-between text-left"
        >
          <p className="text-sm font-medium text-panel-text">Manage Devices</p>
          <ChevronRight size={16} className="text-panel-muted" />
        </button>

        <button
          onClick={handleSignOut}
          className="w-full rounded border border-danger/40 bg-panel-surface p-4 flex items-center gap-2 text-danger"
        >
          <LogOut size={16} />
          <span className="text-sm font-medium">Sign out</span>
        </button>
      </div>

      <BottomNav />
    </main>
  );
}
