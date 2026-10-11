import { useState } from 'react'
import { asset, splitList } from '../api.js'

const isFeatured = (p) => p.featured === true || Number(p.featured) === 1

function ProjectCard({ p }) {
  const [open, setOpen] = useState(false)
  const tech = splitList(p.tech_stack)
  const long = (p.description || '').length > 220

  return (
    <article className="card project pcard">
      <div className="banner">
        {p.image_url ? (
          <img src={asset(p.image_url)} alt={p.title} loading="lazy" />
        ) : (
          <div className="banner-ph">
            <span className="dots"><i /><i /><i /></span>
            <span>{p.title}</span>
          </div>
        )}
        {isFeatured(p) && <span className="badge small float">Featured</span>}
      </div>
      <div className="pbody">
        <h3>{p.title}</h3>
        <p className={'desc' + (open ? '' : ' clamp')}>{p.description}</p>
        {long && (
          <button className="link-btn" onClick={() => setOpen(!open)}>
            {open ? 'Show less' : 'Read more'}
          </button>
        )}
        {tech.length > 0 && (
          <div className="chips">
            {tech.map((t) => <span key={t} className="chip">{t}</span>)}
          </div>
        )}
        <div className="actions tight">
          {p.github_url && (
            <a className="btn sm" href={p.github_url} target="_blank" rel="noreferrer">GitHub</a>
          )}
          {p.live_url && (
            <a className="btn sm primary" href={p.live_url} target="_blank" rel="noreferrer">Live demo</a>
          )}
        </div>
      </div>
    </article>
  )
}

export default function Projects({ items }) {
  if (!items.length) return null
  const sorted = [...items].sort((a, b) => Number(isFeatured(b)) - Number(isFeatured(a)))
  return (
    <section id="projects" className="section">
      <h2 className="title">Projects</h2>
      <div className="grid">
        {sorted.map((p) => <ProjectCard key={p.id} p={p} />)}
      </div>
    </section>
  )
}
