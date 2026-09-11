// components/DeviceCard.tsx
'use client';

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

export default function DeviceCard({
  device,
  onToggle,
  pendingKey,
}: {
  device: Device;
  onToggle: (deviceId: number, channelNo: number) => void;
  pendingKey: string | null;
}) {
  const isOffline = device.status !== 'online';

  return (
    <div className="rounded border border-panel-border bg-panel-surface p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium text-panel-text">{device.name}</p>
          <p className="text-xs text-panel-muted">{device.type}</p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded border ${
            isOffline
              ? 'border-panel-border text-panel-muted'
              : 'border-amber/40 text-amber'
          }`}
        >
          {isOffline ? 'Offline' : 'Online'}
        </span>
      </div>

      <div className="space-y-2">
        {device.channels.map((ch) => {
          const key = `${device.id}:${ch.channel_no}`;
          const isPending = pendingKey === key;
          return (
            <div
              key={ch.channel_no}
              className="flex items-center justify-between rounded bg-panel-surface2 px-3 py-2.5"
            >
              <span className="text-sm text-panel-text">{ch.name}</span>
              <button
                type="button"
                role="switch"
                aria-checked={ch.is_on}
                aria-label={`Turn ${ch.name} ${ch.is_on ? 'off' : 'on'}`}
                disabled={isOffline || isPending}
                onClick={() => onToggle(device.id, ch.channel_no)}
                className={`relative h-7 w-12 rounded-full transition-colors disabled:opacity-40 ${
                  ch.is_on ? 'bg-amber' : 'bg-panel-border'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-panel-text transition-transform ${
                    ch.is_on ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
