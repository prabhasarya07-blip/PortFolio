import React, { useEffect, useRef } from 'react'

/* GPU nebula: a WebGL fragment shader (domain-warped fractal noise, fbm) that sits UNDER the particle galaxy.
   Colours come live from --c1..--c4, so it changes with every section. The cursor bends the clouds like a lens,
   scrolling drifts them. It renders at half resolution (the blur hides it) so it stays light. */
const VS = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'
const FS = [
  'precision mediump float;',
  'uniform vec2 uRes;uniform float uT;uniform vec2 uM;uniform float uS;uniform float uV;uniform float uMv;uniform float uK;uniform vec2 uC;',
  'uniform vec3 c1;uniform vec3 c2;uniform vec3 c3;uniform vec3 c4;',
  'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
  'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}',
  'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p=mat2(1.6,1.2,-1.2,1.6)*p;a*=.5;}return v;}',
  'void main(){',
  '  float x01=gl_FragCoord.x/uRes.x;float wide=step(1.2,uRes.x/uRes.y);float side=mix(.62,mix(.5,1.,smoothstep(.2,.62,x01)),wide);',
  '  vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y;',
  '  vec2 m=(uM-.5)*vec2(uRes.x/uRes.y,1.);',
  '  float d=length(p-m);',
  '  vec2 rel=p-m;float ag=(.5+uMv*3.)*exp(-d*3.5);rel=mat2(cos(ag),-sin(ag),sin(ag),cos(ag))*rel;p=m+rel*(1.+.35*exp(-d*3.));',
  '  vec2 cc=(uC-.5)*vec2(uRes.x/uRes.y,1.);float dc=length(p-cc);float rr=uK*.9;p+=normalize(p-cc+.0001)*.05*sin(dc*26.-uK*14.)*exp(-uK*1.6)*exp(-abs(dc-rr)*5.);',
  '  float t=uT*.22+uV*1.2+uMv*.5;',
  '  vec2 q=vec2(fbm(p*1.5+t),fbm(p*1.5+vec2(5.2,1.3)-t));',
  '  vec2 r=vec2(fbm(p*1.5+3.*q+vec2(1.7,9.2)+t*1.5),fbm(p*1.5+3.*q+vec2(8.3,2.8)-t));',
  '  float f=fbm(p*1.5+3.*r+uS*2.);',
  '  vec3 col=mix(c1,c2,clamp(f*f*3.,0.,1.));',
  '  col=mix(col,c3,clamp(length(q),0.,1.)*.45);',
  '  col=mix(col,c4,clamp(r.x*r.x*1.4,0.,1.)*.55);',
  '  float lum=min(.12+.62*f*f+.25*exp(-d*3.5)+.2*uMv*exp(-d*5.),.33)*side;',
  '  float vig=smoothstep(1.5,.3,length(p-vec2(.12,0.)));',
  '  gl_FragColor=vec4(col*lum*vig,1.);',
  '}',
].join('\n')

const hex = (s, f) => {
  const m = /^#?([0-9a-f]{6})$/i.exec((s || '').trim())
  const n = parseInt(m ? m[1] : f, 16)
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}
const FB = ['ff4d8d', 'ff8a3d', 'ffd166', 'b45cff']

export default function Nebula() {
  const ref = useRef(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return undefined
    const gl = cv.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' })
    if (!gl) return undefined
    const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s }
    const pr = gl.createProgram()
    gl.attachShader(pr, mk(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, FS))
    gl.linkProgram(pr)
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return undefined
    gl.useProgram(pr)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(pr, 'a')
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const U = {}
    ;['uRes', 'uT', 'uM', 'uS', 'uV', 'uMv', 'uK', 'uC', 'c1', 'c2', 'c3', 'c4'].forEach((k) => { U[k] = gl.getUniformLocation(pr, k) })
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const M = { x: 0.6, y: 0.5, tx: 0.6, ty: 0.5 }
    const C = { x: 0.5, y: 0.5 }
    let kt = 9, mv = 0, t = 0, sp = 0, v = 0, raf = 0, last = 0, frame = 0, alive = true
    const col = [hex('', FB[0]), hex('', FB[1]), hex('', FB[2]), hex('', FB[3])]
    const read = () => {
      const cs = getComputedStyle(document.documentElement)
      for (let i = 0; i < 4; i++) col[i] = hex(cs.getPropertyValue('--c' + (i + 1)), FB[i])
    }
    const target = () => {
      const q = new URLSearchParams(window.location.search).get('p')
      if (q !== null) return Math.max(0, Math.min(1, parseFloat(q) || 0))
      const max = document.documentElement.scrollHeight - window.innerHeight
      return max > 0 ? Math.max(0, Math.min(1, window.scrollY / max)) : 0
    }
    const size = () => {
      const w = Math.max(2, Math.round(window.innerWidth * 0.4)), h = Math.max(2, Math.round(window.innerHeight * 0.4))
      cv.width = w; cv.height = h; gl.viewport(0, 0, w, h)
    }
    const draw = () => {
      gl.uniform2f(U.uRes, cv.width, cv.height)
      gl.uniform1f(U.uT, t); gl.uniform2f(U.uM, M.x, M.y); gl.uniform1f(U.uS, sp); gl.uniform1f(U.uV, v); gl.uniform1f(U.uMv, mv); gl.uniform1f(U.uK, kt); gl.uniform2f(U.uC, C.x, C.y)
      gl.uniform3fv(U.c1, col[0]); gl.uniform3fv(U.c2, col[1]); gl.uniform3fv(U.c3, col[2]); gl.uniform3fv(U.c4, col[3])
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    const loop = (now) => {
      if (!alive) return
      raf = requestAnimationFrame(loop)
      if (document.hidden || now - last < 15) return
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016)
      last = now; frame++
      if (frame % 8 === 1) read()
      const tg = target(); const d = tg - sp; sp += d * 0.1; v = v * 0.9 + Math.min(1, Math.abs(d) * 40) * 0.1
      const ddx = M.tx - M.x, ddy = M.ty - M.y
      mv = mv * 0.92 + Math.min(1, Math.hypot(ddx, ddy) * 6) * 0.08
      M.x += ddx * 0.22; M.y += ddy * 0.22; kt += dt
      t += dt
      draw()
    }
    const onDown = (e) => { C.x = e.clientX / window.innerWidth; C.y = 1 - e.clientY / window.innerHeight; kt = 0 }
    const onMove = (e) => { M.tx = e.clientX / window.innerWidth; M.ty = 1 - e.clientY / window.innerHeight }
    let rt = 0
    const onResize = () => { clearTimeout(rt); rt = setTimeout(() => { size(); draw() }, 200) }
    size(); read(); sp = target(); t = 3
    draw()
    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    if (!reduce) raf = requestAnimationFrame(loop)
    return () => { alive = false; cancelAnimationFrame(raf); clearTimeout(rt); window.removeEventListener('resize', onResize); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerdown', onDown) }
  }, [])
  return <canvas ref={ref} className='dev-canvas' aria-hidden='true' />
}
