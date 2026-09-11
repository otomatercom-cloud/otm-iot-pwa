// components/RoomSection.tsx
import DeviceCard from './DeviceCard';

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

export default function RoomSection({
  room,
  devices,
  onToggle,
  pendingKey,
}: {
  room: string;
  devices: Device[];
  onToggle: (deviceId: number, channelNo: number) => void;
  pendingKey: string | null;
}) {
  const onCount = devices.reduce(
    (sum, d) => sum + d.channels.filter((c) => c.is_on).length,
    0
  );

  return (
    <section className="mb-6">
      <div className="flex items-baseline justify-between mb-2.5 px-0.5">
        <h2 className="text-sm font-medium text-panel-text">{room}</h2>
        <span className="text-xs text-panel-muted">
          {onCount} of {devices.reduce((s, d) => s + d.channels.length, 0)} on
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {devices.map((d) => (
          <DeviceCard key={d.id} device={d} onToggle={onToggle} pendingKey={pendingKey} />
        ))}
      </div>
    </section>
  );
}
