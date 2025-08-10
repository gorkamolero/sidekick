import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

export function useAgent() {
  const {
    messages,
    sendMessage,
    stop,
    status,
    regenerate,
  } = useChat({
    transport: new DefaultChatTransport({
      api: 'http://localhost:3001/chat',
    }) as any,
    onFinish: (message) => {
      console.log('Message finished:', message);
    },
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });
  
  const sendMessageWithAttachments = (text: string, attachments?: any[]) => {
    // For now, include file info in the message text
    // TODO: Figure out how to properly send attachments with v5
    let finalText = text;
    if (attachments && attachments.length > 0) {
      const fileInfo = attachments.map(a => `[Audio file: ${a.name} at ${a.url}]`).join('\n');
      finalText = `${text}\n\n${fileInfo}`;
    }
    
    sendMessage({ text: finalText });
  };
  
  const cancelMessage = () => {
    stop();
  };
  
  return {
    sendMessage: sendMessageWithAttachments,
    isProcessing: status === 'submitted' || status === 'streaming',
    cancelMessage,
    messages,
    reload: regenerate
  };
}