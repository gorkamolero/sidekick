import React from "react";
import { 
  Conversation, 
  ConversationContent, 
  ConversationScrollButton 
} from "@/components/ai-elements/conversation";
import { 
  Message, 
  MessageContent, 
  MessageAvatar 
} from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { Loader } from "@/components/ai-elements/loader";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import { Task, TaskContent, TaskItem, TaskTrigger } from "@/components/ai-elements/task";
import { Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ToolCallDisplay } from "./ToolCallDisplay";
import { TaskProgressDisplay } from "./TaskProgressDisplay";
import type { UIMessage } from "@ai-sdk/react";

interface ChatInterfaceProps {
  messages: UIMessage[];
  isProcessing: boolean;
}

export function ChatInterface({ messages, isProcessing }: ChatInterfaceProps) {

  // Filter out system messages for display
  const displayMessages = messages.filter((m: any) => m.role !== "system");

  if (displayMessages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4">
          <div className="text-center py-16">
            <div className="text-[var(--color-text-dim)] text-sm font-mono">
              <p>// READY FOR NEURAL SYNTHESIS</p>
              <p className="mt-2 text-xs">TYPE YOUR COMMAND BELOW</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Conversation className="flex-1 bg-[var(--color-void)]">
      <ConversationContent className="max-w-4xl mx-auto space-y-3">
        <AnimatePresence initial={false}>
          {displayMessages.map((message: any) => {
            const isLastAssistantMessage =
              message === displayMessages[displayMessages.length - 1] &&
              message.role === "assistant";
            const showLoader =
              isProcessing && isLastAssistantMessage && !message.content && !message.toolInvocations;

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Message from={message.role} className="[&>div]:max-w-full items-start">
                  <div
                    className={`flex-shrink-0 w-7 h-7 rounded flex items-center justify-center ${
                      message.role === "user"
                        ? "bg-[var(--color-accent)] text-black"
                        : "bg-[var(--color-surface)] text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User className="w-3 h-3" />
                    ) : (
                      <Bot className="w-3 h-3" />
                    )}
                  </div>

                  <MessageContent
                    className={`max-w-full ${
                      message.role === "user"
                        ? "bg-[var(--color-surface)] border border-[var(--color-accent)] text-[var(--color-text-primary)]"
                        : "bg-[var(--color-surface)] border border-[var(--color-text-dim)] text-[var(--color-text-primary)]"
                    }`}
                  >
                    <div className="text-[10px] text-[var(--color-text-dim)] mb-1 font-mono">
                      {message.createdAt ? new Date(message.createdAt).toTimeString().slice(0, 8) : new Date().toTimeString().slice(0, 8)}
                    </div>

                    {showLoader && (
                      <div className="flex items-center gap-2 text-[var(--color-text-dim)]">
                        <Loader className="inline-block" />
                        <span className="text-[10px] font-mono">Thinking...</span>
                      </div>
                    )}
                    
                    {/* Show reasoning - check multiple possible locations including Kimi's format */}
                    {(() => {
                      // Check if content has thinking tags (Kimi format)
                      const contentText = message.content || (message.parts?.find((p: any) => p.type === "text")?.text);
                      const thinkingMatch = contentText?.match(/<thinking>([\s\S]*?)<\/thinking>/);
                      
                      const hasReasoning = message.reasoning || 
                                         message.experimental_reasoning ||
                                         thinkingMatch ||
                                         (message.parts && message.parts.some((p: any) => p.type === "reasoning" || p.type === "thinking"));
                      
                      if (!hasReasoning) return null;
                      
                      const reasoningContent = message.reasoning || 
                                             message.experimental_reasoning ||
                                             thinkingMatch?.[1] ||
                                             message.parts?.filter((p: any) => p.type === "reasoning" || p.type === "thinking")
                                               .map((p: any) => p.reasoning || p.thinking || p.text || p.content)
                                               .join("\n");
                      
                      return (
                        <Reasoning className="mb-2" isStreaming={showLoader}>
                          <ReasoningTrigger />
                          <ReasoningContent>
                            {reasoningContent}
                          </ReasoningContent>
                        </Reasoning>
                      );
                    })()}
                    
                    {/* Always show content if available (filter out thinking tags) */}
                    {message.parts && message.parts.length > 0 && (
                      <Response className="text-xs font-mono whitespace-pre-wrap break-words overflow-wrap-anywhere">
                        {message.parts.filter((p: any) => p.type === "text" && p.text)
                          .map((p: any) => p.text.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim())
                          .join("\n")}
                      </Response>
                    )}
                    
                    {/* Show content for messages without parts (fallback, filter out thinking tags) */}
                    {!message.parts && message.content && (
                      <Response className="text-xs font-mono whitespace-pre-wrap break-words overflow-wrap-anywhere">
                        {message.content.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim()}
                      </Response>
                    )}
                    
                    {/* Show attached files for user messages */}
                    {message.role === "user" && (
                      <>
                        {/* Check the metadata object for attachments */}
                        {message.metadata?.attachments && message.metadata.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {message.metadata.attachments.map((attachment: any, i: number) => (
                              <div key={i} className="flex items-center gap-1.5 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-text-secondary)]/20 rounded-md text-xs text-[var(--color-text-secondary)]">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                </svg>
                                <span className="font-mono">{attachment.name || 'audio file'}</span>
                                {attachment.contentType && (
                                  <span className="text-[var(--color-text-dim)] ml-1">({attachment.contentType.split('/')[1]})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Show task progress for tool calls */}
                    {message.role === "assistant" && message.parts && message.parts.some((p: any) => p.type?.startsWith('tool-')) && (
                      <Task className="mb-2">
                        <TaskTrigger 
                          title="Music Generation Task"
                          status={showLoader ? 'in-progress' : 'completed'}
                          count={message.parts.filter((p: any) => p.type?.startsWith('tool-')).length}
                        />
                        <TaskContent>
                          {message.parts
                            .filter((p: any) => p.type?.startsWith('tool-'))
                            .map((part: any, i: number) => (
                              <TaskItem 
                                key={i}
                                status={
                                  part.state === 'output-available' ? 'completed' :
                                  part.state === 'input-available' ? 'in-progress' : 'pending'
                                }
                              >
                                {part.type.replace('tool-', '')} - {part.toolName || 'Processing'}
                              </TaskItem>
                            ))}
                        </TaskContent>
                      </Task>
                    )}

                    {/* Show task progress updates */}
                    {message.role === "assistant" && message.parts && (
                      <TaskProgressDisplay message={message} />
                    )}

                    {/* Always show tool calls if available */}
                    {message.role === "assistant" && message.parts && (
                      <ToolCallDisplay message={message} />
                    )}
                  </MessageContent>
                </Message>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </ConversationContent>
      <ConversationScrollButton className="bg-[var(--color-surface)] border-[var(--color-text-dim)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent)] hover:text-black" />
    </Conversation>
  );
}
