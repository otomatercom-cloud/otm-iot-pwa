// app/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import RoomSection from '@/components/RoomSection';

type Channel = { channel_no: number; name: string; is_on: boolean };
type Device = {
  id: number;
  name: string;
  type: string;
  icon: string | null;
  location: string | null;
  status: 'online' | 'offline';
  last_seen: string;
  channels: Channel[];
};
type DevicesResponse = {
  subscription_active: boolean;
  subscription_valid_until: string;
  devices: Device[];
  error?: string;
};

const POLL_MS = 5000;

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DevicesResponse | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchMe = useCallback(async () => {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const json = await res.json();
      setUserName(json.name);
    }
  }, []);

  const fetchDevices = useCallback(async () => {
    const res = await fetch('/api/devices');
    if (res.status === 401) {
      router.push('/');
      return;
    }
    const json: DevicesResponse = await res.json();
    setData(json);
  }, [router]);

  useEffect(() => {
    fetchMe();
    fetchDevices();
    const id = setInterval(fetchDevices, POLL_MS);
    return () => clearInterval(id);
  }, [fetchMe, fetchDevices]);

  async function handleToggle(deviceId: number, channelNo: number) {
    setError('');
    setPendingKey(`${deviceId}:${channelNo}`);
    // Optimistic flip
    setData((prev) =>
      prev
        ? {
            ...prev,
            devices: prev.devices.map((d) =>
              d.id !== deviceId
                ? d
                : {
                    ...d,
                    channels: d.channels.map((c) =>
                      c.channel_no !== channelNo ? c : { ...c, is_on: !c.is_on }
                    ),
                  }
            ),
          }
        : prev
    );

    const res = await fetch('/api/devices/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId, channel_no: channelNo }),
    });
    if (!res.ok) {
      const json = await res.json();
      setError(
        json.error === 'subscription_inactive'
          ? 'Your subscription has expired. Renew to keep controlling devices.'
          : 'Could not send the command. It will retry on next refresh.'
      );
    }
    // Reconcile with real state shortly after (command is delivered async by the bridge)
    setTimeout(() => {
      fetchDevices();
      setPendingKey(null);
    }, 1200);
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-panel-muted text-sm">Loading your devices…</p>
      </main>
    );
  }

  if (data.error) {
    return (
      <main className="min-h-screen flex flex-col">
        <header className="border-b border-panel-border px-4 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="font-medium">
              {userName ? `Welcome, ${userName}` : 'Your Devices'}
            </h1>
            {userName && <p className="text-xs text-panel-muted mt-0.5">You're signed in</p>}
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-panel-muted border border-panel-border rounded px-2.5 py-1.5"
          >
            Sign out
          </button>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-3">
          <p className="text-panel-muted text-sm">Could not load your devices.</p>
          <button
            onClick={() => fetchDevices()}
            className="text-sm border border-panel-border rounded px-3 py-1.5 text-panel-text"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  const rooms = new Map<string, Device[]>();
  for (const d of data.devices) {
    const room = d.location || 'Other';
    if (!rooms.has(room)) rooms.set(room, []);
    rooms.get(room)!.push(d);
  }

  return (
    <main className="min-h-screen pb-10">
      <header className="sticky top-0 z-10 border-b border-panel-border bg-panel-bg/95 backdrop-blur px-4 py-3.5 flex items-center justify-between">
        <div>
          <h1 className="font-medium">
            {userName ? `Welcome, ${userName}` : 'Your Devices'}
          </h1>
          {userName && <p className="text-xs text-panel-muted mt-0.5">You're signed in</p>}
          {!data.subscription_active && (
            <p className="text-xs text-danger mt-0.5">
              Subscription inactive ·{' '}
              <a href="/subscribe" className="underline">Subscribe</a>
            </p>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-panel-muted border border-panel-border rounded px-2.5 py-1.5"
        >
          Sign out
        </button>
      </header>

      <div className="px-4 pt-4">
        {error && (
          <p className="text-sm text-danger mb-4" role="alert">
            {error}
          </p>
        )}

        {data.devices.length === 0 ? (
          <p className="text-sm text-panel-muted mt-8 text-center">
            No devices yet. Once one is registered to your account, it'll show up here.
          </p>
        ) : (
          Array.from(rooms.entries()).map(([room, devices]) => (
            <RoomSection
              key={room}
              room={room}
              devices={devices}
              onToggle={handleToggle}
              pendingKey={pendingKey}
            />
          ))
        )}
      </div>
    </main>
  );
}
