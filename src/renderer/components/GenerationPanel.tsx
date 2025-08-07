import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { Terminal, Cpu } from 'lucide-react';
import { useAudioGeneration } from '../hooks/useAudioGeneration';

export function GenerationPanel() {
  const [prompt, setPrompt] = useState('');
  const { currentProject } = useStore();
  const { mutate: generate, isPending } = useAudioGeneration();

  const handleGenerate = async () => {
    if (!prompt.trim() || isPending) return;
    
    generate(prompt, {
      onSuccess: () => {
        setPrompt(''); // Clear prompt on success
      },
      onError: (error) => {
        console.error('Generation failed:', error);
      }
    });
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
                handleGenerate();
              }
            }}
          />
        </div>
        
        {currentProject && (
          <div className="flex gap-6 mt-3 text-xs text-[var(--color-text-secondary)] font-mono">
            <span className="flex items-center gap-1">
              <span className="text-[var(--color-text-dim)]">BPM:</span>
              <span className="text-[var(--color-accent)]">{currentProject.bpm}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="text-[var(--color-text-dim)]">KEY:</span>
              <span className="text-[var(--color-accent)]">{currentProject.key}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="text-[var(--color-text-dim)]">SIG:</span>
              <span className="text-[var(--color-accent)]">{currentProject.timeSignature}</span>
            </span>
          </div>
        )}
      </div>

      <button
        onClick={handleGenerate}
        disabled={isPending || !prompt.trim()}
        className={`w-full px-4 py-3 border-t border-[var(--color-text-dim)] text-sm uppercase tracking-[0.2em]
                   transition-all duration-200 flex items-center justify-center gap-3
                   ${isPending 
                     ? 'bg-[var(--color-surface)] text-[var(--color-text-dim)]' 
                     : 'hover:bg-[var(--color-accent)] hover:text-black cursor-pointer'
                   } disabled:cursor-not-allowed`}
      >
        {isPending ? (
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