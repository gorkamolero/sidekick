import React, { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { useStore } from "../lib/store";
import { Plus, X, MessageSquare } from "lucide-react";
import { Reorder } from "framer-motion";

export function ConversationTabs() {
  const {
    conversations,
    currentConversation,
    openTabIds,
    createNewConversation,
    loadConversation,
    closeTab,
    reorderTabs,
  } = useStore();
  
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);

  const handleCloseTab = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (openTabIds.length === 1) {
      createNewConversation();
    }
    closeTab(conversationId);
  };
  
  const handleReorder = (newOrder: string[]) => {
    reorderTabs(newOrder);
  };

  const openTabs = openTabIds
    .map((id) => conversations.find((c) => c.id === id))
    .filter(Boolean);

  return (
    <Tabs.Root 
      value={currentConversation?.id || ""} 
      onValueChange={(value) => value && loadConversation(value)}
      className="flex items-center gap-1 px-3 pt-2 bg-[var(--color-void)] border-b border-[var(--color-text-dim)] overflow-x-auto"
    >
      <Tabs.List className="flex items-center gap-1">
        <Reorder.Group 
          axis="x" 
          values={openTabIds} 
          onReorder={handleReorder}
          className="flex items-center gap-1"
        >
        {openTabs.map((conv) => {
          if (!conv) return null;
          const isActive = currentConversation?.id === conv.id;
          return (
            <Reorder.Item
              key={conv.id}
              value={conv.id}
              whileDrag={{ scale: 1.05, zIndex: 1 }}
              className="relative"
            >
              <Tabs.Trigger
                value={conv.id}
                className={`
                  relative group flex items-center gap-2 px-3 py-1.5 rounded-t transition-all cursor-move
                  ${
                    isActive
                      ? "bg-[var(--color-surface)] text-[var(--color-accent)] border-t border-l border-r border-[var(--color-accent)]"
                      : "bg-[var(--color-surface)]/50 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]/70 border-t border-l border-r border-transparent"
                  }
                  max-w-[200px] min-w-[120px] data-[state=active]:bg-[var(--color-surface)]
                `}
              >
                <MessageSquare className="w-3 h-3 flex-shrink-0" />
                <span className="text-xs font-mono truncate flex-1 text-left">
                  {conv.title}
                </span>
                <div
                  onClick={(e) => handleCloseTab(e, conv.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 ml-1 flex-shrink-0 cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleCloseTab(e as any, conv.id);
                    }
                  }}
                >
                  <X className="w-3 h-3" />
                </div>
              </Tabs.Trigger>
            </Reorder.Item>
          );
        })}
        </Reorder.Group>
      </Tabs.List>

      <button
        onClick={createNewConversation}
        className="
          flex items-center gap-1 px-3 py-1.5 rounded-t
          bg-[var(--color-surface)]/50 hover:bg-[var(--color-surface)]/70
          text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]
          transition-all border-t border-l border-r border-[var(--color-text-dim)]
          hover:border-[var(--color-accent)]
        "
      >
        <Plus className="w-3 h-3" />
        <span className="text-xs font-mono">NEW</span>
      </button>
    </Tabs.Root>
  );
}
