import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import Intro from './Intro.jsx'
import Backdrop from './Backdrop.jsx'
import './styles.css'

const isAdmin = window.location.pathname.startsWith('/admin')

// safety net: never leave the page hidden if something goes wrong
setTimeout(() => document.documentElement.classList.add('ready'), 9000)
if (isAdmin) document.documentElement.classList.add('ready')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {!isAdmin && <Backdrop />}
    <App />
    {!isAdmin && <Intro />}
  </StrictMode>
)
