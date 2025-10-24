import { useState, useRef, useCallback } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';

interface MicButtonProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  disabled?: boolean;
  className?: string;
}

export function MicButton({
  onRecordingComplete,
  onRecordingStart,
  onRecordingStop,
  disabled = false,
  className = ''
}: MicButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        setIsProcessing(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      onRecordingStart?.();
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Microphone access denied');
      setIsRecording(false);
    }
  }, [onRecordingComplete, onRecordingStart]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      setIsProcessing(true);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      onRecordingStop?.();
    }
  }, [isRecording, onRecordingStop]);

  const handleClick = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <button
        onClick={handleClick}
        disabled={disabled || isProcessing}
        className={`
          relative w-20 h-20 rounded-full flex items-center justify-center
          transition-all duration-300 shadow-lg
          ${isRecording
            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
            : 'bg-blue-600 hover:bg-blue-700'
          }
          ${(disabled || isProcessing) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isProcessing ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        ) : isRecording ? (
          <Square className="w-8 h-8 text-white" />
        ) : (
          <Mic className="w-8 h-8 text-white" />
        )}

        {isRecording && (
          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-600 rounded-full animate-ping" />
        )}
      </button>

      <div className="text-center">
        {isProcessing ? (
          <p className="text-sm text-gray-600">Processing...</p>
        ) : isRecording ? (
          <p className="text-sm text-red-600 font-medium">Recording... Click to stop</p>
        ) : (
          <p className="text-sm text-gray-600">Click to record</p>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}
