'use client';

import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  WrenchIcon,
  XCircleIcon,
} from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { ToolUIPart } from 'ai';
import { CodeBlock } from './code-block';

export type ToolProps = ComponentProps<typeof Collapsible>;

export const Tool = ({ className, ...props }: ToolProps) => (
  <Collapsible
    className={cn('not-prose mb-4 w-full rounded-md border border-[var(--color-text-secondary)]/30', className)}
    {...props}
  />
);

export type ToolHeaderProps = {
  type: ToolUIPart['type'];
  state: ToolUIPart['state'];
  className?: string;
};

const getStatusBadge = (status: ToolUIPart['state']) => {
  const labels = {
    'input-streaming': 'Pending',
    'input-available': 'Running',
    'output-available': 'Completed',
    'output-error': 'Error',
  } as const;

  const icons = {
    'input-streaming': <CircleIcon className="size-3" />,
    'input-available': <ClockIcon className="size-3 animate-pulse" />,
    'output-available': <CheckCircleIcon className="size-3 text-[var(--color-accent)]" />,
    'output-error': <XCircleIcon className="size-3 text-red-500" />,
  } as const;

  return (
    <Badge className="rounded-full text-[10px] px-1.5 py-0.5 bg-[var(--color-surface)] text-[var(--color-text-dim)] border-[var(--color-text-dim)]/20" variant="outline">
      {icons[status]}
      {labels[status]}
    </Badge>
  );
};

export const ToolHeader = ({
  className,
  type,
  state,
  ...props
}: ToolHeaderProps) => (
  <CollapsibleTrigger
    className={cn(
      'flex w-full items-center justify-between gap-2 p-2',
      className,
    )}
    {...props}
  >
    <div className="flex items-center gap-2">
      <WrenchIcon className="size-3 text-[var(--color-text-dim)]" />
      <span className="font-medium text-xs text-[var(--color-text-secondary)]">{type}</span>
      {getStatusBadge(state)}
    </div>
    <ChevronDownIcon className="size-3 text-[var(--color-text-dim)] transition-transform group-data-[state=open]:rotate-180" />
  </CollapsibleTrigger>
);

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>;

export const ToolContent = ({ className, ...props }: ToolContentProps) => (
  <CollapsibleContent
    className={cn(
      'text-popover-foreground outline-none overflow-hidden transition-all duration-200 ease-in-out data-[state=closed]:animate-[collapse_200ms_ease-out] data-[state=open]:animate-[expand_200ms_ease-out]',
      className,
    )}
    {...props}
  />
);

export type ToolInputProps = ComponentProps<'div'> & {
  input: ToolUIPart['input'];
};

export const ToolInput = ({ className, input, ...props }: ToolInputProps) => (
  <Collapsible defaultOpen={true}>
    <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-4 py-2 hover:bg-[var(--color-surface)]/50 transition-colors">
      <h4 className="font-medium text-[var(--color-text-dim)] text-xs uppercase tracking-wide">
        Parameters
      </h4>
      <ChevronDownIcon className="size-3 text-[var(--color-text-dim)] transition-transform data-[state=open]:rotate-180" />
    </CollapsibleTrigger>
    <CollapsibleContent className="px-4 pb-4 overflow-hidden transition-all duration-200 ease-in-out data-[state=closed]:animate-[collapse_200ms_ease-out] data-[state=open]:animate-[expand_200ms_ease-out]">
      <div className="rounded-md bg-[var(--color-surface)]/50 border border-[var(--color-text-dim)]/20 p-2">
        <pre className="text-[10px] font-mono text-[var(--color-text-primary)] whitespace-pre-wrap overflow-x-auto">
          {JSON.stringify(input, null, 2)}
        </pre>
      </div>
    </CollapsibleContent>
  </Collapsible>
);

export type ToolOutputProps = ComponentProps<'div'> & {
  output: ReactNode;
  errorText: ToolUIPart['errorText'];
};

export const ToolOutput = ({
  className,
  output,
  errorText,
  ...props
}: ToolOutputProps) => {
  if (!(output || errorText)) {
    return null;
  }

  return (
    <div className={cn('space-y-2 p-4', className)} {...props}>
      <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {errorText ? 'Error' : 'Result'}
      </h4>
      <div
        className={cn(
          'overflow-x-auto rounded-md text-xs [&_table]:w-full',
          errorText
            ? 'bg-destructive/10 text-destructive'
            : 'bg-muted/50 text-foreground',
        )}
      >
        {errorText && <div>{errorText}</div>}
        {output && <div>{output}</div>}
      </div>
    </div>
  );
};
