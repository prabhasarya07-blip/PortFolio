import { useEffect, useRef, useState } from 'react'

function Stat({ value, suffix, label }) {
  const ref = useRef(null)
  const [n, setN] = useState(0)

  useEffect(() => {
    const target = Number(value) || 0
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(target)
      return undefined
    }
    let raf = 0
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const tick = (t) => {
        const p = Math.min((t - t0) / 1200, 1)
        setN(Math.round(target * (1 - Math.pow(1 - p, 3))))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, { threshold: 0.5 })
    io.observe(ref.current)
    return () => { io.disconnect(); cancelAnimationFrame(raf) }
  }, [value])

  return (
    <div className="stat" ref={ref}>
      <div className="num">{n}{suffix}</div>
      <div className="label">{label}</div>
    </div>
  )
}

export default function About({ about }) {
  return (
    <section id="about" className="section">
      <h2 className="title">About me</h2>
      <div className="about-grid">
        <div>
          <p className="bio">{about.bio}</p>
          {about.location && <p className="location">{'\uD83D\uDCCD'} {about.location}</p>}
        </div>
        <div className="stats">
          <Stat value={about.hackathons_count} suffix="+" label="Hackathons" />
          <Stat value={about.projects_count} suffix="" label="Projects built" />
          <Stat value={about.certificates_count} suffix="" label="Certificates" />
        </div>
      </div>
    </section>
  )
}
