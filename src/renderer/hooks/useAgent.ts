import { useState, useCallback, useRef } from 'react';
import { useStore } from '../lib/store';
import { ChatMessage } from '../types';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export function useAgent() {
  const { addMessage, updateMessage, currentConversation, currentProject } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  

  const sendMessage = useCallback(async (content: string, metadata?: { mode?: string }) => {
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
      // Build conversation history WITHOUT the messages we just added
      const previousMessages = currentConversation?.messages
        .filter((m: any) => m.role !== 'system' && m.id !== assistantMessage.id && m.id !== userMessage.id)
        .map((m: any) => ({ role: m.role, content: m.content })) || [];
      
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

      // TODO: Implement agent streaming through Tauri
      /* const result = await invoke('stream_agent_message', {
        messages,
        metadata,
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
            console.log('🔧 Tool result received in renderer:', chunk);
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
            // Force a new array reference to trigger React re-render
            updateMessage(assistantMessage.id, {
              toolCalls: [...toolCalls],
            });
          }
        }
      }); */
        
        // Use AI SDK directly in the frontend - no need for IPC!
        const response = await streamText({
          model: openai('gpt-4'),
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          tools: {
            generateMusic: {
              description: 'Generate music loops based on user requirements',
              parameters: {
                type: 'object',
                properties: {
                  prompt: { type: 'string', description: 'Music generation prompt' },
                  bpm: { type: 'number', description: 'Beats per minute' },
                  duration: { type: 'number', description: 'Duration in seconds' },
                },
                required: ['prompt'],
              },
            },
          },
        });

        for await (const delta of response.textStream) {
          fullContent += delta;
          updateMessage(assistantMessage.id, {
            content: fullContent,
            isStreaming: true,
          });
        }

        // Handle tool calls if any
        if (response.toolCalls) {
          for (const toolCall of response.toolCalls) {
            console.log('🎵 Tool call received:', toolCall);
            toolCalls.push({
              type: 'tool-call',
              toolName: toolCall.toolName,
              toolCallId: toolCall.toolCallId,
              args: toolCall.args,
              status: 'generating',
            });
            updateMessage(assistantMessage.id, {
              toolCalls: [...toolCalls],
            });
            
            // Simulate tool execution result
            if (toolCall.toolName === 'generateMusic') {
              toolCalls[toolCalls.length - 1] = {
                ...toolCalls[toolCalls.length - 1],
                type: 'tool-result',
                result: { audioUrl: 'https://example.com/generated.wav', duration: 30 },
                status: 'complete',
              };
              updateMessage(assistantMessage.id, {
                toolCalls: [...toolCalls],
              });
            }
          }
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