export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#1a6fd4] flex items-center justify-center text-white text-sm">
            🩺
          </div>
          <span className="font-semibold text-slate-800 text-sm">Clinical Data Analyzer AI</span>
        </div>
        <p className="text-xs text-slate-500 text-center">
          For educational and demonstration purposes only. Not a medical device.
        </p>
        <p className="text-xs text-slate-400">© 2026 Clinical Data Analyzer AI</p>
      </div>
    </footer>
  )
}
