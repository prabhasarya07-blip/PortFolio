import React, { useEffect, useState } from 'react'

const FONTS = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700&family=IBM+Plex+Sans:wght@400;500;600&family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@400;500;600&family=Poppins:wght@400;500;600;700;800&family=Syne:wght@600;700;800&family=Manrope:wght@400;500;600&display=swap'

export const TYPES = [
  'Modern Tech (Space Grotesk + Inter)',
  'Developer Mono (JetBrains Mono + IBM Plex Sans)',
  'Elegant Editorial (Playfair Display + Source Sans)',
  'Bold Geometric (Poppins)',
  'Creative Bold (Syne + Manrope)',
]

function initialType() {
  try {
    const q = new URLSearchParams(window.location.search).get('type')
    const n = parseInt(q || '1', 10)
    return n >= 1 && n <= 5 ? n : 1
  } catch (e) { return 1 }
}

export default function TypePicker() {
  const [t, setT] = useState(initialType)
  useEffect(() => {
    if (!document.getElementById('type-fonts')) {
      const l = document.createElement('link')
      l.id = 'type-fonts'
      l.rel = 'stylesheet'
      l.href = FONTS
      document.head.appendChild(l)
    }
  }, [])
  useEffect(() => {
    document.documentElement.dataset.type = String(t)
    try { localStorage.setItem('typestyle', String(t)) } catch (e) {}
  }, [t])
  return (
    <div className='type-pick' role='group' aria-label='Text style'>
      <b>Aa</b>
      {TYPES.map((n, i) => (
        <button key={n} type='button' title={n} className={t === i + 1 ? 'on' : ''} onClick={() => setT(i + 1)}>{i + 1}</button>
      ))}
      <span>{TYPES[t - 1]}</span>
    </div>
  )
}
