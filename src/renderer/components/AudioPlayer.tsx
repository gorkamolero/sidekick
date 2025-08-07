import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Repeat, GripVertical } from 'lucide-react';
import { Howl } from 'howler';

interface AudioPlayerProps {
  audioUrl: string;
  localFilePath?: string;
  prompt: string;
  duration: number;
}

export function AudioPlayer({ audioUrl, localFilePath, prompt, duration }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true); // Default to looping
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const howlRef = useRef<Howl | null>(null);
  const animationFrameRef = useRef<number>(0);
  
  // Update progress bar function
  const updateProgress = () => {
    if (howlRef.current && howlRef.current.playing()) {
      const seek = howlRef.current.seek() as number;
      setCurrentTime(seek);
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  };

  // Initialize Howler for seamless looping
  useEffect(() => {
    console.log('Initializing Howler with:', { audioUrl, duration });
    
    // Create new Howl instance
    const sound = new Howl({
      src: [audioUrl],
      loop: isLooping,
      html5: true, // Use HTML5 Audio for better streaming
      preload: true,
      onload: () => {
        console.log('Audio loaded successfully');
        // Don't auto-play
      },
      onplay: () => {
        console.log('Audio started playing');
        setIsPlaying(true);
        updateProgress();
      },
      onpause: () => {
        setIsPlaying(false);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      },
      onstop: () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      },
      onend: () => {
        if (!isLooping) {
          setIsPlaying(false);
          setCurrentTime(0);
        }
      },
      onloaderror: (id, error) => {
        console.error('Failed to load audio:', error);
      },
      onplayerror: (id, error) => {
        console.error('Failed to play audio:', error);
      }
    });

    howlRef.current = sound;

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (howlRef.current) {
        howlRef.current.unload();
      }
    };
  }, [audioUrl]); // Only recreate when audioUrl changes

  // Update loop setting
  useEffect(() => {
    if (howlRef.current) {
      howlRef.current.loop(isLooping);
      console.log('Loop setting updated:', isLooping);
    }
  }, [isLooping]);

  const togglePlayback = () => {
    if (!howlRef.current) return;

    if (isPlaying) {
      howlRef.current.pause();
    } else {
      howlRef.current.play();
    }
  };

  const toggleLoop = () => {
    setIsLooping(!isLooping);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `generated-loop-${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Use a ref to attach native ondragstart
  const dragRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const element = dragRef.current;
    if (!element) return;
    
    // Attach native ondragstart handler (not React's)
    element.ondragstart = (event) => {
      if (!localFilePath) {
        console.warn('No local file path available');
        return;
      }
      
      event.preventDefault(); // MUST prevent default for native drag
      console.log('🎵 Native drag started for:', localFilePath);
      
      // Call Electron's startDrag via IPC
      (window as any).electron.startDrag(localFilePath);
    };
    
    return () => {
      if (element) {
        element.ondragstart = null;
      }
    };
  }, [localFilePath]);

  return (
    <div 
      ref={dragRef}
      className="inline-flex items-center gap-3 bg-[var(--color-surface)] border border-[var(--color-text-dim)] rounded px-3 py-2 transition-all hover:border-[var(--color-accent)] cursor-move"
      draggable={true}
      title="Drag to Ableton Live"
    >
      <GripVertical size={14} className="text-[var(--color-text-dim)]" />
      
      <button
        onClick={togglePlayback}
        className="w-8 h-8 bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/80 rounded-full flex items-center justify-center text-black transition-colors"
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
      </button>

      <div className="w-32">
        <div className="bg-[var(--color-void)] h-1 rounded-full">
          <div 
            className="bg-[var(--color-accent)] h-1 rounded-full transition-all duration-100"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
      </div>
      
      <span className="text-xs text-[var(--color-text-secondary)] font-mono">
        {formatTime(currentTime)}/{formatTime(duration)}
      </span>

      <button
        onClick={toggleLoop}
        className={`w-8 h-8 hover:bg-[var(--color-surface)] rounded flex items-center justify-center transition-colors ${
          isLooping 
            ? 'text-[var(--color-accent)]' 
            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]'
        }`}
        title={isLooping ? 'Loop enabled' : 'Loop disabled'}
      >
        <Repeat size={14} />
      </button>

      <button
        onClick={handleDownload}
        className="w-8 h-8 hover:bg-[var(--color-surface)] rounded flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
        title="Download"
      >
        <Download size={14} />
      </button>
    </div>
  );
}