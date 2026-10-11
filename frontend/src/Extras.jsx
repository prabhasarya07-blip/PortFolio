import React, { useEffect, useMemo, useRef, useState } from 'react'
import { asset } from './api'

/* Final polish layer. Self-contained: sticky hire bar, Ctrl+K command menu, image lightbox, copy-email toast,
   project tech filter, live GitHub count, SEO tags. Nothing here touches your existing components. */
const SECTIONS = [['home', 'Home'], ['about', 'About'], ['education', 'Education'], ['skills', 'Skills'], ['projects', 'Projects'], ['certifications', 'Certifications'], ['hackathons', 'Hackathons'], ['achievements', 'Achievements'], ['contact', 'Contact']]
const ENV = (import.meta && import.meta.env) || {}
const API = ENV.VITE_API_URL || ''
const Q = new URLSearchParams(window.location.search)
const IMG = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
const isImg = (u) => !!u && IMG.some((e) => u.toLowerCase().split('?')[0].endsWith(e))

const toast = (m) => window.dispatchEvent(new CustomEvent('x-toast', { detail: m }))
const copy = async (text, msg) => {
  try { await navigator.clipboard.writeText(text) } catch (e) {
    const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select()
    try { document.execCommand('copy') } catch (e2) { /* ignore */ }
    t.remove()
  }
  toast(msg || 'Copied')
}
const goTo = (id) => {
  if (id === 'home') { window.scrollTo({ top: 0, behavior: 'smooth' }); return }
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
const toggleTheme = () => {
  const d = document.documentElement
  const next = d.dataset.theme === 'light' ? 'dark' : 'light'
  d.dataset.theme = next
  try { localStorage.setItem('theme', next) } catch (e) { /* ignore */ }
}

function useHero() {
  const [hero, setHero] = useState(window.__PROFILE || null)
  useEffect(() => {
    if (window.__PROFILE) return undefined
    let off = false
    fetch(API + '/api/profile').then((r) => r.json()).then((d) => { if (!off && d && d.hero) setHero(d.hero) }).catch(() => {})
    return () => { off = true }
  }, [])
  return hero
}

function useGithub(hero) {
  const [gh, setGh] = useState(null)
  useEffect(() => {
    if (!hero || !hero.github_url) return undefined
    const user = hero.github_url.split('/').filter(Boolean).pop()
    if (!user || user.length > 40) return undefined
    try { const c = JSON.parse(sessionStorage.getItem('gh_stats') || 'null'); if (c && c.u === user) { setGh(c); return undefined } } catch (e) { /* ignore */ }
    let off = false
    fetch('https://api.github.com/users/' + user).then((r) => r.json()).then((d) => {
      if (off || typeof d.public_repos !== 'number') return
      const v = { u: user, repos: d.public_repos, followers: d.followers }
      try { sessionStorage.setItem('gh_stats', JSON.stringify(v)) } catch (e) { /* ignore */ }
      setGh(v)
    }).catch(() => {})
    return () => { off = true }
  }, [hero])
  return gh
}

function setMeta(attr, key, val) {
  if (!val) return
  let m = document.head.querySelector('meta[' + attr + '="' + key + '"]')
  if (!m) { m = document.createElement('meta'); m.setAttribute(attr, key); document.head.appendChild(m) }
  m.setAttribute('content', val)
}
function seo(h) {
  if (!h) return
  const title = h.name + ' | ' + (h.role_title || 'Developer')
  const desc = (h.tagline || h.role_title || '') + ' Portfolio of ' + h.name + '.'
  document.title = title
  setMeta('name', 'description', desc)
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', desc)
  setMeta('property', 'og:type', 'website')
  setMeta('name', 'twitter:card', 'summary')
  setMeta('name', 'theme-color', '#14061f')
  let s = document.getElementById('ld-person')
  if (!s) { s = document.createElement('script'); s.id = 'ld-person'; s.type = 'application/ld+json'; document.head.appendChild(s) }
  s.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Person', name: h.name, jobTitle: h.role_title, email: h.email, sameAs: [h.github_url, h.linkedin_url, h.leetcode_url].filter(Boolean) })
}

function projectFilter() {
  let tries = 0
  const t = setInterval(() => {
    tries++
    const sec = document.getElementById('projects')
    const cards = sec ? Array.from(sec.querySelectorAll('.pcard')) : []
    if (cards.length || tries > 40) clearInterval(t)
    if (!cards.length || sec.querySelector('.pfilter')) return
    const tags = (c) => Array.from(c.querySelectorAll('.chip')).map((x) => x.textContent.trim()).filter(Boolean)
    const count = {}
    cards.forEach((c) => tags(c).forEach((x) => { count[x] = (count[x] || 0) + 1 }))
    const top = Object.keys(count).sort((a, b) => count[b] - count[a]).slice(0, 8)
    if (top.length < 2) return
    const bar = document.createElement('div'); bar.className = 'pfilter'
    const mk = (label, val) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'pf-btn'; b.textContent = label
      b.onclick = () => {
        bar.querySelectorAll('.pf-btn').forEach((x) => x.classList.toggle('on', x === b))
        cards.forEach((c) => { c.style.display = !val || tags(c).includes(val) ? '' : 'none' })
      }
      return b
    }
    const all = mk('All', ''); all.classList.add('on'); bar.appendChild(all)
    top.forEach((x) => bar.appendChild(mk(x, x)))
    const grid = cards[0].parentElement
    grid.parentElement.insertBefore(bar, grid)
  }, 250)
  return () => clearInterval(t)
}

