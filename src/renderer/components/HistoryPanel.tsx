import React from 'react';
import { useStore } from '../lib/store';
import { Database, FileAudio, Activity } from 'lucide-react';
import { Generation } from '../types';

export function HistoryPanel() {
  const { generations } = useStore();

  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-[var(--color-accent)]" />
          <h2 className="text-xs text-[var(--color-text-secondary)] uppercase tracking-[0.2em]">
            GENERATION ARCHIVE
          </h2>
        </div>
        
        {generations.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-[var(--color-text-dim)] text-sm font-mono">
              <p>// NO DATA AVAILABLE</p>
              <p className="mt-2 text-xs">AWAITING NEURAL SYNTHESIS...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {generations.map((gen, index) => (
              <GenerationItem key={gen.id} generation={gen} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GenerationItem({ generation, index }: { generation: Generation; index: number }) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/uri-list', `file://${generation.filePath}`);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="border border-[var(--color-text-dim)] p-3 cursor-move 
                 hover:border-[var(--color-accent)] hover:bg-[var(--color-surface)]
                 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[var(--color-text-dim)] text-xs font-mono">
              #{String(generations.length - index).padStart(3, '0')}
            </span>
            <FileAudio className="w-3 h-3 text-[var(--color-accent)]" />
          </div>
          <p className="text-xs text-[var(--color-text-primary)] font-mono line-clamp-2">
            {generation.prompt}
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex gap-4 text-[var(--color-text-secondary)]">
          <span>{generation.bpm}BPM</span>
          <span>{generation.key}</span>
          <span>{generation.duration}s</span>
        </div>
        <span className="text-[var(--color-text-dim)]">
          {new Date(generation.timestamp).toTimeString().slice(0, 8)}
        </span>
      </div>

      {/* Waveform visualization */}
      <div className="mt-2 h-8 bg-[var(--color-void)] border border-[var(--color-text-dim)] 
                      flex items-center px-2 group-hover:border-[var(--color-accent)] transition-colors">
        <div className="flex items-center justify-between w-full">
          <Activity className="w-3 h-3 text-[var(--color-text-dim)]" />
          <div className="flex-1 mx-2 flex items-center gap-[1px]">
            {Array.from({ length: 32 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-[var(--color-accent)] opacity-30"
                style={{ height: `${Math.random() * 100}%` }}
              />
            ))}
          </div>
          <span className="text-[var(--color-text-dim)] text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            DRAG
          </span>
        </div>
      </div>
    </div>
  );
}