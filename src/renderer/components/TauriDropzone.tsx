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
    console.log('🚀 TauriDropzone mounted, setting up listener...');
    
    let unlisten: (() => void) | null = null;
    
    const setupListener = async () => {
      try {
        console.log('Setting up onDragDropEvent listener...');
        
        const webview = getCurrentWebview();
        
        unlisten = await webview.onDragDropEvent((event) => {
          console.log('📦 Drag/Drop event:', event);
          
          if (event.payload.type === 'over') {
            console.log('Files hovering at position:', event.payload.position);
            setIsDragging(true);
          } else if (event.payload.type === 'drop') {
            console.log('Files dropped!', event.payload.paths);
            setIsDragging(false);
            
            // Handle the first dropped file
            if (event.payload.paths && event.payload.paths.length > 0) {
              const filePath = event.payload.paths[0];
              console.log('First file path:', filePath);
              
              // Check if it's an audio file by extension
              if (filePath.match(/\.(mp3|wav|m4a|aiff|flac|ogg|aac)$/i)) {
                console.log('Audio file detected!');
                // Create a pseudo-file with the path
                const fileName = filePath.split('/').pop() || 'audio.mp3';
                const pseudoFile = new File([], fileName);
                // Add the path as a custom property
                (pseudoFile as any).path = filePath;
                onFileDrop(pseudoFile);
              } else {
                console.log('Not an audio file, but got:', filePath);
                // For debugging, accept any file
                const fileName = filePath.split('/').pop() || 'file';
                const pseudoFile = new File([], fileName);
                (pseudoFile as any).path = filePath;
                onFileDrop(pseudoFile);
              }
            }
          } else {
            console.log('Drop cancelled');
            setIsDragging(false);
          }
        });
        
        console.log('✅ onDragDropEvent listener set up successfully');
        
      } catch (error) {
        console.error('❌ Error setting up drag drop listener:', error);
      }
    };
    
    setupListener();

    return () => {
      if (unlisten) {
        console.log('Cleaning up drag drop listener');
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