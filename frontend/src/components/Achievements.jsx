import { fmtDate } from '../api.js'

export default function Achievements({ items }) {
  if (!items.length) return null
  return (
    <section id="achievements" className="section">
      <h2 className="title">Achievements</h2>
      <div className="stack">
        {items.map((a) => (
          <article key={a.id} className="card">
            <div className="card-head">
              <h3>{a.title}</h3>
              {a.category ? <span className="badge small">{a.category}</span> : null}
            </div>
            {a.achieved_date && <p className="meta">{fmtDate(a.achieved_date)}</p>}
            {a.description && <p className="desc">{a.description}</p>}
          </article>
        ))}
      </div>
    </section>
  )
}
