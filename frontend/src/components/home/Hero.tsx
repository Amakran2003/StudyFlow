import { motion } from 'framer-motion'
import { Button } from '../ui/button'

export function Hero() {
  return (
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
              className="bg-black text-white hover:bg-black/90"
              asChild
            >
              <a href="https://github.com/Amakran2003/StudyFlow" target="_blank" rel="noopener noreferrer">
                View on GitHub
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
