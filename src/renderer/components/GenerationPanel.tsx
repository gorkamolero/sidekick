import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../lib/store';
import { Terminal, Cpu, X, Music, Repeat, Zap, Lightbulb } from 'lucide-react';
import { useAgent } from '../hooks/useAgent';
import { AudioDropZone } from './AudioDropZone';
import { analyzeAudioFile } from '../services/audioAnalysisService';

type GenerationMode = 'loop' | 'sample' | 'inspiration';

export function GenerationPanel() {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<GenerationMode>('loop');
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [showAudioDrop, setShowAudioDrop] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { currentProject, updateProject } = useStore();
  const { sendMessage, isProcessing, cancelMessage } = useAgent();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount and when processing completes
  useEffect(() => {
    if (!isProcessing) {
      textareaRef.current?.focus();
    }
  }, [isProcessing]);

  const handleSubmit = async () => {
    const message = prompt.trim();
    if (!message || isProcessing) return;
    
    // Add mode-specific system instructions
    const modeInstructions = {
      loop: `[SYSTEM: LOOP MODE ACTIVE]
Generate a 4-8 second seamless loop that can be repeated indefinitely.
- Create consistent energy throughout
- No fade in or fade out
- Ensure the end connects smoothly to the beginning
- Optimize for layering in a DAW

User request: ${message}`,
      
      sample: `[SYSTEM: SAMPLE MODE ACTIVE]
Generate a 1 second one-shot, hit, or sample.
- Focus on impact and transient
- Create a single, distinct sound
- Suitable for triggering and sampling
- Think: drum hits, vocal chops, FX, stabs

User request: ${message}`,
      
      inspiration: `[SYSTEM: INSPIRATION MODE ACTIVE]
Generate a 15-30 second musical idea or sketch.
- Include musical development and progression
- Can have intro, main section, and variation
- Allow for creative exploration
- Suitable as a song starter or arrangement reference

User request: ${message}`
    };
    
    const enhancedMessage = modeInstructions[mode];
    
    // Clear input immediately for better UX
    setPrompt('');
    
    // Send message asynchronously
    await sendMessage(enhancedMessage);
    
    // Re-focus after sending
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleAudioFile = async (file: File) => {
    setIsAnalyzing(true);
    try {
      // Analyze locally first for immediate feedback
      const analysis = await analyzeAudioFile(file);
      
      // Format the analysis results as a message
      const analyzePrompt = `I've analyzed the audio file "${file.name}":
      
🎵 BPM: ${Math.round(analysis.bpm)}
🎹 Key: ${analysis.key}
⚡ Energy: ${Math.round(analysis.energy * 100)}%
🕺 Danceability: ${Math.round(analysis.danceability * 100)}%
🎼 Style: ${analysis.style.join(', ')}
🎤 Instruments: ${analysis.instruments.map(i => i.label).join(', ')}

Would you like me to generate a complementary loop based on these characteristics?`;
      
      // Send the analysis results to the chat
      await sendMessage(analyzePrompt);
      
      // Update project context if needed
      if (currentProject) {
        updateProject({ 
          bpm: Math.round(analysis.bpm),
          key: analysis.key 
        });
      }
      
      setShowAudioDrop(false);
    } catch (error) {
      console.error('Failed to process audio file:', error);
      // Fallback: just inform about the upload
      const fallbackPrompt = `I've received the audio file "${file.name}" but couldn't analyze it locally. The file has been uploaded for processing.`;
      await sendMessage(fallbackPrompt);
      setShowAudioDrop(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="border-b border-[var(--color-text-dim)]">
      <div className="p-4">
        {/* Mode selector buttons - at the top */}
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setMode('loop')}
            className={`px-3 py-1.5 text-xs uppercase tracking-wider transition-all duration-200
                       backdrop-blur-sm border border-[var(--color-text-dim)]
                       ${mode === 'loop' 
                         ? 'bg-[var(--color-accent)]/30 text-[var(--color-accent)] border-[var(--color-accent)]' 
                         : 'bg-black/40 text-[var(--color-text-secondary)] hover:bg-black/60 hover:text-[var(--color-text-primary)]'
                       }`}
            title="Loop Mode: 4-8 second seamless loops"
          >
            <Repeat className="w-3 h-3 inline-block mr-1" />
            Loop
          </button>
          <button
            onClick={() => setMode('sample')}
            className={`px-3 py-1.5 text-xs uppercase tracking-wider transition-all duration-200
                       backdrop-blur-sm border border-[var(--color-text-dim)]
                       ${mode === 'sample' 
                         ? 'bg-[var(--color-accent)]/30 text-[var(--color-accent)] border-[var(--color-accent)]' 
                         : 'bg-black/40 text-[var(--color-text-secondary)] hover:bg-black/60 hover:text-[var(--color-text-primary)]'
                       }`}
            title="Sample Mode: 1 second one-shots and hits"
          >
            <Zap className="w-3 h-3 inline-block mr-1" />
            Sample
          </button>
          <button
            onClick={() => setMode('inspiration')}
            className={`px-3 py-1.5 text-xs uppercase tracking-wider transition-all duration-200
                       backdrop-blur-sm border border-[var(--color-text-dim)]
                       ${mode === 'inspiration' 
                         ? 'bg-[var(--color-accent)]/30 text-[var(--color-accent)] border-[var(--color-accent)]' 
                         : 'bg-black/40 text-[var(--color-text-secondary)] hover:bg-black/60 hover:text-[var(--color-text-primary)]'
                       }`}
            title="Inspiration Mode: 15-30 second musical ideas"
          >
            <Lightbulb className="w-3 h-3 inline-block mr-1" />
            Inspire
          </button>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[var(--color-accent)]" />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAudioDrop(!showAudioDrop)}
              className="p-1.5 rounded hover:bg-[var(--color-surface)] transition-colors"
              title="Analyze audio file"
            >
              <Music className="w-4 h-4 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]" />
            </button>
            <div className="text-xs text-[var(--color-text-dim)] font-mono">
              Enter to send • Shift+Enter for new line
            </div>
          </div>
        </div>
        
        {showAudioDrop && (
          <div className="mb-3">
            <AudioDropZone 
              onFileSelect={handleAudioFile}
              isAnalyzing={isAnalyzing}
            />
          </div>
        )}
        
        <div className="relative">
          <span className="absolute left-3 top-3 text-[var(--color-text-dim)] pointer-events-none">
            &gt;_
          </span>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="neural_synthesis --prompt "
            className="w-full pl-8 pr-3 py-3 bg-[var(--color-surface)] border border-[var(--color-text-dim)] 
                     resize-none h-20 placeholder-[var(--color-text-dim)] focus:outline-none 
                     focus:border-[var(--color-accent)] text-[var(--color-text-primary)] font-mono text-sm
                     transition-colors"
            disabled={isProcessing}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            autoFocus
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

      <div className="flex border-t border-[var(--color-text-dim)]">
        <button
          onClick={isProcessing ? cancelMessage : handleSubmit}
          disabled={(!isProcessing && !prompt.trim())}
          className={`flex-1 px-4 py-3 text-sm uppercase tracking-[0.2em]
                     transition-all duration-200 flex items-center justify-center gap-3
                     ${isProcessing
                       ? 'bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300' 
                       : 'hover:bg-[var(--color-accent)] hover:text-black'
                     } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {isProcessing ? (
            <>
              <X className="w-4 h-4" />
              <span>CANCEL</span>
            </>
          ) : (
            <>
              <span>[EXECUTE] {prompt.trim() && '↵'}</span>
            </>
          )}
        </button>
        {isProcessing && (
          <div className="px-4 py-3 border-l border-[var(--color-text-dim)] flex items-center gap-2">
            <Cpu className="w-4 h-4 animate-pulse text-[var(--color-accent)]" />
            <span className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)] animate-pulse">
              Processing
            </span>
          </div>
        )}
      </div>
    </div>
  );
}