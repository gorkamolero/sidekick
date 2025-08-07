import { useState, useCallback, useRef } from 'react';
import { useStore } from '../lib/store';
import { ChatMessage } from '../types';

export function useAgent() {
  const { addMessage, updateMessage, currentConversation, currentProject } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isProcessing) return;

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setIsProcessing(true);
    
    // Add a timeout to prevent stuck processing state
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setIsProcessing(false);
      console.error('Message processing timeout after 30s');
    }, 30000);

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
      // Build conversation history including the new message
      const previousMessages = currentConversation?.messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content })) || [];
      
      // Add the new user message
      const messages = [
        ...previousMessages,
        { role: 'user' as const, content: content.trim() }
      ];
      
      // Add project context as system message if available
      if (currentProject && messages.length === 1) {
        messages.unshift({
          role: 'system' as const,
          content: `Current project context: BPM=${currentProject.bpm}, Key=${currentProject.key}, Time Signature=${currentProject.timeSignature}. Use these values when generating music unless the user specifies otherwise.`
        });
      }

      let fullContent = '';
      const toolCalls: any[] = [];

      // Use Mastra through IPC
      const result = await window.electron.agent.streamMessage(
        messages,
        (chunk) => {
          if (chunk.type === 'text' && chunk.text) {
            fullContent += chunk.text;
            updateMessage(assistantMessage.id, {
              content: fullContent,
              isStreaming: true,
            });
          } else if (chunk.type === 'tool-call') {
            console.log('🎵 Tool call received:', chunk);
            toolCalls.push({
              type: 'tool-call',
              toolName: chunk.toolName,
              toolCallId: chunk.toolCallId,
              args: chunk.args,
              status: 'generating',
            });
            updateMessage(assistantMessage.id, {
              toolCalls: toolCalls,
            });
          } else if (chunk.type === 'tool-result') {
            console.log('🔧 Tool result received:', chunk);
            // Update the existing tool call with the result
            const toolIndex = toolCalls.findIndex(t => t.toolCallId === chunk.toolCallId);
            if (toolIndex >= 0) {
              toolCalls[toolIndex] = {
                ...toolCalls[toolIndex],
                type: 'tool-result',
                result: chunk.result,
                status: 'complete',
              };
            } else {
              toolCalls.push({
                type: 'tool-result',
                toolName: chunk.toolName,
                toolCallId: chunk.toolCallId,
                result: chunk.result,
                status: 'complete',
              });
            }
            updateMessage(assistantMessage.id, {
              toolCalls: toolCalls,
            });
          }
        }
      );

      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }

      // Mark as complete
      updateMessage(assistantMessage.id, {
        content: fullContent,
        isStreaming: false,
        toolCalls: toolCalls,
      });

    } catch (error) {
      console.error('Agent error:', error);
      updateMessage(assistantMessage.id, {
        content: `Error: ${error instanceof Error ? error.message : 'Failed to process request'}`,
        isStreaming: false,
      });
    } finally {
      clearTimeout(timeoutId);
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  }, [isProcessing, addMessage, updateMessage, currentConversation, currentProject]);

  const cancelMessage = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsProcessing(false);
    }
  }, []);

  return {
    sendMessage,
    isProcessing,
    cancelMessage,
  };
}