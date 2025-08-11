import React, { useState, useRef } from "react";
import { Terminal, Send } from "lucide-react";
import { useStore } from "../lib/store";
import { AudioDropZone } from "./AudioDropZone";
import { GenerationMode } from "./GenerationPanel/ModeSelector";
import { ExpandableModeSelector } from "./GenerationPanel/ExpandableModeSelector";
import { ProjectInfoDisplay } from "./GenerationPanel/ProjectInfoDisplay";
import { PromptInput } from "./GenerationPanel/PromptInput";
import { ExecuteButton } from "./GenerationPanel/ExecuteButton";
import { getModeInstructions } from "./GenerationPanel/modeInstructions";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import tauriAPI from "../lib/tauri-api";

interface GenerationPanelProps {
  sendMessage: (text: string, attachments?: any[]) => void;
  isProcessing: boolean;
  cancelMessage: () => void;
  messages?: any[];
}

export function GenerationPanel({ sendMessage, isProcessing, cancelMessage, messages = [] }: GenerationPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<GenerationMode>("loop");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [savedFilePath, setSavedFilePath] = useState<string | null>(null);
  const { currentProject, updateProject, linkState, attachedFile, setAttachedFile } = useStore();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    let message = prompt.trim();
    if (!message && !attachedFile) return;
    if (isProcessing) return;

    setPrompt("");

    // Prepare attachments if there's a file
    let attachments: any[] | undefined;
    if (attachedFile) {
      const filePath = (attachedFile as any).path || savedFilePath;
      console.log('🎵 File path being sent:', filePath);
      if (filePath) {
        // Create an attachment object with the file info
        attachments = [{
          name: attachedFile.name,
          url: filePath, // Use the file path as URL
          contentType: attachedFile.type || 'audio/*',
        }];
        console.log('🎵 Attachments array:', attachments);
        
        // If no message provided, just set a default
        if (!message) {
          message = "Analyze this audio";
        }
      }
      
      // Clear file immediately after capturing it
      setAttachedFile(null);
      setSavedFilePath(null);
    }

    sendMessage(message, attachments);
  };

  const handleAudioFile = async (file: File) => {
    setIsAnalyzing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const savedPath = await tauriAPI.saveAudioFile(
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
        {/* Quick suggestions - only show when no messages in conversation */}
        {!prompt && !attachedFile && !isProcessing && messages.length === 0 && (
          <Suggestions className="mb-2">
            <Suggestion 
              suggestion="Generate dark techno loop" 
              onClick={(text) => {
                setPrompt(text);
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
            />
            <Suggestion 
              suggestion="Analyze this audio" 
              onClick={(text) => {
                setPrompt(text);
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
            />
            <Suggestion 
              suggestion="Create ambient pad" 
              onClick={(text) => {
                setPrompt(text);
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
            />
            <Suggestion 
              suggestion="Make it more energetic" 
              onClick={(text) => {
                setPrompt(text);
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
            />
          </Suggestions>
        )}

        <div className="relative">
          <PromptInput
            ref={inputRef}
            prompt={prompt}
            onPromptChange={setPrompt}
            onSubmit={handleSubmit}
            isProcessing={isProcessing}
            onFileSelect={handleAudioFile}
            isAnalyzing={isAnalyzing}
            attachedFile={attachedFile}
            onFileRemove={handleFileRemove}
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
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

        <div className="mt-3 space-y-3">
          {currentProject ? (
            <ProjectInfoDisplay
              project={currentProject}
              onProjectUpdate={updateProject}
            />
          ) : (
            <div className="p-2 bg-[var(--color-surface)] rounded text-center">
              <p className="text-xs text-[var(--color-text-secondary)]">
                No Ableton project detected
              </p>
              <button className="mt-1 text-xs text-[var(--color-accent)] hover:underline">
                Connect to Ableton
              </button>
            </div>
          )}

          {linkState.isConnected && (
            <div className="p-2 bg-[var(--color-surface)] rounded flex items-center gap-2">
              <Terminal size={14} className="text-[var(--color-accent)]" />
              <span className="text-xs text-[var(--color-text-secondary)]">
                Ableton Link: {linkState.tempo?.toFixed(1)} BPM • Beat {linkState.beat}
              </span>
            </div>
          )}

          {isProcessing && (
            <ExecuteButton onClick={cancelMessage} />
          )}
        </div>
      </div>
    </div>
  );
}