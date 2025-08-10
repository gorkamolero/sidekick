import React, { useState } from "react";
import { Terminal, Send } from "lucide-react";
import { useStore } from "../lib/store";
import { useAgent } from "../hooks/useAgent";
import { AudioDropZone } from "./AudioDropZone";
import { GenerationMode } from "./GenerationPanel/ModeSelector";
import { ExpandableModeSelector } from "./GenerationPanel/ExpandableModeSelector";
import { ProjectInfoDisplay } from "./GenerationPanel/ProjectInfoDisplay";
import { PromptInput } from "./GenerationPanel/PromptInput";
import { ExecuteButton } from "./GenerationPanel/ExecuteButton";
import { getModeInstructions } from "./GenerationPanel/modeInstructions";

export function GenerationPanel() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<GenerationMode>("loop");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [savedFilePath, setSavedFilePath] = useState<string | null>(null);
  const { currentProject, updateProject, linkState } = useStore();
  const { sendMessage, isProcessing, cancelMessage } = useAgent();

  const handleSubmit = async () => {
    const message = prompt.trim();
    if (!message || isProcessing) return;

    setPrompt("");

    // Pass file info through metadata instead of in message text
    const metadata: any = { mode };
    if (attachedFile && savedFilePath) {
      metadata.audioFile = {
        name: attachedFile.name,
        path: savedFilePath,
      };
      
      // Clear file immediately after capturing it in metadata
      setAttachedFile(null);
      setSavedFilePath(null);
    }

    await sendMessage(message, metadata);
  };

  const handleAudioFile = async (file: File) => {
    setIsAnalyzing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const savedPath = await (window as any).electron?.saveAudioFile(
        arrayBuffer,
        file.name,
      );

      // Store the file and path for later use - NO automatic analysis
      setAttachedFile(file);
      setSavedFilePath(savedPath);
    } catch (error) {
      console.error("Failed to process audio file:", error);
      // Still attach the file even if save fails
      setAttachedFile(file);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileRemove = () => {
    setAttachedFile(null);
    setSavedFilePath(null);
  };

  return (
    <div>
      <div className="p-3">
        <div className="relative">
          <PromptInput
            prompt={prompt}
            onPromptChange={setPrompt}
            onSubmit={handleSubmit}
            isProcessing={isProcessing}
            onFileSelect={handleAudioFile}
            isAnalyzing={isAnalyzing}
            attachedFile={attachedFile}
            onFileRemove={handleFileRemove}
          />
          <div className="absolute right-2 bottom-4 flex items-center gap-1.5">
            <ExpandableModeSelector mode={mode} onModeChange={setMode} />
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isProcessing}
              className="p-1.5 rounded hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send message"
            >
              <Send className="w-4 h-4 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export type { GenerationMode };
