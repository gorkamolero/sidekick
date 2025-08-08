import React, { useEffect, useRef } from 'react';
import { useStore } from '../lib/store';
import { ChatMessage } from '../types';
import { Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioPlayer } from './AudioPlayer';
import { AudioAnalysisDisplay } from './AudioAnalysisDisplay';

export function ChatInterface() {
  const { currentConversation } = useStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  if (!currentConversation || currentConversation.messages.length === 0) {
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
          {currentConversation.messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
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
      className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`flex-shrink-0 p-1.5 rounded ${
        isUser 
          ? 'bg-[var(--color-accent)] text-black' 
          : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
      }`}>
        {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
      </div>
      
      <div className={`min-w-0 flex-1 ${isUser ? 'flex justify-end' : ''}`}>
        <div className={`inline-block max-w-full p-2.5 rounded text-sm ${
          isUser 
            ? 'bg-[var(--color-surface)] border border-[var(--color-accent)]' 
            : 'bg-[var(--color-surface)] border border-[var(--color-text-dim)]'
        }`}>
          <div className="text-[10px] text-[var(--color-text-dim)] mb-1 font-mono">
            {message.timestamp.toTimeString().slice(0, 8)}
          </div>
          <div className="text-xs font-mono whitespace-pre-wrap break-words overflow-wrap-anywhere">
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
            <div className="mt-3 space-y-2">
              {message.toolCalls.map((tool, index) => (
                <div key={index}>
                  {tool.toolName === 'generateMusic' ? (
                    tool.status === 'complete' ? (
                      tool.result?.audioUrl ? (
                        <AudioPlayer
                          audioUrl={tool.result.audioUrl}
                          localFilePath={tool.result.localFilePath}
                          prompt={tool.result.prompt}
                          duration={tool.result.duration}
                        />
                      ) : (
                        <div className="text-xs text-red-400 font-mono bg-[var(--color-void)] p-2 rounded">
                          ❌ Generation failed: {tool.result?.message || 'Unknown error'}
                        </div>
                      )
                    ) : (
                      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 max-w-md animate-pulse">
                        <div className="mb-3">
                          <h4 className="text-green-400 font-medium text-sm mb-1">Generating...</h4>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-10 h-10 bg-gray-700 rounded-full" />
                          <div className="flex-1 h-2 bg-gray-700 rounded-full" />
                        </div>
                      </div>
                    )
                  ) : tool.toolName === 'analyze-audio' && tool.status === 'complete' && tool.result ? (
                    <AudioAnalysisDisplay
                      analysis={tool.result}
                      onUseInGeneration={(analysis) => {
                        // You can implement this to auto-fill generation params
                        console.log('Use analysis for generation:', analysis);
                      }}
                    />
                  ) : (
                    <div className="text-xs text-[var(--color-accent)] font-mono bg-[var(--color-void)] p-2 rounded">
                      🔧 {tool.toolName || tool.name} {tool.status || 'executing...'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}