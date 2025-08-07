import React from 'react';
import { Music, Zap, Hash, Clock, Mic, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

interface AudioAnalysisResult {
  fileName?: string;
  bpm: number;
  key: string;
  instruments: Array<{ label: string; confidence: number }>;
  style: string[];
  energy: number;
  valence: number;
  danceability: number;
  loudness: number;
  spectralCentroid: number;
}

interface AudioAnalysisDisplayProps {
  analysis: AudioAnalysisResult;
  onUseInGeneration?: (analysis: AudioAnalysisResult) => void;
}

export function AudioAnalysisDisplay({ analysis, onUseInGeneration }: AudioAnalysisDisplayProps) {
  const formatPercentage = (value: number) => Math.round(value * 100);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--color-surface)] border border-[var(--color-text-dim)] rounded-lg p-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-[var(--color-accent)]" />
          <h3 className="text-sm font-mono uppercase tracking-wider text-[var(--color-text-primary)]">
            AUDIO ANALYSIS
          </h3>
        </div>
        {analysis.fileName && (
          <span className="text-xs text-[var(--color-text-dim)] font-mono">
            {analysis.fileName}
          </span>
        )}
      </div>

      {/* Core Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-[var(--color-text-dim)]" />
            <span className="text-xs text-[var(--color-text-dim)] uppercase">BPM</span>
          </div>
          <div className="text-lg font-mono text-[var(--color-accent)]">
            {Math.round(analysis.bpm)}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Hash className="w-3 h-3 text-[var(--color-text-dim)]" />
            <span className="text-xs text-[var(--color-text-dim)] uppercase">KEY</span>
          </div>
          <div className="text-lg font-mono text-[var(--color-accent)]">
            {analysis.key}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-[var(--color-text-dim)]" />
            <span className="text-xs text-[var(--color-text-dim)] uppercase">ENERGY</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-lg font-mono text-[var(--color-accent)]">
              {formatPercentage(analysis.energy)}%
            </div>
            <div className="flex-1 h-1 bg-[var(--color-void)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[var(--color-accent)] transition-all duration-500"
                style={{ width: `${formatPercentage(analysis.energy)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Style Tags */}
      {analysis.style.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Tag className="w-3 h-3 text-[var(--color-text-dim)]" />
            <span className="text-xs text-[var(--color-text-dim)] uppercase">STYLE</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.style.map((style, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs font-mono bg-[var(--color-void)] text-[var(--color-text-secondary)] rounded"
              >
                {style}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Instruments */}
      {analysis.instruments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Mic className="w-3 h-3 text-[var(--color-text-dim)]" />
            <span className="text-xs text-[var(--color-text-dim)] uppercase">INSTRUMENTS</span>
          </div>
          <div className="space-y-1">
            {analysis.instruments.map((instrument, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-xs font-mono text-[var(--color-text-secondary)]">
                  {instrument.label}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1 bg-[var(--color-void)] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[var(--color-accent)] opacity-60 transition-all duration-500"
                      style={{ width: `${formatPercentage(instrument.confidence)}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-[var(--color-text-dim)]">
                    {formatPercentage(instrument.confidence)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Metrics */}
      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[var(--color-text-dim)]">
        <div className="text-center">
          <div className="text-xs text-[var(--color-text-dim)] uppercase mb-1">DANCE</div>
          <div className="text-sm font-mono text-[var(--color-text-secondary)]">
            {formatPercentage(analysis.danceability)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-[var(--color-text-dim)] uppercase mb-1">MOOD</div>
          <div className="text-sm font-mono text-[var(--color-text-secondary)]">
            {formatPercentage(analysis.valence)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-[var(--color-text-dim)] uppercase mb-1">LOUD</div>
          <div className="text-sm font-mono text-[var(--color-text-secondary)]">
            {Math.round(analysis.loudness)}dB
          </div>
        </div>
      </div>

      {/* Action Button */}
      {onUseInGeneration && (
        <button
          onClick={() => onUseInGeneration(analysis)}
          className="w-full py-2 px-3 bg-[var(--color-void)] hover:bg-[var(--color-accent)] 
                   text-[var(--color-text-secondary)] hover:text-black text-xs font-mono 
                   uppercase tracking-wider transition-all duration-200 rounded"
        >
          USE FOR GENERATION →
        </button>
      )}
    </motion.div>
  );
}