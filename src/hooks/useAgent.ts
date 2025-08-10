import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useStore } from '../lib/store';
import { useEffect, useRef, useCallback } from 'react';
import { updateConversationMessages, updateConversation, loadConversation } from '../lib/db';
import { generateConversationTitle } from '../lib/titleGenerator';

export function useAgent() {
  const { currentConversation, conversations, setCurrentConversation, setConversations } = useStore();
  const lastConversationId = useRef<string | null>(null);
  const lastMessageCount = useRef<number>(0);
  const lastTitleUpdate = useRef<string | null>(null);
  const storeRef = useRef({ currentConversation, conversations, setCurrentConversation, setConversations });
  const messagesRef = useRef<any[]>([]);
  
  // Update ref when store values change
  useEffect(() => {
    storeRef.current = { currentConversation, conversations, setCurrentConversation, setConversations };
  }, [currentConversation, conversations, setCurrentConversation, setConversations]);
  
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
    onFinish: ({ message }) => {
      console.log('🔥 onFinish TRIGGERED!');
      console.log('📝 onFinish message:', message);
      
      // Use a timeout to let the state update first
      setTimeout(() => {
        const store = useStore.getState();
        const { currentConversation, conversations, setCurrentConversation, setConversations } = store;
        console.log('📝 store.currentConversation:', currentConversation);
        
        // Use the messages from the ref which should be current
        const currentMessages = messagesRef.current;
        console.log('📝 current messages length:', currentMessages.length);
        
        if (currentConversation) {
          const allMessages = [...currentMessages, message];
          generateConversationTitle(allMessages as any).then((title) => {
            console.log('Generated title:', title);
            
            const updatedConversation = { ...currentConversation, title };
            const updatedConversations = conversations.map(conv => 
              conv.id === currentConversation.id ? updatedConversation : conv
            );
            
            setCurrentConversation(updatedConversation);
            setConversations(updatedConversations);
            
            updateConversation(currentConversation.id, { title, messages: allMessages }).catch(console.error);
          }).catch((error) => {
            console.error('Title generation error:', error);
          });
        }
      }, 100);
    },
  });

  // Keep messages ref updated
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  
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
            console.log('📥 LOADING MESSAGES FROM DB:', dbConversation.messages.length);
            
            // Deduplicate messages by ID (keep the last occurrence)
            const messageMap = new Map();
            dbConversation.messages.forEach(msg => {
              messageMap.set(msg.id, msg);
            });
            const deduplicatedMessages = Array.from(messageMap.values());
            
            if (deduplicatedMessages.length !== dbConversation.messages.length) {
              console.warn('🔧 DEDUPLICATING MESSAGES:', dbConversation.messages.length, '→', deduplicatedMessages.length);
            }
            
            // Check for tool parts in loaded messages
            const messagesWithTools = deduplicatedMessages.filter(msg => 
              msg.parts?.some(p => p.type?.startsWith('tool-'))
            );
            if (messagesWithTools.length) {
              console.log('🔧 LOADED MESSAGES WITH TOOLS:', messagesWithTools.length);
              messagesWithTools.forEach(msg => {
                const toolParts = msg.parts?.filter(p => p.type?.startsWith('tool-'));
                toolParts?.forEach(part => {
                  console.log('Loaded tool:', part.type, 'state:', part.state, 'output:', part.output);
                });
              });
            }
            
            lastMessageCount.current = deduplicatedMessages.length;
            setMessages(deduplicatedMessages);
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
    
    // Check for duplicate message IDs
    const messageIds = messages.map(m => m.id);
    const uniqueIds = new Set(messageIds);
    if (messageIds.length !== uniqueIds.size) {
      console.warn('🚨 DUPLICATE MESSAGE IDs DETECTED:', messageIds.length, 'messages,', uniqueIds.size, 'unique IDs');
      const duplicates = messageIds.filter((id, index) => messageIds.indexOf(id) !== index);
      console.warn('Duplicate IDs:', duplicates);
      // Don't save messages with duplicate IDs
      return;
    }
    
    const previousCount = lastMessageCount.current;
    lastMessageCount.current = messages.length;
    
    // Save to DB
    if (currentConversation?.id && messages.length > 0) {
      console.log('💾 SAVING MESSAGES TO DB:', messages.length);
      const lastMessage = messages[messages.length - 1];
      console.log('Sample message parts:', lastMessage?.parts);
      
      // Log tool parts specifically
      const toolParts = lastMessage?.parts?.filter(p => p.type?.startsWith('tool-'));
      if (toolParts?.length) {
        console.log('🔧 TOOL PARTS BEING SAVED:', toolParts);
        toolParts.forEach((part, i) => {
          console.log(`Tool ${i}:`, part.type, 'state:', part.state, 'output:', part.output);
        });
      }
      
      updateConversationMessages(currentConversation.id, messages).catch(console.error);
      
    }
  }, [messages.length, currentConversation?.id]);

  
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