import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileInput } from '../ui/file-input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '../ui/card';
import { ApiKeyInput } from './ApiKeyInput';
import { TranscriptionProgress } from './TranscriptionProgress';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useProgressTracking } from '../../hooks/useProgressTracking';

interface UploadFormProps {
  onTranscriptionComplete: (data: {
    transcription: string;
    petitResume?: string;
    grosResume?: string;
  }) => void;
}

export function UploadForm({ onTranscriptionComplete }: UploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [enableSummary, setEnableSummary] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiInput, setShowApiInput] = useState<boolean>(false);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);

  const { 
    progress, 
    estimatedTimeRemaining, 
    updateProgress, 
    resetProgress 
  } = useProgressTracking();

  const { 
    setupWebSocket, 
    closeWebSocket 
  } = useWebSocket({
    onDurationUpdate: setAudioDuration,
    onProgress: updateProgress
  });

  // Clean up when loading state changes
  useEffect(() => {
    if (!loading) {
      resetProgress();
    }
  }, [loading]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setSelectedFile(event.target.files[0]);
      setError('');
      resetProgress();
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an audio file.');
      return;
    }
    if (enableSummary && !apiKey) {
      setError('Please enter an OpenAI API key for summarization.');
      return;
    }

    setError('');
    setLoading(true);
    resetProgress();

    const clientId = `client_${Date.now()}`;

    try {
      // First establish WebSocket connection
      await setupWebSocket(clientId);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('enable_summary', String(enableSummary));
      formData.append('client_id', clientId);
      if (enableSummary) {
        formData.append('api_key', apiKey);
      }

      const response = await fetch('http://localhost:8000/transcribe/', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to process the audio file.');
      }

      const data = await response.json();
      onTranscriptionComplete({
        transcription: data.transcription,
        petitResume: data.petitResume,
        grosResume: data.grosResume
      });

      // Wait a bit before closing the WebSocket to ensure all progress updates are received
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to process the audio file.');
    } finally {
      setLoading(false);
      closeWebSocket();
    }
  };

  return (
    <Card className="max-w-2xl mx-auto backdrop-blur-sm bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Audio Transcription</CardTitle>
        <CardDescription>Upload your audio file and let AI transform it into clear, concise notes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <FileInput 
            accept="audio/*" 
            onChange={handleFileChange}
            error={error}
            label="Supported formats: MP3, WAV, M4A"
          />

          <div className="flex flex-col space-y-1.5">
            <div className="flex items-center space-x-2">
              <Switch
                id="enable-summary"
                checked={enableSummary}
                onCheckedChange={(checked: boolean) => {
                  setEnableSummary(checked);
                  if (checked) {
                    setShowApiInput(true);
                  }
                }}
              />
              <Label htmlFor="enable-summary" className="text-sm">
                Enable AI Summarization
              </Label>
            </div>
          </div>

          {showApiInput && (
            <ApiKeyInput
              apiKey={apiKey}
              onApiKeyChange={setApiKey}
            />
          )}

          {loading && (
            <TranscriptionProgress
              progress={progress}
              audioDuration={audioDuration}
              estimatedTimeRemaining={estimatedTimeRemaining}
            />
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleUpload} 
          disabled={loading || !selectedFile}
          className="w-full"
        >
          {loading ? (
            <>
              <motion.div
                className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              />
              Processing...
            </>
          ) : (
            'Upload & Transcribe'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
