import React, { useEffect, useRef } from 'react'

/* Journey backgrounds: scrolling the page = travelling. Progress p (0 at the top, 1 at the bottom) drives every scene. */
const FALLBACK = ['#ff4d8d', '#ff8a3d', '#ffd166', '#b45cff', '#3ee0ff']
const MONO = 'ui-monospace,Menlo,Consolas,monospace'
const NAMES = ['Home', 'About', 'Education', 'Skills', 'Projects', 'Certifications', 'Hackathons', 'Achievements', 'Contact']
const rgba = (hex, a) => {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim())
  if (!m) return 'rgba(255,255,255,' + a + ')'
  const n = parseInt(m[1], 16)
  return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'
}
const rnd = (n) => (Math.random() * n) | 0
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t) }

export default function JourneyScene({ scene }) {
  const ref = useRef(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return undefined
    const ctx = cv.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let W = 0, H = 0, raf = 0, last = 0, frame = 0, alive = true, step = () => {}
    let C = FALLBACK.slice()
    const S = { sp: 0, v: 0, t: 0 }
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
    const makePath = (fr) => {
      const pts = fr.map((q) => [q[0] * W, q[1] * H])
      const cum = [0]
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
      const total = cum[cum.length - 1] || 1
      const at = (d) => {
        d = Math.max(0, Math.min(total, d))
        let i = 1
        while (i < cum.length - 1 && cum[i] < d) i++
        const a = pts[i - 1], b = pts[i], seg = cum[i] - cum[i - 1] || 1
        const t = (d - cum[i - 1]) / seg
        return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, Math.atan2(b[1] - a[1], b[0] - a[0])]
      }
      const trace = (from, to) => {
        ctx.beginPath()
        const s = at(from)
        ctx.moveTo(s[0], s[1])
        for (let i = 1; i < pts.length; i++) { if (cum[i] > from && cum[i] < to) ctx.lineTo(pts[i][0], pts[i][1]) }
        const e = at(to)
        ctx.lineTo(e[0], e[1])
      }
      return { pts, cum, total, at, trace }
    }

    /* 1. NIGHT DRIVE: the road runs to the horizon, each section is a road sign you pass */
    const road = () => {
      const bld = Array.from({ length: 46 }, (_, i) => ({ x: i / 46, w: 0.012 + Math.random() * 0.02, h: 0.03 + Math.random() * 0.12 }))
      return () => {
        const hz = H * 0.56, vx = W * 0.5, half = W * 0.62
        ctx.clearRect(0, 0, W, H)
        ctx.fillStyle = 'rgba(8,4,18,0.78)'
        bld.forEach((b) => {
          ctx.fillRect(b.x * W, hz - b.h * H, b.w * W, b.h * H)
        })
        ctx.fillStyle = rgba(C[2], 0.45)
        bld.forEach((b, i) => { for (let j = 0; j < 4; j++) if ((i + j) % 2 === 0) ctx.fillRect(b.x * W + 3, hz - b.h * H + 6 + j * 10, 2, 2) })
        ctx.fillStyle = 'rgba(8,4,16,0.62)'
        ctx.beginPath(); ctx.moveTo(vx - 3, hz); ctx.lineTo(vx + 3, hz); ctx.lineTo(vx + half, H); ctx.lineTo(vx - half, H); ctx.fill()
        ctx.strokeStyle = rgba(C[0], 0.85); ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(vx - 3, hz); ctx.lineTo(vx - half, H); ctx.moveTo(vx + 3, hz); ctx.lineTo(vx + half, H); ctx.stroke()
        const off = (S.sp * 70 + S.t * 0.35) % 1
        ctx.fillStyle = rgba(C[2], 0.8)
        for (let i = 0; i < 16; i++) {
          const f1 = (i + off) / 16, f2 = Math.min(1, f1 + 0.03)
          const p1 = Math.pow(f1, 2.2), p2 = Math.pow(f2, 2.2)
          const y1 = hz + (H - hz) * p1, y2 = hz + (H - hz) * p2
          const w1 = 0.8 + p1 * 12, w2 = 0.8 + p2 * 12
          ctx.beginPath(); ctx.moveTo(vx - w1, y1); ctx.lineTo(vx + w1, y1); ctx.lineTo(vx + w2, y2); ctx.lineTo(vx - w2, y2); ctx.fill()
        }
        for (let k = 0; k < 9; k++) {
          const d = (k / 8 - S.sp) / 0.16
          if (d < -0.12 || d > 1.02) continue
          const f = d >= 0 ? 1 - d : 1 + -d * 1.6
          const p = Math.pow(Math.min(f, 1.5), 2.2)
          const y = hz + (H - hz) * p
          const x = vx + half * p * 1.12 + 10
          const s = 0.25 + p * 1.5
          const a = d < 0 ? Math.max(0, 1 + d * 7) : Math.min(1, (1 - d) * 5 + 0.15)
          const w = 150 * s, h = 34 * s
          ctx.strokeStyle = rgba('#ffffff', 0.5 * a); ctx.lineWidth = Math.max(1, 3 * s)
          ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y - h - 40 * s); ctx.stroke()
          ctx.fillStyle = 'rgba(12,7,24,' + 0.8 * a + ')'
          ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y - h - 40 * s, w, h, 6 * s); else ctx.rect(x, y - h - 40 * s, w, h); ctx.fill()
          ctx.strokeStyle = rgba(C[0], a); ctx.lineWidth = Math.max(1, 2 * s); ctx.stroke()
          ctx.fillStyle = rgba('#ffffff', 0.95 * a)
          ctx.font = '600 ' + Math.max(8, 13 * s) + 'px ' + MONO
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillText(NAMES[k], x + w / 2, y - h / 2 - 40 * s)
        }
        ctx.textAlign = 'left'
      }
    }

    /* 2. ROCKET LAUNCH: scroll = altitude, ground > clouds > stars > planets */
    const rocket = () => {
      const stars = Array.from({ length: 110 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.4 + 0.4, tw: Math.random() * 6 }))
      const clouds = Array.from({ length: 16 }, () => ({ x: Math.random(), alt: 0.02 + Math.random() * 0.3, s: 60 + Math.random() * 120 }))
      return () => {
        ctx.clearRect(0, 0, W, H)
        const a = S.sp, ry = H * 0.62, rx = W * 0.9
        const sa = sstep(0.08, 0.45, a)
        stars.forEach((s) => { ctx.fillStyle = rgba('#ffffff', sa * (0.35 + 0.35 * Math.sin(S.t * 2 + s.tw))); ctx.fillRect(s.x * W, s.y * H, s.r, s.r) })
        const gy = H * 0.88 + a * H * 5
        if (gy < H) {
          ctx.fillStyle = 'rgba(8,4,18,0.85)'; ctx.fillRect(0, gy, W, H - gy)
          ctx.strokeStyle = rgba(C[2], 0.7); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke()
        }
        clouds.forEach((c) => {
          const y = ry - (c.alt - a) * H * 8
          if (y < -80 || y > H + 80) return
          ctx.fillStyle = rgba(C[0], 0.13)
          for (let j = 0; j < 3; j++) { ctx.beginPath(); ctx.ellipse(c.x * W + (j - 1) * c.s * 0.45, y + (j % 2) * 6, c.s * 0.5, c.s * 0.16, 0, 0, 6.283); ctx.fill() }
        })
        const planets = [[0.55, 0.2, 70, 3, 2], [0.85, 0.7, 110, 4, 1]]
        planets.forEach((pl) => {
          const y = ry - (pl[0] - a) * H * 6
          if (y < -150 || y > H + 150) return
          const x = pl[1] * W, r = pl[2]
          const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r)
          g.addColorStop(0, rgba(C[pl[3]], 0.75)); g.addColorStop(1, 'rgba(10,6,22,0.9)')
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill()
          ctx.strokeStyle = rgba(C[pl[4]], 0.6); ctx.lineWidth = 3
          ctx.beginPath(); ctx.ellipse(x, y, r * 1.6, r * 0.38, -0.3, 0, 6.283); ctx.stroke()
        })
        ctx.font = '11px ' + MONO; ctx.textBaseline = 'middle'
        for (let m = 0; m <= 10; m++) {
          const y = ry - (m / 10 - a) * H * 3
          if (y < 20 || y > H - 20) continue
          ctx.fillStyle = rgba('#ffffff', 0.35)
          ctx.fillRect(10, y, 14, 1)
          ctx.fillText(Math.round(m * 120) + ' km', 30, y)
        }
        if (S.v > 0.04) {
          ctx.strokeStyle = rgba('#ffffff', 0.2 * S.v); ctx.lineWidth = 1
          for (let i = 0; i < 14; i++) { const x = ((i * 977) % 1000) / 1000 * W, y0 = ((i * 613 + S.t * 900) % 1000) / 1000 * H; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + 60 + S.v * 120); ctx.stroke() }
        }
        ctx.save(); ctx.translate(rx, ry + Math.sin(S.t * 30) * (0.4 + S.v * 2))
        const fl = 26 + Math.random() * 14 + S.v * 50
        ctx.fillStyle = rgba(C[1], 0.85); ctx.beginPath(); ctx.moveTo(-7, 22); ctx.lineTo(0, 22 + fl); ctx.lineTo(7, 22); ctx.fill()
        ctx.fillStyle = rgba(C[2], 0.95); ctx.beginPath(); ctx.moveTo(-4, 22); ctx.lineTo(0, 22 + fl * 0.6); ctx.lineTo(4, 22); ctx.fill()
        ctx.fillStyle = rgba(C[1], 0.9)
        ctx.beginPath(); ctx.moveTo(-10, 6); ctx.lineTo(-20, 26); ctx.lineTo(-8, 20); ctx.fill()
        ctx.beginPath(); ctx.moveTo(10, 6); ctx.lineTo(20, 26); ctx.lineTo(8, 20); ctx.fill()
        ctx.fillStyle = '#f3f0ff'; ctx.strokeStyle = rgba(C[0], 0.9); ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(0, -36); ctx.bezierCurveTo(13, -20, 13, 10, 8, 22); ctx.lineTo(-8, 22); ctx.bezierCurveTo(-13, 10, -13, -20, 0, -36); ctx.fill(); ctx.stroke()
        ctx.fillStyle = rgba(C[4], 0.95); ctx.beginPath(); ctx.arc(0, -10, 4.5, 0, 6.283); ctx.fill()
        ctx.restore()
      }
    }

    /* 3. HYPERSPACE: scroll speed = warp speed, a glowing gate passes at every section */
    const warp = () => {
      const st = Array.from({ length: 220 }, () => ({ a: Math.random() * 6.283, r: Math.random(), s: 0.3 + Math.random() * 0.7, c: rnd(5) }))
      return (dt) => {
        ctx.clearRect(0, 0, W, H)
        const cx = W * 0.64, cy = H * 0.46, R = Math.hypot(W, H) * 0.6
        const sp = 0.25 + S.v * 3.2
        ctx.lineCap = 'round'
        st.forEach((s) => {
          s.r += (s.s * dt / 1000) * sp * 0.5
          if (s.r > 1) { s.r = 0.02; s.a = Math.random() * 6.283 }
          const r0 = s.r * R, r1 = Math.max(0, s.r - 0.015 * (0.5 + S.v * 5)) * R
          ctx.strokeStyle = rgba(C[s.c], Math.min(1, s.r * 1.4) * 0.85)
          ctx.lineWidth = 0.6 + s.r * 1.8
          ctx.beginPath(); ctx.moveTo(cx + Math.cos(s.a) * r1, cy + Math.sin(s.a) * r1); ctx.lineTo(cx + Math.cos(s.a) * r0, cy + Math.sin(s.a) * r0); ctx.stroke()
        })
        for (let j = 0; j < 3; j++) {
          const p = (((S.sp * 9 + j / 3) % 1) + 1) % 1
          ctx.strokeStyle = rgba(C[(j + 1) % 5], (1 - p) * 0.55); ctx.lineWidth = 2 + p * 7
          ctx.beginPath(); ctx.arc(cx, cy, p * p * R * 0.9, 0, 6.283); ctx.stroke()
        }
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.18)
        g.addColorStop(0, rgba(C[0], 0.35)); g.addColorStop(1, rgba(C[0], 0))
        ctx.fillStyle = g; ctx.fillRect(cx - R * 0.2, cy - R * 0.2, R * 0.4, R * 0.4)
      }
    }

    /* 4. MOUNTAIN CLIMB: a path to the summit, a flag at every section, you climb as you scroll */
    const mount = () => {
      const P = makePath([[0.06, 0.96], [0.3, 0.88], [0.18, 0.78], [0.45, 0.7], [0.3, 0.58], [0.58, 0.5], [0.45, 0.4], [0.72, 0.32], [0.62, 0.22], [0.86, 0.14]])
      const layers = [{ seed: 1, base: 0.5, amp: 0.16, k: 0.25, a: 0.3, col: 3 }, { seed: 4, base: 0.64, amp: 0.18, k: 0.5, a: 0.5, col: 4 }, { seed: 9, base: 0.8, amp: 0.2, k: 0.9, a: 0.7, col: 0 }]
      const stars = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random() * 0.6, r: Math.random() * 1.3 + 0.3 }))
      return () => {
        ctx.clearRect(0, 0, W, H)
        const sa = sstep(0.25, 0.8, S.sp)
        stars.forEach((s) => { ctx.fillStyle = rgba('#ffffff', sa * 0.6); ctx.fillRect(s.x * W, s.y * H, s.r, s.r) })
        layers.forEach((L) => {
          const dy = S.sp * L.k * H * 0.12
          ctx.beginPath(); ctx.moveTo(0, H + 10)
          for (let i = 0; i <= 60; i++) {
            const x = i / 60
            const y = L.base + (Math.sin(x * 6 + L.seed) * 0.5 + Math.sin(x * 14 + L.seed * 2) * 0.25) * L.amp
            ctx.lineTo(x * W, y * H + dy)
          }
          ctx.lineTo(W, H + 10); ctx.closePath()
          ctx.fillStyle = 'rgba(10,6,22,' + L.a + ')'; ctx.fill()
          ctx.strokeStyle = rgba(C[L.col], 0.45); ctx.lineWidth = 1.6; ctx.stroke()
        })
        const here = S.sp * P.total
        ctx.lineCap = 'round'
        ctx.setLineDash([2, 9]); ctx.strokeStyle = rgba(C[2], 0.5); ctx.lineWidth = 3; P.trace(0, P.total); ctx.stroke()
        ctx.setLineDash([]); ctx.strokeStyle = rgba(C[2], 0.9); ctx.lineWidth = 3.5; P.trace(0, Math.max(1, here)); ctx.stroke()
        ctx.font = '11px ' + MONO; ctx.textBaseline = 'middle'
        for (let k = 0; k < 9; k++) {
          const q = P.at((k / 8) * P.total), on = S.sp >= k / 8 - 0.001
          const big = k === 8 ? 1.5 : 1
          ctx.strokeStyle = rgba('#ffffff', on ? 0.8 : 0.35); ctx.lineWidth = 1.6
          ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[0], q[1] - 26 * big); ctx.stroke()
          ctx.fillStyle = on ? rgba(C[1], 0.95) : rgba(C[3], 0.5)
          ctx.beginPath(); ctx.moveTo(q[0], q[1] - 26 * big); ctx.lineTo(q[0] + 16 * big, q[1] - 20 * big); ctx.lineTo(q[0], q[1] - 14 * big); ctx.fill()
          ctx.fillStyle = rgba('#ffffff', on ? 0.8 : 0.4); ctx.fillText(NAMES[k], q[0] + 20 * big, q[1] - 8)
        }
        const c = P.at(here)
        ctx.fillStyle = rgba(C[0], 0.25); ctx.beginPath(); ctx.arc(c[0], c[1], 16 + Math.sin(S.t * 4) * 3, 0, 6.283); ctx.fill()
        ctx.fillStyle = rgba('#ffffff', 0.95); ctx.beginPath(); ctx.arc(c[0], c[1], 5.5, 0, 6.283); ctx.fill()
        ctx.strokeStyle = rgba(C[0], 1); ctx.lineWidth = 2; ctx.stroke()
      }
    }

    /* 5. METRO MAP: your roadmap as a transit line, the train rides to the next station */
    const metro = () => {
      const main = makePath([[0.05, 0.8], [0.28, 0.8], [0.4, 0.66], [0.55, 0.66], [0.66, 0.44], [0.8, 0.44], [0.9, 0.28], [0.96, 0.28]])
      const l2 = makePath([[0.05, 0.3], [0.2, 0.3], [0.3, 0.45], [0.5, 0.45], [0.6, 0.58], [0.92, 0.58]])
      const l3 = makePath([[0.3, 0.95], [0.45, 0.82], [0.7, 0.82], [0.8, 0.7], [0.97, 0.7]])
      return () => {
        ctx.clearRect(0, 0, W, H)
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'
        const faint = (P, col) => { ctx.strokeStyle = rgba(C[col], 0.2); ctx.lineWidth = 6; P.trace(0, P.total); ctx.stroke() }
        faint(l2, 4); faint(l3, 3)
        const here = S.sp * main.total
        ctx.strokeStyle = rgba(C[0], 0.3); ctx.lineWidth = 8; main.trace(0, main.total); ctx.stroke()
        ctx.strokeStyle = rgba(C[0], 0.25); ctx.lineWidth = 18; main.trace(0, Math.max(1, here)); ctx.stroke()
        ctx.strokeStyle = rgba(C[0], 0.95); ctx.lineWidth = 8; main.trace(0, Math.max(1, here)); ctx.stroke()
        ctx.font = '600 11.5px ' + MONO; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        for (let k = 0; k < 9; k++) {
          const q = main.at((k / 8) * main.total), on = S.sp >= k / 8 - 0.001
          ctx.beginPath(); ctx.arc(q[0], q[1], 9, 0, 6.283)
          ctx.fillStyle = on ? rgba('#ffffff', 0.95) : 'rgba(12,7,24,0.9)'; ctx.fill()
          ctx.strokeStyle = rgba(C[0], 1); ctx.lineWidth = 3; ctx.stroke()
          ctx.fillStyle = rgba('#ffffff', on ? 0.9 : 0.5)
          ctx.fillText(NAMES[k], q[0], q[1] + (k % 2 ? 24 : -24))
        }
        for (let i = 3; i >= 0; i--) {
          const q = main.at(Math.max(0, here - i * 24))
          ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(q[2])
          ctx.fillStyle = i === 0 ? rgba(C[1], 1) : rgba(C[1], 0.8)
          ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(-11, -6.5, 22, 13, 4); else ctx.rect(-11, -6.5, 22, 13); ctx.fill()
          ctx.fillStyle = 'rgba(12,7,24,0.85)'; ctx.fillRect(-6, -3, 4, 3); ctx.fillRect(2, -3, 4, 3)
          ctx.restore()
        }
        ctx.textAlign = 'left'
      }
    }

    const makers = [null, road, rocket, warp, mount, metro]
    const resize = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1)
      W = window.innerWidth; H = window.innerHeight
      cv.width = W * dpr; cv.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      readColors()
      step = makers[scene]()
      S.sp = target()
      if (reduce) { step(33) }
    }
    const tick = (dt) => {
      const tp = target()
      const d = tp - S.sp
      S.sp += d * 0.14
      S.v = S.v * 0.85 + Math.min(1, Math.abs(d) * 45) * 0.15
      S.t += dt / 1000
      step(dt)
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
    const onScroll = () => { if (reduce) { S.sp = target(); step(33) } }
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, { passive: true })
    if (!reduce) raf = requestAnimationFrame(loop)
    return () => { alive = false; cancelAnimationFrame(raf); clearTimeout(rt); window.removeEventListener('resize', onResize); window.removeEventListener('scroll', onScroll) }
  }, [scene])

  return <canvas ref={ref} className="dev-canvas" />
}
