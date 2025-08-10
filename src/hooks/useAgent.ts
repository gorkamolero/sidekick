import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useStore } from '../lib/store';
import { useEffect, useRef, useCallback } from 'react';
import { updateConversationMessages, loadConversation } from '../lib/db';

export function useAgent() {
  const { currentConversation } = useStore();
  const lastConversationId = useRef<string | null>(null);
  const lastMessageCount = useRef<number>(0);
  
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
  
  // Load messages when conversation changes
  useEffect(() => {
    // Only load if conversation actually changed
    if (lastConversationId.current === currentConversation?.id) {
      return;
    }
    lastConversationId.current = currentConversation?.id || null;
    lastMessageCount.current = 0; // Reset message count for new conversation
    
    const loadMessages = async () => {
      if (currentConversation?.id) {
        try {
          const dbConversation = await loadConversation(currentConversation.id);
          if (dbConversation?.messages && dbConversation.messages.length > 0) {
            lastMessageCount.current = dbConversation.messages.length;
            setMessages(dbConversation.messages);
          } else {
            setMessages([]);
          }
        } catch (error) {
          console.error('Error loading conversation:', error);
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    };
    
    loadMessages();
  }, [currentConversation?.id]); // Remove setMessages from deps to avoid loops
  
  // Save messages to DB when they change (but not when loading)
  useEffect(() => {
    // Skip saving if we just loaded these messages
    if (messages.length === lastMessageCount.current) {
      return;
    }
    
    // Update the count
    lastMessageCount.current = messages.length;
    
    // Save to DB
    if (currentConversation?.id && messages.length > 0) {
      updateConversationMessages(currentConversation.id, messages).catch(console.error);
    }
  }, [messages.length, currentConversation?.id]); // Use messages.length instead of messages
  
  const sendMessageWithAttachments = useCallback((text: string, attachments?: any[]) => {
    let finalText = text;
    if (attachments && attachments.length > 0) {
      const fileInfo = attachments.map(a => `[Audio file: ${a.name} at ${a.url}]`).join('\n');
      finalText = `${text}\n\n${fileInfo}`;
    }
    
    sendMessage({ text: finalText });
  }, [sendMessage]);
  
  const cancelMessage = useCallback(() => {
    stop();
  }, [stop]);
  
  return {
    sendMessage: sendMessageWithAttachments,
    isProcessing: status === 'submitted' || status === 'streaming',
    cancelMessage,
    messages,
    reload: regenerate
  };
}