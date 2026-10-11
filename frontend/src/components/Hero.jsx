import { useEffect, useRef } from 'react'
import { asset } from '../api.js'
import { DEFAULT_HERO_STYLE } from '../heroStyle.js'

/* Pick style: ?style=1..5 in the URL (for previewing) or DEFAULT_HERO_STYLE */
function pickStyle() {
  if (typeof window === 'undefined') return DEFAULT_HERO_STYLE
  const q = new URLSearchParams(window.location.search).get('style')
  const n = Number(q)
  return q !== null && Number.isInteger(n) && n >= 1 && n <= 6 ? n : DEFAULT_HERO_STYLE
}

function initials(name) {
  return String(name || 'PN').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

/* Mouse position -> CSS variables (parallax / tilt) */
function useMouse(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const move = (e) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const x = e.clientX / window.innerWidth - 0.5
        const y = e.clientY / window.innerHeight - 0.5
        el.style.setProperty('--px', x.toFixed(3))
        el.style.setProperty('--py', y.toFixed(3))
        el.style.setProperty('--rx', (-y * 14).toFixed(2) + 'deg')
        el.style.setProperty('--ry', (x * 18).toFixed(2) + 'deg')
      })
    }
    window.addEventListener('pointermove', move)
    return () => {
      window.removeEventListener('pointermove', move)
      cancelAnimationFrame(raf)
    }
  }, [ref])
}

function Photo({ src, name }) {
  if (!src) return <div className="hv-initials">{initials(name)}</div>
  return <img className="hv-img" src={asset(src)} alt={name} />
}

/* 1. Tilt card + floating tech chips */
const CHIPS = [
  { t: 'Java', c: '#f59e0b', d: 38 },
  { t: 'MySQL', c: '#22d3ee', d: -30 },
  { t: 'Node.js', c: '#22c55e', d: 44 },
  { t: 'React', c: '#60a5fa', d: -36 },
]
function V1({ src, name }) {
  return (
    <div className="hv v1">
      <div className="v1-card"><Photo src={src} name={name} /></div>
      {CHIPS.map((c, i) => (
        <span key={c.t} className={`fchip c${i + 1}`} style={{ '--c': c.c, '--d': c.d, animationDelay: `${i * 0.7}s` }}>
          {c.t}
        </span>
      ))}
    </div>
  )
}

/* 2. Layered parallax */
function V2({ src, name }) {
  const first = String(name || 'Prabhas').split(' ')[0]
  return (
    <div className="hv v2">
      <span className="layer b1" style={{ '--d': -34 }} />
      <span className="layer b2" style={{ '--d': 28 }} />
      <span className="layer dots" style={{ '--d': 20 }} />
      <div className="layer arch" style={{ '--d': 8 }}><Photo src={src} name={name} /></div>
      <div className="layer codecard" style={{ '--d': 44 }}>
        <b>const</b> dev = <em>"{first}"</em>;
      </div>
      <div className="layer tag2" style={{ '--d': -40 }}>10+ hackathons</div>
    </div>
  )
}

/* 3. Glass 3D shapes */
function V3({ src, name }) {
  return (
    <div className="hv v3">
      <div className="frame"><Photo src={src} name={name} /></div>
      <span className="gs sphere" style={{ '--d': -30 }} />
      <span className="gs cubebox" style={{ '--d': 26 }}>
        <span className="cube"><i /><i /><i /><i /><i /><i /></span>
      </span>
      <span className="gs ring3" style={{ '--d': 34 }} />
      <span className="gs pill3" style={{ '--d': -22 }} />
    </div>
  )
}

