import { Button } from '../ui/button'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../ui/card'
import { motion } from 'framer-motion'

interface TranscriptionResultProps {
  transcription: string
  isExpanded: boolean
  onToggleExpand: () => void
  onCopy: () => void
  onDownload: (format: 'txt' | 'json' | 'md') => void
}

export function TranscriptionResult({
  transcription,
  isExpanded,
  onToggleExpand,
  onCopy,
  onDownload
}: TranscriptionResultProps) {
  const getPreviewText = (text: string) => {
    const lines = text.split('\n')
    if (lines.length <= 10 || isExpanded) {
      return text
    }
    return lines.slice(0, 10).join('\n') + '\n...'
  }

  return (
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
          <div className="space-y-4">
            <div className="bg-background/50 p-4 rounded-md prose prose-sm max-w-none border">
              <pre className="whitespace-pre-wrap">{getPreviewText(transcription)}</pre>
              {transcription.split('\n').length > 10 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleExpand}
                  className="mt-2"
                >
                  {isExpanded ? 'Show Less' : 'Show More'}
                </Button>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onCopy}
                title="Copy to clipboard"
              >
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload('txt')}
              >
                Download .txt
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload('json')}
              >
                Download .json
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownload('md')}
              >
                Download .md
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
