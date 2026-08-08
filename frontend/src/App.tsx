import { useState } from 'react'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import LandingPage from './pages/LandingPage'
import UploadPage from './pages/UploadPage'
import ProcessingPage from './pages/ProcessingPage'
import ResultsPage from './pages/ResultsPage'

export type Page = 'landing' | 'upload' | 'processing' | 'results'

export default function App() {
  const [page, setPage] = useState<Page>('landing')

  const navigate = (p: Page) => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setPage(p)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <NavBar currentPage={page} navigate={navigate} />
      <main className="flex-1">
        {page === 'landing' && <LandingPage navigate={navigate} />}
        {page === 'upload' && <UploadPage navigate={navigate} />}
        {page === 'processing' && <ProcessingPage navigate={navigate} />}
        {page === 'results' && <ResultsPage navigate={navigate} />}
      </main>
      {(page === 'landing') && <Footer />}
    </div>
  )
}
