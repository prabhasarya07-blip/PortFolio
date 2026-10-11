import { splitList } from '../api.js'

export default function Education({ items }) {
  if (!items.length) return null
  return (
    <section id="education" className="section">
      <h2 className="title">Education</h2>
      <div className="timeline">
        {items.map((e) => (
          <div key={e.id} className="timeline-item">
            <span className="tl-dot" />
            <div className="card">
              <div className="card-head">
                <h3>{e.institution}</h3>
                <span className="badge small">{e.start_year} - {e.end_year}</span>
              </div>
              <p className="degree">{e.degree}</p>
              {e.score && <p className="meta score">{e.score}</p>}
              <div className="chips">
                {splitList(e.coursework).map((c) => (
                  <span key={c} className="chip">{c}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
