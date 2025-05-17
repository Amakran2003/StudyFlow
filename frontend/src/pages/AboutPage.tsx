import { motion } from 'framer-motion'

export function AboutPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container max-w-4xl mx-auto px-4 py-24"
    >
      <div className="prose prose-lg mx-auto">
        <h1>About StudyFlow</h1>
        <p className="lead">
          Hi! I'm Abderrazaq, a student passionate about making education more accessible and efficient.
        </p>
        
        <h2>The Story Behind StudyFlow</h2>
        <p>
          As a student, I noticed how challenging it could be to keep up with lectures while taking comprehensive notes.
          I created StudyFlow to help fellow students easily convert their lecture recordings into actionable study materials.
        </p>

        <h2>How It Works</h2>
        <p>
          StudyFlow uses advanced AI technology to transcribe audio recordings and generate concise summaries.
          It's designed to be simple to use while providing powerful features that help students save time and study more effectively.
        </p>

        <h2>Open Source</h2>
        <p>
          This project is open source and available on GitHub. I believe in the power of community-driven development
          and welcome contributions from fellow developers who share the vision of improving educational tools.
        </p>

        <h2>Contact</h2>
        <p>
          Have questions or suggestions? Feel free to reach out on GitHub or connect with me on LinkedIn.
          I'm always excited to hear from users and collaborate with other developers.
        </p>
      </div>
    </motion.div>
  )
}
