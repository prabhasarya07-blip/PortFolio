import { asset, fmtDate } from '../api.js'

export default function Hackathons({ items }) {
  if (!items.length) return null
  return (
    <section id="hackathons" className="section">
      <h2 className="title">Hackathons</h2>
      <div className="grid">
        {items.map((h) => (
          <article key={h.id} className="card project">
            <div className="card-head">
              <h3>{h.name}</h3>
              {h.result ? <span className="badge small">{h.result}</span> : null}
            </div>
            {h.event_date && <p className="meta">{fmtDate(h.event_date)}</p>}
            {h.project_name && <p className="degree">Project: {h.project_name}</p>}
            {h.description && <p className="desc">{h.description}</p>}
            <div className="actions tight">
              {h.link && (
                <a className="btn" href={asset(h.link)} target="_blank" rel="noreferrer">
                  View certificate
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
