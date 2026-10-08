import { asset } from '../api.js'

export default function Hero({ hero }) {
  const links = [
    ['GitHub', hero.github_url],
    ['LinkedIn', hero.linkedin_url],
    ['LeetCode', hero.leetcode_url],
    ['Email', hero.email ? 'mailto:' + hero.email : null],
  ].filter(([, url]) => url)

  const initials = (hero.name || '').split(' ').map((w) => w[0]).join('').slice(0, 2)

  return (
    <section id="home" className="section hero">
      <div className="hero-text">
        {hero.open_to_work ? <span className="badge">Open to work</span> : null}
        <p className="hello">Hi, I am</p>
        <h1>{hero.name}</h1>
        <h2 className="role">{hero.role_title}</h2>
        <p className="tagline">{hero.tagline}</p>
        <div className="actions">
          <a className="btn primary" href="#contact">Contact me</a>
          <a className="btn" href="#projects">View projects</a>
          {hero.resume_url && (
            <a className="btn" href={asset(hero.resume_url)} target="_blank" rel="noreferrer">
              Resume
            </a>
          )}
        </div>
        <div className="socials">
          {links.map(([label, url]) => (
            <a key={label} href={url} target="_blank" rel="noreferrer">{label}</a>
          ))}
        </div>
      </div>
      <div className="hero-photo">
        {hero.photo_url ? (
          <img src={asset(hero.photo_url)} alt={hero.name} />
        ) : (
          <div className="avatar">{initials}</div>
        )}
      </div>
    </section>
  )
}
