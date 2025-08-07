import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { Loader2, Sparkles } from 'lucide-react';
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
        // TODO: Show error toast
      }
    });
  };

  return (
    <div className="p-4 border-b border-gray-800">
      <div className="mb-4">
        <label className="text-xs text-gray-400 uppercase tracking-wider">
          Generate Loop
        </label>
        <div className="mt-2 relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your loop... (e.g., 'deep house bassline with analog warmth')"
            className="w-full p-3 bg-[var(--color-ableton-gray)] rounded-lg resize-none h-20 
                     placeholder-gray-500 focus:outline-none focus:ring-2 
                     focus:ring-[var(--color-ableton-blue)] text-white"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey) {
                handleGenerate();
              }
            }}
          />
        </div>
      </div>

      {currentProject && (
        <div className="flex gap-4 text-xs text-gray-400 mb-4">
          <span>BPM: {currentProject.bpm}</span>
          <span>Key: {currentProject.key}</span>
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={isPending || !prompt.trim()}
        className="w-full bg-[var(--color-ableton-blue)] text-white py-3 rounded-lg font-medium
                   hover:bg-blue-600 transition-colors disabled:opacity-50 
                   disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate
          </>
        )}
      </button>
    </div>
  );
}