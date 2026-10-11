import { useEffect, useState } from 'react'

const KEY = 'intro_seen'
const R = 54
const C = 2 * Math.PI * R

function shouldShow() {
  try {
    if (sessionStorage.getItem(KEY)) return false
  } catch (e) {}
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function Intro() {
  const [show] = useState(shouldShow)
  const [pct, setPct] = useState(0)
  const [phase, setPhase] = useState('in') // in -> out -> gone

  // progress counter
  useEffect(() => {
    const root = document.documentElement
    if (!show) {
      root.classList.add('ready')
      return
    }
    document.body.style.overflow = 'hidden'
    let p = 0
    let t2 = 0
    const t = setInterval(() => {
      p = Math.min(100, p + 0.8 + Math.random())
      setPct(Math.floor(p))
      if (p >= 100) {
        clearInterval(t)
        t2 = setTimeout(() => setPhase('out'), 400)
      }
    }, 40)
    return () => {
      clearInterval(t)
      clearTimeout(t2)
    }
  }, [show])

  // exit animation, then reveal the site
  useEffect(() => {
    if (phase !== 'out') return
    const root = document.documentElement
    const a = setTimeout(() => root.classList.add('ready'), 650)
    const b = setTimeout(() => {
      try { sessionStorage.setItem(KEY, '1') } catch (e) {}
      document.body.style.overflow = ''
      setPhase('gone')
    }, 1500)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }, [phase])

  // click / key to skip
  useEffect(() => {
    if (!show || phase !== 'in') return
    const skip = () => { setPct(100); setPhase('out') }
    const onKey = (e) => { if (['Escape', 'Enter', ' '].includes(e.key)) skip() }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', skip)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', skip)
    }
  }, [show, phase])

  if (!show || phase === 'gone') return null

  return (
    <div className={`intro ${phase}`} role="presentation">
      <div className="intro-half top" />
      <div className="intro-half bot" />
      <div className="intro-center">
        <div className="intro-ring">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <defs>
              <linearGradient id="introGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#6366f1" />
                <stop offset="1" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <circle className="trk" cx="60" cy="60" r={R} />
            <circle className="bar" cx="60" cy="60" r={R} stroke="url(#introGrad)" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} />
          </svg>
          <span className="pct">{pct}</span>
        </div>
        <h1 className="intro-welcome" aria-label="Welcome">
          {'Welcome'.split('').map((c, i) => <span key={i} style={{ '--i': i }}>{c}</span>)}
        </h1>
        <p className="intro-sub">to the portfolio of <b>Prabhas N</b></p>
        <p className="intro-skip">click anywhere to skip</p>
      </div>
    </div>
  )
}
