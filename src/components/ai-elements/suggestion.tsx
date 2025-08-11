'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export type SuggestionsProps = {
  children: ReactNode;
  className?: string;
};

export const Suggestions = ({ children, className }: SuggestionsProps) => (
  <div 
    className={cn(
      'flex flex-wrap gap-2 p-3',
      className
    )}
  >
    {children}
  </div>
);

export type SuggestionProps = {
  suggestion: string;
  onClick?: (suggestion: string) => void;
  className?: string;
};

export const Suggestion = ({ 
  suggestion, 
  onClick,
  className 
}: SuggestionProps) => (
  <button
    onClick={() => onClick?.(suggestion)}
    className={cn(
      'px-3 py-1.5 text-xs font-mono',
      'bg-[var(--color-surface)] text-[var(--color-text-secondary)]',
      'border border-[var(--color-text-dim)]/20 rounded-md',
      'hover:bg-[var(--color-accent)] hover:text-black',
      'transition-all duration-200',
      'active:scale-95',
      className
    )}
  >
    {suggestion}
  </button>
);