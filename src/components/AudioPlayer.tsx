import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerProps {
  audioBase64?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  className?: string;
}

export function AudioPlayer({
  audioBase64,
  autoPlay = false,
  onEnded,
  className = ''
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (!audioBase64 || !audioRef.current) return;

    const audio = audioRef.current;
    
    // Stop any ongoing playback before loading new audio
    const stopCurrentPlayback = async () => {
      if (playPromiseRef.current) {
        try {
          await playPromiseRef.current;
        } catch (err) {
          // Ignore errors from previous playback attempts
        }
      }
      
      if (!audio.paused) {
        audio.pause();
      }
      
      audio.currentTime = 0;
    };

    const loadAndPlay = async () => {
      await stopCurrentPlayback();
      
      const audioSrc = `data:audio/mp3;base64,${audioBase64}`;
      audio.src = audioSrc;

      if (autoPlay) {
        try {
          // Load the audio first
          await audio.load();
          
          // Start playback
          playPromiseRef.current = audio.play();
          await playPromiseRef.current;
          playPromiseRef.current = null;
        } catch (err) {
          // Only log non-abort errors
          if (err instanceof Error && err.name !== 'AbortError') {
            console.error('Audio playback failed:', err);
            setError('Audio playback failed');
          }
        }
      }
    };

    loadAndPlay();

    // Cleanup function
    return () => {
      if (playPromiseRef.current) {
        playPromiseRef.current.then(() => {
          if (audio && !audio.paused) {
            audio.pause();
          }
        }).catch(() => {
          // Ignore cleanup errors
        });
      }
    };
  }, [audioBase64, autoPlay]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };
    const handleError = () => {
      setError('Failed to load audio');
      setIsPlaying(false);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [onEnded]);

  if (error) {
    return (
      <div className={`flex items-center gap-2 text-red-600 ${className}`}>
        <VolumeX className="w-5 h-5" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <audio ref={audioRef} className="hidden" />
      {isPlaying && (
        <div className="flex items-center gap-2 text-blue-600">
          <Volume2 className="w-5 h-5 animate-pulse" />
          <span className="text-sm font-medium">Playing audio...</span>
        </div>
      )}
    </div>
  );
}
