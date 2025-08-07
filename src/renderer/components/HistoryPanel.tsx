import React from 'react';
import { useStore } from '../lib/store';
import { Clock, Download } from 'lucide-react';
import { Generation } from '../types';

export function HistoryPanel() {
  const { generations } = useStore();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-xs text-gray-400 uppercase tracking-wider mb-4">
          Recent Generations
        </h2>
        
        {generations.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No generations yet. Create your first loop!
          </div>
        ) : (
          <div className="space-y-3">
            {generations.map((gen) => (
              <GenerationItem key={gen.id} generation={gen} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GenerationItem({ generation }: { generation: Generation }) {
  const handleDragStart = (e: React.DragEvent) => {
    // Set up drag data for Ableton
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/uri-list', `file://${generation.filePath}`);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="bg-[var(--color-ableton-gray)] rounded-lg p-3 cursor-move hover:bg-gray-700 
                 transition-colors group"
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm text-gray-300 line-clamp-2 flex-1">
          {generation.prompt}
        </p>
        <Download className="w-4 h-4 text-gray-500 group-hover:text-white 
                           transition-colors ml-2 flex-shrink-0" />
      </div>
      
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>{generation.bpm} BPM</span>
        <span>{generation.key}</span>
        <span>{generation.duration}s</span>
        <span className="ml-auto flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(generation.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {/* Waveform visualization would go here */}
      <div className="mt-2 h-12 bg-black/30 rounded flex items-center 
                      justify-center text-xs text-gray-600">
        [Waveform]
      </div>
    </div>
  );
}