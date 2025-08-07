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
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 max-w-md">
      <audio ref={audioRef} src={audioUrl} />
      
      <div className="mb-3">
        <h4 className="text-green-400 font-medium text-sm mb-1">Generated Loop</h4>
        <p className="text-gray-300 text-sm line-clamp-2">{prompt}</p>
        <p className="text-gray-500 text-xs mt-1">{duration}s duration</p>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={togglePlayback}
          className="w-10 h-10 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-colors"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <div className="flex-1">
          <div className="bg-gray-700 h-2 rounded-full">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-100"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <button
          onClick={handleDownload}
          className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center text-gray-300 transition-colors"
        >
          <Download size={14} />
        </button>
      </div>

      {localFilePath && (
        <p className="text-xs text-gray-500 mt-2">
          Saved to: {localFilePath.split('/').pop()}
        </p>
      )}
    </div>
  );
}