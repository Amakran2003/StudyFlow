import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Button } from './components/ui/button';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from './components/ui/card';
import { FileInput } from './components/ui/file-input';
import { TextArea } from './components/ui/textarea';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [petitResume, setPetitResume] = useState('');
  const [grosResume, setGrosResume] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enableSummary, setEnableSummary] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(false);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
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
    setTranscription('');
    setPetitResume('');
    setGrosResume('');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('enable_summary', enableSummary);
    if (enableSummary) {
      formData.append('api_key', apiKey);
    }

    try {
      const response = await axios.post('http://localhost:8000/transcribe/', formData);
      setTranscription(response.data.original_transcript);
      if (enableSummary) {
        setPetitResume(response.data.petit_resume);
        setGrosResume(response.data.gros_resume);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to process the audio file.');
    }
    setLoading(false);
  };  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-12"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">StudyFlow</h1>
          <p className="text-xl text-gray-600">Transform your audio into actionable insights</p>
        </motion.div>

        <Card className="max-w-2xl mx-auto bg-white">
          <CardHeader>
            <CardTitle>Audio Transcription</CardTitle>
            <CardDescription>Upload your audio file to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileInput 
              accept="audio/*" 
              onChange={handleFileChange}
              error={error}
              label="Supported formats: MP3, WAV, M4A"
            />

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enable-summary"
                checked={enableSummary}
                onChange={(e) => {
                  setEnableSummary(e.target.checked);
                  if (e.target.checked) {
                    setShowApiInput(true);
                  } else {
                    setPetitResume('');
                    setGrosResume('');
                  }
                }}
                className="rounded border-gray-300"
              />
              <label htmlFor="enable-summary" className="text-sm text-gray-700">
                Enable AI Summarization
              </label>
            </div>

            {showApiInput && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-2"
              >
                <input
                  type="password"
                  placeholder="Enter OpenAI API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </motion.div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleUpload} 
              disabled={loading || !selectedFile}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Upload & Transcribe'}
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
            <Card>
              <CardHeader>
                <CardTitle>Transcription</CardTitle>
              </CardHeader>
              <CardContent>
                <TextArea
                  value={transcription}
                  readOnly
                  className="min-h-[200px]"
                />
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
              onClick={() => setShowApiInput(true)}
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
            <Card>
              <CardHeader>
                <CardTitle>Key Points</CardTitle>
              </CardHeader>
              <CardContent>
                <TextArea
                  value={petitResume}
                  readOnly
                  className="min-h-[150px]"
                />
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
            <Card>
              <CardHeader>
                <CardTitle>Detailed Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <TextArea
                  value={grosResume}
                  readOnly
                  className="min-h-[300px]"
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default App;
