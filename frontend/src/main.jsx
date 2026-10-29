import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './admin.css'
import App from './App.jsx'
import { loadCachedThemeColors } from './utils/theme'

// Immediately apply saved custom colors to prevent flash of unstyled content
loadCachedThemeColors();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

