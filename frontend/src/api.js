const BASE = import.meta.env.VITE_API_URL || ''

export const asset = (url) =>
  !url ? '' : /^https?:/.test(url) ? url : BASE + url

export async function get(path) {
  const res = await fetch(BASE + '/api' + path)
  if (!res.ok) throw new Error('Request failed (' + res.status + ')')
  return res.json()
}

// Accepts an array, { key: [...] }, or a { Category: [...] } object and returns a flat list
export function toList(x, key) {
  if (Array.isArray(x)) return x
  if (x && Array.isArray(x[key])) return x[key]
  if (x && typeof x === 'object') {
    return Object.entries(x).flatMap(([cat, v]) =>
      Array.isArray(v)
        ? v.map((i) => (typeof i === 'object' ? { category: cat, ...i } : { category: cat, name: i }))
        : []
    )
  }
  return []
}

export const splitList = (v) => {
  if (Array.isArray(v)) return v.map(String)
  if (typeof v !== 'string') return []
  const t = v.trim()
  if (t.startsWith('[')) {
    try { return JSON.parse(t).map(String) } catch (e) { /* fall through */ }
  }
  return t.split(',').map((s) => s.trim()).filter(Boolean)
}

export async function post(path, body) {
  const res = await fetch(BASE + '/api' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Please check the form fields')
  }
  return data
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const fmtDate = (v) => {
  if (!v) return ''
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? MONTHS[Number(m[2]) - 1] + ' ' + m[1] : String(v)
}
