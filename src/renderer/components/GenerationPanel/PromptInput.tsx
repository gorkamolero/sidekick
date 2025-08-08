import React, { useRef, useEffect } from 'react';

interface PromptInputProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  isProcessing: boolean;
}

export function PromptInput({ prompt, onPromptChange, onSubmit, isProcessing }: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount and when processing completes
  useEffect(() => {
    if (!isProcessing) {
      textareaRef.current?.focus();
    }
  }, [isProcessing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={prompt}
      onChange={(e) => onPromptChange(e.target.value)}
      placeholder="Type your prompt..."
      className="w-full pl-3 pr-10 py-2 bg-[var(--color-surface)] border border-[var(--color-text-dim)] 
               rounded resize-none h-[88px] placeholder-[var(--color-text-dim)] focus:outline-none 
               focus:border-[var(--color-accent)] text-[var(--color-text-primary)] font-mono text-sm
               transition-colors"
      disabled={isProcessing}
      onKeyDown={handleKeyDown}
      autoFocus
    />
  );
}