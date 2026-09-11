// components/SceneCard.tsx
'use client';

import { Lightbulb } from 'lucide-react';

export default function SceneCard({
  label,
  count,
  onRun,
  disabled,
}: {
  label: string;
  count: number;
  onRun: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onRun}
      disabled={disabled}
      className="flex-1 rounded border border-panel-border bg-panel-surface px-4 py-4 text-left disabled:opacity-40"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Lightbulb size={16} className="text-amber" strokeWidth={1.75} />
        <span className="text-sm font-medium text-panel-text">{count}</span>
      </div>
      <p className="text-sm text-panel-text">{label}</p>
    </button>
  );
}
