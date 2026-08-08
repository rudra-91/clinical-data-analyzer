import type { Page } from '../App'

interface Props {
  currentPage: Page
  navigate: (p: Page) => void
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

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <button
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
        </button>

        <nav className="hidden md:flex items-center gap-8">
          {navLink('Home', 'home')}
          <button className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-150">
            About
          </button>
          <button className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-150">
            Features
          </button>
        </nav>

        <button
          onClick={() => navigate('upload')}
          className="px-4 py-2 bg-[#1a6fd4] text-white text-sm font-semibold rounded-xl hover:bg-[#1558b0] transition-colors duration-150 shadow-sm"
        >
          Analyze Report
        </button>
      </div>
    </header>
  )
}
