import React, { useState, useEffect } from 'react';
import { ChordResult, ChordProgression as ChordProgressionType, chordDetectionService } from '../services/chordDetection';

interface ChordProgressionProps {
  audioUrl?: string;
  currentTime?: number;
  isVisible?: boolean;
}

export const ChordProgression: React.FC<ChordProgressionProps> = ({
  audioUrl,
  currentTime = 0,
  isVisible = true
}) => {
  const [progression, setProgression] = useState<ChordProgressionType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentChordIndex, setCurrentChordIndex] = useState(0);

  useEffect(() => {
    if (audioUrl) {
      analyzeAudio(audioUrl);
    }
  }, [audioUrl]);

  useEffect(() => {
    if (progression?.chords) {
      updateCurrentChord();
    }
  }, [currentTime, progression]);

  const analyzeAudio = async (url: string) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await chordDetectionService.analyzeFile(url);
      setProgression(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      console.error('Chord analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateCurrentChord = () => {
    if (!progression?.chords) return;

    const chords = progression.chords;
    let index = 0;

    for (let i = 0; i < chords.length - 1; i++) {
      if (currentTime >= chords[i].timestamp && currentTime < chords[i + 1].timestamp) {
        index = i;
        break;
      }
    }

    if (currentTime >= chords[chords.length - 1]?.timestamp) {
      index = chords.length - 1;
    }

    setCurrentChordIndex(index);
  };

  const formatChordName = (chord: string): string => {
    return chord.replace(/([A-G])(#|b)?(.*)/, (match, note, accidental = '', quality) => {
      const formattedNote = note + (accidental || '');
      const formattedQuality = quality.replace('maj', '').replace('min', 'm');
      return formattedNote + formattedQuality;
    });
  };

  const getChordColor = (chord: string): string => {
    const note = chord.charAt(0);
    const colors: Record<string, string> = {
      'C': 'bg-red-100 text-red-800 border-red-200',
      'D': 'bg-orange-100 text-orange-800 border-orange-200',
      'E': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'F': 'bg-green-100 text-green-800 border-green-200',
      'G': 'bg-blue-100 text-blue-800 border-blue-200',
      'A': 'bg-purple-100 text-purple-800 border-purple-200',
      'B': 'bg-pink-100 text-pink-800 border-pink-200'
    };
    return colors[note] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Chord Progression</h3>
        {isAnalyzing && (
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-sm">Analyzing...</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {progression && (
        <div className="space-y-4">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            {progression.key && (
              <div>
                <span className="font-medium">Key:</span> {progression.key}
              </div>
            )}
            {progression.tempo && (
              <div>
                <span className="font-medium">Tempo:</span> {progression.tempo} BPM
              </div>
            )}
            <div>
              <span className="font-medium">Chords:</span> {progression.chords.length}
            </div>
          </div>

          {progression.chords.length > 0 && (
            <>
              <div className="bg-gray-50 rounded-md p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-gray-700">Current Chord:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getChordColor(progression.chords[currentChordIndex]?.chord || '')}`}>
                    {formatChordName(progression.chords[currentChordIndex]?.chord || 'N/A')}
                  </span>
                  <span className="text-xs text-gray-500">
                    at {formatTime(progression.chords[currentChordIndex]?.timestamp || 0)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${((currentChordIndex + 1) / progression.chords.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto">
                <div className="grid grid-cols-1 gap-2">
                  {progression.chords.map((chord, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-2 rounded border transition-colors ${
                        index === currentChordIndex 
                          ? 'bg-blue-50 border-blue-200 shadow-sm' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded text-sm font-medium border ${getChordColor(chord.chord)}`}>
                          {formatChordName(chord.chord)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(chord.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-12 bg-gray-200 rounded-full h-1">
                          <div 
                            className="bg-green-500 h-1 rounded-full"
                            style={{ width: `${chord.confidence * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {Math.round(chord.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {!progression && !isAnalyzing && !error && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">Load an audio file to analyze its chord progression</p>
        </div>
      )}
    </div>
  );
};