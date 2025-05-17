import { Link } from 'react-router-dom'
import { Button } from '../ui/button'

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="font-bold text-xl">StudyFlow</Link>
        <div className="flex items-center gap-4">
          <Link to="/transcribe">
            <Button variant="ghost">Transcribe</Button>
          </Link>
          <Link to="/about">
            <Button variant="ghost">About</Button>
          </Link>
          <a href="https://github.com/Amakran2003/StudyFlow" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost">GitHub</Button>
          </a>
        </div>
      </div>
    </nav>
  )
}
