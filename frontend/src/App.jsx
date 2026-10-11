import { useEffect, useState } from 'react'
import { get, toList } from './api.js'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import About from './components/About.jsx'
import Education from './components/Education.jsx'
import Skills from './components/Skills.jsx'
import Projects from './components/Projects.jsx'
import Certifications from './components/Certifications.jsx'
import Hackathons from './components/Hackathons.jsx'
import Achievements from './components/Achievements.jsx'
import Contact from './components/Contact.jsx'
import { useSiteEffects } from './effects.js'
import Admin from './admin/Admin.jsx'

function Site() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useSiteEffects(data)

  useEffect(() => {
    Promise.all([
      get('/profile'),
      get('/education'),
      get('/skills'),
      get('/projects'),
      get('/certificates'),
      get('/hackathons'),
      get('/achievements'),
    ])
      .then(([profile, education, skills, projects, certificates, hackathons, achievements]) =>
        setData({
          ...profile,
          education: toList(education, 'education'),
          skills: toList(skills, 'skills'),
          projects: toList(projects, 'projects'),
          certificates: toList(certificates, 'certificates'),
          hackathons: toList(hackathons, 'hackathons'),
          achievements: toList(achievements, 'achievements'),
        })
      )
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <p className="status">Could not load portfolio: {error}</p>
  if (!data) return <p className="status">Loading...</p>

  return (
    <>
      <Navbar name={data.hero?.name} />
      <main>
        {data.hero && <Hero hero={data.hero} />}
        {data.about && <About about={data.about} />}
        <Education items={data.education} />
        <Skills items={data.skills} />
        <Projects items={data.projects} />
        <Certifications items={data.certificates} />
        <Hackathons items={data.hackathons} />
        <Achievements items={data.achievements} />
        <Contact hero={data.hero} />
      </main>
      <footer className="footer">
        &copy; {new Date().getFullYear()} {data.hero?.name}
      </footer>
    </>
  )
}


export default function App() {
  return window.location.pathname.startsWith('/admin') ? <Admin /> : <Site />
}

