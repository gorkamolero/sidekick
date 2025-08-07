import React, { useState } from 'react';
import { useStore } from '../lib/store';
import { Database, FileAudio, Activity, MessageSquare, Trash2, Search, Clock } from 'lucide-react';
import { Generation } from '../types';
import { formatDistanceToNow } from 'date-fns';

export function HistoryPanel() {
  const { generations, conversations, loadConversation, deleteConversation, openTabIds } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showGenerations, setShowGenerations] = useState(false);
  
  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => {
    const searchLower = searchQuery.toLowerCase();
    return conv.title.toLowerCase().includes(searchLower) ||
           conv.messages.some(msg => msg.content.toLowerCase().includes(searchLower));
  });
  
  // Filter generations based on search
  const filteredGenerations = generations.filter(gen => {
    const searchLower = searchQuery.toLowerCase();
    return gen.prompt.toLowerCase().includes(searchLower);
  });

  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      <div className="p-4">
        {/* Header with toggle */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[var(--color-accent)]" />
              <h2 className="text-xs text-[var(--color-text-secondary)] uppercase tracking-[0.2em]">
                ARCHIVE
              </h2>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setShowGenerations(false)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  !showGenerations 
                    ? 'bg-[var(--color-accent)] text-black' 
                    : 'text-[var(--color-text-dim)] hover:text-[var(--color-accent)]'
                }`}
              >
                CHATS
              </button>
              <button
                onClick={() => setShowGenerations(true)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  showGenerations 
                    ? 'bg-[var(--color-accent)] text-black' 
                    : 'text-[var(--color-text-dim)] hover:text-[var(--color-accent)]'
                }`}
              >
                LOOPS
              </button>
            </div>
          </div>
          
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-2 top-2 w-3 h-3 text-[var(--color-text-dim)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={showGenerations ? "Search loops..." : "Search conversations..."}
              className="w-full pl-7 pr-2 py-1.5 text-xs bg-[var(--color-surface)] border border-[var(--color-text-dim)] 
                       rounded focus:border-[var(--color-accent)] focus:outline-none font-mono"
            />
          </div>
        </div>
        
        {/* Content */}
        {showGenerations ? (
          // Generations view
          filteredGenerations.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-[var(--color-text-dim)] text-sm font-mono">
                <p>// NO LOOPS FOUND</p>
                <p className="mt-2 text-xs">
                  {searchQuery ? 'TRY A DIFFERENT SEARCH' : 'GENERATE YOUR FIRST LOOP'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredGenerations.map((gen, index) => (
                <GenerationItem key={gen.id} generation={gen} index={index} total={generations.length} />
              ))}
            </div>
          )
        ) : (
          // Conversations view
          filteredConversations.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-[var(--color-text-dim)] text-sm font-mono">
                <p>// NO CONVERSATIONS FOUND</p>
                <p className="mt-2 text-xs">
                  {searchQuery ? 'TRY A DIFFERENT SEARCH' : 'START A NEW CONVERSATION'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredConversations.map((conv) => {
                const isOpen = openTabIds.includes(conv.id);
                return (
                  <div
                    key={conv.id}
                    className="group border border-[var(--color-text-dim)] p-3 
                             hover:border-[var(--color-accent)] hover:bg-[var(--color-surface)]
                             transition-all duration-200 cursor-pointer"
                    onClick={() => loadConversation(conv.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="w-3 h-3 text-[var(--color-accent)]" />
                          <h3 className="text-xs font-mono text-[var(--color-text-primary)] line-clamp-1">
                            {conv.title}
                          </h3>
                          {isOpen && (
                            <span className="text-xs px-1 bg-[var(--color-accent)] text-black rounded">
                              TAB
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this conversation permanently?')) {
                            deleteConversation(conv.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity 
                                 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <div className="text-xs text-[var(--color-text-dim)] space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>{formatDistanceToNow(conv.updatedAt, { addSuffix: true })}</span>
                        <span>•</span>
                        <span>{conv.messages.length} messages</span>
                      </div>
                      {conv.messages[0] && (
                        <p className="line-clamp-2 text-[var(--color-text-secondary)] mt-2 pl-5">
                          {conv.messages[0].content}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function GenerationItem({ generation, index, total }: { generation: Generation; index: number; total: number }) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/uri-list', `file://${generation.filePath}`);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="border border-[var(--color-text-dim)] p-3 cursor-move 
                 hover:border-[var(--color-accent)] hover:bg-[var(--color-surface)]
                 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[var(--color-text-dim)] text-xs font-mono">
              #{String(total - index).padStart(3, '0')}
            </span>
            <FileAudio className="w-3 h-3 text-[var(--color-accent)]" />
          </div>
          <p className="text-xs text-[var(--color-text-primary)] font-mono line-clamp-2">
            {generation.prompt}
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex gap-4 text-[var(--color-text-secondary)]">
          <span>{generation.bpm}BPM</span>
          <span>{generation.key}</span>
          <span>{generation.duration}s</span>
        </div>
        <span className="text-[var(--color-text-dim)]">
          {new Date(generation.timestamp).toTimeString().slice(0, 8)}
        </span>
      </div>

      {/* Waveform visualization */}
      <div className="mt-2 h-8 bg-[var(--color-void)] border border-[var(--color-text-dim)] 
                      flex items-center px-2 group-hover:border-[var(--color-accent)] transition-colors">
        <div className="flex items-center justify-between w-full">
          <Activity className="w-3 h-3 text-[var(--color-text-dim)]" />
          <div className="flex-1 mx-2 flex items-center gap-[1px]">
            {Array.from({ length: 32 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-[var(--color-accent)] opacity-30"
                style={{ height: `${Math.random() * 100}%` }}
              />
            ))}
          </div>
          <span className="text-[var(--color-text-dim)] text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            DRAG
          </span>
        </div>
      </div>
    </div>
  );
}