// app/devices/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import DeviceIcon from '@/components/DeviceIcon';
import BottomNav from '@/components/BottomNav';

type Channel = { channel_no: number; name: string; is_on: boolean; is_favorite: boolean };
type Device = {
  id: number;
  name: string;
  type: string;
  icon: string | null;
  location: string | null;
  status: 'online' | 'offline';
  channels: Channel[];
};

export default function DevicesPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [showClaim, setShowClaim] = useState(false);
  const [claimCode, setClaimCode] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchDevices = useCallback(async () => {
    const res = await fetch('/api/devices');
    if (res.status === 401) {
      router.push('/');
      return;
    }
    const json = await res.json();
    setDevices(json.devices || []);
  }, [router]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  async function handleClaim() {
    setError('');
    setSuccess('');
    if (!claimCode.trim()) {
      setError('Enter the claim code from your device.');
      return;
    }
    setClaiming(true);
    const res = await fetch('/api/devices/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claim_code: claimCode.trim() }),
    });
    const data = await res.json();
    setClaiming(false);

    if (res.ok && data.ok) {
      setSuccess(`${data.device_name} connected to your account.`);
      setClaimCode('');
      setShowClaim(false);
      fetchDevices();
    } else {
      const messages: Record<string, string> = {
        invalid_or_already_claimed: 'That code is invalid or already claimed by another account.',
        no_active_subscription: 'Your subscription is inactive - subscribe first to connect a device.',
        device_limit_reached: 'You\'ve reached the device limit for your current plan.',
        claim_code_required: 'Enter the claim code from your device.',
      };
      setError(messages[data.error] || 'Could not connect that device. Try again.');
    }
  }

  return (
    <main className="min-h-screen pb-20">
      <header className="border-b border-panel-border px-4 py-3.5 flex items-center justify-between">
        <h1 className="font-medium">Your Devices</h1>
        <button
          onClick={() => setShowClaim(!showClaim)}
          className="flex items-center gap-1 text-sm text-amber border border-amber/40 rounded px-3 py-1.5"
        >
          <Plus size={14} /> Add Device
        </button>
      </header>

      <div className="px-4 pt-4">
        {success && <p className="text-sm text-amber mb-4" role="status">{success}</p>}
        {error && <p className="text-sm text-danger mb-4" role="alert">{error}</p>}

        {showClaim && (
          <div className="rounded border border-panel-border bg-panel-surface p-4 mb-4 space-y-3">
            <div>
              <p className="text-sm text-panel-text mb-1">Connect a device</p>
              <p className="text-xs text-panel-muted">
                Enter the claim code printed on the device or its packaging.
              </p>
            </div>
            <input
              placeholder="e.g. A1B2C3D4"
              value={claimCode}
              onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
              className="w-full rounded border border-panel-border bg-panel-surface2 px-3 py-2.5 text-panel-text font-mono tracking-wider outline-none focus:border-amber"
            />
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full rounded bg-amber py-2.5 font-medium text-panel-bg disabled:opacity-50"
            >
              {claiming ? 'Connecting…' : 'Connect Device'}
            </button>
          </div>
        )}

        {devices === null ? (
          <p className="text-sm text-panel-muted text-center mt-8">Loading…</p>
        ) : devices.length === 0 ? (
          <p className="text-sm text-panel-muted text-center mt-8">
            No devices yet. Tap "Add Device" and enter the claim code from your device to connect it.
          </p>
        ) : (
          <div className="space-y-2">
            {devices.map((d) => (
              <div key={d.id} className="rounded border border-panel-border bg-panel-surface p-3.5 flex items-center gap-3">
                <DeviceIcon iconKey={d.icon} active={d.status === 'online'} size={22} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-panel-text truncate">{d.name}</p>
                  <p className="text-xs text-panel-muted truncate">
                    {d.location || 'No room set'} · {d.type}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded border shrink-0 ${
                    d.status === 'online' ? 'border-amber/40 text-amber' : 'border-panel-border text-panel-muted'
                  }`}
                >
                  {d.status === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
