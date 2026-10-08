export default function Skills({ items }) {
  if (!items.length) return null
  const groups = items.reduce((acc, s) => {
    const c = s.category || 'Other'
    ;(acc[c] = acc[c] || []).push(s)
    return acc
  }, {})

  return (
    <section id="skills" className="section">
      <h2 className="title">Skills</h2>
      <div className="grid">
        {Object.entries(groups).map(([category, list]) => (
          <div key={category} className="card">
            <h3>{category}</h3>
            <div className="chips">
              {list.map((s) => (
                <span key={s.id ?? s.name} className="chip">{s.name}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
