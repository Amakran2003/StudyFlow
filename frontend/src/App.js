import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [petitResume, setPetitResume] = useState('');
  const [grosResume, setGrosResume] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an audio file.');
      return;
    }
    setError('');
    setLoading(true);
    setTranscription('');
    setPetitResume('');
    setGrosResume('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('http://localhost:8000/transcribe/', formData);
      // The backend returns: original_transcript, petit_resume, gros_resume
      setTranscription(response.data.original_transcript);
      setPetitResume(response.data.petit_resume);
      setGrosResume(response.data.gros_resume);
    } catch (err) {
      console.error(err);
      setError('Failed to process the audio file.');
    }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', margin: '2rem' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>StudyFlow Transcription & Summary</h1>

      <div style={{ marginBottom: '1rem' }}>
        <input type="file" accept="audio/*" onChange={handleFileChange} />
        <button
          onClick={handleUpload}
          style={{
            marginLeft: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#007BFF',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Processing...' : 'Upload & Transcribe'}
        </button>
      </div>

      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

      {/* Transcription Preview */}
      {transcription && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Transcription</h2>
          <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              backgroundColor: '#f9f9f9',
              padding: '1rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{transcription}</pre>
          </div>
        </div>
      )}

      {/* Petit Résumé (Points Clés) */}
      {petitResume && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Small Summary (Key Points)</h2>
          <div style={{
              maxHeight: '200px',
              overflowY: 'auto',
              backgroundColor: '#f9f9f9',
              padding: '1rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{petitResume}</pre>
          </div>
        </div>
      )}

      {/* Gros Résumé (Détaillé) */}
      {grosResume && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Big Summary (Detailed)</h2>
          <div style={{
              maxHeight: '500px',
              overflowY: 'auto',
              backgroundColor: '#f9f9f9',
              padding: '1rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{grosResume}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
