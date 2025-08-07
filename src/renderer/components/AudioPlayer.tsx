import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string;
  localFilePath?: string;
  prompt: string;
  duration: number;
}

export function AudioPlayer({ audioUrl, localFilePath, prompt, duration }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
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

  return (
    <div className="inline-flex items-center gap-3 bg-[var(--color-surface)] border border-[var(--color-text-dim)] rounded px-3 py-2">
      <audio ref={audioRef} src={audioUrl} />
      
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
        onClick={handleDownload}
        className="w-8 h-8 hover:bg-[var(--color-surface)] rounded flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
      >
        <Download size={14} />
      </button>
    </div>
  );
}