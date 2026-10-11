import React, { useEffect, useRef } from 'react'

/* Maths backgrounds (21-29): variations of Constellation (12), Vortex (18) and Halftone (19).
   Each one is driven by a real maths idea: rotation matrices + perspective projection, k-nearest-neighbour graphs
   with random walks, Newtonian gravity (symplectic integration), the golden angle, the Lorenz system (RK4),
   Fourier epicycles, wave interference, fractal height fields and the Fibonacci sphere. */
const FALLBACK = ['#ff4d8d', '#ff8a3d', '#ffd166', '#b45cff', '#3ee0ff']
const GA = 2.399963229728653 // golden angle in radians (pi * (3 - sqrt(5)))
const TAU = Math.PI * 2
const rgba = (hex, a) => {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim())
  if (!m) return 'rgba(255,255,255,' + a + ')'
  const n = parseInt(m[1], 16)
  return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'
}
const R = (a, b) => a + Math.random() * (b - a)
const mod = (x, m) => ((x % m) + m) % m
const clamp = (x, a, b) => Math.max(a, Math.min(b, x))

export default function MathScene({ scene }) {
  const ref = useRef(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return undefined
    const ctx = cv.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let W = 0, H = 0, raf = 0, last = 0, frame = 0, alive = true, step = () => {}
    let C = FALLBACK.slice()
    const S = { sp: 0, v: 0, t: 0, mx: 0, my: 0, ax: 0, ay: 0 }
    const M = { x: -1, y: -1 }
    const small = () => W < 700
    const readColors = () => {
      const cs = getComputedStyle(document.documentElement)
      C = FALLBACK.map((f, i) => (cs.getPropertyValue('--c' + (i + 1)) || '').trim() || f)
    }
    const target = () => {
      const q = new URLSearchParams(window.location.search).get('p')
      if (q !== null) return clamp(parseFloat(q) || 0, 0, 1)
      const max = document.documentElement.scrollHeight - window.innerHeight
      return max > 0 ? clamp(window.scrollY / max, 0, 1) : 0
    }
    /* rotation about X then Y (rotation matrices), result written into a reused vector */
    const P = [0, 0, 0]
    const rot = (x, y, z) => {
      const cx = Math.cos(S.ax), sx = Math.sin(S.ax), cy = Math.cos(S.ay), sy = Math.sin(S.ay)
      const y1 = y * cx - z * sx, z1 = y * sx + z * cx
      P[0] = x * cy + z1 * sy; P[1] = y1; P[2] = -x * sy + z1 * cy
      return P
    }
    const cen = () => [W < 900 ? W * 0.5 : W * 0.64, H * 0.47]
    const unit = () => Math.min(W, H) * (small() ? 0.42 : 0.5)

    /* 21. CONSTELLATION 3D: points in a cube, rotation matrices + perspective, links by true 3D distance */
    const net3 = () => {
      const n = small() ? 70 : 120
      const p = Array.from({ length: n }, () => ({ x: R(-1, 1), y: R(-1, 1), z: R(-1, 1), vx: R(-0.002, 0.002), vy: R(-0.002, 0.002), vz: R(-0.002, 0.002) }))
      const sx = new Float32Array(n), sy = new Float32Array(n), sz = new Float32Array(n), sa = new Float32Array(n)
      return () => {
        ctx.clearRect(0, 0, W, H)
        const c = cen(), u = unit()
        const mv = 1 + S.v * 5
        for (let i = 0; i < n; i++) {
          const q = p[i]
          q.x = mod(q.x + 1 + q.vx * mv, 2) - 1; q.y = mod(q.y + 1 + q.vy * mv, 2) - 1; q.z = mod(q.z + 1 + q.vz * mv, 2) - 1
          const r = rot(q.x, q.y, q.z)
          const s = 3 / (3 + r[2])
          sx[i] = c[0] + r[0] * u * s; sy[i] = c[1] + r[1] * u * s; sz[i] = r[2]; sa[i] = clamp(0.5 - r[2] * 0.4, 0.12, 1)
        }
        ctx.lineWidth = 1
        for (let i = 0; i < n; i++) {
          const a = p[i]
          for (let j = i + 1; j < n; j++) {
            const b = p[j]
            const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
            if (d < 0.48) {
              ctx.strokeStyle = rgba(C[i % 5], (1 - d / 0.48) * 0.5 * Math.min(sa[i], sa[j]))
              ctx.beginPath(); ctx.moveTo(sx[i], sy[i]); ctx.lineTo(sx[j], sy[j]); ctx.stroke()
            }
          }
        }
        for (let i = 0; i < n; i++) {
          ctx.fillStyle = rgba(C[i % 5], 0.35 + 0.65 * sa[i])
          ctx.beginPath(); ctx.arc(sx[i], sy[i], 0.9 + 2.4 * sa[i], 0, TAU); ctx.fill()
        }
      }
    }

    /* 22. NEURAL GRAPH: k-nearest-neighbour graph, signals random-walk along the edges */
    const graph = () => {
      const n = small() ? 56 : 92, K = 3
      const p = Array.from({ length: n }, () => ({ x: R(0, W), y: R(0, H), vx: R(-0.25, 0.25), vy: R(-0.25, 0.25) }))
      const nb = Array.from({ length: n }, () => [])
      const pulses = Array.from({ length: small() ? 8 : 16 }, () => ({ a: (Math.random() * n) | 0, b: 0, t: 1, c: (Math.random() * 5) | 0 }))
      const d2 = new Float32Array(n)
      return (dt) => {
        ctx.clearRect(0, 0, W, H)
        const k = 1 + S.v * 5
        p.forEach((q) => { q.x = mod(q.x + q.vx * k, W); q.y = mod(q.y + q.vy * k, H) })
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) d2[j] = i === j ? 1e12 : (p[i].x - p[j].x) ** 2 + (p[i].y - p[j].y) ** 2
          const best = []
          for (let m = 0; m < K; m++) { let bj = -1, bd = 1e12; for (let j = 0; j < n; j++) if (d2[j] < bd && best.indexOf(j) < 0) { bd = d2[j]; bj = j } best.push(bj) }
          nb[i] = best
        }
        ctx.lineWidth = 1
        for (let i = 0; i < n; i++) nb[i].forEach((j) => {
          const d = Math.sqrt((p[i].x - p[j].x) ** 2 + (p[i].y - p[j].y) ** 2)
          ctx.strokeStyle = rgba(C[i % 5], 0.42 / (1 + d / 140)); ctx.beginPath(); ctx.moveTo(p[i].x, p[i].y); ctx.lineTo(p[j].x, p[j].y); ctx.stroke()
        })
        for (let i = 0; i < n; i++) { ctx.fillStyle = rgba(C[i % 5], 0.85); ctx.beginPath(); ctx.arc(p[i].x, p[i].y, 2.1, 0, TAU); ctx.fill() }
        pulses.forEach((u) => {
          if (u.t >= 1) {
            const from = u.b || u.a, opts = nb[from].filter((x) => x !== u.a)
            u.a = from; u.b = (opts.length ? opts[(Math.random() * opts.length) | 0] : nb[from][0]); u.t = 0
          }
          const A = p[u.a], B = p[u.b], len = Math.hypot(A.x - B.x, A.y - B.y) + 1
          u.t = Math.min(1, u.t + (dt / 1000) * (160 + S.v * 500) / len)
          const x = A.x + (B.x - A.x) * u.t, y = A.y + (B.y - A.y) * u.t
          const g = ctx.createRadialGradient(x, y, 0, x, y, 14)
          g.addColorStop(0, rgba(C[u.c], 0.95)); g.addColorStop(1, rgba(C[u.c], 0))
          ctx.fillStyle = g; ctx.fillRect(x - 14, y - 14, 28, 28)
        })
      }
    }

    /* 23. GRAVITY WEB: Newtonian gravity from orbiting masses (and your cursor), symplectic Euler integration */
    const gravity = () => {
      const n = small() ? 80 : 135
      const p = Array.from({ length: n }, () => { const a = R(0, TAU), r = R(80, Math.min(W, H) * 0.5); return { x: W * 0.55 + Math.cos(a) * r, y: H * 0.47 + Math.sin(a) * r, vx: -Math.sin(a) * 1.1, vy: Math.cos(a) * 1.1 } })
      return () => {
        ctx.clearRect(0, 0, W, H)
        const c = cen(), G = 2600 * (1 + S.v * 3), eps2 = 3600
        const A = [
          [c[0] + Math.cos(S.t * 0.21) * W * 0.22, c[1] + Math.sin(S.t * 0.34) * H * 0.2, 1],
          [c[0] + Math.cos(S.t * 0.15 + 2) * W * 0.3, c[1] + Math.sin(S.t * 0.27 + 1) * H * 0.26, 0.7],
          [c[0] + Math.cos(S.t * 0.4 + 4) * W * 0.12, c[1] + Math.sin(S.t * 0.3 + 3) * H * 0.12, 0.5]
        ]
        if (M.x >= 0) A.push([M.x, M.y, 1.8])
        for (let i = 0; i < n; i++) {
          const q = p[i]
          let ax = 0, ay = 0
          for (let k = 0; k < A.length; k++) {
            const dx = A[k][0] - q.x, dy = A[k][1] - q.y
            const r2 = dx * dx + dy * dy + eps2, inv = G * A[k][2] / (r2 * Math.sqrt(r2))
            ax += dx * inv; ay += dy * inv
          }
          q.vx = (q.vx + ax) * 0.9985; q.vy = (q.vy + ay) * 0.9985
          const sp = Math.hypot(q.vx, q.vy); if (sp > 7) { q.vx *= 7 / sp; q.vy *= 7 / sp }
          q.x = mod(q.x + q.vx, W); q.y = mod(q.y + q.vy, H)
        }
        ctx.lineWidth = 1
        for (let i = 0; i < n; i++) {
          const a = p[i]
          for (let j = i + 1; j < n; j++) {
            const dx = a.x - p[j].x, dy = a.y - p[j].y
            if (dx * dx + dy * dy < 7000) { ctx.strokeStyle = rgba(C[i % 5], (1 - (dx * dx + dy * dy) / 7000) * 0.4); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(p[j].x, p[j].y); ctx.stroke() }
          }
          ctx.strokeStyle = rgba(C[i % 5], 0.55); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.x - a.vx * 5, a.y - a.vy * 5); ctx.stroke()
          ctx.fillStyle = rgba(C[i % 5], 0.95); ctx.beginPath(); ctx.arc(a.x, a.y, 1.8, 0, TAU); ctx.fill()
        }
      }
    }

    /* 24. GOLDEN-ANGLE GALAXY: phyllotaxis r = c*sqrt(i), theta = i*137.5deg; scroll nudges the angle and the arms morph */
    const phyllo = () => {
      const N = small() ? 520 : 940
      return () => {
        ctx.clearRect(0, 0, W, H)
        const c = cen(), Rm = unit() * 1.15, k = Rm / Math.sqrt(N)
        const delta = 0.0022 * Math.sin(S.t * 0.07) + (S.sp - 0.5) * 0.005
        const rotA = S.t * 0.05 + S.mx * 0.4
        for (let i = 1; i < N; i++) {
          const th = i * (GA + delta) + rotA
          const r = k * Math.sqrt(i) * (1 + 0.03 * Math.sin(S.t * 0.8 - i * 0.02))
          const f = i / N
          ctx.fillStyle = rgba(C[i % 5], 0.22 + 0.7 * f)
          ctx.beginPath(); ctx.arc(c[0] + Math.cos(th) * r, c[1] + Math.sin(th) * r, 0.7 + f * 2.5, 0, TAU); ctx.fill()
        }
      }
    }

    /* 25. LORENZ ATTRACTOR: the chaotic system dx=s(y-x), dy=x(r-z)-y, dz=xy-bz solved with RK4, drawn in 3D */
    const lorenz = () => {
      const m = small() ? 4 : 7, L = 200
      const sg = 10, rh = 28, bt = 8 / 3
      const f = (x, y, z) => [sg * (y - x), x * (rh - z) - y, x * y - bt * z]
      const bodies = Array.from({ length: m }, (_, i) => ({ s: [1 + i * 0.001, 1, 1 + i * 0.37], tr: [], c: i % 5 }))
      return () => {
        ctx.clearRect(0, 0, W, H)
        const c = cen(), u = unit() / 24
        bodies.forEach((b) => {
          for (let k = 0; k < 3; k++) {
            const h = 0.006, s = b.s
            const a = f(s[0], s[1], s[2])
            const b2 = f(s[0] + h * a[0] / 2, s[1] + h * a[1] / 2, s[2] + h * a[2] / 2)
            const c2 = f(s[0] + h * b2[0] / 2, s[1] + h * b2[1] / 2, s[2] + h * b2[2] / 2)
            const d = f(s[0] + h * c2[0], s[1] + h * c2[1], s[2] + h * c2[2])
            s[0] += h * (a[0] + 2 * b2[0] + 2 * c2[0] + d[0]) / 6; s[1] += h * (a[1] + 2 * b2[1] + 2 * c2[1] + d[1]) / 6; s[2] += h * (a[2] + 2 * b2[2] + 2 * c2[2] + d[2]) / 6
          }
          b.tr.push([b.s[0], b.s[1], b.s[2] - 25]); if (b.tr.length > L) b.tr.shift()
          const pts = b.tr.map((q) => { const r = rot(q[0] / 24 * 1.2, q[1] / 24 * 1.2, q[2] / 24 * 1.2); const s = 3 / (3 + r[2]); return [c[0] + r[0] * u * 24 * s, c[1] + r[1] * u * 24 * s] })
          ctx.lineWidth = 1.5
          for (let i = 0; i < pts.length - 6; i += 6) {
            ctx.strokeStyle = rgba(C[b.c], (i / pts.length) * 0.85)
            ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); for (let j = 1; j <= 6; j++) ctx.lineTo(pts[i + j][0], pts[i + j][1]); ctx.stroke()
          }
          const h = pts[pts.length - 1]
          if (h) { const g = ctx.createRadialGradient(h[0], h[1], 0, h[0], h[1], 12); g.addColorStop(0, rgba(C[b.c], 1)); g.addColorStop(1, rgba(C[b.c], 0)); ctx.fillStyle = g; ctx.fillRect(h[0] - 12, h[1] - 12, 24, 24) }
        })
      }
    }

    /* 26. EPICYCLE BLOOM: a Fourier sum of rotating vectors, z(t) = sum a_k e^(i f_k t), slowly detuned so the flower morphs */
    const epi = () => {
      const A = [0.5, 0.3, 0.17, 0.08], F = [1, -5, 13, -29]
      return () => {
        ctx.clearRect(0, 0, W, H)
        ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 1.6
        const c = cen(), Rm = unit() * 1.1
        const T = S.t * 0.5 + S.sp * 8
        for (let w = 0; w < 5; w++) {
          const off = w * 0.9
          const pt = (tau) => {
            let x = 0, y = 0
            for (let k = 0; k < 4; k++) { const fk = F[k] + 0.06 * Math.sin(S.t * 0.1 + k + off * 0.2); const ph = fk * tau + off * k; x += A[k] * Math.cos(ph); y += A[k] * Math.sin(ph) }
            return [c[0] + x * Rm, c[1] + y * Rm]
          }
          const S0 = 150
          for (let j = 0; j < S0; j += 5) {
            ctx.strokeStyle = rgba(C[w], (1 - j / S0) * 0.75)
            ctx.beginPath()
            for (let q = 0; q <= 5; q++) { const z = pt(T - (j + q) * 0.03); if (q === 0) ctx.moveTo(z[0], z[1]); else ctx.lineTo(z[0], z[1]) }
            ctx.stroke()
          }
          const h = pt(T); ctx.fillStyle = rgba(C[w], 1); ctx.beginPath(); ctx.arc(h[0], h[1], 2.6, 0, TAU); ctx.fill()
        }
        ctx.globalCompositeOperation = 'source-over'
      }
    }

    /* 27. WAVE INTERFERENCE: dot size = superposition of circular waves from moving sources (and your cursor) */
    const interf = () => () => {
      ctx.clearRect(0, 0, W, H)
      const gap = small() ? 24 : 28
      const src = [[W * (0.5 + 0.3 * Math.sin(S.t * 0.31)), H * (0.5 + 0.3 * Math.cos(S.t * 0.23))], [W * (0.5 + 0.34 * Math.cos(S.t * 0.17 + 1)), H * (0.5 + 0.28 * Math.sin(S.t * 0.29 + 2))], [W * (0.5 + 0.2 * Math.sin(S.t * 0.4 + 4)), H * (0.5 + 0.34 * Math.cos(S.t * 0.13 + 3))]]
      if (M.x >= 0) src.push([M.x, M.y])
      const kk = 0.05, om = 1.7 + S.v * 4
      for (let y = gap / 2; y < H; y += gap) {
        for (let x = gap / 2; x < W; x += gap) {
          let f = 0
          for (let s = 0; s < src.length; s++) { const d = Math.hypot(x - src[s][0], y - src[s][1]); f += Math.sin(kk * d - om * S.t + S.sp * 8) / (1 + d / 380) }
          f = clamp(f / src.length * 2.2, -1, 1)
          const ci = Math.min(4, Math.floor((f * 0.5 + 0.5) * 5))
          ctx.fillStyle = rgba(C[ci], 0.1 + (f + 1) * 0.24)
          ctx.beginPath(); ctx.arc(x, y, 0.9 + (f + 1) * 1.9, 0, TAU); ctx.fill()
        }
      }
    }

    /* 28. DOT TERRAIN 3D: a fractal height field h(x,z) seen through a perspective camera, scroll = flying forward */
    const terrain = () => () => {
      ctx.clearRect(0, 0, W, H)
      const nx = small() ? 34 : 56, nz = small() ? 26 : 38
      const hor = H * 0.4, u = W * 0.2, camH = 0.95
      const trav = S.t * 0.35 + S.sp * 7
      for (let j = nz - 1; j >= 0; j--) {
        const wz = (j / (nz - 1)) * 3.2
        const s = 1 / (0.35 + wz * 0.55)
        const zz = wz + trav
        for (let i = 0; i < nx; i++) {
          const wx = (i / (nx - 1) - 0.5) * 3.8
          const h = 0.2 * (Math.sin(1.7 * wx + 0.6 * zz) + Math.sin(2.3 * zz + 0.9 * wx) + 0.5 * Math.sin(4.1 * wx + 3.3 * zz) + 0.25 * Math.sin(8 * wx - 6 * zz))
          const X = W * 0.5 + wx * s * u, Y = hor + (camH - h) * s * u * 0.9
          if (X < -10 || X > W + 10 || Y > H + 10) continue
          const ci = clamp(Math.floor((h / 0.5 + 1) * 2.5), 0, 4)
          ctx.fillStyle = rgba(C[ci], clamp(s * 0.4, 0.08, 0.85))
          ctx.beginPath(); ctx.arc(X, Y, 0.7 + s * 1.15, 0, TAU); ctx.fill()
        }
      }
    }

    /* 29. FIBONACCI SPHERE: points spread by the golden angle, rotated and perspective-projected, with a travelling surface wave */
    const sphere = () => {
      const N = small() ? 420 : 760
      return () => {
        ctx.clearRect(0, 0, W, H)
        const c = cen(), Rm = unit() * 0.78
        for (let i = 0; i < N; i++) {
          const y = 1 - (2 * (i + 0.5)) / N, r = Math.sqrt(1 - y * y), ph = i * GA
          const rho = 1 + 0.08 * Math.sin(6 * y + S.t * 1.4) + 0.05 * Math.sin(4 * ph + S.t)
          const q = rot(Math.cos(ph) * r * rho, y * rho, Math.sin(ph) * r * rho)
          const s = 3.2 / (3.2 + q[2]), a = clamp((q[2] + 1.2) / 2.4, 0, 1)
          ctx.fillStyle = rgba(C[i % 5], 0.14 + 0.82 * (1 - a))
          ctx.beginPath(); ctx.arc(c[0] + q[0] * Rm * s, c[1] + q[1] * Rm * s, (0.7 + 2.2 * (1 - a)) * s, 0, TAU); ctx.fill()
        }
      }
    }


    /* 30. VORTEX PRO: your Vortex (18), rebuilt as a real 3D galaxy.
       Maths: logarithmic spiral arms, Kepler shear (inner stars orbit faster: w ~ r^-1.5), rotation matrices for the
       yaw/pitch camera, perspective projection, depth-based size and alpha, orbiting comets with trails. */
    const vpro = () => {
      const n = small() ? 700 : 1500
      const arms = 3
      const p = Array.from({ length: n }, (_, i) => {
        const r = Math.pow(Math.random(), 0.65)
        return { r, a0: (i % arms) * TAU / arms + Math.log(0.08 + r) * 2.2 + R(-1, 1) * 0.35 * (0.3 + r), y: R(-1, 1) * 0.07 * (1 - r * 0.5), c: i % 5, s: R(1.5, 3.3), dx: 0, dy: 0, vx: 0, vy: 0 }
      })
      const comets = Array.from({ length: small() ? 3 : 5 }, (_, i) => ({ r: R(0.3, 0.95), a: R(0, TAU), y: R(-0.08, 0.08), c: i % 5, tr: [] }))
      const stars = Array.from({ length: small() ? 60 : 130 }, () => ({ x: Math.random(), y: Math.random(), z: R(0.2, 1) }))
      let spin = 0
      const proj = (x, y, z, yaw, pit, c, u) => {
        const cy = Math.cos(yaw), sy = Math.sin(yaw), cx = Math.cos(pit), sx = Math.sin(pit)
        const x1 = x * cy + z * sy, z1 = -x * sy + z * cy
        const y2 = y * cx - z1 * sx, z2 = y * sx + z1 * cx
        const s = 2.6 / (2.6 + z2)
        P[0] = c[0] + x1 * u * s; P[1] = c[1] + y2 * u * s; P[2] = s; P[3] = z2
        return P
      }
      P.push(0)
      return (dt) => {
        ctx.clearRect(0, 0, W, H)
        const c = cen(), u = Math.max(W, H) * (small() ? 0.34 : 0.42)
        const yaw = S.mx * 0.6, pit = 1.0 + S.my * 0.3 + 0.08 * Math.sin(S.t * 0.2)
        spin += (dt / 1000) * (0.9 + S.v * 4)
        ctx.globalAlpha = 1
        for (let i = 0; i < stars.length; i++) {
          const q = stars[i]
          ctx.fillStyle = C[i % 5]; ctx.globalAlpha = 0.12 + 0.3 * q.z * (0.6 + 0.4 * Math.sin(S.t * 1.5 + i))
          ctx.fillRect(q.x * W - S.mx * 24 * q.z, q.y * H - S.my * 16 * q.z, 1 + q.z, 1 + q.z)
        }
        ctx.globalAlpha = 1
        const g = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], u * 0.4)
        g.addColorStop(0, rgba(C[2], 0.4)); g.addColorStop(0.4, rgba(C[0], 0.14)); g.addColorStop(1, rgba(C[0], 0))
        ctx.fillStyle = g; ctx.fillRect(c[0] - u * 0.45, c[1] - u * 0.45, u * 0.9, u * 0.9)
        for (let i = 0; i < n; i++) {
          const q = p[i]
          const ang = q.a0 + spin * 0.35 / Math.pow(0.15 + q.r, 1.5) * 0.35 + S.sp * 3
          const r = proj(Math.cos(ang) * q.r, q.y, Math.sin(ang) * q.r, yaw, pit, c, u)
          const X = r[0] + q.dx, Y = r[1] + q.dy
          let near = 0
          if (M.x >= 0) {
            const ex = X - M.x, ey = Y - M.y, d2 = ex * ex + ey * ey
            if (d2 < 52900) {
              const d = Math.sqrt(d2) + 0.001
              near = 1 - d / 230
              const f = near * near
              q.vx += (ex / d) * f * 2.6 + (-ey / d) * f * 1.6
              q.vy += (ey / d) * f * 2.6 + (ex / d) * f * 1.6
            }
          }
          if (S.shk > 0.03) {
            const ex = X - S.kx, ey = Y - S.ky, d = Math.sqrt(ex * ex + ey * ey) + 0.001
            if (d < 360) { const f = S.shk * (1 - d / 360); q.vx += (ex / d) * f * 14; q.vy += (ey / d) * f * 14 }
          }
          q.vx += -q.dx * 0.07; q.vy += -q.dy * 0.07
          q.vx *= 0.88; q.vy *= 0.88
          q.dx += q.vx; q.dy += q.vy
          ctx.fillStyle = C[q.c]
          ctx.globalAlpha = clamp(0.28 + (1 - q.r) * 0.55 - r[3] * 0.18 + near * 0.5, 0.1, 1)
          const sz = q.s * r[2] * (0.8 + (1 - q.r) * 0.8) * (1 + near * 0.8)
          ctx.fillRect(X, Y, sz, sz)
        }
        ctx.globalAlpha = 1
        ctx.globalCompositeOperation = 'lighter'
        comets.forEach((k) => {
          k.a += (dt / 1000) * (1.2 + S.v * 3) / Math.pow(0.2 + k.r, 1.2)
          const r = proj(Math.cos(k.a) * k.r, k.y, Math.sin(k.a) * k.r, yaw, pit, c, u)
          k.tr.push(r[0], r[1]); if (k.tr.length > 52) k.tr.splice(0, 2)
          for (let j = 2; j < k.tr.length; j += 2) {
            ctx.strokeStyle = rgba(C[k.c], (j / k.tr.length) * 0.6)
            ctx.lineWidth = 0.6 + (j / k.tr.length) * 2
            ctx.beginPath(); ctx.moveTo(k.tr[j - 2], k.tr[j - 1]); ctx.lineTo(k.tr[j], k.tr[j + 1]); ctx.stroke()
          }
          const h = ctx.createRadialGradient(r[0], r[1], 0, r[0], r[1], 9)
          h.addColorStop(0, rgba(C[k.c], 0.9)); h.addColorStop(1, rgba(C[k.c], 0))
          ctx.fillStyle = h; ctx.fillRect(r[0] - 9, r[1] - 9, 18, 18)
        })
        if (M.x >= 0) {
          const gl = ctx.createRadialGradient(M.x, M.y, 0, M.x, M.y, 130)
          gl.addColorStop(0, rgba(C[0], 0.22)); gl.addColorStop(1, rgba(C[0], 0))
          ctx.fillStyle = gl; ctx.fillRect(M.x - 130, M.y - 130, 260, 260)
        }
        ctx.globalCompositeOperation = 'source-over'
      }
    }

    const makers = [null, net3, graph, gravity, phyllo, lorenz, epi, interf, terrain, sphere, vpro]
    const tick = (dt) => {
      const d = target() - S.sp
      S.sp += d * 0.14
      S.v = S.v * 0.85 + Math.min(1, Math.abs(d) * 45) * 0.15
      S.t += dt / 1000
      S.shk = (S.shk || 0) * 0.93
      S.mx += ((M.x >= 0 ? (M.x / W - 0.5) * 2 : 0) - S.mx) * 0.06
      S.my += ((M.y >= 0 ? (M.y / H - 0.5) * 2 : 0) - S.my) * 0.06
      S.ay = S.t * 0.1 + S.sp * TAU + S.mx * 1.1
      S.ax = 0.3 * Math.sin(S.t * 0.07) + S.my * 0.7
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
      if (reduce) { for (let i = 0; i < 40; i++) tick(33) }
    }
    const loop = (now) => {
      if (!alive) return
      raf = requestAnimationFrame(loop)
      if (document.hidden || now - last < 16) return
      const dt = Math.min(64, now - last || 28)
      last = now; frame++
      if (frame % 8 === 1) readColors()
      tick(dt)
    }
    resize()
    let rt = 0
    const onResize = () => { clearTimeout(rt); rt = setTimeout(resize, 200) }
    const onMove = (e) => { M.x = e.clientX; M.y = e.clientY }
    const onDown = (e) => { S.shk = 1; S.kx = e.clientX; S.ky = e.clientY }
    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    if (!reduce) raf = requestAnimationFrame(loop)
    return () => { alive = false; cancelAnimationFrame(raf); clearTimeout(rt); window.removeEventListener('resize', onResize); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerdown', onDown) }
  }, [scene])

  return <canvas ref={ref} className="dev-canvas" />
}
