import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { cn } from '../../lib/utils';

interface ExtractedProfile {
  fullName: string | null;
  age: number | null;
  searchLocation: string | null;
  mode: 'looking' | 'offering' | null;
  bio: string;
  lifestyleTags: string[];
}

interface VoiceRecorderProps {
  onProfileExtracted: (profile: ExtractedProfile, transcription: string) => void;
  onSkip: () => void;
}

type RecordingState = 'idle' | 'recording' | 'processing' | 'success' | 'error';

const GUIDED_PROMPT = "Tell me your name, age, where you're looking for housing, whether you're looking for or offering a sublet, and a bit about your lifestyle and personality.";

const MAX_RECORDING_TIME = 60; // seconds

export function VoiceRecorder({ onProfileExtracted, onSkip }: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [processingStep, setProcessingStep] = useState<string>('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setState('recording');
      setRecordingTime(0);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Create blob from chunks
        const audioBlob = new Blob(chunksRef.current, { 
          type: mediaRecorder.mimeType 
        });
        
        // Process the audio
        await processAudio(audioBlob);
      };

      mediaRecorder.start();

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_RECORDING_TIME - 1) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording:', err);
      setState('error');
      setError('Could not access microphone. Please allow microphone access and try again.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const processAudio = async (audioBlob: Blob) => {
    setState('processing');
    setProcessingStep('Uploading audio...');

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      setProcessingStep('Transcribing speech...');

      const response = await fetch('/api/voice-onboarding', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to process audio');
      }

      setProcessingStep('Profile extracted!');
      setState('success');

      // Short delay to show success state
      setTimeout(() => {
        onProfileExtracted(data.profile, data.transcription);
      }, 1000);

    } catch (err) {
      console.error('Failed to process audio:', err);
      setState('error');
      setError(err instanceof Error ? err.message : 'Failed to process audio. Please try again.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRetry = () => {
    setState('idle');
    setError(null);
    setRecordingTime(0);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Quick Voice Setup</h1>
        <p className="text-slate-400 text-sm max-w-xs">
          Tell us about yourself in under a minute and we'll fill out your profile automatically
        </p>
      </div>

      {/* Guided Prompt Card */}
      <Card variant="acrylic" className="w-full">
        <CardContent>
          <p className="text-slate-300 text-sm leading-relaxed">
            <span className="text-primary font-medium">Say something like:</span>
            <br />
            "{GUIDED_PROMPT}"
          </p>
        </CardContent>
      </Card>

      {/* Recording Interface */}
      <div className="flex flex-col items-center gap-4 py-4">
        {/* Microphone Button */}
        <button
          onClick={state === 'idle' ? startRecording : state === 'recording' ? stopRecording : undefined}
          disabled={state === 'processing' || state === 'success'}
          className={cn(
            'relative h-28 w-28 rounded-full flex items-center justify-center transition-all duration-300',
            state === 'idle' && 'bg-primary hover:bg-primary/90 hover:scale-105 active:scale-95',
            state === 'recording' && 'bg-red-500 animate-pulse',
            state === 'processing' && 'bg-white/10 cursor-not-allowed',
            state === 'success' && 'bg-green-500/20',
            state === 'error' && 'bg-red-500/20',
          )}
        >
          {state === 'idle' && (
            <Mic className="h-12 w-12 text-white" />
          )}
          {state === 'recording' && (
            <Square className="h-10 w-10 text-white" />
          )}
          {state === 'processing' && (
            <Loader2 className="h-10 w-10 text-white animate-spin" />
          )}
          {state === 'success' && (
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          )}
          {state === 'error' && (
            <AlertCircle className="h-12 w-12 text-red-500" />
          )}

          {/* Recording ring animation */}
          {state === 'recording' && (
            <>
              <span className="absolute inset-0 rounded-full border-4 border-red-500/50 animate-ping" />
              <span className="absolute inset-0 rounded-full border-2 border-red-400/30" />
            </>
          )}
        </button>

        {/* Status Text */}
        <div className="text-center h-16">
          {state === 'idle' && (
            <p className="text-slate-400">Tap to start recording</p>
          )}
          {state === 'recording' && (
            <div className="flex flex-col items-center gap-1">
              <p className="text-red-400 font-medium">Recording...</p>
              <p className="text-slate-400 text-sm">
                {formatTime(recordingTime)} / {formatTime(MAX_RECORDING_TIME)}
              </p>
              <p className="text-slate-500 text-xs">Tap to stop</p>
            </div>
          )}
          {state === 'processing' && (
            <p className="text-primary">{processingStep}</p>
          )}
          {state === 'success' && (
            <p className="text-green-400">Profile extracted successfully!</p>
          )}
          {state === 'error' && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-red-400 text-sm">{error}</p>
              <Button variant="secondary" size="sm" onClick={handleRetry}>
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Skip Option */}
      {(state === 'idle' || state === 'error') && (
        <Button variant="ghost" onClick={onSkip} className="text-slate-400">
          Skip and fill out manually
        </Button>
      )}
    </div>
  );
}
