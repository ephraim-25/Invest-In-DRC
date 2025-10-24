export type SectorKey = 'agriculture'|'elevage'|'commerce'|'tech'|'energie'

export type Sector = {
  key: SectorKey
  name: string
  capexMin: number
  baseWeeklyRevenue: [number, number]
  risk: 'seasonal'|'sanitary'|'fx'|'talent'|'power'
  investedUSD: number
}

export type HistoryEntry = { week:number; log:string[]; netWorth:number }

export type GameState = {
  week: number
  cashUSD: number
  cashCDF: number
  fx: number
  inflation: number
  reputation: number
  cityKey: string
  sectors: Sector[]
  bankruptWeeks: number
  history: HistoryEntry[]
}

export const SECTORS: Record<SectorKey, Omit<Sector,'investedUSD'>> = {
  agriculture: { name: 'Agriculture', capexMin: 20, baseWeeklyRevenue: [20, 80], risk: 'seasonal' },
  elevage: { name: 'Élevage', capexMin: 25, baseWeeklyRevenue: [10, 60], risk: 'sanitary' },
  commerce: { name: 'Commerce', capexMin: 10, baseWeeklyRevenue: [15, 70], risk: 'fx' },
  tech: { name: 'Tech', capexMin: 10, baseWeeklyRevenue: [5, 120], risk: 'talent' },
  energie: { name: 'Énergie', capexMin: 40, baseWeeklyRevenue: [0, 150], risk: 'power' },
}

export const CITIES = [
  { key: 'kinshasa', name: 'Kinshasa', unlockedAtNetWorth: 0 },
  { key: 'lubumbashi', name: 'Lubumbashi', unlockedAtNetWorth: 5000 },
  { key: 'goma', name: 'Goma', unlockedAtNetWorth: 12000 },
  { key: 'matadi', name: 'Matadi', unlockedAtNetWorth: 25000 },
  { key: 'mbandaka', name: 'Mbandaka', unlockedAtNetWorth: 50000 },
]

const WEEKLY_BASE_INFLATION: [number,number] = [0.002, 0.015]
const FX_INITIAL = 2800

function randomInRange(min:number, max:number){ return Math.random()*(max-min)+min }
function randomInt(min:number, max:number){ return Math.floor(randomInRange(min, max+1)) }
function clamp(v:number, min:number, max:number){ return Math.max(min, Math.min(max, v)) }

export function createInitialState(): GameState{
  return {
    week: 1,
    cashUSD: 50,
    cashCDF: 0,
    fx: FX_INITIAL,
    inflation: 0.005,
    reputation: 50,
    cityKey: 'kinshasa',
    sectors: [],
    bankruptWeeks: 0,
    history: [],
  }
}

export function netWorthUSD(state: GameState){
  const cash = state.cashUSD + state.cashCDF / state.fx
  const sectorsValue = state.sectors.reduce((sum, s) => sum + s.investedUSD * 0.8, 0)
  return cash + sectorsValue
}

export function unlockedCities(state: GameState){
  const worth = netWorthUSD(state)
  return CITIES.filter(c => worth >= c.unlockedAtNetWorth).map(c => c.key)
}
export function cityName(key:string){ return CITIES.find(x=>x.key===key)?.name ?? key }

function applyMacroEconomy(state: GameState, log: string[]){
  const baseInf = randomInRange(WEEKLY_BASE_INFLATION[0], WEEKLY_BASE_INFLATION[1])
  let inflationShock = 0
  const fxDrift = 1 + randomInRange(-0.04, 0.04)

  const eventRoll = Math.random()
  if (eventRoll < 0.08){
    inflationShock += randomInRange(0.01, 0.05)
    log.push('Pénurie de carburant: coûts logistiques en hausse.')
  } else if (eventRoll < 0.16){
    log.push("Coupures d’électricité: baisse de productivité.")
  } else if (eventRoll < 0.22){
    const shock = randomInRange(-0.06, 0.06)
    state.fx = Math.max(1200, Math.round(state.fx * (1 + shock)))
    log.push(`Choc de change: nouveau taux ≈ ${state.fx} CDF/USD`)
  }

  state.inflation = clamp(baseInf + inflationShock, 0, 0.2)
  state.fx = Math.max(1200, Math.round(state.fx * fxDrift))
}

