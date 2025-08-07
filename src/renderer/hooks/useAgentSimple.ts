import { useState, useCallback } from 'react';
import { useStore } from '../lib/store';
import { ChatMessage } from '../types';

// Temporary simple agent without Mastra to debug UI
export function useAgent() {
  const { addMessage, updateMessage } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isProcessing) return;

    setIsProcessing(true);

    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    addMessage(userMessage);

    // Create assistant message
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    addMessage(assistantMessage);

    try {
      // Simulate streaming response
      const response = "I'm Sidekick, your AI music production assistant. I can help you generate loops, understand your project context, and provide production tips. Try asking me to generate a specific type of music!";
      
      // Simulate streaming
      for (let i = 0; i < response.length; i += 5) {
        await new Promise(resolve => setTimeout(resolve, 50));
        updateMessage(assistantMessage.id, {
          content: response.slice(0, i + 5),
          isStreaming: true,
        });
      }

      // Mark as complete
      updateMessage(assistantMessage.id, {
        content: response,
        isStreaming: false,
      });

    } catch (error) {
      console.error('Agent error:', error);
      updateMessage(assistantMessage.id, {
        content: 'Error: Failed to process your request.',
        isStreaming: false,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, addMessage, updateMessage]);

  return {
    sendMessage,
    isProcessing,
  };
}