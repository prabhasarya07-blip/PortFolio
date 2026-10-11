import { useEffect } from 'react'

/* Light 3D tilt for the hero photo. No always-running loop: it animates only while the pointer is moving. */
export default function HeroTilt() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    if (!window.matchMedia('(pointer: fine)').matches) return undefined
    let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0, el = null
    const step = () => {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18
      if (!el || !el.isConnected) el = document.querySelector('.hero-s6 .v6')
      if (el) { el.style.setProperty('--tx', cx.toFixed(3)); el.style.setProperty('--ty', cy.toFixed(3)) }
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.002 ? requestAnimationFrame(step) : 0
    }
    const onMove = (e) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2
      ty = (e.clientY / window.innerHeight - 0.5) * 2
      if (!raf) raf = requestAnimationFrame(step)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => { cancelAnimationFrame(raf); window.removeEventListener('pointermove', onMove) }
  }, [])
  return null
}
