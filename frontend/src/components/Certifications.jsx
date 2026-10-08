import { fmtDate } from '../api.js'

export default function Certifications({ items }) {
  if (!items.length) return null
  return (
    <section id="certifications" className="section">
      <h2 className="title">Certifications</h2>
      <div className="grid">
        {items.map((c) => (
          <article key={c.id} className="card project">
            <h3>{c.title}</h3>
            <p className="degree">{c.issuer}</p>
            {c.issue_date && <p className="meta">{fmtDate(c.issue_date)}</p>}
            <div className="actions tight">
              {c.credential_url && (
                <a className="btn" href={c.credential_url} target="_blank" rel="noreferrer">
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
