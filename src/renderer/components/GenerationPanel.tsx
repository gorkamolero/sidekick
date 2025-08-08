import React, { useState } from 'react';
import { Terminal, Music, Send } from 'lucide-react';
import { useStore } from '../lib/store';
import { useAgent } from '../hooks/useAgent';
import { AudioDropZone } from './AudioDropZone';
import { analyzeAudioFile } from '../services/audioAnalysisService';
import { ModeSelector, GenerationMode } from './GenerationPanel/ModeSelector';
import { ProjectInfoDisplay } from './GenerationPanel/ProjectInfoDisplay';
import { PromptInput } from './GenerationPanel/PromptInput';
import { ExecuteButton } from './GenerationPanel/ExecuteButton';
import { getModeInstructions } from './GenerationPanel/modeInstructions';

export function GenerationPanel() {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<GenerationMode>('loop');
  const [showAudioDrop, setShowAudioDrop] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { currentProject, updateProject, linkState } = useStore();
  const { sendMessage, isProcessing, cancelMessage } = useAgent();

  const handleSubmit = async () => {
    const message = prompt.trim();
    if (!message || isProcessing) return;
    
    // Add mode-specific system instructions
    const enhancedMessage = getModeInstructions(mode, message);
    
    // Clear input immediately for better UX
    setPrompt('');
    
    // Send message asynchronously
    await sendMessage(enhancedMessage);
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
    <div className="border-t border-[var(--color-text-dim)]">
      <div className="p-3">
        {/* Mode selector buttons - at the top */}
        <div className="mb-3">
          <ModeSelector mode={mode} onModeChange={setMode} />
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
          <PromptInput
            prompt={prompt}
            onPromptChange={setPrompt}
            onSubmit={handleSubmit}
            isProcessing={isProcessing}
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <button
              onClick={() => setShowAudioDrop(!showAudioDrop)}
              className="p-1.5 rounded hover:bg-[var(--color-surface)] transition-colors"
              title="Analyze audio file"
            >
              <Music className="w-4 h-4 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]" />
            </button>
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isProcessing}
              className="p-1.5 rounded hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send message"
            >
              <Send className="w-4 h-4 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export type { GenerationMode };