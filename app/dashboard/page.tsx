// app/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import HeroBanner from '@/components/HeroBanner';
import SceneCard from '@/components/SceneCard';
import SwitchTile from '@/components/SwitchTile';
import RoomSection from '@/components/RoomSection';
import BottomNav from '@/components/BottomNav';

type Channel = { channel_no: number; name: string; is_on: boolean; is_favorite: boolean };
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
  const [sceneRunning, setSceneRunning] = useState<'on' | 'off' | null>(null);
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
    setTimeout(() => {
      fetchDevices();
      setPendingKey(null);
    }, 1200);
  }

  async function handleScene(turn: 'on' | 'off') {
    setError('');
    setSceneRunning(turn);
    const res = await fetch('/api/devices/bulk-toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ turn }),
    });
    if (!res.ok) {
      const json = await res.json();
      setError(
        json.error === 'subscription_inactive'
          ? 'Your subscription has expired. Renew to run scenes.'
          : 'Could not run that scene. Try again.'
      );
    }
    setTimeout(() => {
      fetchDevices();
      setSceneRunning(null);
    }, 1500);
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-panel-muted text-sm">Loading your devices…</p>
      </main>
    );
  }

  const greetingSubtitle = data.subscription_active
    ? 'Smart Home'
    : 'Smart Home · Subscription inactive';

  if (data.error) {
    return (
      <main className="min-h-screen flex flex-col pb-16">
        <HeroBanner subtitle={userName ? `Welcome, ${userName}` : greetingSubtitle} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-3">
          <p className="text-panel-muted text-sm">Could not load your devices.</p>
          <button
            onClick={() => fetchDevices()}
            className="text-sm border border-panel-border rounded px-3 py-1.5 text-panel-text"
          >
            Retry
          </button>
        </div>
        <BottomNav />
      </main>
    );
  }

  const allChannels = data.devices.flatMap((d) =>
    d.channels.map((c) => ({ ...c, device: d }))
  );
  const favoriteChannels = allChannels.filter((c) => c.is_favorite);
  const favoritesOnCount = favoriteChannels.filter((c) => c.is_on).length;

  const rooms = new Map<string, Device[]>();
  for (const d of data.devices) {
    const room = d.location || 'Other';
    if (!rooms.has(room)) rooms.set(room, []);
    rooms.get(room)!.push(d);
  }

  return (
    <main className="min-h-screen pb-20">
      <HeroBanner subtitle={userName ? `Welcome, ${userName}` : greetingSubtitle} />

      <div className="px-4 -mt-2">
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
          <>
            <section className="mb-6">
              <h2 className="text-sm font-medium text-panel-text mb-2.5 px-0.5">Favourite Scenes</h2>
              <div className="flex gap-3">
                <SceneCard
                  label="Start Home"
                  count={favoritesOnCount}
                  onRun={() => handleScene('on')}
                  disabled={sceneRunning !== null || !data.subscription_active}
                />
                <SceneCard
                  label="Stop Home"
                  count={favoriteChannels.length - favoritesOnCount}
                  onRun={() => handleScene('off')}
                  disabled={sceneRunning !== null || !data.subscription_active}
                />
              </div>
            </section>

            {favoriteChannels.length > 0 && (
              <section className="mb-6">
                <h2 className="text-sm font-medium text-panel-text mb-2.5 px-0.5">Favourite Switches</h2>
                <div className="grid grid-cols-2 gap-3">
                  {favoriteChannels.map((c) => (
                    <SwitchTile
                      key={`${c.device.id}:${c.channel_no}`}
                      name={c.name}
                      location={c.device.location || ''}
                      iconKey={c.device.icon}
                      isOn={c.is_on}
                      disabled={c.device.status !== 'online' || pendingKey === `${c.device.id}:${c.channel_no}`}
                      onTap={() => handleToggle(c.device.id, c.channel_no)}
                    />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-sm font-medium text-panel-text mb-2.5 px-0.5">All Devices</h2>
              {Array.from(rooms.entries()).map(([room, devices]) => (
                <RoomSection
                  key={room}
                  room={room}
                  devices={devices}
                  onToggle={handleToggle}
                  pendingKey={pendingKey}
                />
              ))}
            </section>
          </>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
