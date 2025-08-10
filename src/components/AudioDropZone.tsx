import React, { useCallback, useState } from 'react';
import { Upload, Music, AlertCircle, FileAudio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioDropZoneProps {
  onFileSelect: (file: File) => void;
  isAnalyzing?: boolean;
}

export function AudioDropZone({ onFileSelect, isAnalyzing = false }: AudioDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): boolean => {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/flac'];
    const validExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.mp4'];
    
    const hasValidType = validTypes.includes(file.type) || file.type.startsWith('audio/');
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!hasValidType && !hasValidExtension) {
      setError('Please select a valid audio file (MP3, WAV, M4A, AAC, OGG, FLAC)');
      return false;
    }
    
    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      setError('File size must be less than 50MB');
      return false;
    }
    
    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);

    const files = Array.from(e.dataTransfer.files);
    const audioFile = files.find(file => file.type.startsWith('audio/') || 
      ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'].some(ext => 
        file.name.toLowerCase().endsWith(ext)
      )
    );

    if (audioFile && validateFile(audioFile)) {
      onFileSelect(audioFile);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  return (
    <div className="relative">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative rounded-lg border-2 border-dashed transition-all duration-200
          ${isDragging 
            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10' 
            : 'border-[var(--color-text-dim)] hover:border-[var(--color-accent)]/50'
          }
          ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <label 
          htmlFor="audio-upload" 
          className="block cursor-pointer p-8"
        >
          <input
            id="audio-upload"
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
            onChange={handleFileInput}
            className="hidden"
            disabled={isAnalyzing}
          />
          
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="relative">
              <motion.div
                animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {isAnalyzing ? (
                  <div className="w-12 h-12 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="p-3 rounded-full bg-[var(--color-surface)] border border-[var(--color-text-dim)]">
                    {isDragging ? (
                      <FileAudio className="w-6 h-6 text-[var(--color-accent)]" />
                    ) : (
                      <Upload className="w-6 h-6 text-[var(--color-text-secondary)]" />
                    )}
                  </div>
                )}
              </motion.div>
            </div>
            
            <div className="text-center">
              <p className="text-sm font-mono text-[var(--color-text-primary)]">
                {isAnalyzing ? 'ANALYZING...' : 'DROP AUDIO FILE HERE'}
              </p>
              <p className="text-xs font-mono text-[var(--color-text-dim)] mt-1">
                OR CLICK TO BROWSE
              </p>
              <p className="text-xs font-mono text-[var(--color-text-dim)] mt-2">
                MP3, WAV, M4A, AAC, OGG, FLAC (MAX 50MB)
              </p>
            </div>
          </div>
        </label>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 p-3 bg-red-900/20 border border-red-500/50 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-xs font-mono text-red-400">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}