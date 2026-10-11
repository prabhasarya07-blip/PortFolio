import { useEffect } from 'react'

export function useSiteEffects(ready) {
  useEffect(() => {
    if (!ready) return undefined
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const canHover = window.matchMedia('(hover: hover)').matches
    const cleanups = []

    if (!reduce && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) =>
          entries.forEach((en) => {
            if (!en.isIntersecting) return
            const el = en.target
            el.classList.add('in')
            io.unobserve(el)
            setTimeout(() => { el.style.transitionDelay = '' }, 1400)
          }),
        { threshold: 0.12 }
      )
      document.querySelectorAll('.section .title, .section .card, .stat').forEach((el) => {
        const idx = Array.prototype.indexOf.call(el.parentElement.children, el)
        el.style.transitionDelay = Math.min(idx, 6) * 70 + 'ms'
        el.classList.add('reveal')
        io.observe(el)
      })
      cleanups.push(() => io.disconnect())
    }

    document.querySelectorAll('.grid > .card, .stack > .card').forEach((c) => c.classList.add('tilt'))

    const onMove = (e) => {
      const card = e.target.closest && e.target.closest('.card')
      if (!card || card.closest('.adm')) return
      const r = card.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      card.style.setProperty('--mx', x + 'px')
      card.style.setProperty('--my', y + 'px')
      if (!reduce && canHover && card.classList.contains('tilt')) {
        card.style.setProperty('--ry', ((x / r.width - 0.5) * 8).toFixed(2) + 'deg')
        card.style.setProperty('--rx', ((0.5 - y / r.height) * 8).toFixed(2) + 'deg')
      }
    }
    const onOut = (e) => {
      const card = e.target.closest && e.target.closest('.card')
      if (!card || card.contains(e.relatedTarget)) return
      card.style.setProperty('--rx', '0deg')
      card.style.setProperty('--ry', '0deg')
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerout', onOut)
    cleanups.push(() => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerout', onOut)
    })
    return () => cleanups.forEach((fn) => fn())
  }, [ready])
}
