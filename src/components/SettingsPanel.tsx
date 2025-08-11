import React, { useState } from 'react';
import { Settings, Music2, Palette, Wrench, Book } from 'lucide-react';
import { MusicServiceSelector } from './MusicServiceSelector';
import { ThemeSelector } from './ThemeSelector';

export function SettingsPanel() {
  const [activeTab, setActiveTab] = useState<'setup' | 'config'>('config');

  const resetSetup = () => {
    localStorage.removeItem('setupComplete');
    localStorage.removeItem('envConfigured');
    window.location.reload();
  };

  return (
    <div className="flex-1 overflow-y-auto min-h-0 bg-[var(--color-void)]">
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-[var(--color-accent)]" />
            <h2 className="text-xs text-[var(--color-text-secondary)] uppercase tracking-[0.2em]">
              SETTINGS
            </h2>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('setup')}
              className={`px-4 py-2 text-xs rounded transition-colors ${
                activeTab === 'setup'
                  ? 'bg-[var(--color-accent)] text-black'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]'
              }`}
            >
              <Wrench className="w-3 h-3 inline mr-1" />
              SETUP GUIDE
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`px-4 py-2 text-xs rounded transition-colors ${
                activeTab === 'config'
                  ? 'bg-[var(--color-accent)] text-black'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]'
              }`}
            >
              <Settings className="w-3 h-3 inline mr-1" />
              CONFIGURATION
            </button>
          </div>
        </div>

        {activeTab === 'setup' ? (
          <div>Setup content removed</div>
        ) : (
          <>
            <div>
          <div className="flex items-center gap-2 mb-3">
            <Music2 className="w-4 h-4 text-[var(--color-accent)]" />
            <h3 className="text-xs text-[var(--color-text-secondary)] uppercase tracking-[0.2em]">
              DAW INTEGRATION
            </h3>
          </div>
          <div>Ableton OSC setup moved to first-time setup</div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Music2 className="w-4 h-4 text-[var(--color-accent)]" />
            <h3 className="text-xs text-[var(--color-text-secondary)] uppercase tracking-[0.2em]">
              MUSIC GENERATION
            </h3>
          </div>
          <MusicServiceSelector />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-[var(--color-accent)]" />
            <h3 className="text-xs text-[var(--color-text-secondary)] uppercase tracking-[0.2em]">
              APPEARANCE
            </h3>
          </div>
          <ThemeSelector />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="w-4 h-4 text-[var(--color-accent)]" />
            <h3 className="text-xs text-[var(--color-text-secondary)] uppercase tracking-[0.2em]">
              DEVELOPER OPTIONS
            </h3>
          </div>
          <div className="p-4 bg-black/20 rounded-lg border border-white/10">
            <button
              onClick={resetSetup}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm transition-colors"
            >
              Reset First-Time Setup
            </button>
            <p className="text-xs text-gray-500 mt-2">
              This will show the setup guide again on next launch
            </p>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}