import React, { useState, useRef, useEffect } from 'react';
import { Repeat, Zap, Lightbulb } from 'lucide-react';
import { GenerationMode } from './ModeSelector';

interface ExpandableModeSelectorProps {
  mode: GenerationMode;
  onModeChange: (mode: GenerationMode) => void;
}

export function ExpandableModeSelector({ mode, onModeChange }: ExpandableModeSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredMode, setHoveredMode] = useState<GenerationMode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const modes = [
    { 
      id: 'loop' as const,
      label: 'Loop',
      icon: Repeat,
      tooltip: '4-8 bar seamless loops'
    },
    { 
      id: 'sample' as const,
      label: 'Sample', 
      icon: Zap,
      tooltip: 'One-shot hits'
    },
    { 
      id: 'inspiration' as const,
      label: 'Inspire',
      icon: Lightbulb,
      tooltip: 'Full musical ideas'
    }
  ];
  
  const activeMode = modes.find(m => m.id === mode);
  const ActiveIcon = activeMode?.icon || Repeat;
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };
    
    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);
  
  return (
    <div 
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => {
        setIsExpanded(false);
        setHoveredMode(null);
      }}
    >
      <div 
        className={`flex items-center transition-all duration-300 ease-out ${
          isExpanded ? 'gap-1.5' : 'gap-0'
        }`}
      >
        {/* Expanded buttons */}
        <div className={`flex gap-1 transition-all duration-300 origin-right ${
          isExpanded ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0 w-0'
        }`}>
          {modes.map(({ id, label, icon: Icon, tooltip }) => {
            const isActive = mode === id;
            const isHovered = hoveredMode === id;
            
            return (
              <div key={id} className="relative">
                <button
                  onClick={() => {
                    onModeChange(id);
                    setIsExpanded(false);
                  }}
                  onMouseEnter={() => setHoveredMode(id)}
                  onMouseLeave={() => setHoveredMode(null)}
                  className={`px-2.5 py-1.5 rounded-full flex items-center gap-1.5
                             transition-all duration-200 text-[11px] font-medium uppercase tracking-wider
                             ${isActive 
                               ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]' 
                               : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-text-dim)] hover:border-[var(--color-text-secondary)]'
                             }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
                
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 pointer-events-none z-50">
                    <div className="bg-black/90 backdrop-blur-sm text-[var(--color-text-secondary)] px-2 py-1 rounded text-[10px] whitespace-nowrap border border-[var(--color-text-dim)]">
                      {tooltip}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Main button - always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-8 h-8 rounded-full flex items-center justify-center
                     transition-all duration-300 border
                     ${isExpanded 
                       ? 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-text-dim)]' 
                       : 'bg-transparent text-[var(--color-accent)] border-[var(--color-accent)] hover:bg-[var(--color-accent)]/10'
                     }`}
        >
          <ActiveIcon className={`w-4 h-4 transition-transform duration-300 ${
            isExpanded ? 'rotate-90' : ''
          }`} />
        </button>
      </div>
    </div>
  );
}