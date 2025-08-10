import React, { useState } from 'react';
import { Repeat, Zap, Lightbulb } from 'lucide-react';

export type GenerationMode = 'loop' | 'sample' | 'inspiration';

interface ModeSelectorProps {
  mode: GenerationMode;
  onModeChange: (mode: GenerationMode) => void;
}

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  const [hoveredMode, setHoveredMode] = useState<GenerationMode | null>(null);
  
  const modes = [
    { 
      id: 'loop' as const, 
      label: 'Loop', 
      icon: Repeat,
      description: '4-8 bar seamless loops'
    },
    { 
      id: 'sample' as const, 
      label: 'Sample', 
      icon: Zap,
      description: 'One-shots & hits'
    },
    { 
      id: 'inspiration' as const, 
      label: 'Inspire', 
      icon: Lightbulb,
      description: 'Full musical ideas'
    }
  ];

  return (
    <div className="flex gap-1 mb-3">
      {modes.map(({ id, label, icon: Icon, description }) => {
        const isActive = mode === id;
        const isHovered = hoveredMode === id;
        
        return (
          <div key={id} className="relative">
            <button
              onClick={() => onModeChange(id)}
              onMouseEnter={() => setHoveredMode(id)}
              onMouseLeave={() => setHoveredMode(null)}
              className={`px-3 py-1.5 text-xs uppercase tracking-wider
                         transition-all duration-200 rounded
                         backdrop-blur-sm border
                         ${isActive 
                           ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border-[var(--color-accent)]/50' 
                           : 'bg-black/40 text-[var(--color-text-secondary)] border-[var(--color-text-dim)] hover:bg-black/60 hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-secondary)]'
                         }`}
            >
              <Icon className="w-3 h-3 inline-block mr-1.5" />
              {label}
            </button>
            
            {/* Minimal Tooltip */}
            {isHovered && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 pointer-events-none z-50">
                <div className="bg-black/90 backdrop-blur-sm text-[var(--color-text-secondary)] px-2 py-1 rounded text-[10px] whitespace-nowrap border border-[var(--color-text-dim)]">
                  {description}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}