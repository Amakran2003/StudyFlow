import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/button'
import { UploadForm } from '../components/transcribe/UploadForm'
import { TranscriptionResult } from '../components/transcribe/TranscriptionResult'
import { SummaryResult } from '../components/transcribe/SummaryResult'

interface TranscriptionData {
  transcription: string
  petitResume?: string
  grosResume?: string
}

export function TranscribePage() {
  const [transcriptionData, setTranscriptionData] = useState<TranscriptionData | null>(null)
  const [isTranscriptionExpanded, setIsTranscriptionExpanded] = useState(false)

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleJsonDownload = () => {
    if (!transcriptionData) return
    const content = {
      transcription: transcriptionData.transcription,
      ...(transcriptionData.petitResume && { keyPoints: transcriptionData.petitResume }),
      ...(transcriptionData.grosResume && { detailedSummary: transcriptionData.grosResume })
    }
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transcription.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleMarkdownDownload = () => {
    if (!transcriptionData) return
    const mdContent = `# Transcription\n\n${transcriptionData.transcription}\n\n${
      transcriptionData.petitResume ? `\n## Key Points\n\n${transcriptionData.petitResume}` : ''
    }${
      transcriptionData.grosResume ? `\n## Detailed Summary\n\n${transcriptionData.grosResume}` : ''
    }`
    handleDownload(mdContent, 'transcription.md')
  }

  return (
    <div id="upload-section" className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <UploadForm onTranscriptionComplete={setTranscriptionData} />

      {transcriptionData?.transcription && (
        <TranscriptionResult
          transcription={transcriptionData.transcription}
          isExpanded={isTranscriptionExpanded}
          onToggleExpand={() => setIsTranscriptionExpanded(!isTranscriptionExpanded)}
          onCopy={() => navigator.clipboard.writeText(transcriptionData.transcription)}
          onDownload={(format) => {
            switch (format) {
              case 'txt':
                handleDownload(transcriptionData.transcription, 'transcription.txt')
                break
              case 'json':
                handleJsonDownload()
                break
              case 'md':
                handleMarkdownDownload()
                break
            }
          }}
        />
      )}

      {transcriptionData?.petitResume && (
        <SummaryResult
          title="Key Points"
          description="Essential takeaways from your audio"
          content={transcriptionData.petitResume}
          onCopy={() => {
            if (transcriptionData.petitResume) {
              navigator.clipboard.writeText(transcriptionData.petitResume)
            }
          }}
          onDownload={() => {
            if (transcriptionData.petitResume) {
              handleDownload(transcriptionData.petitResume, 'key-points.txt')
            }
          }}
        />
      )}

      {transcriptionData?.grosResume && (
        <SummaryResult
          title="Detailed Summary"
          description="Comprehensive overview of the content"
          content={transcriptionData.grosResume}
          onCopy={() => {
            if (transcriptionData.grosResume) {
              navigator.clipboard.writeText(transcriptionData.grosResume)
            }
          }}
          onDownload={() => {
            if (transcriptionData.grosResume) {
              handleDownload(transcriptionData.grosResume, 'detailed-summary.txt')
            }
          }}
        />
      )}

      {!transcriptionData?.petitResume && transcriptionData?.transcription && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 text-center"
        >
          <Button
            variant="outline"
            onClick={() => {
              // Handle enabling summarization
              // This would need to be implemented in the UploadForm component
            }}
          >
            Add API Key for Summarization
          </Button>
        </motion.div>
      )}
    </div>
  )
}
