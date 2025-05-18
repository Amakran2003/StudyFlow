import { motion } from 'framer-motion';
import { Progress } from '../ui/progress';

interface TranscriptionProgressProps {
  progress: number;
  audioDuration: number | null;
  estimatedTimeRemaining: number | null;
}

export function TranscriptionProgress({ 
  progress, 
  audioDuration, 
  estimatedTimeRemaining 
}: TranscriptionProgressProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-2"
    >
      <div className="flex flex-col gap-2">
        <Progress 
          value={progress} 
          className="h-2 w-full progress-bar" 
        />
        <p className="text-sm text-muted-foreground text-center">
          {progress === 0 ? "Preparing..." : (
            <>
              Transcribing... 
              <span className="font-mono progress-value">{progress}%</span>
              {audioDuration && (
                <span className="text-xs ml-2 opacity-75">
                  (Audio length: {Math.round(audioDuration)}s)
                </span>
              )}
              {estimatedTimeRemaining !== null && (
                <div className="text-xs opacity-75 mt-1">
                  Estimated time remaining: {estimatedTimeRemaining}s
                </div>
              )}
            </>
          )}
        </p>
      </div>
    </motion.div>
  );
}