function HireBar({ hero, gh, onPal }) {
  const [show, setShow] = useState(Q.get('bar') === '1')
  useEffect(() => {
    if (Q.get('bar') === '1') return undefined
    let raf = 0
    const calc = () => {
      raf = 0
      const c = document.getElementById('contact')
      const near = c && c.getBoundingClientRect().top < window.innerHeight * 0.6
      setShow(window.scrollY > window.innerHeight * 0.7 && !near)
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(calc) }
    window.addEventListener('scroll', on, { passive: true }); window.addEventListener('resize', on)
    calc()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', on); window.removeEventListener('resize', on) }
  }, [])
  if (!hero) return null
  return (
    <div className={'hire' + (show ? ' on' : '')} role='region' aria-label='Quick contact'>
      <span className={'hire-dot' + (hero.open_to_work ? '' : ' off')} />
      <div className='hire-txt'>
        <b>{hero.open_to_work ? 'Open to work' : hero.name}</b>
        <span>{gh ? gh.repos + ' public repos on GitHub' : hero.role_title}</span>
      </div>
      {hero.email && <button type='button' className='hire-btn' onClick={() => copy(hero.email, 'Email copied: ' + hero.email)}>Copy email</button>}
      {hero.resume_url && <a className='hire-btn' href={asset(hero.resume_url)} target='_blank' rel='noreferrer'>Resume</a>}
      <button type='button' className='hire-btn primary' onClick={() => goTo('contact')}>Hire me</button>
      <button type='button' className='hire-k' onClick={onPal} aria-label='Open command menu'>Ctrl K</button>
    </div>
  )
}

