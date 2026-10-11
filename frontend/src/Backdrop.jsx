import { useEffect, useRef, useState } from 'react'
import DevScene, { DevPicker, initialScene } from './DevScene'
import TypePicker from './TypePicker'
import HeroTilt from './HeroTilt'
import Extras from './Extras'

/* LOCKED SCENE: Sunset Synthwave (stars, sun, neon mountains, horizon, grid floor).
   The scene never changes. Only its COLOURS change, section by section, as you scroll.
   The sun starts behind the hero photo and sinks to the horizon while you scroll down. */

// ---- colour maths in OKLab, so blends stay clean and never turn muddy ----
const h2r = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) }
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const gam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)
const cl = (v) => Math.min(1, Math.max(0, v))
function toLab(hex) {
  const [r, g, b] = h2r(hex).map(lin)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]
}
function toHex([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s]
  return '#' + rgb.map((c) => Math.round(cl(gam(cl(c))) * 255).toString(16).padStart(2, '0')).join('')
}

/* Colour theory used for every world (60 - 30 - 10):
   60% a very dark tinted base (bg),
   30% two or three neighbouring hues (analogous: c1, c2, c3) for harmony,
   10% one sharp accent from the opposite side of the wheel (c5, complementary) for the pop.
   The wheel is walked section by section, so scrolling feels like one continuous journey:
   pink-orange > gold > emerald > teal > violet > rose > fire > royal gold > back to sunset. */
// order of colours: bg, c1 main, c2 second, c3 third, c4 deep, c5 accent
const THEMES = [
  { id: 'home', name: 'Sunset', c: ['#14061f', '#ff4d8d', '#ff8a3d', '#ffd166', '#b45cff', '#3ee0ff'] },
  { id: 'about', name: 'Amber Gold', c: ['#170d04', '#ffb020', '#ff7a1a', '#ff4d6d', '#ffe08a', '#60a5fa'] },
  { id: 'education', name: 'Emerald', c: ['#04150d', '#34d399', '#a3e635', '#facc15', '#10b981', '#f472b6'] },
  { id: 'skills', name: 'Teal Lagoon', c: ['#041418', '#2dd4bf', '#22d3ee', '#a3e635', '#14b8a6', '#fb7185'] },
  { id: 'projects', name: 'Electric Violet', c: ['#0e0720', '#a78bfa', '#e879f9', '#22d3ee', '#7c3aed', '#fcd34d'] },
  { id: 'certifications', name: 'Rose', c: ['#1a0614', '#f43f5e', '#ec4899', '#fb923c', '#be185d', '#2dd4bf'] },
  { id: 'hackathons', name: 'Fire', c: ['#1a0805', '#ff5a1f', '#ffb703', '#ff2e63', '#c2410c', '#22d3ee'] },
  { id: 'achievements', name: 'Royal Gold', c: ['#120a22', '#fbbf24', '#c084fc', '#fb7185', '#7e22ce', '#34d399'] },
  { id: 'contact', name: 'Sunset', c: ['#14061f', '#ff4d8d', '#ff8a3d', '#ffd166', '#b45cff', '#3ee0ff'] },
].map((t) => ({ ...t, labs: t.c.map(toLab) }))

const WHITE = toLab('#ffffff')
const SHOOT = [{ x: '8%', y: '10%', t: '1s' }, { x: '48%', y: '4%', t: '5.5s' }, { x: '70%', y: '18%', t: '9s' }]
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
const fast = (t) => 1 - (1 - t) ** 3

function paint(labs) {
  const st = document.documentElement.style
  const hex = labs.map(toHex)
  for (let i = 1; i <= 5; i++) st.setProperty('--c' + i, hex[i])
  st.setProperty('--accent', hex[1]); st.setProperty('--accent-2', hex[2]); st.setProperty('--a3', hex[3])
  if (document.documentElement.dataset.theme === 'light') { st.removeProperty('--bg'); st.removeProperty('--bg-2') }
  else {
    st.setProperty('--bg', hex[0])
    st.setProperty('--bg-2', toHex(labs[0].map((v, k) => v + (WHITE[k] - v) * 0.05)))
  }
}


