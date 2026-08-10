import type { Page } from '../App'

interface Props {
  currentPage: Page
  navigate: (p: Page) => void
}

const NAVBAR_HEIGHT = 64
const scrollToSection = (id: string) => {
  const el = document.getElementById(id)
  if (!el) return
  const y = el.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT
  window.scrollTo({ top: y, behavior: 'smooth' })
}

export default function NavBar({ currentPage, navigate }: Props) {
  const navLink = (label: string, target: Page | 'home') => {
    const dest: Page = target === 'home' ? 'landing' : (target as Page)
    const active = (target === 'home' && currentPage === 'landing') || currentPage === target
    return (
      <button
        onClick={() => navigate(dest)}
        className={`text-sm font-medium transition-colors duration-150 ${
          active ? 'text-[#1a6fd4]' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        {label}
      </button>
    )
  }

  const handleSectionClick = (section: 'about' | 'features') => {
    if (currentPage !== 'landing') {
      navigate('landing')
      setTimeout(() => scrollToSection(section), 150)
    } else {
      scrollToSection(section)
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <nav
        className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between"
        aria-label="Main navigation"
      >
        <a
          href="#home"
          onClick={() => navigate('landing')}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-[#1a6fd4] flex items-center justify-center text-white text-base shadow-sm">
            🩺
          </div>
          <span className="font-semibold text-slate-900 text-[15px] leading-tight">
            Clinical Data<br />
            <span className="text-[#1a6fd4] text-xs font-medium tracking-wide uppercase">Analyzer AI</span>
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {navLink('Home', 'home')}
          <button
            onClick={() => handleSectionClick('about')}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-150"
          >
            About
          </button>
          <button
            onClick={() => handleSectionClick('features')}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-150"
          >
            Features
          </button>
        </div>

        <button
          onClick={() => navigate('upload')}
          className="px-4 py-2 bg-[#1a6fd4] text-white text-sm font-semibold rounded-xl hover:bg-[#1558b0] transition-colors duration-150 shadow-sm"
        >
          Analyze Report
        </button>
      </nav>
    </header>
  )
}
