import { asset, splitList } from '../api.js'

export default function Projects({ items }) {
  if (!items.length) return null
  const sorted = [...items].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))

  return (
    <section id="projects" className="section">
      <h2 className="title">Projects</h2>
      <div className="grid">
        {sorted.map((p) => (
          <article key={p.id} className="card project">
            {p.image_url && <img className="project-img" src={asset(p.image_url)} alt={p.title} />}
            <div className="card-head">
              <h3>{p.title}</h3>
              {p.featured ? <span className="badge small">Featured</span> : null}
            </div>
            <p className="desc">{p.description}</p>
            {p.tech_stack && (
              <div className="chips">
                {splitList(p.tech_stack).map((s) => (
                  <span key={s} className="chip">{s}</span>
                ))}
              </div>
            )}
            <div className="actions tight">
              {p.github_url && (
                <a className="btn" href={p.github_url} target="_blank" rel="noreferrer">GitHub</a>
              )}
              {p.live_url && (
                <a className="btn primary" href={p.live_url} target="_blank" rel="noreferrer">Live demo</a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

