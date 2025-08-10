import React, { useState, useEffect } from 'react';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { Upload } from 'lucide-react';

interface TauriDropzoneProps {
  children: React.ReactNode;
  onFileDrop: (file: File) => void;
}

export function TauriDropzone({ children, onFileDrop }: TauriDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    
    const setupListener = async () => {
      try {
        const webview = getCurrentWebview();
        
        unlisten = await webview.onDragDropEvent((event) => {
          if (event.payload.type === 'over') {
            setIsDragging(true);
          } else if (event.payload.type === 'drop') {
            setIsDragging(false);
            
            if (event.payload.paths && event.payload.paths.length > 0) {
              const filePath = event.payload.paths[0];
              
              if (filePath.match(/\.(mp3|wav|m4a|aiff|flac|ogg|aac)$/i)) {
                const fileName = filePath.split('/').pop() || 'audio.mp3';
                const pseudoFile = new File([], fileName);
                (pseudoFile as any).path = filePath;
                onFileDrop(pseudoFile);
              } else {
                const fileName = filePath.split('/').pop() || 'file';
                const pseudoFile = new File([], fileName);
                (pseudoFile as any).path = filePath;
                onFileDrop(pseudoFile);
              }
            }
          } else {
            setIsDragging(false);
          }
        });
      } catch (error) {
        console.error('Error setting up drag drop listener:', error);
      }
    };
    
    setupListener();

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      {children}
      
      {isDragging && (
        <div className="absolute inset-0 z-50 pointer-events-none">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="absolute inset-4 border-2 border-dashed border-[var(--color-accent)]/50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Upload className="w-12 h-12 text-[var(--color-accent)]/80 mx-auto mb-3" />
              <p className="text-lg font-medium text-white/90 mb-1">
                Drop your audio file here
              </p>
              <p className="text-xs text-white/60">
                We'll analyze it and help you create something amazing
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}