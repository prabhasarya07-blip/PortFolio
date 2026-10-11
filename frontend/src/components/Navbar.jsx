import { useEffect, useState } from 'react'

const LINKS = [
  ['home', 'Home'], ['about', 'About'], ['education', 'Education'], ['skills', 'Skills'],
  ['projects', 'Projects'], ['certifications', 'Certifications'], ['hackathons', 'Hackathons'],
  ['achievements', 'Achievements'], ['contact', 'Contact'],
]

export default function Navbar({ name }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('home')
  const [progress, setProgress] = useState(0)
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement
      const max = h.scrollHeight - h.clientHeight
      setProgress(max > 0 ? (h.scrollTop / max) * 100 : 0)
      setShowTop(h.scrollTop > 600)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const els = LINKS.map(([id]) => document.getElementById(id)).filter(Boolean)
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id) }),
      { rootMargin: '-45% 0px -50% 0px' }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <>
      <header className="nav">
        <div className="progress" style={{ width: progress + '%' }} />
        <div className="nav-inner">
          <a href="#home" className="brand">{name || 'Portfolio'}</a>
          <nav className={'links' + (open ? ' open' : '')}>
            {LINKS.map(([id, label]) => (
              <a key={id} href={'#' + id} className={active === id ? 'active' : ''} onClick={() => setOpen(false)}>
                {label}
              </a>
            ))}
          </nav>
          <div className="nav-actions">
            <button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
              {theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19'}
            </button>
            <button className="icon-btn menu" onClick={() => setOpen(!open)} aria-label="Menu">
              {open ? '\u2715' : '\u2630'}
            </button>
          </div>
        </div>
      </header>
      {showTop && (
        <button className="to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top">
          {'\u2191'}
        </button>
      )}
    </>
  )
}
