import React, { useRef, useState } from 'react';
import { domToPng } from 'modern-screenshot';
import { startDrag } from '@crabnebula/tauri-plugin-drag';

interface DraggableAudioFileProps {
  filePath: string;
  fileName: string;
  duration?: number;
  bpm?: number;
  onPlay?: () => void;
  onDelete?: () => void;
}

export const DraggableAudioFile: React.FC<DraggableAudioFileProps> = ({
  filePath,
  fileName,
  duration,
  bpm,
  onPlay,
  onDelete
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

  const handleDragStart = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
    
    try {
      // Use Tauri drag plugin to start native drag
      await startDrag({
        item: [filePath],
        icon: '',
      });
    } catch (err) {
      console.error('Failed to start drag:', err);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={dragRef}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        group relative flex items-center gap-3 p-4 rounded-lg
        bg-gradient-to-r from-gray-800/50 to-gray-800/30
        hover:from-gray-700/60 hover:to-purple-900/20
        transition-all duration-200 cursor-grab active:cursor-grabbing
        border-2 border-gray-700 hover:border-purple-500
        ${isDragging ? 'opacity-50 scale-95 border-purple-400 animate-pulse' : ''}
        hover:shadow-lg hover:shadow-purple-500/20
        hover:translate-y-[-2px]
        select-none
      `}
    >
      {/* Audio icon */}
      <div className="flex-shrink-0">
        <svg
          className="w-8 h-8 text-purple-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
        </svg>
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-200 truncate">
          {fileName}
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
          {duration && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {formatDuration(duration)}
            </span>
          )}
          {bpm && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              {bpm} BPM
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {onPlay && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1.5 rounded-md hover:bg-gray-600/50 text-gray-400 hover:text-white transition-colors z-10"
            title="Play"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1.5 rounded-md hover:bg-red-600/20 text-gray-400 hover:text-red-400 transition-colors z-10"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Drag indicator - shows on hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1 text-xs text-purple-400 bg-gray-900/80 px-2 py-1 rounded">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
          </svg>
          DRAG TO DAW
        </div>
      </div>

      {/* Drag overlay - shows while dragging */}
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-purple-900/40 backdrop-blur-sm rounded-lg border-2 border-purple-400 border-dashed">
          <div className="bg-gray-900/90 px-4 py-2 rounded-lg">
            <span className="text-purple-300 font-medium text-sm">
              🎵 Drop into your DAW
            </span>
          </div>
        </div>
      )}
    </div>
  );
};