import React, { useState } from 'react';
import { ProjectInfo } from '../../types';
import { useStore } from '../../lib/store';

interface ProjectInfoDisplayProps {
  project: ProjectInfo;
  onUpdateProject: (updates: Partial<ProjectInfo>) => void;
}

export function ProjectInfoDisplay({ project, onUpdateProject }: ProjectInfoDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { linkState } = useStore();
  
  // Use Link tempo if connected, otherwise use project tempo
  const displayBpm = linkState.isConnected ? Math.round(linkState.tempo) : project.bpm;

  return (
    <div className="flex gap-6 mt-3 text-xs text-[var(--color-text-secondary)] font-mono">
      <span className="flex items-center gap-1">
        <span className="text-[var(--color-text-dim)]">
          BPM{linkState.isConnected && ' (Link)'}:
        </span>
        {isEditing && !linkState.isConnected ? (
          <input
            type="number"
            value={project.bpm}
            onChange={(e) => onUpdateProject({ bpm: parseInt(e.target.value) || 120 })}
            className="w-12 bg-[var(--color-surface)] border border-[var(--color-accent)] px-1 text-[var(--color-accent)] focus:outline-none"
            min="60"
            max="200"
          />
        ) : (
          <span 
            className={`text-[var(--color-accent)] ${!linkState.isConnected ? 'cursor-pointer hover:underline' : ''}`}
            onClick={() => !linkState.isConnected && setIsEditing(true)}
          >
            {displayBpm}
          </span>
        )}
      </span>
      
      <span className="flex items-center gap-1">
        <span className="text-[var(--color-text-dim)]">KEY:</span>
        {isEditing ? (
          <select
            value={project.key}
            onChange={(e) => onUpdateProject({ key: e.target.value })}
            className="bg-[var(--color-surface)] border border-[var(--color-accent)] px-1 text-[var(--color-accent)] focus:outline-none"
          >
            {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(note => (
              <React.Fragment key={note}>
                <option value={`${note} major`}>{note} major</option>
                <option value={`${note} minor`}>{note} minor</option>
              </React.Fragment>
            ))}
          </select>
        ) : (
          <span 
            className="text-[var(--color-accent)] cursor-pointer hover:underline"
            onClick={() => setIsEditing(true)}
          >
            {project.key}
          </span>
        )}
      </span>
      
      <span className="flex items-center gap-1">
        <span className="text-[var(--color-text-dim)]">SIG:</span>
        {isEditing ? (
          <select
            value={project.timeSignature}
            onChange={(e) => onUpdateProject({ timeSignature: e.target.value })}
            className="bg-[var(--color-surface)] border border-[var(--color-accent)] px-1 text-[var(--color-accent)] focus:outline-none"
          >
            <option value="3/4">3/4</option>
            <option value="4/4">4/4</option>
            <option value="5/4">5/4</option>
            <option value="6/8">6/8</option>
            <option value="7/8">7/8</option>
          </select>
        ) : (
          <span 
            className="text-[var(--color-accent)] cursor-pointer hover:underline"
            onClick={() => setIsEditing(true)}
          >
            {project.timeSignature}
          </span>
        )}
      </span>
      
      {isEditing && (
        <button
          onClick={() => setIsEditing(false)}
          className="text-[var(--color-accent)] hover:underline"
        >
          [SAVE]
        </button>
      )}
    </div>
  );
}