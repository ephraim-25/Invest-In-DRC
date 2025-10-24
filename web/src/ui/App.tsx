import React from 'react'
import { useGameStore } from '../store/gameStore'
import { Dashboard } from './Dashboard'

export default function App(){
  const init = useGameStore(s => s.init)
  React.useEffect(()=>{ init() },[init])
  return (
    <>
      <header className="header">
        <div className="logo">Invest In DRC</div>
        <div className="tag">Dark Business Hi‑Tech</div>
      </header>
      <Dashboard />
    </>
  )
}
