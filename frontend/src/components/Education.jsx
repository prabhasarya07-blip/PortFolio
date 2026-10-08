import { splitList } from '../api.js'

export default function Education({ items }) {
  if (!items.length) return null
  return (
    <section id="education" className="section">
      <h2 className="title">Education</h2>
      <div className="stack">
        {items.map((e) => (
          <article key={e.id} className="card">
            <div className="card-head">
              <h3>{e.institution}</h3>
              <span className="years">{e.start_year} - {e.end_year}</span>
            </div>
            <p className="degree">{e.degree}</p>
            {e.score && <p className="score">{e.score}</p>}
            {e.coursework && (
              <div className="chips">
                {splitList(e.coursework).map((s) => (
                  <span key={s} className="chip">{s}</span>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

