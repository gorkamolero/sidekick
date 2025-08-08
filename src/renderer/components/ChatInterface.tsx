import React, { useEffect, useRef } from 'react';
import { useStore } from '../lib/store';
import { Message, MessageContent, MessageAvatar } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import { Loader } from '@/components/ai-elements/loader';
import { Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ChatInterface() {
  const { currentConversation } = useStore();
  const messages = currentConversation?.messages || [];
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter out system messages for display
  const displayMessages = messages.filter((m: any) => m.role !== 'system');

  if (displayMessages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4">
          <div className="text-center py-16">
            <div className="text-[var(--color-text-dim)] text-sm font-mono">
              <p>// READY FOR NEURAL SYNTHESIS</p>
              <p className="mt-2 text-xs">TYPE YOUR COMMAND BELOW</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="max-w-4xl mx-auto p-4 space-y-3">
        <AnimatePresence initial={false}>
          {displayMessages.map((message: any) => {
            const isLastAssistantMessage = message === displayMessages[displayMessages.length - 1] && message.role === 'assistant';
            const showLoader = message.isStreaming && isLastAssistantMessage && !message.content;
            
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Message from={message.role} className="[&>div]:max-w-full">
                  <div className={`flex-shrink-0 p-1.5 rounded ${
                    message.role === 'user' 
                      ? 'bg-[var(--color-accent)] text-black' 
                      : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                  }`}>
                    {message.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                  </div>
                  
                  <MessageContent className={`inline-block max-w-full p-2.5 rounded text-sm ${
                    message.role === 'user' 
                      ? 'bg-[var(--color-surface)] border border-[var(--color-accent)]' 
                      : 'bg-[var(--color-surface)] border border-[var(--color-text-dim)]'
                  }`}>
                    <div className="text-[10px] text-[var(--color-text-dim)] mb-1 font-mono">
                      {new Date().toTimeString().slice(0, 8)}
                    </div>
                    
                    {showLoader ? (
                      <Loader className="inline-block" />
                    ) : (
                      <Response className="text-xs font-mono whitespace-pre-wrap break-words overflow-wrap-anywhere">
                        {message.content}
                      </Response>
                    )}
                  </MessageContent>
                </Message>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}