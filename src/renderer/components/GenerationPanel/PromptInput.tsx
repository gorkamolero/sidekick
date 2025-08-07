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
    <div className="relative">
      <span className="absolute left-3 top-3 text-[var(--color-text-dim)] pointer-events-none">
        &gt;_
      </span>
      <textarea
        ref={textareaRef}
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder="neural_synthesis --prompt "
        className="w-full pl-8 pr-3 py-3 bg-[var(--color-surface)] border border-[var(--color-text-dim)] 
                 resize-none h-20 placeholder-[var(--color-text-dim)] focus:outline-none 
                 focus:border-[var(--color-accent)] text-[var(--color-text-primary)] font-mono text-sm
                 transition-colors"
        disabled={isProcessing}
        onKeyDown={handleKeyDown}
        autoFocus
      />
    </div>
  );
}