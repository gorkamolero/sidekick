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
import { Archive, RefreshCw, Zap } from "lucide-react";
import { Generation } from "./types";
import { StatusBar } from "./components/StatusBar";
import { ProjectBar } from "./components/ProjectBar";
import { TauriDropzone } from "./components/TauriDropzone";
import tauriAPI from "./lib/tauri-api";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useAbleton } from "./hooks/useAbleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const { isConnected, isSyncing, syncWithAbleton } = useAbleton();
  
  const handleSync = async () => {
    const success = await syncWithAbleton(true);
    if (!success) {
      toast.error("Failed to sync", {
        description: "Could not connect to Ableton Live",
      });
    }
  };

  useEffect(() => {
    console.log("App mounted");

    // Prevent default drop behavior to avoid loading files into the browser
    // But only for drops outside our dropzone AND not when dragging FROM audio players
    const preventDefault = (e: DragEvent) => {
      // Only prevent if not in a dropzone area AND not dragging from audio player
      const target = e.target as HTMLElement;
      const isAudioPlayerDrag = target.closest('[data-audio-player-drag]');
      if (!target.closest('[data-dropzone]') && !isAudioPlayerDrag) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    
    const preventDrop = (e: DragEvent) => {
      // Always prevent drop to avoid loading files in browser
      const target = e.target as HTMLElement;
      const isAudioPlayerDrag = target.closest('[data-audio-player-drag]');
      if (!target.closest('[data-dropzone]') && !isAudioPlayerDrag) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };
    
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', preventDrop);

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

    const cleanupPromise = setupEventListeners();
    
    // Cleanup function
    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDrop);
      cleanupPromise.then(cleanup => cleanup());
    };

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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleSync}
                      disabled={!isConnected || isSyncing}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all duration-200 ${
                        isConnected
                          ? isSyncing
                            ? "bg-[var(--color-accent)]/50 text-[var(--color-accent)] cursor-wait"
                            : "bg-[var(--color-surface)] hover:bg-[var(--color-accent)] hover:text-black text-[var(--color-accent)]"
                          : "bg-[var(--color-surface)] text-[var(--color-text-dim)] cursor-not-allowed opacity-50"
                      }`}
                    >
                      {isSyncing ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Zap className="w-3 h-3" />
                      )}
                      <span className="text-[10px] font-medium">
                        {isConnected ? "SYNC" : "OFFLINE"}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[var(--color-surface)] border-[var(--color-text-dim)] text-[var(--color-text-primary)]">
                    <p className="text-xs">
                      {isConnected
                        ? "Sync project settings with Ableton Live (auto-syncs every 5s)"
                        : "Ableton Live is not detected. Make sure it's running."}
                    </p>
                  </TooltipContent>
                </Tooltip>
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
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--color-surface)',
              border: '1px solid var(--color-text-dim)',
              color: 'var(--color-text-primary)',
              marginTop: '40px',
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
