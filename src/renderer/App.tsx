import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GenerationPanel } from "./components/GenerationPanel";
import { HistoryPanel } from "./components/HistoryPanel";
import { ChatInterface } from "./components/ChatInterface";
import { ConversationTabs } from "./components/ConversationTabs";
import { MusicServiceSelector } from "./components/MusicServiceSelector";
import { ThemeSelector } from "./components/ThemeSelector";
import { PonyAnimations } from "./components/PonyAnimations";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { useStore } from "./lib/store";
import { Archive } from "lucide-react";
import { Generation } from "./types";
import { StatusBar } from "./components/StatusBar";
import { ProjectBar } from "./components/ProjectBar";
import { AbletonLinkStatus } from "./components/AbletonLinkStatus";
import { AbletonAlert } from "./components/AbletonAlert";

const queryClient = new QueryClient();

function AppContent() {
  const {
    setProject,
    initializeStore,
    activeView,
    setActiveView,
    addGeneration,
  } = useStore();
  const { theme } = useTheme();

  useEffect(() => {
    console.log("App mounted");

    // Initialize store (load conversations from storage)
    initializeStore();

    // Get project info on startup
    window.electron
      .getProjectInfo()
      .then(setProject)
      .catch((err) => {
        console.error("Error getting project info:", err);
      });

    // Listen for audio generation events from main process
    const unsubscribe = window.electron.audio.onGenerated((event, data) => {
      console.log("Audio generated event received:", data);

      // Add generation to store with the local file path
      const generation: Generation = {
        id: Math.random().toString(36).substr(2, 9),
        prompt: data.prompt,
        timestamp: new Date(),
        audioUrl: data.audioUrl,
        filePath: data.localFilePath, // This is the actual file on disk!
        duration: data.duration,
        bpm: data.bpm || 120,
        key: data.key || "C",
        tags: data.tags || [],
      };

      addGeneration(generation);
    });

    return () => {
      unsubscribe();
    };
  }, [setProject, initializeStore, addGeneration]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen flex flex-col bg-[var(--color-void)] relative overflow-hidden">
        {/* Ableton Alert - Above everything */}
        <AbletonAlert />
        
        {/* Show pony animations only when MLP theme is active */}
        {theme === "pony" && <PonyAnimations />}

        {/* Scanner effect */}
        <div className="scanner" />

        {/* Grid pattern background */}
        <div className="absolute inset-0 grid-pattern opacity-50" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Simplified header */}
          <header className="px-4 py-1 flex items-center justify-between">
            <h1 className="text-sm font-bold duochrome tracking-wider">
              SIDEKICK
            </h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[var(--color-accent)] rounded-full animate-pulse" />
              <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-widest">
                Neural Audio Synthesis
              </p>
            </div>
          </header>

          {/* Project bar */}
          <ProjectBar />
          
          {/* Ableton Link status */}
          <AbletonLinkStatus />

          {/* Conversation tabs */}
          <ConversationTabs />

          {/* Main content area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeView === "chat" ? (
              <>
                {/* Chat messages */}
                <ChatInterface />

                {/* Generation panel at bottom */}
                <GenerationPanel />
              </>
            ) : (
              /* History view */
              <HistoryPanel />
            )}
          </div>

          <StatusBar />
        </div>
      </div>
    </QueryClientProvider>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
