import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "../../lib/utils"

const FileInput = React.forwardRef(({ className, label, error, ...props }, ref) => {
  return (
    <motion.div 
      className={cn("relative", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <input
        type="file"
        className={cn(
          "file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0",
          "file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground",
          "hover:file:bg-primary/90 cursor-pointer w-full",
          "text-sm text-gray-500 rounded-lg border",
          error ? "border-red-500" : "border-gray-200",
          className
        )}
        ref={ref}
        {...props}
      />
      {label && (
        <label className="text-sm text-gray-500 mt-2 block">
          {label}
        </label>
      )}
      {error && (
        <motion.p 
          className="text-red-500 text-sm mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  )
})
FileInput.displayName = "FileInput"

export { FileInput }
