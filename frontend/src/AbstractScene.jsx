import React, { useEffect, useRef } from 'react'

/* Abstract premium backgrounds (11-20). No literal metaphors: pure motion, light and colour. All read --c1..--c5 live. */
const FALLBACK = ['#ff4d8d', '#ff8a3d', '#ffd166', '#b45cff', '#3ee0ff']
const rgba = (hex, a) => {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim())
  if (!m) return 'rgba(255,255,255,' + a + ')'
  const n = parseInt(m[1], 16)
  return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'
}
const R = (a, b) => a + Math.random() * (b - a)
const mod = (x, m) => ((x % m) + m) % m

export default function AbstractScene({ scene }) {
  const ref = useRef(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return undefined
    const ctx = cv.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let W = 0, H = 0, raf = 0, last = 0, frame = 0, alive = true, step = () => {}
    let C = FALLBACK.slice()
    const S = { sp: 0, v: 0, t: 0 }
    const M = { x: -1, y: -1 }
    const small = () => W < 700
    const readColors = () => {
      const cs = getComputedStyle(document.documentElement)
      C = FALLBACK.map((f, i) => (cs.getPropertyValue('--c' + (i + 1)) || '').trim() || f)
    }
    const target = () => {
      const q = new URLSearchParams(window.location.search).get('p')
      if (q !== null) return Math.max(0, Math.min(1, parseFloat(q) || 0))
      const max = document.documentElement.scrollHeight - window.innerHeight
      return max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0
    }

    /* 11. AURORA: huge soft colour clouds that drift and mix */
    const aurora = () => {
      const b = Array.from({ length: 6 }, (_, i) => ({ ph: R(0, 6.28), sx: R(0.6, 1.3), sy: R(0.6, 1.3), c: i % 5 }))
      return () => {
        ctx.clearRect(0, 0, W, H)
        ctx.globalCompositeOperation = 'lighter'
        b.forEach((o, i) => {
          const x = W * (0.5 + 0.4 * Math.sin(S.t * 0.12 * o.sx + o.ph))
          const y = H * (0.5 + 0.34 * Math.cos(S.t * 0.1 * o.sy + o.ph * 1.7)) + S.sp * H * 0.3 * (i % 2 ? 1 : -1)
          const r = Math.max(W, H) * (0.32 + 0.1 * Math.sin(S.t * 0.2 + o.ph))
          const g = ctx.createRadialGradient(x, y, 0, x, y, r)
          g.addColorStop(0, rgba(C[o.c], 0.34)); g.addColorStop(1, rgba(C[o.c], 0))
          ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2)
        })
        ctx.globalCompositeOperation = 'source-over'
      }
    }

    /* 12. CONSTELLATION: drifting points that connect when close, and reach for your cursor */
    const net = () => {
      const n = small() ? 48 : 95
      const p = Array.from({ length: n }, () => ({ x: R(0, W), y: R(0, H), vx: R(-0.3, 0.3), vy: R(-0.3, 0.3) }))
      return () => {
        const k = 1 + S.v * 6
        p.forEach((q) => { q.x = mod(q.x + q.vx * k, W); q.y = mod(q.y + q.vy * k, H) })
        ctx.clearRect(0, 0, W, H)
        ctx.lineWidth = 1
        for (let i = 0; i < n; i++) {
          const a = p[i]
          for (let j = i + 1; j < n; j++) {
            const d = Math.hypot(a.x - p[j].x, a.y - p[j].y)
            if (d < 135) { ctx.strokeStyle = rgba(C[i % 5], (1 - d / 135) * 0.4); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(p[j].x, p[j].y); ctx.stroke() }
          }
          if (M.x >= 0) {
            const d = Math.hypot(a.x - M.x, a.y - M.y)
            if (d < 190) { ctx.strokeStyle = rgba(C[(i + 2) % 5], (1 - d / 190) * 0.7); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(M.x, M.y); ctx.stroke() }
          }
          ctx.fillStyle = rgba(C[i % 5], 0.9); ctx.beginPath(); ctx.arc(a.x, a.y, 1.8, 0, 6.283); ctx.fill()
        }
      }
    }

    /* 13. FLOW FIELD: thousands of particles drawing silk-like currents */
    const flow = () => {
      const n = small() ? 260 : 520
      const p = Array.from({ length: n }, () => ({ x: R(0, W), y: R(0, H) }))
      return () => {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.fillStyle = 'rgba(0,0,0,0.05)'; ctx.fillRect(0, 0, W, H)
        ctx.globalCompositeOperation = 'source-over'
        ctx.lineWidth = 1.2
        p.forEach((q, i) => {
          const f = Math.sin(q.x * 0.004 + S.t * 0.2 + S.sp * 3) + Math.cos(q.y * 0.005 - S.t * 0.15) + Math.sin((q.x + q.y) * 0.003 + S.t * 0.1)
          const a = f * 1.05
          const nx = q.x + Math.cos(a) * (1.6 + S.v * 5), ny = q.y + Math.sin(a) * (1.6 + S.v * 5)
          ctx.strokeStyle = rgba(C[mod(Math.floor((f + 3) * 0.9), 5)], 0.55)
          ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(nx, ny); ctx.stroke()
          q.x = nx; q.y = ny
          if (q.x < 0 || q.x > W || q.y < 0 || q.y > H || (i + frame) % 400 === 0) { q.x = R(0, W); q.y = R(0, H) }
        })
      }
    }

    /* 14. CONTOURS: living topographic rings, like a map of ideas */
    const topo = () => {
      const cs = [[0.3, 0.4], [0.72, 0.35], [0.55, 0.78], [0.12, 0.8]]
      return () => {
        ctx.clearRect(0, 0, W, H)
        const u = Math.min(W, H) * 0.045
        cs.forEach((c, ci) => {
          const cx = W * c[0] + Math.sin(S.t * 0.15 + ci) * 40, cy = H * c[1] + Math.cos(S.t * 0.12 + ci * 2) * 30
          for (let k = 0; k < 16; k++) {
            ctx.beginPath()
            const rad = (k + 1) * u + S.sp * 160
            for (let i = 0; i <= 90; i++) {
              const a = (i / 90) * 6.283
              const r = rad * (1 + 0.07 * Math.sin(a * 3 + S.t * 0.3 + k * 0.5 + ci) + 0.04 * Math.sin(a * 5 - S.t * 0.2 + ci))
              const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r
              if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
            }
            ctx.closePath()
            ctx.strokeStyle = rgba(C[(ci + (k % 2)) % 5], Math.max(0.03, 0.26 - k * 0.012)); ctx.lineWidth = 1.2; ctx.stroke()
          }
        })
      }
    }

    /* 15. LIQUID WAVES: layered silk waves that rise as you scroll */
    const waves = () => () => {
      ctx.clearRect(0, 0, W, H)
      for (let i = 4; i >= 0; i--) {
        const base = H * (0.58 + i * 0.09) - S.sp * H * 0.18, amp = 28 + i * 9
        ctx.beginPath(); ctx.moveTo(0, H)
        for (let x = 0; x <= W + 12; x += 12) {
          const y = base + Math.sin(x * 0.004 * (1 + i * 0.3) + S.t * 0.5 * (1 + i * 0.2) + i + S.sp * 6) * amp + Math.sin(x * 0.011 + S.t * 0.8 + i) * amp * 0.35
          ctx.lineTo(x, y)
        }
        ctx.lineTo(W, H); ctx.closePath()
        const g = ctx.createLinearGradient(0, base - amp, 0, H)
        g.addColorStop(0, rgba(C[i], 0.3)); g.addColorStop(1, rgba(C[i], 0.02))
        ctx.fillStyle = g; ctx.fill()
        ctx.strokeStyle = rgba(C[i], 0.6); ctx.lineWidth = 2; ctx.stroke()
      }
    }

    /* 16. CRYSTALS: slow wireframe cubes floating at different depths */
    const cubes = () => {
      const V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]
      const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]
      const o = Array.from({ length: small() ? 10 : 18 }, (_, i) => ({ x: R(0, 1), y: R(0, 1), z: R(0.4, 1), s: R(22, 60), rx: R(0, 6), ry: R(0, 6), vx: R(0.1, 0.4), vy: R(0.1, 0.4), c: i % 5 }))
      return () => {
        ctx.clearRect(0, 0, W, H)
        o.forEach((c) => {
          c.rx += 0.004 * c.vx * (1 + S.v * 12); c.ry += 0.004 * c.vy * (1 + S.v * 12)
          const cx = c.x * W, cy = mod(c.y * H - S.t * 6 * c.z - S.sp * H * c.z * 1.2, H + 160) - 80
          const sa = Math.sin(c.rx), ca = Math.cos(c.rx), sb = Math.sin(c.ry), cb = Math.cos(c.ry)
          const pr = V.map((v) => {
            const y1 = v[1] * ca - v[2] * sa, z1 = v[1] * sa + v[2] * ca
            const x2 = v[0] * cb + z1 * sb
            return [cx + x2 * c.s * c.z, cy + y1 * c.s * c.z]
          })
          ctx.strokeStyle = rgba(C[c.c], 0.2 + 0.45 * c.z); ctx.lineWidth = 1.2
          ctx.beginPath()
          E.forEach((e) => { ctx.moveTo(pr[e[0]][0], pr[e[0]][1]); ctx.lineTo(pr[e[1]][0], pr[e[1]][1]) })
          ctx.stroke()
        })
      }
    }

    /* 17. GLASS BUBBLES: translucent glass orbs rising at different speeds */
    const bubbles = () => {
      const o = Array.from({ length: small() ? 12 : 22 }, (_, i) => ({ x: R(0, 1), y: R(0, 1), r: R(28, 130), z: R(0.3, 1), c: i % 5 }))
      return () => {
        ctx.clearRect(0, 0, W, H)
        o.forEach((b) => {
          const y = mod(b.y * H - S.t * 9 * b.z - S.sp * H * b.z * 1.4, H + b.r * 2) - b.r
          const x = b.x * W + Math.sin(S.t * 0.3 + b.y * 9) * 18
          const g = ctx.createRadialGradient(x, y, 0, x, y, b.r)
          g.addColorStop(0, rgba(C[b.c], 0.03)); g.addColorStop(0.8, rgba(C[b.c], 0.1 * b.z + 0.04)); g.addColorStop(0.96, rgba(C[b.c], 0.5 * b.z)); g.addColorStop(1, rgba(C[b.c], 0))
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, b.r, 0, 6.283); ctx.fill()
          ctx.strokeStyle = 'rgba(255,255,255,' + 0.35 * b.z + ')'; ctx.lineWidth = 2
          ctx.beginPath(); ctx.arc(x, y, b.r * 0.78, 3.6, 4.5); ctx.stroke()
        })
      }
    }

    /* 18. VORTEX: a spiral galaxy that spins faster when you scroll */
    const vortex = () => {
      const p = Array.from({ length: small() ? 380 : 760 }, (_, i) => ({ a: R(0, 6.283), r: Math.pow(Math.random(), 0.7), c: i % 5, s: R(1, 2.6) }))
      return (dt) => {
        ctx.clearRect(0, 0, W, H)
        const cx = W * 0.64, cy = H * 0.46, Rm = Math.max(W, H) * 0.5, rot = S.t * 0.1 + S.sp * 3
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Rm * 0.25)
        g.addColorStop(0, rgba(C[2], 0.3)); g.addColorStop(1, rgba(C[2], 0))
        ctx.fillStyle = g; ctx.fillRect(cx - Rm * 0.3, cy - Rm * 0.3, Rm * 0.6, Rm * 0.6)
        p.forEach((q) => {
          q.a += ((0.12 + S.v * 1.2) * dt / 1000) / (0.25 + q.r)
          const th = q.a + q.r * 6 + rot
          const x = cx + Math.cos(th) * q.r * Rm, y = cy + Math.sin(th) * q.r * Rm * 0.55
          ctx.fillStyle = rgba(C[q.c], 0.25 + (1 - q.r) * 0.6); ctx.fillRect(x, y, q.s, q.s)
        })
      }
    }

    /* 19. HALFTONE RIPPLE: a dot grid that breathes in waves around your cursor */
    const dots = () => () => {
      ctx.clearRect(0, 0, W, H)
      const gap = small() ? 26 : 30
      const ax = W * (0.5 + 0.3 * Math.sin(S.t * 0.3)), ay = H * (0.5 + 0.3 * Math.cos(S.t * 0.25))
      for (let y = gap / 2; y < H; y += gap) {
        for (let x = gap / 2; x < W; x += gap) {
          let d = Math.hypot(x - ax, y - ay)
          if (M.x >= 0) d = Math.min(d, Math.hypot(x - M.x, y - M.y) * 0.8)
          const v = Math.sin(d * 0.02 - S.t * 1.5 + S.sp * 10)
          const ci = mod(Math.floor(((x + y) / (W + H)) * 5 + S.t * 0.1), 5)
          ctx.fillStyle = rgba(C[ci], 0.12 + (v + 1) * 0.22)
          ctx.beginPath(); ctx.arc(x, y, 1 + (v + 1) * 1.7, 0, 6.283); ctx.fill()
        }
      }
    }

    /* 20. RIBBONS: glowing silk ribbons that sway across the page */
    const ribbons = () => () => {
      ctx.clearRect(0, 0, W, H)
      ctx.globalCompositeOperation = 'lighter'
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      const gr = ctx.createLinearGradient(0, 0, W, 0)
      C.forEach((c, i) => gr.addColorStop(i / 4, c))
      for (let i = 0; i < 6; i++) {
        ctx.beginPath()
        for (let x = -20; x <= W + 20; x += 16) {
          const y = H * (0.22 + 0.11 * i) + Math.sin(x * 0.003 + S.t * 0.35 + i * 1.1) * H * 0.14 + Math.sin(x * 0.009 - S.t * 0.5 + i) * H * 0.04 + S.sp * H * (0.1 * i - 0.25)
          if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y)
        }
        ctx.globalAlpha = 0.13; ctx.strokeStyle = gr; ctx.lineWidth = 34; ctx.stroke()
        ctx.globalAlpha = 0.55; ctx.lineWidth = 1.6; ctx.stroke()
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'
    }

    const makers = [null, aurora, net, flow, topo, waves, cubes, bubbles, vortex, dots, ribbons]
    const tick = (dt) => {
      const d = target() - S.sp
      S.sp += d * 0.14
      S.v = S.v * 0.85 + Math.min(1, Math.abs(d) * 45) * 0.15
      S.t += dt / 1000
      step(dt)
    }
    const resize = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1)
      W = window.innerWidth; H = window.innerHeight
      cv.width = W * dpr; cv.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      readColors()
      step = makers[scene]()
      S.sp = target()
      if (reduce) { for (let i = 0; i < 70; i++) tick(33) }
    }
    const loop = (now) => {
      if (!alive) return
      raf = requestAnimationFrame(loop)
      if (document.hidden || now - last < 33) return
      const dt = Math.min(64, now - last || 33)
      last = now; frame++
      if (frame % 8 === 1) readColors()
      tick(dt)
    }
    resize()
    let rt = 0
    const onResize = () => { clearTimeout(rt); rt = setTimeout(resize, 200) }
    const onMove = (e) => { M.x = e.clientX; M.y = e.clientY }
    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onMove, { passive: true })
    if (!reduce) raf = requestAnimationFrame(loop)
    return () => { alive = false; cancelAnimationFrame(raf); clearTimeout(rt); window.removeEventListener('resize', onResize); window.removeEventListener('pointermove', onMove) }
  }, [scene])

  return <canvas ref={ref} className="dev-canvas" />
}
