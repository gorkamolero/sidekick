import React, { useRef, useEffect, useState } from 'react';
import { X, Music } from 'lucide-react';
import { useStore } from '../../lib/store';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const { shouldFocusPrompt, clearFocusPrompt } = useStore();

  // Auto-focus on mount and when processing completes
  useEffect(() => {
    if (!isProcessing) {
      textareaRef.current?.focus();
    }
  }, [isProcessing]);
  
  // Focus when new tab is created
  useEffect(() => {
    if (shouldFocusPrompt) {
      textareaRef.current?.focus();
      clearFocusPrompt();
    }
  }, [shouldFocusPrompt, clearFocusPrompt]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
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

  const textareaHeight = attachedFile ? 'h-[60px]' : 'h-[88px]';
  const paddingTop = attachedFile ? 'pt-1' : 'pt-2';

  return (
    <div className="relative">
      {attachedFile && (
        <div className="mb-2 p-2 bg-[var(--color-surface)] border border-[var(--color-text-dim)] rounded-t flex items-center gap-2">
          <Music className="w-4 h-4 text-[var(--color-accent)] flex-shrink-0" />
          <span className="text-sm text-[var(--color-text-secondary)] truncate flex-1">
            {attachedFile.name}
          </span>
          <button
            onClick={onFileRemove}
            className="p-1 rounded hover:bg-[var(--color-background)] transition-colors flex-shrink-0"
            title="Remove file"
          >
            <X className="w-3 h-3 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]" />
          </button>
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder={getPlaceholder()}
        className={`w-full pl-3 pr-10 ${paddingTop} pb-2 bg-[var(--color-surface)] border 
                 ${attachedFile ? 'rounded-b border-t-0' : 'rounded'} resize-none ${textareaHeight} placeholder-[var(--color-text-dim)] focus:outline-none 
                 text-[var(--color-text-primary)] font-mono text-sm transition-all duration-200
                 ${isDragOver 
                   ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5 border-dashed' 
                   : 'border-[var(--color-text-dim)] focus:border-[var(--color-accent)]'
                 }
                 ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={isProcessing || isAnalyzing}
        onKeyDown={handleKeyDown}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        autoFocus
      />
    </div>
  );
}