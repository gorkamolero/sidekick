import React from 'react';
import { Repeat, Zap, Lightbulb } from 'lucide-react';

export type GenerationMode = 'loop' | 'sample' | 'inspiration';

interface ModeSelectorProps {
  mode: GenerationMode;
  onModeChange: (mode: GenerationMode) => void;
}

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  const modes = [
    { 
      id: 'loop' as const, 
      label: 'Loop', 
      icon: Repeat, 
      tooltip: 'Loop Mode: 4-8 second seamless loops' 
    },
    { 
      id: 'sample' as const, 
      label: 'Sample', 
      icon: Zap, 
      tooltip: 'Sample Mode: 1 second one-shots and hits' 
    },
    { 
      id: 'inspiration' as const, 
      label: 'Inspire', 
      icon: Lightbulb, 
      tooltip: 'Inspiration Mode: 15-30 second musical ideas' 
    }
  ];

  return (
    <div className="flex gap-1 mb-3">
      {modes.map(({ id, label, icon: Icon, tooltip }) => (
        <button
          key={id}
          onClick={() => onModeChange(id)}
          className={`px-3 py-1.5 text-xs uppercase tracking-wider transition-all duration-200
                     backdrop-blur-sm border border-[var(--color-text-dim)]
                     ${mode === id 
                       ? 'bg-[var(--color-accent)]/30 text-[var(--color-accent)] border-[var(--color-accent)]' 
                       : 'bg-black/40 text-[var(--color-text-secondary)] hover:bg-black/60 hover:text-[var(--color-text-primary)]'
                     }`}
          title={tooltip}
        >
          <Icon className="w-3 h-3 inline-block mr-1" />
          {label}
        </button>
      ))}
    </div>
  );
}