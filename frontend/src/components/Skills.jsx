const ORDER = ['Languages', 'Frontend', 'Backend', 'Database', 'Core CS', 'Tools']
const ICON = {
  Languages: '\uD83D\uDCBB', Frontend: '\uD83C\uDFA8', Backend: '\u2699\uFE0F',
  Database: '\uD83D\uDDC4\uFE0F', 'Core CS': '\uD83E\uDDE0', Tools: '\uD83D\uDEE0\uFE0F',
}

export default function Skills({ items }) {
  if (!items.length) return null
  const groups = {}
  items.forEach((s) => {
    const c = s.category || 'Other'
    ;(groups[c] = groups[c] || []).push(s)
  })
  const cats = [...ORDER.filter((c) => groups[c]), ...Object.keys(groups).filter((c) => !ORDER.includes(c))]

  return (
    <section id="skills" className="section">
      <h2 className="title">Skills</h2>
      <div className="grid">
        {cats.map((c) => (
          <div key={c} className="card">
            <h3>{ICON[c] || '\u2728'} {c}</h3>
            <div className="chips">
              {groups[c].map((s) => (
                <span key={s.id ?? s.name} className="chip">{s.name}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