/* 4. Code window scene */
function codeLines(name) {
  return [
    [['cm', '// backend developer, open to work']],
    [['kw', 'const'], ['', ' app = '], ['fn', 'express'], ['', '();']],
    [['', ' ']],
    [['fn', 'app.get'], ['', '('], ['str', "'/api/hire'"], ['', ', (req, res) => {']],
    [['', '  res.json({']],
    [['', '    name: '], ['str', `'${name}'`], ['', ',']],
    [['', '    stack: ['], ['str', "'Java'"], ['', ', '], ['str', "'MySQL'"], ['', ', '], ['str', "'Node'"], ['', '],']],
    [['', '    openToWork: '], ['kw', 'true']],
    [['', '  });']],
    [['', '});']],
  ]
}
function V4({ src, name }) {
  const lines = codeLines(name || 'Prabhas N')
  return (
    <div className="hv v4">
      <div className="win">
        <div className="win-bar"><i /><i /><i /><span>server.js</span></div>
        <pre className="code">
          {lines.map((toks, i) => {
            const n = toks.reduce((a, t) => a + t[1].length, 0)
            return (
              <span key={i} className="ln" style={{ '--i': i, '--n': n, animationTimingFunction: `steps(${n})` }}>
                {toks.map((t, j) => <span key={j} className={t[0]}>{t[1]}</span>)}
              </span>
            )
          })}
        </pre>
      </div>
      <div className="avatar4"><Photo src={src} name={name} /></div>
      <div className="tag4"><i />{name} · available</div>
    </div>
  )
}

/* 5. Minimal premium aurora */
function V5({ src, name }) {
  return (
    <div className="hv v5">
      <span className="aurora" />
      <span className="ring5" />
      <div className="blob"><Photo src={src} name={name} /></div>
    </div>
  )
}

/* 6. Cutout hero: person standing in a glow, faint code behind (best with a transparent PNG) */
const BG_CODE = `const app = express();
app.use(cors());

app.get('/api/projects', async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM projects'
  );
  res.json(rows);
});

app.post('/api/contact', limiter, (req, res) => {
  saveMessage(req.body);
  sendMail(req.body);
  res.json({ ok: true });
});

app.listen(5000);`
function V6({ src, name }) {
  const cut = /\.png($|\?)/i.test(src || '')
  return (
    <div className={`hv v6 ${cut ? 'cut' : 'soft'}`}>
      <span className="glow6" />
      <pre className="code6" aria-hidden="true">{BG_CODE}</pre>
      {src ? <img className="img6" src={asset(src)} alt={name} /> : <div className="hv-initials">{initials(name)}</div>}
      <svg className="spark6" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0z" /></svg>
    </div>
  )
}

const VISUALS = { 1: V1, 2: V2, 3: V3, 4: V4, 5: V5, 6: V6 }

const Ic = {
  github: (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="m2 7 10 7 10-7" /></svg>
  ),
}

export default function Hero(props) {
  const h = props.hero || props.data?.hero || props.profile?.hero || props.profile || props.data || {}
  const style = pickStyle()
  const Visual = VISUALS[style]
  const ref = useRef(null)
  useMouse(ref)

  return (
    <section id="home" className={`hero hero-s${style}`}>
      <div className="hero-inner">
        <div className="hero-copy">
          {h.open_to_work ? <span className="open-pill"><i />Open to work</span> : null}
          <p className="hero-hi">Hi, I am</p>
          <h1 className="hero-name">{h.name}</h1>
          <h2 className="hero-role">{h.role_title}</h2>
          {h.tagline ? <p className="hero-tag">{h.tagline}</p> : null}
          <div className="hero-cta">
            <a className="btn primary" href="#contact">Contact me</a>
            <a className="btn ghost" href="#projects">View projects</a>
            {h.resume_url ? <a className="btn ghost" href={asset(h.resume_url)} target="_blank" rel="noreferrer">Download résumé</a> : null}
          </div>
          <div className="soc-row">
            {h.github_url ? <a className="soc" href={h.github_url} target="_blank" rel="noreferrer">{Ic.github}GitHub</a> : null}
            {h.linkedin_url ? <a className="soc" href={h.linkedin_url} target="_blank" rel="noreferrer"><b>in</b>LinkedIn</a> : null}
            {h.leetcode_url ? <a className="soc" href={h.leetcode_url} target="_blank" rel="noreferrer"><b>{'</>'}</b>LeetCode</a> : null}
            {h.email ? <a className="soc" href={`mailto:${h.email}`}>{Ic.mail}Email</a> : null}
          </div>
        </div>
        <div className="hero-vis" ref={ref}>
          <Visual src={h.photo_url} name={h.name} />
        </div>
      </div>
    </section>
  )
}

export { Hero }
