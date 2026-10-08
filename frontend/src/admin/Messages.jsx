import { useEffect, useState } from 'react'
import { api } from './adminApi.js'

export default function Messages() {
  const [items, setItems] = useState([])
  const [err, setErr] = useState('')

  async function load() {
    try {
      const data = await api('/admin/messages')
      setItems(Array.isArray(data) ? data : data.messages || [])
    } catch (e) {
      setErr(e.message)
    }
  }
  useEffect(() => { load() }, [])

  async function markRead(m) {
    await api('/admin/messages/' + m.id + '/read', { method: 'PATCH' })
    load()
  }
  async function remove(m) {
    if (!window.confirm('Delete this message?')) return
    await api('/admin/messages/' + m.id, { method: 'DELETE' })
    load()
  }

  return (
    <div>
      <h2 className="adm-h">Messages</h2>
      {err && <div className="notice err">{err}</div>}
      <div className="adm-list">
        {items.map((m) => (
          <div className="card" key={m.id} style={{ marginBottom: '0.8rem' }}>
            <div className="card-head">
              <h3>{m.subject || '(no subject)'}</h3>
              {!Number(m.is_read) && <span className="badge small">New</span>}
            </div>
            <p className="meta">
              {m.name} &lt;{m.email}&gt; &middot; {m.created_at ? new Date(m.created_at).toLocaleString() : ''}
            </p>
            <p className="desc" style={{ whiteSpace: 'pre-wrap' }}>{m.message}</p>
            <div className="actions tight">
              <a className="btn sm" href={'mailto:' + m.email}>Reply</a>
              {!Number(m.is_read) && <button className="btn sm" onClick={() => markRead(m)}>Mark read</button>}
              <button className="btn sm danger" onClick={() => remove(m)}>Delete</button>
            </div>
          </div>
        ))}
        {!items.length && <p className="meta">No messages yet.</p>}
      </div>
    </div>
  )
}