function Palette({ open, onClose, hero }) {
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const inp = useRef(null)
  const items = useMemo(() => {
    const a = SECTIONS.map(([id, l]) => ({ k: 'Go to ' + l, hint: 'Section', run: () => goTo(id) }))
    if (hero && hero.email) a.push({ k: 'Copy email', hint: hero.email, run: () => copy(hero.email, 'Email copied: ' + hero.email) })
    if (hero && hero.resume_url) a.push({ k: 'Open resume', hint: 'PDF', run: () => window.open(asset(hero.resume_url), '_blank') })
    if (hero && hero.github_url) a.push({ k: 'Open GitHub', hint: 'Link', run: () => window.open(hero.github_url, '_blank') })
    if (hero && hero.linkedin_url) a.push({ k: 'Open LinkedIn', hint: 'Link', run: () => window.open(hero.linkedin_url, '_blank') })
    if (hero && hero.leetcode_url) a.push({ k: 'Open LeetCode', hint: 'Link', run: () => window.open(hero.leetcode_url, '_blank') })
    a.push({ k: 'Toggle light / dark', hint: 'Theme', run: toggleTheme })
    return a
  }, [hero])
  const list = items.filter((x) => (x.k + ' ' + x.hint).toLowerCase().includes(q.trim().toLowerCase()))
  useEffect(() => { if (open) { setQ(''); setI(0); setTimeout(() => inp.current && inp.current.focus(), 30) } }, [open])
  useEffect(() => { setI(0) }, [q])
  if (!open) return null
  const run = (x) => { if (!x) return; onClose(); setTimeout(x.run, 60) }
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setI((v) => Math.min(list.length - 1, v + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setI((v) => Math.max(0, v - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); run(list[i]) }
    else if (e.key === 'Escape') onClose()
  }
  return (
    <div className='cmd-ov' onMouseDown={onClose}>
      <div className='cmd' role='dialog' aria-label='Command menu' onMouseDown={(e) => e.stopPropagation()}>
        <input ref={inp} className='cmd-in' value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder='Jump to a section or run an action...' aria-label='Search commands' />
        <div className='cmd-list' role='listbox'>
          {list.length === 0 && <div className='cmd-empty'>No match</div>}
          {list.map((x, n) => (
            <button type='button' key={x.k} role='option' aria-selected={n === i} className={'cmd-it' + (n === i ? ' on' : '')} onMouseEnter={() => setI(n)} onClick={() => run(x)}>
              <span>{x.k}</span><em>{x.hint}</em>
            </button>
          ))}
        </div>
        <div className='cmd-foot'>Up and down to move, Enter to run, Esc to close</div>
      </div>
    </div>
  )
}

function Lightbox() {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    const onClick = (e) => {
      const t = e.target
      if (!t || !t.closest) return
      if (t.closest('.nav,.hire,.cmd-ov,.lbx,.adm,.hero,.v6')) return
      const a = t.closest('a[href]')
      const img = t.closest('img')
      let s = null
      if (a && isImg(a.getAttribute('href'))) s = a.href
      else if (img && img.closest('.card,.pcard,.banner,.timeline-item')) s = img.currentSrc || img.src
      if (s) { e.preventDefault(); setSrc(s) }
    }
    const onKey = (e) => { if (e.key === 'Escape') setSrc(null) }
    document.addEventListener('click', onClick)
    window.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('click', onClick); window.removeEventListener('keydown', onKey) }
  }, [])
  if (!src) return null
  return (
    <div className='lbx' onClick={() => setSrc(null)} role='dialog' aria-label='Image preview'>
      <img src={src} alt='Preview' />
      <button type='button' className='lbx-x' aria-label='Close' onClick={() => setSrc(null)}>Close</button>
    </div>
  )
}

function Toast() {
  const [m, setM] = useState('')
  useEffect(() => {
    let t = 0
    const on = (e) => { setM(e.detail); clearTimeout(t); t = setTimeout(() => setM(''), 2200) }
    window.addEventListener('x-toast', on)
    return () => { clearTimeout(t); window.removeEventListener('x-toast', on) }
  }, [])
  return <div className={'tst' + (m ? ' on' : '')} role='status' aria-live='polite'>{m}</div>
}

function Inner() {
  const hero = useHero()
  const gh = useGithub(hero)
  const [open, setOpen] = useState(Q.get('pal') === '1')
  useEffect(() => { seo(hero) }, [hero])
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target && e.target.tagName) || ''
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((v) => !v) }
      else if (e.key === '/' && !typing) { e.preventDefault(); setOpen(true) }
    }
    const onMail = (e) => {
      const a = e.target && e.target.closest && e.target.closest('a[href^="mailto:"]')
      if (a) copy(a.getAttribute('href').slice(7).split('?')[0], 'Email copied')
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('click', onMail)
    const lazy = () => document.querySelectorAll('img').forEach((im) => { if (!im.closest('.hero')) { im.loading = 'lazy'; im.decoding = 'async' } })
    const timers = [setTimeout(lazy, 300), setTimeout(lazy, 1800), setTimeout(lazy, 5000)]
    let n = 0
    const fillT = setInterval(() => {
      n++
      const v = document.querySelector('.hero-s6 .v6')
      const im = v && v.querySelector('img')
      if (n > 40) clearInterval(fillT)
      if (!im || !im.src || v.querySelector('.v6-blur')) return
      const w = document.createElement('div'); w.className = 'v6-blur'
      const i = document.createElement('i'); i.style.backgroundImage = 'url(\'' + im.src + '\')'
      w.appendChild(i); v.insertBefore(w, v.firstChild)
      clearInterval(fillT)
    }, 250)
    const stop = projectFilter()
    return () => { window.removeEventListener('keydown', onKey); document.removeEventListener('click', onMail); timers.forEach(clearTimeout); clearInterval(fillT); stop() }
  }, [])
  return (
    <>
      <a className='skip' href='#about'>Skip to content</a>
      <Palette open={open} onClose={() => setOpen(false)} hero={hero} />
      <Lightbox />
      <Toast />
    </>
  )
}

export default function Extras() {
  if (window.location.pathname.startsWith('/admin')) return null
  return <Inner />
}
