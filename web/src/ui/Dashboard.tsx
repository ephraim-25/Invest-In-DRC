import React from 'react'
import { useGameStore } from '../store/gameStore'
import { CITIES, SECTORS, cityName, netWorthUSD, unlockedCities, type SectorKey } from '../state/sim'
import { formatMoneyUSD } from '../store/gameStore'

function KPI(){
  const cashUSD = useGameStore(s=>s.cashUSD)
  const cashCDF = useGameStore(s=>s.cashCDF)
  const fx = useGameStore(s=>s.fx)
  const rep = useGameStore(s=>s.reputation)
  const state = useGameStore(s=>s as any)
  return (
    <div className="kpi">
      <div className="it"><div className="label">Cash USD</div><div className="value">{formatMoneyUSD(cashUSD)}</div></div>
      <div className="it"><div className="label">Cash CDF</div><div className="value">{Math.round(cashCDF).toLocaleString('fr-CD')} CDF</div></div>
      <div className="it"><div className="label">Taux (CDF/USD)</div><div className="value">{fx}</div></div>
      <div className="it"><div className="label">Valeur nette</div><div className="value">{formatMoneyUSD(netWorthUSD(state))}</div></div>
      <div className="it"><div className="label">Réputation</div><div className="value">{rep}</div></div>
    </div>
  )
}

export function Dashboard(){
  const week = useGameStore(s=>s.week)
  const cityKey = useGameStore(s=>s.cityKey)
  const sectors = useGameStore(s=>s.sectors)
  const nextWeek = useGameStore(s=>s.nextWeek)
  const doInvest = useGameStore(s=>s.doInvest)
  const doChangeCity = useGameStore(s=>s.doChangeCity)
  const doCorrupt = useGameStore(s=>s.doCorrupt)
  const history = useGameStore(s=>s.history)

  const unlocked = useGameStore(s=>unlockedCities(s))

  return (
    <div className="container">
      <aside className="sidebar">
        <div className="card">
          <h3>Situation</h3>
          <div>Semaine {week} • Ville: <b>{cityName(cityKey)}</b></div>
        </div>
        <div className="card">
          <h3>Actions</h3>
          <div style={{display:'grid', gap:8}}>
            <button className="btn" onClick={nextWeek}>Passer la semaine</button>
            <button className="btn secondary" onClick={doCorrupt}>Tenter corruption (risqué)</button>
          </div>
        </div>
        <div className="card">
          <h3>Changer de ville</h3>
          <div className="list">
            {CITIES.filter(c=>unlocked.includes(c.key)).map(c=> (
              <div key={c.key} className="item">
                <div>{c.name}</div>
                <button className="btn secondary" onClick={()=>doChangeCity(c.key)}>Aller</button>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="card"><KPI/></div>

        <div className="card">
          <h3>Investir dans un secteur</h3>
          <div className="list">
            {Object.keys(SECTORS).map(k=>{
              const key = k as SectorKey
              const s = SECTORS[key]
              return (
                <div key={key} className="item">
                  <div>
                    <div><b>{s.name}</b></div>
                    <div style={{fontSize:12, color:'#666'}}>Capex min {formatMoneyUSD(s.capexMin)} • Risque {s.risk}</div>
                  </div>
                  <button className="btn" onClick={()=>doInvest(key)}>Investir</button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <h3>Portefeuille</h3>
          {sectors.length===0 ? <div style={{color:'#666'}}>Aucun secteur. Investissez pour démarrer.</div> : (
            <div className="list">
              {sectors.map((s,i)=> (
                <div key={i} className="item">
                  <div>
                    <div><b>{s.name}</b></div>
                    <div style={{fontSize:12, color:'#666'}}>Investi: {formatMoneyUSD(s.investedUSD)} • Risque {s.risk}</div>
                  </div>
                  <span className="badge">{s.key}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3>Journal</h3>
          <div className="log">
            {history.slice(-8).map(h=> (
              <div key={h.week}>
                <div style={{fontWeight:700}}>Semaine {h.week}</div>
                {h.log.map((l,i)=> <div key={i}>• {l}</div>)}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
