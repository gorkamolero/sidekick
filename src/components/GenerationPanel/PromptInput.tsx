import React, { useRef, useEffect, useState } from 'react';
import { X, Music } from 'lucide-react';
import { useStore } from '../../lib/store';
import {
  PromptInput as AIPromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputSubmit,
  PromptInputTools
} from '@/components/ai-elements/prompt-input';

interface PromptInputProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  isProcessing: boolean;
  onFileSelect?: (file: File) => void;
  isAnalyzing?: boolean;
  attachedFile?: File | null;
  onFileRemove?: () => void;
}

export function PromptInput({ prompt, onPromptChange, onSubmit, isProcessing, onFileSelect, isAnalyzing, attachedFile, onFileRemove }: PromptInputProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const { shouldFocusPrompt, clearFocusPrompt } = useStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount and when processing completes
  useEffect(() => {
    if (!isProcessing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isProcessing]);
  
  // Focus when new tab is created
  useEffect(() => {
    if (shouldFocusPrompt && textareaRef.current) {
      textareaRef.current.focus();
      clearFocusPrompt();
    }
  }, [shouldFocusPrompt, clearFocusPrompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isProcessing && !isAnalyzing && prompt.trim()) {
      onSubmit();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (!onFileSelect) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('audio/')) {
        onFileSelect(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (onFileSelect) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const getPlaceholder = () => {
    if (isAnalyzing) return 'Analyzing audio...';
    if (isDragOver) return 'Drop audio file here...';
    if (attachedFile) return 'Ask a question about your audio file...';
    return 'Type your prompt or drag audio files here...';
  };

  const status = isProcessing ? 'streaming' : 'idle';

  return (
    <div className="relative">
      <AIPromptInput
        onSubmit={handleSubmit}
        className={`bg-[var(--color-surface)] border-[var(--color-text-dim)] transition-all duration-200 rounded ${
          isDragOver 
            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5 border-dashed' 
            : 'border-[var(--color-text-dim)] focus-within:border-[var(--color-accent)]'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <PromptInputTextarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder={getPlaceholder()}
          disabled={isProcessing || isAnalyzing}
          className={`font-mono text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-dim)] bg-transparent ${
            isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''
          } ${attachedFile ? 'min-h-[60px]' : 'min-h-[88px]'}`}
          minHeight={attachedFile ? 60 : 88}
          maxHeight={attachedFile ? 120 : 164}
        />
        
        {attachedFile && (
          <PromptInputToolbar className="pb-0 mb-0">
            <PromptInputTools className="pb-0 mb-0 [&_button:first-child]:rounded-bl-none">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-[var(--color-accent)] flex-shrink-0" />
                <span className="text-sm text-[var(--color-text-secondary)] truncate max-w-[150px]">
                  {attachedFile.name}
                </span>
                <button
                  onClick={onFileRemove}
                  className="p-1 rounded hover:bg-[var(--color-background)] transition-colors flex-shrink-0 mb-0 pb-0"
                  title="Remove file"
                >
                  <X className="w-3 h-3 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]" />
                </button>
              </div>
            </PromptInputTools>
          </PromptInputToolbar>
        )}
      </AIPromptInput>
    </div>
  );
}