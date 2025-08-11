import React from "react";
import { useStore } from "../lib/store";
import { MusicServiceSelector } from "./MusicServiceSelector";
import { ThemeSelector } from "./ThemeSelector";
import { Archive, RefreshCw, Zap } from "lucide-react";
import { useAbleton } from "../hooks/useAbleton";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ProjectBar() {
  const {
    currentProject,
    updateProject,
    activeView,
    setActiveView,
    setProject,
  } = useStore();
  
  const { isConnected, isSyncing, syncWithAbleton } = useAbleton();

  const handleSync = async () => {
    const success = await syncWithAbleton();
    if (!success) {
      toast.error("Failed to sync", {
        description: "Could not connect to Ableton Live",
      });
    }
  };

  // Initialize with defaults if no project
  const project = currentProject || {
    bpm: 120,
    key: "C",
    timeSignature: "4/4",
  };

  // If there's no project, create one with defaults
  if (!currentProject) {
    setProject(project);
  }

  return (
    <div className="border-b border-[var(--color-text-dim)] px-3 py-1.5 flex justify-between text-[11px]">
      {/* Project info on the left - separate boxes with gaps */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center bg-[var(--color-surface)] px-2 py-1 rounded whitespace-nowrap">
          <span className="text-[var(--color-text-secondary)]">
            BPM:
            <input
              type="text"
              value={project.bpm || 120}
              onChange={(e) => {
                const rawValue = e.target.value;
                // Allow empty string for typing
                if (rawValue === "") {
                  updateProject({ bpm: 0 });
                  return;
                }
                // Only allow digits
                const value = rawValue.replace(/\D/g, "");
                const numValue = parseInt(value);
                if (!isNaN(numValue)) {
                  // Allow any value while typing, but clamp on blur
                  updateProject({ bpm: numValue });
                }
              }}
              onBlur={(e) => {
                // Clamp value on blur
                const value = parseInt(e.target.value) || 120;
                const clampedValue = Math.min(Math.max(value, 60), 200);
                updateProject({ bpm: clampedValue });
              }}
              className="bg-transparent text-[var(--color-accent)] w-8 text-center focus:outline-none"
            />
          </span>
        </div>
        
        <div className="flex items-center justify-center bg-[var(--color-surface)] px-2 py-1 rounded whitespace-nowrap">
          <span className="text-[var(--color-text-secondary)]">
            KEY:
            <select
              value={project.key || "C"}
              onChange={(e) => updateProject({ key: e.target.value })}
              className="bg-transparent text-[var(--color-accent)] focus:outline-none appearance-none cursor-pointer w-4"
            >
              <optgroup label="Major">
                {[
                  "C",
                  "C#",
                  "D",
                  "D#",
                  "E",
                  "F",
                  "F#",
                  "G",
                  "G#",
                  "A",
                  "A#",
                  "B",
                ].map((k) => (
                  <option key={k} value={k} className="bg-[var(--color-surface)]">
                    {k}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Minor">
                {[
                  "Cm",
                  "C#m",
                  "Dm",
                  "D#m",
                  "Em",
                  "Fm",
                  "F#m",
                  "Gm",
                  "G#m",
                  "Am",
                  "A#m",
                  "Bm",
                ].map((k) => (
                  <option key={k} value={k} className="bg-[var(--color-surface)]">
                    {k}
                  </option>
                ))}
              </optgroup>
            </select>
          </span>
        </div>
        
        <div className="flex items-center justify-center bg-[var(--color-surface)] px-2 py-1 rounded whitespace-nowrap">
          <span className="text-[var(--color-text-secondary)]">
            SIG:
            <select
              value={project.timeSignature || "4/4"}
              onChange={(e) => updateProject({ timeSignature: e.target.value })}
              className="bg-transparent text-[var(--color-accent)] focus:outline-none appearance-none cursor-pointer"
            >
              {["4/4", "3/4", "6/8", "5/4", "7/8"].map((sig) => (
                <option
                  key={sig}
                  value={sig}
                  className="bg-[var(--color-surface)]"
                >
                  {sig}
                </option>
              ))}
            </select>
          </span>
        </div>
      </div>

      {/* Controls on the right - compact box */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleSync}
              disabled={!isConnected || isSyncing}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-all duration-200 ${
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
        <MusicServiceSelector />
        <ThemeSelector />
        <button
          onClick={() =>
            setActiveView(activeView === "history" ? "chat" : "history")
          }
          className={`p-1 rounded transition-all duration-200 ${
            activeView === "history"
              ? "bg-[var(--color-accent)] text-black"
              : "hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)]"
          }`}
          title="View History"
        >
          <Archive className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