function sectorWeeklyResult(state: GameState, sector: Sector, log: string[]){
  const [minRev, maxRev] = sector.baseWeeklyRevenue
  let revenue = randomInRange(minRev, maxRev)

  const repMult = 1 + (state.reputation - 50) / 200
  const cityMult = state.cityKey === 'kinshasa' ? 1 : 1.05
  revenue *= repMult * cityMult

  const eventRoll = Math.random()
  if (sector.risk === 'power' && eventRoll < 0.15){
    revenue *= 0.7
    log.push(`${sector.name}: coupure réseau, production réduite.`)
  }
  if (sector.risk === 'fx' && eventRoll < 0.15){
    revenue *= 0.85
    log.push(`${sector.name}: volatilité du change, marge compressée.`)
  }
  if (sector.risk === 'seasonal' && eventRoll < 0.12){
    revenue *= 0.8
    log.push(`${sector.name}: saison faible.`)
  }
  if (sector.risk === 'sanitary' && eventRoll < 0.10){
    revenue *= 0.75
    log.push(`${sector.name}: alerte sanitaire, pertes.`)
  }

  const fixedCosts = 5 + Math.max(0, sector.investedUSD * 0.02)
  const generatorCost = 10 + randomInRange(0, 15)
  const logisticInflation = 1 + state.inflation

  const gross = revenue
  const variableCosts = revenue * randomInRange(0.25, 0.55)
  const totalCosts = fixedCosts + generatorCost + variableCosts * logisticInflation
  const profit = gross - totalCosts
  return { revenue: gross, costs: totalCosts, profit }
}

export function applyCorruptionChoice(state: GameState){
  const log: string[] = []
  const bribe = randomInt(10, 200)
  const gainNow = bribe * randomInRange(1.1, 2.3)
  const ns: GameState = { ...state, cashUSD: state.cashUSD + gainNow - bribe, reputation: clamp(state.reputation - randomInt(5, 20), 0, 100) }
  log.push(`Corruption: -$${bribe} + $${gainNow.toFixed(2)} immédiat, réputation ↓.`)
  ns.history = [...ns.history, { week: ns.week, log, netWorth: netWorthUSD(ns) }]
  return ns
}

export function investInSector(state: GameState, sectorKey: SectorKey){
  const meta = SECTORS[sectorKey]
  if (!meta) return state
  if (state.cashUSD < meta.capexMin) return state
  const s: Sector = { ...meta, key: sectorKey, investedUSD: meta.capexMin }
  const ns: GameState = { ...state, cashUSD: state.cashUSD - meta.capexMin, sectors: [...state.sectors, s] }
  return ns
}

export function changeCity(state: GameState, cityKey: string){
  if (!CITIES.find(c=>c.key===cityKey)) return state
  return { ...state, cityKey }
}

export function simulateWeek(state: GameState): [GameState, string[]]{
  const log: string[] = []
  const ns: GameState = JSON.parse(JSON.stringify(state))

  applyMacroEconomy(ns, log)

  let totalProfit = 0
  for (const s of ns.sectors){
    const { profit } = sectorWeeklyResult(ns, s, log)
    totalProfit += profit
  }
  const tax = totalProfit > 0 ? totalProfit * 0.02 : 0
  totalProfit -= tax

  if (ns.cashCDF > 0){
    const toUsd = ns.cashCDF / ns.fx
    ns.cashUSD += toUsd
    ns.cashCDF = 0
  }

  ns.cashUSD += totalProfit
  if (totalProfit >= 0) log.push(`Profit hebdomadaire: $${totalProfit.toFixed(2)} (après taxes)`) 
  else log.push(`Perte hebdomadaire: $${totalProfit.toFixed(2)} (après taxes)`) 

  ns.bankruptWeeks = ns.cashUSD < 0 ? ns.bankruptWeeks + 1 : 0
  ns.week += 1
  ns.history = [...ns.history, { week: ns.week, log, netWorth: netWorthUSD(ns) }]
  return [ns, log]
}
