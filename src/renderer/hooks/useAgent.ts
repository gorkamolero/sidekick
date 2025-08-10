import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

export function useAgent() {
  const {
    messages,
    append,
    stop,
    status,
    reload,
    input,
    handleInputChange,
    handleSubmit,
    setInput,
  } = useChat({
    api: 'http://localhost:3001/chat',
    onFinish: (message) => {
      console.log('Message finished:', message);
    },
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });
  
  const sendMessage = (text: string, attachments?: any[]) => {
    // Use append to send message with experimental_attachments
    append({
      role: 'user',
      content: text,
    }, {
      experimental_attachments: attachments,
    });
  };
  
  const cancelMessage = () => {
    stop();
  };
  
  return {
    sendMessage,
    isProcessing: status === 'in_progress',
    cancelMessage,
    messages,
    reload,
    input,
    handleInputChange,
    handleSubmit,
    setInput,
  };
}