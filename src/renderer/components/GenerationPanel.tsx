import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { Terminal, Cpu } from 'lucide-react';
import { useAgent } from '../hooks/useAgent';

export function GenerationPanel() {
  const [prompt, setPrompt] = useState('');
  const [isEditingProject, setIsEditingProject] = useState(false);
  const { currentProject, updateProject } = useStore();
  const { sendMessage, isProcessing } = useAgent();

  const handleSubmit = async () => {
    if (!prompt.trim() || isProcessing) return;
    
    await sendMessage(prompt);
    setPrompt('');
  };

  return (
    <div className="border-b border-[var(--color-text-dim)]">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="w-4 h-4 text-[var(--color-accent)]" />
          <label className="text-xs text-[var(--color-text-secondary)] uppercase tracking-[0.2em]">
            COMMAND INPUT
          </label>
        </div>
        
        <div className="relative">
          <span className="absolute left-3 top-3 text-[var(--color-text-dim)] pointer-events-none">
            &gt;_
          </span>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="neural_synthesis --prompt "
            className="w-full pl-8 pr-3 py-3 bg-[var(--color-surface)] border border-[var(--color-text-dim)] 
                     resize-none h-20 placeholder-[var(--color-text-dim)] focus:outline-none 
                     focus:border-[var(--color-accent)] text-[var(--color-text-primary)] font-mono text-sm
                     transition-colors"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey) {
                handleSubmit();
              }
            }}
          />
        </div>
        
        {currentProject && (
          <div className="flex gap-6 mt-3 text-xs text-[var(--color-text-secondary)] font-mono">
            <span className="flex items-center gap-1">
              <span className="text-[var(--color-text-dim)]">BPM:</span>
              {isEditingProject ? (
                <input
                  type="number"
                  value={currentProject.bpm}
                  onChange={(e) => updateProject({ bpm: parseInt(e.target.value) || 120 })}
                  className="w-12 bg-[var(--color-surface)] border border-[var(--color-accent)] px-1 text-[var(--color-accent)] focus:outline-none"
                  min="60"
                  max="200"
                />
              ) : (
                <span 
                  className="text-[var(--color-accent)] cursor-pointer hover:underline"
                  onClick={() => setIsEditingProject(true)}
                >
                  {currentProject.bpm}
                </span>
              )}
            </span>
            <span className="flex items-center gap-1">
              <span className="text-[var(--color-text-dim)]">KEY:</span>
              {isEditingProject ? (
                <select
                  value={currentProject.key}
                  onChange={(e) => updateProject({ key: e.target.value })}
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
                  onClick={() => setIsEditingProject(true)}
                >
                  {currentProject.key}
                </span>
              )}
            </span>
            <span className="flex items-center gap-1">
              <span className="text-[var(--color-text-dim)]">SIG:</span>
              {isEditingProject ? (
                <select
                  value={currentProject.timeSignature}
                  onChange={(e) => updateProject({ timeSignature: e.target.value })}
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
                  onClick={() => setIsEditingProject(true)}
                >
                  {currentProject.timeSignature}
                </span>
              )}
            </span>
            {isEditingProject && (
              <button
                onClick={() => setIsEditingProject(false)}
                className="text-[var(--color-accent)] hover:underline"
              >
                [SAVE]
              </button>
            )}
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={isProcessing || !prompt.trim()}
        className={`w-full px-4 py-3 border-t border-[var(--color-text-dim)] text-sm uppercase tracking-[0.2em]
                   transition-all duration-200 flex items-center justify-center gap-3
                   ${isProcessing 
                     ? 'bg-[var(--color-surface)] text-[var(--color-text-dim)]' 
                     : 'hover:bg-[var(--color-accent)] hover:text-black cursor-pointer'
                   } disabled:cursor-not-allowed`}
      >
        {isProcessing ? (
          <>
            <Cpu className="w-4 h-4 animate-pulse" />
            <span className="cursor">PROCESSING</span>
          </>
        ) : (
          <>
            <span>[EXECUTE]</span>
          </>
        )}
      </button>
    </div>
  );
}