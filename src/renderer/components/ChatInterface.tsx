import React, { useEffect, useRef } from 'react';
import { useStore } from '../lib/store';
import { ChatMessage } from '../types';
import { Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ChatInterface() {
  const { currentConversation } = useStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  if (!currentConversation || currentConversation.messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-center py-16">
          <div className="text-[var(--color-text-dim)] text-sm font-mono">
            <p>// READY FOR NEURAL SYNTHESIS</p>
            <p className="mt-2 text-xs">TYPE YOUR COMMAND BELOW</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <AnimatePresence initial={false}>
        {currentConversation.messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
      </AnimatePresence>
      <div ref={messagesEndRef} />
    </div>
  );
}

function MessageItem({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`flex-shrink-0 p-2 rounded ${
        isUser 
          ? 'bg-[var(--color-accent)] text-black' 
          : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      
      <div className={`flex-1 ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block p-3 rounded ${
          isUser 
            ? 'bg-[var(--color-surface)] border border-[var(--color-accent)]' 
            : 'bg-[var(--color-surface)] border border-[var(--color-text-dim)]'
        }`}>
          <div className="text-xs text-[var(--color-text-dim)] mb-1 font-mono">
            {message.timestamp.toTimeString().slice(0, 8)}
          </div>
          <div className="text-sm font-mono whitespace-pre-wrap">
            {message.isStreaming ? (
              <>
                {message.content}
                <span className="cursor">█</span>
              </>
            ) : (
              message.content
            )}
          </div>
          
          {/* Tool calls display */}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="mt-2 pt-2 border-t border-[var(--color-text-dim)]">
              {message.toolCalls.map((tool, index) => (
                <div key={index} className="text-xs text-[var(--color-accent)] font-mono">
                  [{tool.name}] {tool.status || 'executing...'}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}