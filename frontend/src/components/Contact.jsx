import { useState } from 'react'
import { post } from '../api.js'

const EMPTY = { name: '', email: '', subject: '', message: '', website: '' }

export default function Contact({ hero }) {
  const [form, setForm] = useState(EMPTY)
  const [status, setStatus] = useState({ type: '', text: '' })
  const [sending, setSending] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setSending(true)
    setStatus({ type: '', text: '' })
    try {
      await post('/contact', form)
      setStatus({ type: 'ok', text: 'Thanks! Your message has been sent.' })
      setForm(EMPTY)
    } catch (err) {
      setStatus({ type: 'err', text: err.message || 'Something went wrong' })
    } finally {
      setSending(false)
    }
  }

  const links = [
    ['GitHub', hero?.github_url],
    ['LinkedIn', hero?.linkedin_url],
    ['LeetCode', hero?.leetcode_url],
  ].filter(([, url]) => url)

  return (
    <section id="contact" className="section">
      <h2 className="title">Contact</h2>
      <div className="contact-wrap">
        <div>
          <p className="bio">
            I am open to internships and entry level backend or full stack roles. Send me a message and I will reply soon.
          </p>
          {hero?.email && (
            <p><a className="location" href={'mailto:' + hero.email}>{hero.email}</a></p>
          )}
          <div className="socials">
            {links.map(([label, url]) => (
              <a key={label} href={url} target="_blank" rel="noreferrer">{label}</a>
            ))}
          </div>
        </div>

        <form className="form card" onSubmit={submit}>
          <div className="row">
            <input placeholder="Your name" value={form.name} onChange={set('name')} required maxLength={100} />
            <input type="email" placeholder="Your email" value={form.email} onChange={set('email')} required maxLength={150} />
          </div>
          <input placeholder="Subject (optional)" value={form.subject} onChange={set('subject')} maxLength={150} />
          <textarea rows="5" placeholder="Your message" value={form.message} onChange={set('message')} required maxLength={3000} />
          <input
            className="hp"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={form.website}
            onChange={set('website')}
          />
          <button className="btn primary" type="submit" disabled={sending}>
            {sending ? 'Sending...' : 'Send message'}
          </button>
          {status.text && <div className={'notice ' + status.type}>{status.text}</div>}
        </form>
      </div>
    </section>
  )
}
