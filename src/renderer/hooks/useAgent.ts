import { useState, useCallback } from 'react';
import { useStore } from '../lib/store';
import { createSidekickAgent } from '../lib/agent/mastra-config';
import { ChatMessage } from '../types';

export function useAgent() {
  const { addMessage, updateMessage, addGeneration } = useStore();
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
      // Get the agent
      const agent = createSidekickAgent();

      // Stream the response
      const stream = await agent.text({
        messages: [{ role: 'user', content: content.trim() }],
        stream: true,
      });

      let fullContent = '';
      let toolCalls: any[] = [];

      for await (const chunk of stream) {
        if (chunk.text) {
          fullContent += chunk.text;
          updateMessage(assistantMessage.id, {
            content: fullContent,
            isStreaming: true,
          });
        }

        // Handle tool calls
        if (chunk.toolCalls) {
          toolCalls = chunk.toolCalls;
          updateMessage(assistantMessage.id, {
            toolCalls: toolCalls,
          });

          // Process music generation tool calls
          for (const toolCall of toolCalls) {
            if (toolCall.name === 'generate_music') {
              // Trigger actual music generation
              const { prompt, duration, style } = toolCall.arguments;
              // TODO: Connect to actual music generation
              console.log('Generating music:', { prompt, duration, style });
            }
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
        content: 'Error: Failed to process your request.',
        isStreaming: false,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, addMessage, updateMessage, addGeneration]);

  return {
    sendMessage,
    isProcessing,
  };
}