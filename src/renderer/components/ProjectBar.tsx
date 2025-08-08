import React from "react";
import { useStore } from "../lib/store";
import { MusicServiceSelector } from "./MusicServiceSelector";
import { ThemeSelector } from "./ThemeSelector";
import { Archive } from "lucide-react";

export function ProjectBar() {
  const { currentProject, updateProject, activeView, setActiveView, setProject } = useStore();

  // Initialize with defaults if no project
  const project = currentProject || { bpm: 120, key: 'C', timeSignature: '4/4' };
  
  // If there's no project, create one with defaults
  if (!currentProject) {
    setProject(project);
  }

  return (
    <div className="border-b border-[var(--color-text-dim)] px-3 py-1.5 flex justify-between text-[11px]">
      {/* Project info on the left - compact box */}
      <div className="flex items-center bg-[var(--color-surface)] px-2 py-1 rounded">
        <span className="text-[var(--color-text-secondary)]">
          BPM:<input
            type="text"
            value={project.bpm || 120}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              if (value === '' || (parseInt(value) >= 60 && parseInt(value) <= 200)) {
                updateProject({ bpm: parseInt(value) || 120 });
              }
            }}
            className="bg-transparent text-[var(--color-accent)] w-8 text-center focus:outline-none"
          />
        </span>
        <span className="text-[var(--color-text-secondary)] ml-2">
          KEY:<select
            value={project.key || 'C'}
            onChange={(e) => updateProject({ key: e.target.value })}
            className="bg-transparent text-[var(--color-accent)] focus:outline-none appearance-none cursor-pointer"
          >
            {["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"].map((k) => (
              <option key={k} value={k} className="bg-[var(--color-surface)]">{k}</option>
            ))}
          </select>
        </span>
        <span className="text-[var(--color-text-secondary)] ml-2">
          SIG:<select
            value={project.timeSignature || '4/4'}
            onChange={(e) => updateProject({ timeSignature: e.target.value })}
            className="bg-transparent text-[var(--color-accent)] focus:outline-none appearance-none cursor-pointer"
          >
            {["4/4", "3/4", "6/8", "5/4", "7/8"].map((sig) => (
              <option key={sig} value={sig} className="bg-[var(--color-surface)]">{sig}</option>
            ))}
          </select>
        </span>
      </div>

      {/* Controls on the right - compact box */}
      <div className="flex items-center gap-2">
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