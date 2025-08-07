import React from 'react';
import { X, Cpu } from 'lucide-react';

interface ExecuteButtonProps {
  isProcessing: boolean;
  hasPrompt: boolean;
  onExecute: () => void;
  onCancel: () => void;
}

export function ExecuteButton({ isProcessing, hasPrompt, onExecute, onCancel }: ExecuteButtonProps) {
  return (
    <div className="flex border-t border-[var(--color-text-dim)]">
      <button
        onClick={isProcessing ? onCancel : onExecute}
        disabled={(!isProcessing && !hasPrompt)}
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
            <span>[EXECUTE] {hasPrompt && '↵'}</span>
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
  );
}