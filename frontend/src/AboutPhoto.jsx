import { useEffect } from 'react'
import { asset } from './api'

/* Puts your hero photo into the About section (a framed portrait above the About text). */
export default function AboutPhoto() {
  useEffect(() => {
    let url = ''
    let timer = 0
    let stop = false
    const place = () => {
      if (!url) return
      const about = document.getElementById('about')
      if (!about || about.querySelector('.about-photo')) return
      const grid = about.querySelector('.about-grid')
      const fig = document.createElement('figure')
      fig.className = 'about-photo reveal in'
      const img = document.createElement('img')
      img.src = url
      img.alt = 'Prabhas N'
      img.loading = 'lazy'
      fig.appendChild(img)
      if (grid && grid.parentNode) grid.parentNode.insertBefore(fig, grid)
      else about.appendChild(fig)
    }
    let base = ''
    try { base = (import.meta.env && import.meta.env.VITE_API_URL) || '' } catch (e) {}
    fetch(base + '/api/profile')
      .then((r) => r.json())
      .then((d) => {
        if (stop || !d || !d.hero || !d.hero.photo_url) return
        url = asset(d.hero.photo_url)
        place()
      })
      .catch(() => {})
    const mo = new MutationObserver(() => {
      window.clearTimeout(timer)
      timer = window.setTimeout(place, 200)
    })
    const root = document.getElementById('root')
    if (root) mo.observe(root, { childList: true, subtree: true })
    return () => { stop = true; mo.disconnect(); window.clearTimeout(timer) }
  }, [])
  return null
}
