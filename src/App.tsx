import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GenerationPanel } from "./components/GenerationPanel";
import { HistoryPanel } from "./components/HistoryPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { ChatInterface } from "./components/ChatInterface";
import { FirstTimeSetup } from "./components/FirstTimeSetup";
import { useAgent } from "./hooks/useAgent";
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
import { TauriDropzone } from "./components/TauriDropzone";
import tauriAPI from "./lib/tauri-api";
import { Toaster } from "@/components/ui/sonner";

const queryClient = new QueryClient();

function AppContent() {
  const [setupComplete, setSetupComplete] = useState(() => {
    // Check if setup was completed before
    const completed = localStorage.getItem('setupComplete') === 'true';
    // Also check if we're in Tauri mode
    const inTauri = window.__TAURI__ !== undefined;
    // Auto-complete if in Tauri and previously completed
    return completed && inTauri;
  });

  const {
    setProject,
    initializeStore,
    activeView,
    setActiveView,
    addGeneration,
    setAttachedFile,
    createNewConversation,
    closeTab,
    currentConversation,
    openTabIds,
  } = useStore();
  const { theme } = useTheme();
  const agentState = useAgent();

  useEffect(() => {
    console.log("App mounted");

    // Initialize store (load conversations from storage)
    initializeStore();

    // Get project info on startup
    tauriAPI
      .getProjectInfo()
      .then(setProject)
      .catch((err) => {
        console.error("Error getting project info:", err);
      });

    // Listen for global shortcuts
    const setupEventListeners = async () => {
      const unsubscribeNewTab = await tauriAPI.onNewTabShortcut(() => {
        console.log("New tab shortcut pressed");
        createNewConversation();
      });

      const unsubscribeCloseTab = await tauriAPI.onCloseTabShortcut(() => {
        console.log("Close tab shortcut pressed");
        if (currentConversation) {
          if (openTabIds.length === 1) {
            createNewConversation();
          }
          closeTab(currentConversation.id);
        }
      });

      return () => {
        unsubscribeNewTab();
        unsubscribeCloseTab();
      };
    };

    setupEventListeners().then((cleanup) => {
      // Store cleanup function for later use
      return cleanup;
    });

    // Listen for audio generation events
    // TODO: Implement audio generation event listener with Tauri
    // const unsubscribe = tauriAPI.onAudioGenerated((data) => {
    //   console.log("Audio generated event received:", data);
    //
    //   // Add generation to store with the local file path
    //   const generation: Generation = {
    //     id: crypto.randomUUID(),
    //     prompt: data.prompt,
    //     timestamp: new Date(),
    //     audioUrl: data.audioUrl,
    //     filePath: data.localFilePath, // This is the actual file on disk!
    //     duration: data.duration,
    //     bpm: data.bpm || 120,
    //     key: data.key || "C",
    //     tags: data.tags || [],
    //   };
    //
    //   addGeneration(generation);
    // });

    // return () => {
    //   unsubscribe();
    // };
  }, [initializeStore]);

  const handleFileDrop = async (file: File) => {
    console.log("🎯 handleFileDrop called with file:", file);
    console.log("File name:", file.name);
    console.log("File path:", (file as any).path);

    // If the file has a path property (from Tauri drop), we can use it directly
    // Otherwise we'd need to read and save the file
    if ((file as any).path) {
      // Create a pseudo-file that includes the path
      const fileWithPath = file;
      (fileWithPath as any).savedPath = (file as any).path;
      setAttachedFile(fileWithPath);
    } else {
      // Normal file object - would need to save it
      setAttachedFile(file);
    }

    // Switch to chat view if we're in history view
    if (activeView === "history") {
      console.log("Switching to chat view");
      setActiveView("chat");
    }
  };

  const handleSetupComplete = () => {
    setSetupComplete(true);
    localStorage.setItem('setupComplete', 'true');
    
    // Mark that env is configured if we have the keys
    if (window.__TAURI__) {
      // In a real app, we'd check for actual .env file
      localStorage.setItem('envConfigured', 'true');
    }
  };

  // Show setup screen if not complete
  if (!setupComplete) {
    return (
      <QueryClientProvider client={queryClient}>
        <FirstTimeSetup onComplete={handleSetupComplete} />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TauriDropzone onFileDrop={handleFileDrop}>
        <div className="h-screen flex flex-col bg-[var(--color-void)] relative overflow-hidden">
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

            {/* Conversation tabs */}
            <ConversationTabs />

            {/* Main content area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {activeView === "chat" ? (
                <>
                  {/* Chat messages */}
                  <ChatInterface {...agentState} />

                  {/* Generation panel at bottom */}
                  <GenerationPanel {...agentState} />
                </>
              ) : activeView === "history" ? (
                /* History view */
                <HistoryPanel />
              ) : (
                /* Settings view */
                <SettingsPanel />
              )}
            </div>

            <StatusBar />
          </div>
        </div>
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--color-surface)',
              border: '1px solid var(--color-text-dim)',
              color: 'var(--color-text-primary)',
            },
          }}
        />
      </TauriDropzone>
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