/* Section titles: the word backspaces to its first letter (Skills > Skill > Skil > Ski > Sk > S),
   then types itself back. Plays each time a section scrolls into view. */
function useTypeTitles() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const state = new WeakMap()
    const els = []
    const caret = () => { const c = document.createElement('span'); c.className = 'tw-caret'; return c }
    const show = (el, txt, withCaret) => { el.textContent = txt; if (withCaret) el.appendChild(caret()) }
    const cancel = (el) => {
      const s = state.get(el); if (!s) return
      clearTimeout(s.tid); s.running = false
      show(el, s.full, false)
    }
    const run = (el) => {
      const s = state.get(el); if (!s || s.running) return
      s.running = true
      const chars = Array.from(s.full)
      let n = chars.length, dir = -1
      el.style.minHeight = el.offsetHeight + 'px'
      show(el, s.full, true)
      const tick = () => {
        if (dir < 0) {
          n--; show(el, chars.slice(0, n).join(''), true)
          if (n <= 1) { dir = 1; s.tid = setTimeout(tick, 260); return }
          s.tid = setTimeout(tick, 55)
        } else {
          n++; show(el, chars.slice(0, n).join(''), true)
          if (n >= chars.length) { s.tid = setTimeout(() => { show(el, s.full, false); s.running = false; s.done = true }, 1300); return }
          s.tid = setTimeout(tick, 85)
        }
      }
      s.tid = setTimeout(tick, 550)
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const s = state.get(e.target); if (!s) return
        if (e.isIntersecting) { if (!s.done && !s.running) run(e.target) }
        else { if (s.running) cancel(e.target); s.done = false }
      })
    }, { threshold: 0.6 })
    const scan = () => {
      document.querySelectorAll('.section .title').forEach((el) => {
        if (state.has(el) || el.children.length) return
        const full = el.textContent.trim()
        if (Array.from(full).length < 2) return
        state.set(el, { full, running: false, done: false, tid: 0 })
        els.push(el); io.observe(el)
      })
    }
    let deb = 0
    const mo = new MutationObserver(() => { clearTimeout(deb); deb = setTimeout(scan, 250) })
    mo.observe(document.getElementById('root') || document.body, { childList: true, subtree: true })
    scan()
    const timers = [400, 1500, 4000].map((ms) => setTimeout(scan, ms))
    return () => {
      mo.disconnect(); io.disconnect(); clearTimeout(deb); timers.forEach(clearTimeout)
      els.forEach((el) => { const s = state.get(el); if (s) { clearTimeout(s.tid); if (s.running) show(el, s.full, false) } })
    }
  }, [])
}

