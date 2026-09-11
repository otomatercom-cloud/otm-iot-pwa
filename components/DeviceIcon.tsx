// components/DeviceIcon.tsx
import { Tv, Lightbulb, Fan, Plug, AirVent, Speaker, Zap, ToggleLeft } from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  tv: Tv,
  bulb: Lightbulb,
  light: Lightbulb,
  fan: Fan,
  plug: Plug,
  ac: AirVent,
  speaker: Speaker,
  switch: ToggleLeft,
};

export default function DeviceIcon({
  iconKey,
  active,
  size = 22,
}: {
  iconKey?: string | null;
  active?: boolean;
  size?: number;
}) {
  const Icon = (iconKey && ICON_MAP[iconKey.toLowerCase()]) || Zap;
  return <Icon size={size} className={active ? 'text-amber' : 'text-panel-muted'} strokeWidth={1.75} />;
}
