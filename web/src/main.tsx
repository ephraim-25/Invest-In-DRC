import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './ui/App'
import { GameProvider } from './store/gameStore'
import './styles/theme.css'

const el = document.getElementById('root')!
createRoot(el).render(
  <React.StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </React.StrictMode>
)
