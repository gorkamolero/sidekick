import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useStore } from "../lib/store";
import { useEffect, useRef, useCallback, useState } from "react";
import {
  updateConversationMessages,
  updateConversation,
  loadConversation,
} from "../lib/db";
import { generateConversationTitle } from "../lib/titleGenerator";

export function useAgent() {
  const {
    currentConversation,
    conversations,
    setCurrentConversation,
    setConversations,
  } = useStore();
  const lastConversationId = useRef<string | null>(null);
  const lastMessageCount = useRef<number>(0);
  const lastTitleUpdate = useRef<string | null>(null);
  const storeRef = useRef({
    currentConversation,
    conversations,
    setCurrentConversation,
    setConversations,
  });
  const messagesRef = useRef<any[]>([]);
  const messagesConversationId = useRef<string | null>(null);
  const isSaving = useRef<boolean>(false);

  // Update ref when store values change
  useEffect(() => {
    storeRef.current = {
      currentConversation,
      conversations,
      setCurrentConversation,
      setConversations,
    };
  }, [
    currentConversation,
    conversations,
    setCurrentConversation,
    setConversations,
  ]);

  const { messages, sendMessage, stop, status, regenerate, setMessages } =
    useChat({
      id: currentConversation?.id || "new",
      transport: new DefaultChatTransport({
        api: "http://localhost:3001/chat",
      }) as any,
      onError: (error) => {
        console.error("Chat error:", error);
      },
      onFinish: ({ message }) => {
        console.log("🔥 onFinish TRIGGERED!");
        console.log("📝 onFinish message:", message);

        // Use a timeout to let the state update first
        setTimeout(() => {
          const store = useStore.getState();
          const {
            currentConversation,
            conversations,
            setCurrentConversation,
            setConversations,
          } = store;
          console.log("📝 store.currentConversation:", currentConversation);

          // Use the messages from the ref which should be current
          const currentMessages = messagesRef.current;
          console.log("📝 current messages length:", currentMessages.length);

          if (currentConversation) {
            const allMessages = [...currentMessages, message];
            generateConversationTitle(allMessages as any)
              .then((title) => {
                console.log("Generated title:", title);

                const updatedConversation = { ...currentConversation, title };
                const updatedConversations = conversations.map((conv) =>
                  conv.id === currentConversation.id
                    ? updatedConversation
                    : conv,
                );

                setCurrentConversation(updatedConversation);
                setConversations(updatedConversations);

                updateConversation(currentConversation.id, {
                  title,
                  messages: allMessages,
                }).catch(console.error);
              })
              .catch((error) => {
                console.error("Title generation error:", error);
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
    if (lastConversationId.current === currentConversation?.id) {
      return;
    }
    lastConversationId.current = currentConversation?.id || null;
    lastMessageCount.current = 0;

    const loadMessages = async () => {
      if (currentConversation?.id) {
        try {
          const dbConversation = await loadConversation(currentConversation.id);
          if (dbConversation?.messages && dbConversation.messages.length > 0) {
            const messageMap = new Map();
            dbConversation.messages.forEach((msg) => {
              messageMap.set(msg.id, msg);
            });
            const deduplicatedMessages = Array.from(messageMap.values());
            lastMessageCount.current = deduplicatedMessages.length;
            setMessages(deduplicatedMessages);
            messagesConversationId.current = currentConversation.id;
          } else {
            setMessages([]);
            messagesConversationId.current = currentConversation.id;
          }
        } catch (error) {
          console.error("Error loading conversation:", error);
          setMessages([]);
        }
      } else {
        setMessages([]);
        messagesConversationId.current = null;
      }
    };

    loadMessages();
  }, [currentConversation?.id]);

  // Save messages to DB when they change (but not when loading)
  useEffect(() => {
    // Prevent concurrent saves
    if (isSaving.current) {
      return;
    }

    // Only save if these messages belong to the current conversation
    if (messagesConversationId.current !== currentConversation?.id) {
      console.log(
        "⚠️ SKIPPING SAVE - messages belong to different conversation",
      );
      return;
    }

    // Skip saving if we just loaded these messages
    if (messages.length === lastMessageCount.current) {
      return;
    }

    // Check for duplicate message IDs
    const messageIds = messages.map((m) => m.id);
    const uniqueIds = new Set(messageIds);
    if (messageIds.length !== uniqueIds.size) {
      console.warn(
        "🚨 DUPLICATE MESSAGE IDs DETECTED:",
        messageIds.length,
        "messages,",
        uniqueIds.size,
        "unique IDs",
      );
      const duplicates = messageIds.filter(
        (id, index) => messageIds.indexOf(id) !== index,
      );
      console.warn("Duplicate IDs:", duplicates);
      // Don't save messages with duplicate IDs
      return;
    }

    const previousCount = lastMessageCount.current;
    lastMessageCount.current = messages.length;

    // Save to DB
    if (currentConversation?.id && messages.length > 0) {
      isSaving.current = true;
      const lastMessage = messages[messages.length - 1];

      // Log tool parts specifically
      const toolParts = lastMessage?.parts?.filter((p) =>
        p.type?.startsWith("tool-"),
      );
      if (toolParts?.length) {
        console.log("🔧 TOOL PARTS BEING SAVED:", toolParts);
        toolParts.forEach((part, i) => {
          console.log(
            `Tool ${i}:`,
            part.type,
            "state:",
            part.state,
            "output:",
            part.output,
          );
        });
      }

      updateConversationMessages(currentConversation.id, messages)
        .catch(console.error)
        .finally(() => {
          isSaving.current = false;
        });
    }
  }, [messages.length, currentConversation?.id]);

  const sendMessageWithAttachments = useCallback(
    (text: string, attachments?: any[]) => {
      messagesConversationId.current = currentConversation?.id || null;

      // Don't send files to the AI model - the file path is already in the text message
      // The agent only needs the path, not the actual file content
      // Store attachment info in data for UI display purposes
      console.log("📤 Sending message with attachments:", {
        text,
        attachments,
      });

      // Create message with metadata for attachments
      const message = attachments ? {
        text,
        metadata: { attachments }
      } : {
        text
      };
      
      sendMessage(
        message,
        {
          body: { 
            data: attachments ? { attachments } : undefined 
          }
        }
      );
    },
    [sendMessage, currentConversation?.id],
  );

  const cancelMessage = useCallback(() => {
    stop();
  }, [stop]);

  return {
    sendMessage: sendMessageWithAttachments,
    isProcessing: status === "submitted" || status === "streaming",
    cancelMessage,
    messages,
    reload: regenerate,
  };
}
