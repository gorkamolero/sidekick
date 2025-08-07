import React from 'react';
import { useStore } from '../lib/store';
import { Plus, X, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ConversationTabs() {
  const { 
    conversations, 
    currentConversation,
    openTabIds,
    createNewConversation, 
    loadConversation,
    closeTab
  } = useStore();

  const handleCloseTab = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation(); // Prevent tab selection
    
    // If this is the last tab, create a new one before closing
    if (openTabIds.length === 1) {
      createNewConversation();
    }
    
    closeTab(conversationId);
  };
  
  // Get actual tab conversations
  const openTabs = openTabIds
    .map(id => conversations.find(c => c.id === id))
    .filter(Boolean);

  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-[var(--color-void)] border-b border-[var(--color-text-dim)] overflow-x-auto">
      <AnimatePresence mode="popLayout">
        {openTabs.map((conv) => {
          if (!conv) return null;
          const isActive = currentConversation?.id === conv.id;
          return (
            <motion.button
              key={conv.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              onClick={() => loadConversation(conv.id)}
              className={`
                relative group flex items-center gap-2 px-3 py-1.5 rounded-t transition-all
                ${isActive 
                  ? 'bg-[var(--color-surface)] text-[var(--color-accent)] border-t border-l border-r border-[var(--color-accent)]' 
                  : 'bg-[var(--color-surface)]/50 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]/70 border-t border-l border-r border-transparent'
                }
                max-w-[200px] min-w-[120px]
              `}
            >
              <MessageSquare className="w-3 h-3 flex-shrink-0" />
              <span className="text-xs font-mono truncate flex-1 text-left">
                {conv.title}
              </span>
              <div
                onClick={(e) => handleCloseTab(e, conv.id)}
                className={`
                  opacity-0 group-hover:opacity-100 transition-opacity
                  hover:text-red-400 ml-1 flex-shrink-0 cursor-pointer
                `}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleCloseTab(e as any, conv.id);
                  }
                }}
              >
                <X className="w-3 h-3" />
              </div>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-accent)]"
                />
              )}
            </motion.button>
          );
        })}
      </AnimatePresence>
      
      <button
        onClick={createNewConversation}
        className="
          flex items-center gap-1 px-3 py-1.5 rounded
          bg-[var(--color-surface)]/30 hover:bg-[var(--color-surface)]/50
          text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]
          transition-all border border-dashed border-[var(--color-text-dim)]
          hover:border-[var(--color-accent)]
        "
      >
        <Plus className="w-3 h-3" />
        <span className="text-xs font-mono">NEW</span>
      </button>
    </div>
  );
}