import React from 'react'
import { simulateWeek, createInitialState, type GameState, type SectorKey, investInSector, changeCity, applyCorruptionChoice } from '../state/sim'

export function formatMoneyUSD(amount: number){
  return `$${amount.toFixed(2)}`
}
export function formatCDF(amount: number){
  return `${Math.round(amount).toLocaleString('fr-CD')} CDF`
}

export type GameStore = GameState & {
  init: () => void
  nextWeek: () => void
  doInvest: (sector: SectorKey) => void
  doChangeCity: (city: string) => void
  doCorrupt: () => void
  reset: () => void
}

const StoreContext = React.createContext<GameStore | null>(null)

export function GameProvider({children}:{children:React.ReactNode}){
  const [state, setState] = React.useState<GameState>(createInitialState())

  const init = React.useCallback(()=>{
    const raw = localStorage.getItem('iidrc-save')
    if (raw){
      try{ setState(JSON.parse(raw)) }catch{}
    }
  },[])

  const persist = React.useCallback((s: GameState)=>{
    localStorage.setItem('iidrc-save', JSON.stringify(s))
  },[])

  const api: GameStore = {
    ...state,
    init,
    nextWeek(){
      const [ns] = simulateWeek(state)
      setState(ns)
      persist(ns)
    },
    doInvest(sector){
      const ns = investInSector(state, sector)
      setState(ns)
      persist(ns)
    },
    doChangeCity(city){
      const ns = changeCity(state, city)
      setState(ns)
      persist(ns)
    },
    doCorrupt(){
      const ns = applyCorruptionChoice(state)
      setState(ns)
      persist(ns)
    },
    reset(){
      const ns = createInitialState()
      setState(ns)
      persist(ns)
    }
  }

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useGameStore<T>(sel:(s:GameStore)=>T):T{
  const ctx = React.useContext(StoreContext)
  if (!ctx) throw new Error('GameProvider missing')
  return sel(ctx)
}
