import { motion } from 'framer-motion'

interface TranscriptionData {
  transcription: string
  petitResume?: string
  grosResume?: string
}

export function TranscribePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      id="upload-section" 
      className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24"
    >
      <div className="max-w-3xl mx-auto text-center bg-card rounded-lg shadow-lg p-8 backdrop-blur-sm border border-border/50">
        <h2 className="text-3xl font-bold mb-6">Transcription Feature</h2>
        <div className="text-lg text-muted-foreground mb-8">
          <p className="mb-4">This feature is still in development and will be available soon!</p>
          <p>To try it now:</p>
          <ul className="list-disc list-inside text-left mx-auto max-w-xl mt-4 space-y-2">
            <li>Clone the repository locally</li>
            <li>Set up the backend following the instructions in the README</li>
            <li>Run both frontend and backend servers locally</li>
          </ul>
        </div>
        <div className="mt-8">
          <a 
            href="https://github.com/amakran2003/StudyFlow" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </motion.div>
  )
}
