import { Routes, Route } from 'react-router-dom'
import { RootLayout } from './components/layouts/RootLayout'
import { HomePage } from './pages/HomePage'
import { TranscribePage } from './pages/TranscribePage'
import { AboutPage } from './pages/AboutPage'
import './styles/background.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/transcribe" element={<TranscribePage />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>
    </Routes>
  )
}

export default App