export default function Backdrop() {
  const root = useRef(null)
  const cur = useRef(THEMES[0].labs.map((l) => l.slice()))
  const anim = useRef(0)
  const idxRef = useRef(-1)
  const [tag, setTag] = useState({ k: 0, name: '' })
  const [idx, setIdx] = useState(0)
  const [scene, setScene] = useState(initialScene)
  useEffect(() => { document.documentElement.dataset.scene = String(scene); try { localStorage.setItem('devscene', String(scene)) } catch (e) {} }, [scene])

  useTypeTitles()
  useEffect(() => { document.documentElement.dataset.palette = '2'; paint(cur.current) }, [])

  const goTo = (i) => {
    cancelAnimationFrame(anim.current)
    const from = cur.current.map((l) => l.slice())
    const to = THEMES[i].labs
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { cur.current = to.map((l) => l.slice()); paint(cur.current); return }
    const t0 = performance.now()
    const step = (now) => {
      const e = fast(Math.min(1, (now - t0) / 420))
      cur.current = from.map((f, a) => f.map((v, k) => v + (to[a][k] - v) * e))
      paint(cur.current)
      if (e < 1) anim.current = requestAnimationFrame(step)
    }
    anim.current = requestAnimationFrame(step)
  }

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const vh = window.innerHeight, vw = window.innerWidth
      // which section is on screen?
      let k = 0
      THEMES.forEach((t, i) => { const el = document.getElementById(t.id); if (el && el.getBoundingClientRect().top <= vh * 0.72) k = i })
      if (k !== idxRef.current) {
        const first = idxRef.current === -1
        idxRef.current = k; setIdx(k)
        if (!first || k !== 0) goTo(k)
        if (!first) setTag((p) => ({ k: p.k + 1, name: THEMES[k].name }))
      }
      // sun: sits behind the photo, then sinks to the horizon as you scroll
      const el = root.current
      if (!el) return
      const img = document.querySelector('.img6') || document.querySelector('.hero-vis')
      const sy = window.scrollY
      let cx = vw * 0.74, cy = vh * 0.42, d = Math.min(vw, vh) * 0.62
      if (img) {
        const r = img.getBoundingClientRect()
        if (r.width > 0) { cx = r.left + r.width / 2; cy = r.top + sy + r.height * 0.36; d = clamp(r.height * 0.9, 280, 680) }
      }
      const hero = document.querySelector('.hero')
      const p = ease(clamp(sy / ((hero ? hero.offsetHeight : vh) * 0.9), 0, 1))
      el.style.setProperty('--sx', (cx + (vw * 0.5 - cx) * p).toFixed(0) + 'px')
      el.style.setProperty('--sy', (cy + (vh * 0.8 - cy) * p).toFixed(0) + 'px')
      el.style.setProperty('--sd', (d * (1 - 0.18 * p)).toFixed(0) + 'px')
      el.style.setProperty('--fx', Math.max(0.55, 1 - sy / 1800).toFixed(2))
    }
    const sched = () => { if (!raf) raf = requestAnimationFrame(update) }
    const onMove = (e) => {
      const el = root.current; if (!el) return
      el.style.setProperty('--mx', ((e.clientX / window.innerWidth - 0.5) * 2).toFixed(3))
      el.style.setProperty('--my', ((e.clientY / window.innerHeight - 0.5) * 2).toFixed(3))
    }
    sched()
    const timers = [300, 1000, 2500].map((ms) => setTimeout(sched, ms))
    window.addEventListener('scroll', sched, { passive: true })
    window.addEventListener('resize', sched)
    window.addEventListener('load', sched)
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(raf); cancelAnimationFrame(anim.current); timers.forEach(clearTimeout)
      window.removeEventListener('scroll', sched); window.removeEventListener('resize', sched)
      window.removeEventListener('load', sched); window.removeEventListener('pointermove', onMove)
    }
    // eslint-disable-next-line
  }, [])

  return (
    <>
      <div className="pbd p2" ref={root} aria-hidden="true">
        <span className="orb o1" /><span className="orb o2" /><span className="orb o3" /><span className="orb o4" />
        <div className="fx">
          <DevScene scene={scene} />
          <span className="stars" />
          {SHOOT.map((s, i) => <span key={i} className="shoot" style={{ '--x': s.x, '--y': s.y, '--t': s.t }} />)}
          <div className="par" style={{ '--k': 12 }}><span className="sun" /></div>
          <div className="par" style={{ '--k': 10 }}><span className="mtnw mw2"><i /></span></div>
          <div className="par" style={{ '--k': 22 }}><span className="mtnw mw1"><i /></span></div>
          <span className="hz" />
          <span className="floor" />
        </div>
        <span className="pbd-grain" /><span className="pbd-vig" />
      </div>
      <DevPicker scene={scene} setScene={setScene} />
      <TypePicker />
      <HeroTilt />
      <Extras />
      {tag.k > 0 && <span key={'w' + tag.k} className="wave one" aria-hidden="true" />}
      {tag.k > 0 && <div key={'t' + tag.k} className="theme-tag" aria-hidden="true">{tag.name}</div>}
    </>
  )
}
