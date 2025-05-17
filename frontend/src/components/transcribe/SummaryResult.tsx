import { Button } from '../ui/button'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../ui/card'
import { motion } from 'framer-motion'

interface SummaryResultProps {
  title: string
  description: string
  content: string
  onCopy: () => void
  onDownload: () => void
}

export function SummaryResult({
  title,
  description,
  content,
  onCopy,
  onDownload
}: SummaryResultProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-8 max-w-4xl mx-auto"
    >
      <Card className="backdrop-blur-sm bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
                onClick={onDownload}
              >
                Download .txt
              </Button>
            </div>
            <div className="bg-background/50 p-4 rounded-md prose prose-sm max-w-none border">
              {content}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
