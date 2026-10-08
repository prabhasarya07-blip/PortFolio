export default function About({ about }) {
  const stats = [
    [about.hackathons_count + '+', 'Hackathons'],
    [about.projects_count, 'Projects built'],
    [about.certificates_count, 'Certificates'],
  ]

  return (
    <section id="about" className="section">
      <h2 className="title">About me</h2>
      <p className="bio">{about.bio}</p>
      {about.location && <p className="location">{about.location}</p>}
      <div className="stats">
        {stats.map(([value, label]) => (
          <div key={label} className="stat">
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
