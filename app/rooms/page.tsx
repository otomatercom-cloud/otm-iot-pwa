// app/rooms/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Home as HomeIcon } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

type Room = { id: number; name: string; icon: string | null; device_count: number };
type Home = { id: number; name: string; address: string; rooms: Room[] };
type Device = { id: number; name: string; room_id: number | false; room_name: string | false };

export default function RoomsPage() {
  const router = useRouter();
  const [homes, setHomes] = useState<Home[] | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState('');

  const [showNewHome, setShowNewHome] = useState(false);
  const [newHomeName, setNewHomeName] = useState('');

  const [roomFormHomeId, setRoomFormHomeId] = useState<number | null>(null);
  const [newRoomName, setNewRoomName] = useState('');

  const fetchAll = useCallback(async () => {
    const [homesRes, devicesRes] = await Promise.all([
      fetch('/api/homes'),
      fetch('/api/devices'),
    ]);
    if (homesRes.status === 401) {
      router.push('/');
      return;
    }
    const homesData = await homesRes.json();
    const devicesData = await devicesRes.json();
    if (homesData.error) {
      setError('Could not load your homes.');
      return;
    }
    setError('');
    setHomes(homesData.homes || []);
    setDevices(devicesData.devices || []);
  }, [router]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function handleCreateHome() {
    if (!newHomeName.trim()) return;
    const res = await fetch('/api/homes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newHomeName.trim() }),
    });
    if (res.ok) {
      setNewHomeName('');
      setShowNewHome(false);
      fetchAll();
    } else {
      setError('Could not create home.');
    }
  }

  async function handleCreateRoom(homeId: number) {
    if (!newRoomName.trim()) return;
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ home_id: homeId, name: newRoomName.trim() }),
    });
    if (res.ok) {
      setNewRoomName('');
      setRoomFormHomeId(null);
      fetchAll();
    } else {
      setError('Could not create room.');
    }
  }

  async function handleAssign(deviceId: number, roomId: number) {
    await fetch('/api/devices/assign-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId, room_id: roomId }),
    });
    fetchAll();
  }

  const unassignedDevices = devices.filter((d) => !d.room_id);

  return (
    <main className="min-h-screen pb-20">
      <header className="border-b border-panel-border px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/dashboard')} aria-label="Back to home">
            <ChevronLeft size={20} className="text-panel-muted" />
          </button>
          <h1 className="font-medium">Homes &amp; Rooms</h1>
        </div>
        <button
          onClick={() => setShowNewHome(!showNewHome)}
          className="flex items-center gap-1 text-sm text-amber border border-amber/40 rounded px-3 py-1.5"
        >
          <Plus size={14} /> Add Home
        </button>
      </header>

      <div className="px-4 pt-4 max-w-md mx-auto">
        {error && <p className="text-sm text-danger mb-4">{error}</p>}

        {showNewHome && (
          <div className="rounded border border-panel-border bg-panel-surface p-4 mb-4 space-y-3">
            <input
              placeholder="Home name, e.g. My House"
              value={newHomeName}
              onChange={(e) => setNewHomeName(e.target.value)}
              className="w-full rounded border border-panel-border bg-panel-surface2 px-3 py-2.5 text-panel-text outline-none focus:border-amber"
            />
            <button
              onClick={handleCreateHome}
              className="w-full rounded bg-amber py-2 text-sm font-medium text-panel-bg"
            >
              Create Home
            </button>
          </div>
        )}

        {homes === null ? (
          <p className="text-sm text-panel-muted text-center mt-8">Loading…</p>
        ) : homes.length === 0 ? (
          <p className="text-sm text-panel-muted text-center mt-8">
            No homes yet. Tap "Add Home" to create one, then add rooms inside it.
          </p>
        ) : (
          homes.map((home) => (
            <div key={home.id} className="mb-5">
              <div className="flex items-center gap-2 mb-2 px-0.5">
                <HomeIcon size={16} className="text-panel-muted" />
                <h2 className="text-sm font-medium text-panel-text">{home.name}</h2>
              </div>

              <div className="space-y-2 mb-2">
                {home.rooms.map((room) => (
                  <div key={room.id} className="rounded border border-panel-border bg-panel-surface p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-panel-text">{room.name}</span>
                      <span className="text-xs text-panel-muted">{room.device_count} device(s)</span>
                    </div>
                    {unassignedDevices.length > 0 && (
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          const deviceId = Number(e.target.value);
                          if (deviceId) handleAssign(deviceId, room.id);
                        }}
                        className="w-full rounded border border-panel-border bg-panel-surface2 px-2 py-1.5 text-xs text-panel-muted"
                      >
                        <option value="">+ Move a device here…</option>
                        {unassignedDevices.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>

              {roomFormHomeId === home.id ? (
                <div className="flex gap-2">
                  <input
                    placeholder="Room name"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="flex-1 rounded border border-panel-border bg-panel-surface2 px-3 py-2 text-sm text-panel-text outline-none focus:border-amber"
                  />
                  <button
                    onClick={() => handleCreateRoom(home.id)}
                    className="rounded bg-amber px-3 text-sm font-medium text-panel-bg"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setRoomFormHomeId(home.id)}
                  className="text-xs text-amber"
                >
                  + Add a room
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </main>
  );
}
