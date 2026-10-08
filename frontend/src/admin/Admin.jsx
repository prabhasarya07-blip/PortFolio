import { useEffect, useState } from 'react'
import { api, getToken, setToken } from './adminApi.js'
import { SECTIONS } from './config.js'
import Editor from './Editor.jsx'
import Messages from './Messages.jsx'

function Login({ onDone }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      const data = await api('/admin/login', { method: 'POST', body: { email, password } })
      setToken(data.token)
      onDone()
    } catch (x) {
      setErr(x.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="adm-login card adm-form" onSubmit={submit}>
      <h2 className="adm-h">Admin login</h2>
      <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
      <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
      <button className="btn primary" type="submit" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
      {err && <div className="notice err">{err}</div>}
    </form>
  )
}

export default function Admin() {
  const [authed, setAuthed] = useState(!!getToken())
  const [tab, setTab] = useState('messages')

  useEffect(() => {
    document.title = 'Admin'
    if (!document.documentElement.dataset.theme) document.documentElement.dataset.theme = 'dark'
  }, [])

  if (!authed) return <Login onDone={() => setAuthed(true)} />

  const section = SECTIONS.find((s) => s.key === tab)

  return (
    <div className="adm">
      <div className="adm-top">
        <h1 className="adm-h">Portfolio admin</h1>
        <span className="actions tight">
          <a className="btn sm" href="/">View site</a>
          <button className="btn sm" onClick={() => { setToken(null); setAuthed(false) }}>Log out</button>
        </span>
      </div>
      <nav className="adm-nav">
        <button className={tab === 'messages' ? 'active' : ''} onClick={() => setTab('messages')}>Messages</button>
        {SECTIONS.map((s) => (
          <button key={s.key} className={tab === s.key ? 'active' : ''} onClick={() => setTab(s.key)}>{s.label}</button>
        ))}
      </nav>
      {tab === 'messages' ? <Messages /> : <Editor key={section.key} section={section} />}
    </div>
  )
}
