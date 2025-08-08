import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Repeat, GripVertical } from 'lucide-react';
import { Howl } from 'howler';
import { domToPng } from 'modern-screenshot';

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
    
    const handleDragStart = async (event: DragEvent) => {
      if (!localFilePath) {
        return;
      }
      
      event.preventDefault();
      setIsDragging(true);
      
      if (dragRef.current && window.electron && window.electron.startDrag) {
        try {
          const dataUrl = await domToPng(dragRef.current, {
            scale: 2,
            backgroundColor: 'transparent'
          });
          window.electron.startDrag(localFilePath, dataUrl);
        } catch (err) {
          window.electron.startDrag(localFilePath);
        }
      } else if (window.electron && window.electron.startDrag) {
        window.electron.startDrag(localFilePath);
      }
    };
    
    element.addEventListener('dragstart', handleDragStart);
    element.addEventListener('dragend', () => setIsDragging(false));
    
    return () => {
      if (element) {
        element.removeEventListener('dragstart', handleDragStart);
        element.removeEventListener('dragend', () => setIsDragging(false));
      }
    };
  }, [localFilePath]);

  return (
    <div 
      ref={dragRef}
      className="flex items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-text-dim)] rounded px-2 py-1.5 transition-all hover:border-[var(--color-accent)] cursor-move w-full max-w-full"
      draggable={true}
      title="Drag to Ableton Live"
    >
      <GripVertical size={12} className="text-[var(--color-text-dim)] flex-shrink-0" />
      
      <button
        onClick={togglePlayback}
        className="w-6 h-6 bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/80 rounded-full flex items-center justify-center text-black transition-colors flex-shrink-0"
      >
        {isPlaying ? <Pause size={12} /> : <Play size={12} />}
      </button>

      <div className="flex-1 min-w-0 max-w-[120px]">
        <div className="bg-[var(--color-void)] h-1 rounded-full">
          <div 
            className="bg-[var(--color-accent)] h-1 rounded-full transition-all duration-100"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
      </div>
      
      <span className="text-[10px] text-[var(--color-text-secondary)] font-mono flex-shrink-0">
        {formatTime(currentTime)}/{formatTime(duration)}
      </span>

      <button
        onClick={toggleLoop}
        className={`w-6 h-6 hover:bg-[var(--color-surface)] rounded flex items-center justify-center transition-colors flex-shrink-0 ${
          isLooping 
            ? 'text-[var(--color-accent)]' 
            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]'
        }`}
        title={isLooping ? 'Loop enabled' : 'Loop disabled'}
      >
        <Repeat size={12} />
      </button>

      <button
        onClick={handleDownload}
        className="w-6 h-6 hover:bg-[var(--color-surface)] rounded flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors flex-shrink-0"
        title="Download"
      >
        <Download size={12} />
      </button>
    </div>
  );
}