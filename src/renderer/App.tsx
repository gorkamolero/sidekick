import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GenerationPanel } from './components/GenerationPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { useStore } from './lib/store';

const queryClient = new QueryClient();

export function App() {
  const { setProject } = useStore();

  useEffect(() => {
    // Get project info on startup
    window.electron.getProjectInfo().then(setProject);
  }, [setProject]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen flex flex-col bg-[var(--color-ableton-dark)]">
        <header className="bg-black/50 p-4 border-b border-gray-800">
          <h1 className="text-lg font-semibold">Sidekick</h1>
          <p className="text-xs text-gray-400">AI Loops for Ableton Live</p>
        </header>
        
        <GenerationPanel />
        <HistoryPanel />
      </div>
    </QueryClientProvider>
  );
}