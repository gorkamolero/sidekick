import React, { useRef, useState } from 'react';

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

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    // Critical: Prevent default HTML5 drag to enable native OS drag
    event.preventDefault();
    
    setIsDragging(true);
    
    // Start native drag operation for external applications
    if (window.electron?.startDrag) {
      window.electron.startDrag(filePath);
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
        group relative flex items-center gap-3 p-3 rounded-lg
        bg-gray-800/50 hover:bg-gray-700/50 transition-all cursor-move
        border border-gray-700 hover:border-purple-500/50
        ${isDragging ? 'opacity-50 scale-95' : ''}
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
            onClick={onPlay}
            className="p-1.5 rounded-md hover:bg-gray-600/50 text-gray-400 hover:text-white transition-colors"
            title="Play"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-1.5 rounded-md hover:bg-red-600/20 text-gray-400 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Drag hint */}
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-lg">
          <span className="text-purple-400 font-medium">
            Drop into DAW
          </span>
        </div>
      )}
    </div>
  );
};