'use client';

import { ChevronDownIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export type ReasoningProps = ComponentProps<typeof Collapsible> & {
  isStreaming?: boolean;
};

export const Reasoning = ({ 
  className, 
  isStreaming = false,
  ...props 
}: ReasoningProps) => (
  <Collapsible
    className={cn('not-prose w-full', className)}
    defaultOpen={isStreaming}
    open={isStreaming}
    {...props}
  />
);

export type ReasoningTriggerProps = ComponentProps<typeof CollapsibleTrigger>;

export const ReasoningTrigger = ({ className, ...props }: ReasoningTriggerProps) => (
  <CollapsibleTrigger
    className={cn(
      'flex w-full items-center justify-between gap-2 px-3 py-2 text-xs',
      'text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)] transition-colors',
      'border-b border-[var(--color-text-dim)]/20',
      className,
    )}
    {...props}
  >
    <span className="font-mono uppercase tracking-wide">Thinking...</span>
    <ChevronDownIcon className="size-3 transition-transform group-data-[state=open]:rotate-180" />
  </CollapsibleTrigger>
);

export type ReasoningContentProps = ComponentProps<typeof CollapsibleContent>;

export const ReasoningContent = ({ 
  className, 
  children,
  ...props 
}: ReasoningContentProps) => (
  <CollapsibleContent
    className={cn(
      'overflow-hidden transition-all duration-200 ease-in-out',
      'data-[state=closed]:animate-[collapse_200ms_ease-out]',
      'data-[state=open]:animate-[expand_200ms_ease-out]',
      className,
    )}
    {...props}
  >
    <div className="p-3 text-xs font-mono text-[var(--color-text-dim)] bg-[var(--color-surface)]/30 border-l-2 border-[var(--color-accent)]/50">
      <div className="whitespace-pre-wrap break-words">
        {children}
      </div>
    </div>
  </CollapsibleContent>
);