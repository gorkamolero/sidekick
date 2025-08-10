import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useStore } from '../lib/store';
import { useEffect, useRef } from 'react';
import { updateConversationMessages, loadConversation } from '../lib/db';

export function useAgent() {
  const { currentConversation, addMessage } = useStore();
  const lastConversationId = useRef<string | null>(null);
  
  const {
    messages,
    sendMessage,
    stop,
    status,
    regenerate,
    setMessages,
  } = useChat({
    transport: new DefaultChatTransport({
      api: 'http://localhost:3001/chat',
    }) as any,
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });
  
  useEffect(() => {
    if (lastConversationId.current === currentConversation?.id) {
      return;
    }
    
    lastConversationId.current = currentConversation?.id || null;
    
    const loadMessages = async () => {
      if (currentConversation?.id) {
        const dbConversation = await loadConversation(currentConversation.id);
        if (dbConversation?.messages) {
          setMessages(dbConversation.messages);
        } else if (currentConversation.messages) {
          setMessages(currentConversation.messages as any);
        }
      } else {
        setMessages([]);
      }
    };
    
    loadMessages();
  }, [currentConversation?.id, setMessages]);
  
  useEffect(() => {
    if (currentConversation?.id && messages.length > 0) {
      updateConversationMessages(currentConversation.id, messages).catch(console.error);
    }
  }, [messages, currentConversation?.id]);
  
  const sendMessageWithAttachments = (text: string, attachments?: any[]) => {
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