import React, { useState } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Button } from './components/ui/button'
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from './components/ui/card'
import { FileInput } from './components/ui/file-input'
import { Label } from './components/ui/label'
import { Input } from './components/ui/input'
import { Switch } from './components/ui/switch'
import './styles/background.css'

interface TranscriptionResult {
  original_transcript: string
  petit_resume: string
  gros_resume: string
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [transcription, setTranscription] = useState<string>('')
  const [petitResume, setPetitResume] = useState<string>('')
  const [grosResume, setGrosResume] = useState<string>('')
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
    setTranscription('')
    setPetitResume('')
    setGrosResume('')

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('enable_summary', String(enableSummary))
    if (enableSummary) {
      formData.append('api_key', apiKey)
    }

    try {
      const response = await axios.post<TranscriptionResult>(
        'http://localhost:8000/transcribe/',
        formData
      )
      setTranscription(response.data.original_transcript)
      if (enableSummary) {
        setPetitResume(response.data.petit_resume)
        setGrosResume(response.data.gros_resume)
      }
    } catch (err) {
      console.error(err)
      setError('Failed to process the audio file.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-b from-background to-background/95 antialiased"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative">
        <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px] [mask-image:radial-gradient(white,transparent_85%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent" />
        
        <div className="container relative pt-24 sm:pt-32 md:pt-48 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12 space-y-8"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tighter text-primary sm:text-5xl md:text-6xl lg:text-7xl">
                Transform your{" "}
                <span className="text-primary">lectures</span>{" "}
                into actionable{" "}
                <span className="text-primary">insights</span>
              </h1>
              <p className="mx-auto max-w-[42rem] leading-normal text-muted-foreground text-lg sm:text-xl sm:leading-8">
                Experience the future of lecture notes with our AI-powered transcription and summarization. Fast, accurate, and completely free.
              </p>
            </div>
            
            <motion.div 
              className="mx-auto max-w-xl space-x-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Button 
                size="lg" 
                onClick={() => document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                asChild
              >
                <a href="https://github.com/yourusername/StudyFlow" target="_blank" rel="noopener noreferrer">
                  View on GitHub
                </a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div id="upload-section" className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
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
                      } else {
                        setPetitResume('')
                        setGrosResume('')
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

        {transcription && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 max-w-4xl mx-auto"
          >
            <Card className="backdrop-blur-sm bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Transcription</CardTitle>
                <CardDescription>Full transcript of your audio file</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap bg-background/50 p-4 rounded-md">
                  {transcription}
                </pre>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!enableSummary && transcription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 text-center"
          >
            <Button
              variant="outline"
              onClick={() => {
                setShowApiInput(true)
                setEnableSummary(true)
              }}
            >
              Add API Key for Summarization
            </Button>
          </motion.div>
        )}

        {petitResume && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 max-w-4xl mx-auto"
          >
            <Card className="backdrop-blur-sm bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Key Points</CardTitle>
                <CardDescription>Essential takeaways from your audio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-background/50 p-4 rounded-md prose prose-sm max-w-none">
                  {petitResume}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {grosResume && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 max-w-4xl mx-auto"
          >
            <Card className="backdrop-blur-sm bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Detailed Summary</CardTitle>
                <CardDescription>Comprehensive overview of the content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-background/50 p-4 rounded-md prose prose-sm max-w-none">
                  {grosResume}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default App
