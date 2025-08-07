import React from 'react';
import { useStore } from '../lib/store';
import { Plus, X, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ConversationTabs() {
  const { 
    conversations, 
    currentConversation, 
    createNewConversation, 
    loadConversation,
    deleteConversation 
  } = useStore();

  const handleDeleteConversation = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation(); // Prevent tab selection
    if (confirm('Delete this conversation?')) {
      deleteConversation(conversationId);
    }
  };

  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-[var(--color-void)] border-b border-[var(--color-text-dim)] overflow-x-auto">
      <AnimatePresence mode="popLayout">
        {conversations.slice(0, 10).map((conv) => {
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
              {conversations.length > 1 && (
                <button
                  onClick={(e) => handleDeleteConversation(e, conv.id)}
                  className={`
                    opacity-0 group-hover:opacity-100 transition-opacity
                    hover:text-red-400 ml-1 flex-shrink-0
                  `}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
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
      
      {conversations.length > 10 && (
        <div className="text-xs text-[var(--color-text-dim)] font-mono ml-2">
          +{conversations.length - 10} more
        </div>
      )}
    </div>
  );
}