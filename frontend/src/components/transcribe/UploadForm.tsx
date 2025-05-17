import { useState } from 'react'
import { FileInput } from '../ui/file-input'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Switch } from '../ui/switch'
import { Button } from '../ui/button'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '../ui/card'

interface UploadFormProps {
  onTranscriptionComplete: (data: {
    transcription: string;
    petitResume?: string;
    grosResume?: string;
  }) => void;
}

export function UploadForm({ onTranscriptionComplete }: UploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [enableSummary, setEnableSummary] = useState<boolean>(false)
  const [apiKey, setApiKey] = useState<string>('')
  const [showApiInput, setShowApiInput] = useState<boolean>(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setSelectedFile(event.target.files[0])
      setError('')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an audio file.')
      return
    }
    if (enableSummary && !apiKey) {
      setError('Please enter an OpenAI API key for summarization.')
      return
    }

    setError('')
    setLoading(true)

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('enable_summary', String(enableSummary))
    if (enableSummary) {
      formData.append('api_key', apiKey)
    }

    try {
      const response = await fetch('http://localhost:8000/transcribe/', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Failed to process the audio file.')
      }

      const data = await response.json()
      onTranscriptionComplete({
        transcription: data.original_transcript,
        petitResume: data.petit_resume,
        grosResume: data.gros_resume,
      })
    } catch (err) {
      console.error(err)
      setError('Failed to process the audio file.')
    } finally {
      setLoading(false)
    }
  }

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
                  setEnableSummary(checked)
                  if (checked) {
                    setShowApiInput(true)
                  }
                }}
              />
              <Label htmlFor="enable-summary" className="text-sm">
                Enable AI Summarization
              </Label>
            </div>
          </div>

          {showApiInput && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="api-key">OpenAI API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                />
                <p className="text-xs text-muted-foreground">
                  Your API key is only used for summarization and never stored
                </p>
              </div>
            </motion.div>
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
  )
}
