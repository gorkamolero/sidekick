import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GenerationPanel } from './components/GenerationPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { ChatInterface } from './components/ChatInterface';
import { ConversationTabs } from './components/ConversationTabs';
import { useStore } from './lib/store';
import { Archive } from 'lucide-react';

const queryClient = new QueryClient();

export function App() {
  const { setProject, initializeStore, activeView, setActiveView } = useStore();

  useEffect(() => {
    console.log('App mounted');
    
    // Initialize store (load conversations from storage)
    initializeStore();
    
    // Get project info on startup
    window.electron.getProjectInfo().then(setProject).catch(err => {
      console.error('Error getting project info:', err);
    });
  }, [setProject, initializeStore]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen flex flex-col bg-[var(--color-void)] relative overflow-hidden">
        {/* Scanner effect */}
        <div className="scanner" />
        
        {/* Grid pattern background */}
        <div className="absolute inset-0 grid-pattern opacity-50" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          <header className="border-b border-[var(--color-text-dim)] p-3 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold duochrome tracking-wider">SIDEKICK</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 bg-[var(--color-accent)] rounded-full animate-pulse" />
                <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-widest">
                  Neural Audio Synthesis
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setActiveView(activeView === 'history' ? 'chat' : 'history')}
                className={`p-2 rounded transition-all duration-200 ${
                  activeView === 'history' 
                    ? 'bg-[var(--color-accent)] text-black' 
                    : 'hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                }`}
                title="View History"
              >
                <Archive className="w-4 h-4" />
              </button>
            </div>
          </header>
          
          {/* Conversation tabs */}
          <ConversationTabs />
          
          {/* Main content area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeView === 'chat' ? (
              <>
                {/* Chat messages */}
                <ChatInterface />
                
                {/* Generation panel at bottom */}
                <GenerationPanel />
              </>
            ) : (
              /* History view */
              <HistoryPanel />
            )}
          </div>
          
          {/* Status bar */}
          <footer className="border-t border-[var(--color-text-dim)] px-4 py-2 flex items-center justify-between text-xs text-[var(--color-text-dim)]">
            <span>STATUS: OPERATIONAL</span>
            <span className="tabular-nums">{new Date().toISOString().slice(0, 19).replace('T', ' ')}</span>
          </footer>
        </div>
      </div>
    </QueryClientProvider>
  );
}