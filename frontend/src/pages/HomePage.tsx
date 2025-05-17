import { motion } from 'framer-motion'
import { Hero } from '../components/home/Hero'

export function HomePage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Hero />
      
      {/* Add more sections here like Features, Testimonials, etc. */}
    </motion.div>
  )
}
