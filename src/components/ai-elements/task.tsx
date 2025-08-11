'use client';

import { CheckCircleIcon, CircleIcon, ClockIcon, ChevronDownIcon } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export type TaskProps = ComponentProps<typeof Collapsible>;

export const Task = ({ className, ...props }: TaskProps) => (
  <Collapsible
    className={cn('not-prose w-full rounded-md border border-[var(--color-text-dim)]/20 bg-[var(--color-surface)]/30', className)}
    {...props}
  />
);

export type TaskTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
  title: string;
  status?: 'pending' | 'in-progress' | 'completed';
  count?: number;
};

const getStatusIcon = (status: 'pending' | 'in-progress' | 'completed' = 'pending') => {
  const icons = {
    'pending': <CircleIcon className="size-3 text-[var(--color-text-dim)]" />,
    'in-progress': <ClockIcon className="size-3 text-[var(--color-accent)] animate-pulse" />,
    'completed': <CheckCircleIcon className="size-3 text-green-500" />,
  };
  
  return icons[status];
};

export const TaskTrigger = ({ 
  className, 
  title, 
  status = 'pending', 
  count,
  ...props 
}: TaskTriggerProps) => (
  <CollapsibleTrigger
    className={cn(
      'flex w-full items-center justify-between gap-2 p-3 text-left hover:bg-[var(--color-surface)]/50 transition-colors',
      className,
    )}
    {...props}
  >
    <div className="flex items-center gap-2">
      {getStatusIcon(status)}
      <span className="font-medium text-xs text-[var(--color-text-secondary)]">{title}</span>
      {count !== undefined && (
        <span className="text-[10px] text-[var(--color-text-dim)] bg-[var(--color-surface)] px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
    <ChevronDownIcon className="size-3 text-[var(--color-text-dim)] transition-transform group-data-[state=open]:rotate-180" />
  </CollapsibleTrigger>
);

export type TaskContentProps = ComponentProps<typeof CollapsibleContent>;

export const TaskContent = ({ className, ...props }: TaskContentProps) => (
  <CollapsibleContent
    className={cn(
      'overflow-hidden transition-all duration-200 ease-in-out',
      'data-[state=closed]:animate-[collapse_200ms_ease-out]',
      'data-[state=open]:animate-[expand_200ms_ease-out]',
      className,
    )}
    {...props}
  />
);

export type TaskItemProps = {
  children: ReactNode;
  status?: 'pending' | 'in-progress' | 'completed';
  className?: string;
};

export const TaskItem = ({ 
  children, 
  status = 'pending', 
  className 
}: TaskItemProps) => (
  <div className={cn('flex items-center gap-2 px-4 py-2 text-xs', className)}>
    {getStatusIcon(status)}
    <span className="text-[var(--color-text-primary)]">{children}</span>
  </div>
);