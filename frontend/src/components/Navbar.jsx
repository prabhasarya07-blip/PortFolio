import { useEffect, useState } from 'react'

const SECTIONS = [
  ['home', 'Home'],
  ['about', 'About'],
  ['education', 'Education'],
  ['skills', 'Skills'],
  ['projects', 'Projects'],
  ['certifications', 'Certifications'],
  ['hackathons', 'Hackathons'],
  ['achievements', 'Achievements'],
  ['contact', 'Contact'],
]

export default function Navbar({ name }) {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <header className="nav">
      <a href="#home" className="brand">{name}</a>
      <nav className={open ? 'links open' : 'links'}>
        {SECTIONS.map(([id, label]) => (
          <a key={id} href={'#' + id} onClick={() => setOpen(false)}>{label}</a>
        ))}
      </nav>
      <div className="nav-actions">
        <button
          className="icon-btn"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
        <button className="icon-btn menu" aria-label="Menu" onClick={() => setOpen(!open)}>
          Menu
        </button>
      </div>
    </header>
  )
}
