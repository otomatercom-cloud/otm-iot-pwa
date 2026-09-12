// components/SwitchTile.tsx
'use client';

import DeviceIcon from './DeviceIcon';

export default function SwitchTile({
  name,
  location,
  iconKey,
  isOn,
  disabled,
  onTap,
}: {
  name: string;
  location: string;
  iconKey?: string | null;
  isOn: boolean;
  disabled?: boolean;
  onTap: () => void;
}) {
  return (
    <button
      onClick={onTap}
      disabled={disabled}
      aria-pressed={isOn}
      className={`text-left rounded border p-4 transition-colors ${
        disabled ? 'opacity-40' : ''
      } ${
        isOn ? 'border-on/50 bg-on/10' : 'border-panel-border bg-panel-surface'
      }`}
    >
      <DeviceIcon iconKey={iconKey} active={isOn} size={24} />
      <p className="mt-3 text-sm font-medium text-panel-text truncate">{name}</p>
      <p className="text-xs text-panel-muted truncate">{location}</p>
    </button>
  );
}
