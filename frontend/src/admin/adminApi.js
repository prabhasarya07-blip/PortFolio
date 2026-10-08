const API = import.meta.env.VITE_API_URL || ''

export const getToken = () => localStorage.getItem('admin_token')
export const setToken = (t) => (t ? localStorage.setItem('admin_token', t) : localStorage.removeItem('admin_token'))
export const fileUrl = (u) => (!u ? '' : /^https?:/.test(u) ? u : API + u)

function errText(data) {
  if (!data) return 'Request failed'
  if (typeof data.error === 'string') return data.error
  return JSON.stringify(data.error || data)
}

export async function api(path, { method = 'GET', body } = {}) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (getToken()) headers.Authorization = 'Bearer ' + getToken()
  const res = await fetch(API + '/api' + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && path !== '/admin/login') {
    setToken(null)
    window.location.reload()
  }
  if (!res.ok) throw new Error(errText(data))
  return data
}

export async function upload(file) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(API + '/api/admin/upload', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + getToken() },
    body: fd,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(errText(data))
  return data.url
}
