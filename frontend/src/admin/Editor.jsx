import { useEffect, useState } from 'react'
import { api, upload, fileUrl } from './adminApi.js'

const pickRows = (data, key) => (Array.isArray(data) ? data : Array.isArray(data?.[key]) ? data[key] : [])
const pickOne = (data, key) => (data && typeof data[key] === 'object' && data[key] ? data[key] : data)

function toForm(row, fields) {
  const o = {}
  for (const f of fields) {
    const v = row ? row[f.name] : undefined
    if (f.type === 'checkbox') o[f.name] = v === true || Number(v) === 1
    else if (f.type === 'date') o[f.name] = v ? String(v).slice(0, 10) : ''
    else o[f.name] = v === null || v === undefined ? '' : v
  }
  return o
}

function toPayload(form, fields) {
  const o = {}
  for (const f of fields) {
    const v = form[f.name]
    if (f.type === 'checkbox') o[f.name] = v ? 1 : 0
    else if (f.type === 'number') o[f.name] = v === '' || v === null ? null : Number(v)
    else o[f.name] = typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : v
  }
  return o
}

function Field({ f, value, onChange }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  if (f.type === 'checkbox') {
    return (
      <label className="adm-check">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /> {f.label}
      </label>
    )
  }
  if (f.type === 'textarea') {
    return (
      <label>
        {f.label}
        <textarea rows="5" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    )
  }
  if (f.type === 'upload') {
    const pick = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      setBusy(true)
      setErr('')
      try {
        onChange(await upload(file))
      } catch (x) {
        setErr(x.message)
      } finally {
        setBusy(false)
        e.target.value = ''
      }
    }
    return (
      <label>
        {f.label}
        <input type="text" value={value} placeholder="Paste a link, or choose a file below" onChange={(e) => onChange(e.target.value)} />
        <input type="file" accept={f.accept} onChange={pick} />
        {busy && <span className="meta">Uploading...</span>}
        {err && <span className="adm-err">{err}</span>}
        {value ? <a href={fileUrl(value)} target="_blank" rel="noreferrer">Open current file</a> : null}
      </label>
    )
  }
  return (
    <label>
      {f.label}
      <input type={f.type || 'text'} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

export default function Editor({ section }) {
  const { key, fields, single } = section
  const [items, setItems] = useState([])
  const [form, setForm] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      const data = await api('/admin/' + key)
      if (single) setForm(toForm(pickOne(data, key), fields))
      else setItems(pickRows(data, key))
    } catch (e) {
      setErr(e.message)
    }
  }

  useEffect(() => {
    setForm(null)
    setEditingId(null)
    setMsg('')
    setErr('')
    load()
  }, [key])

  const set = (name) => (v) => setForm({ ...form, [name]: v })

  function startNew() {
    const f = toForm(null, fields)
    if ('sort_order' in f) f.sort_order = items.length + 1
    setForm(f)
    setEditingId('new')
    setMsg('')
    setErr('')
  }

  function startEdit(row) {
    setForm(toForm(row, fields))
    setEditingId(row.id)
    setMsg('')
    setErr('')
  }

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setErr('')
    setMsg('')
    try {
      const body = toPayload(form, fields)
      if (single) await api('/admin/' + key, { method: 'PUT', body })
      else if (editingId === 'new') await api('/admin/' + key, { method: 'POST', body })
      else await api('/admin/' + key + '/' + editingId, { method: 'PUT', body })
      setMsg('Saved')
      if (!single) {
        setForm(null)
        setEditingId(null)
      }
      await load()
    } catch (x) {
      setErr(x.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(row) {
    if (!window.confirm('Delete this item?')) return
    try {
      await api('/admin/' + key + '/' + row.id, { method: 'DELETE' })
      setMsg('Deleted')
      await load()
    } catch (x) {
      setErr(x.message)
    }
  }

  const formView = form && (
    <form className="adm-form card" onSubmit={save}>
      {fields.map((f) => (
        <Field key={f.name} f={f} value={form[f.name]} onChange={set(f.name)} />
      ))}
      <div className="actions">
        <button className="btn primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        {!single && (
          <button className="btn" type="button" onClick={() => { setForm(null); setEditingId(null) }}>Cancel</button>
        )}
      </div>
    </form>
  )

  return (
    <div>
      <h2 className="adm-h">{section.label}</h2>
      {msg && <div className="notice ok">{msg}</div>}
      {err && <div className="notice err">{err}</div>}
      {single ? formView : form ? formView : (
        <>
          <button className="btn primary" onClick={startNew}>+ Add new</button>
          <div className="adm-list">
            {items.map((r) => (
              <div className="adm-row" key={r.id}>
                <span>{section.itemLabel(r)}</span>
                <span className="actions tight">
                  <button className="btn sm" onClick={() => startEdit(r)}>Edit</button>
                  <button className="btn sm danger" onClick={() => remove(r)}>Delete</button>
                </span>
              </div>
            ))}
            {!items.length && <p className="meta">Nothing here yet.</p>}
          </div>
        </>
      )}
    </div>
  )
}
