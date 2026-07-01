import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applyLocale, getStoredLocale } from './lib/i18n/locale'
import { initTheme } from './lib/theme'
import './index.css'
import App from './App.tsx'

initTheme()
applyLocale(getStoredLocale())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
