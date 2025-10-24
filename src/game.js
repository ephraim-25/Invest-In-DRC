#!/usr/bin/env node

// Invest In DRC — Prototype CLI (v0.1)
// Sans dépendances externes

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ------------------ Constants & Data ------------------
const SAVE_PATH = path.resolve(__dirname, '../save.json');

const SECTORS = {
  agriculture: { name: 'Agriculture', capexMin: 20, baseWeeklyRevenue: [20, 80], risk: 'seasonal' },
  elevage: { name: 'Élevage', capexMin: 25, baseWeeklyRevenue: [10, 60], risk: 'sanitary' },
  commerce: { name: 'Commerce', capexMin: 10, baseWeeklyRevenue: [15, 70], risk: 'fx' },
  tech: { name: 'Tech', capexMin: 10, baseWeeklyRevenue: [5, 120], risk: 'talent' },
  energie: { name: 'Énergie', capexMin: 40, baseWeeklyRevenue: [0, 150], risk: 'power' },
};

const CITIES = [
  { key: 'kinshasa', name: 'Kinshasa', unlockedAtNetWorth: 0 },
  { key: 'lubumbashi', name: 'Lubumbashi', unlockedAtNetWorth: 5000 },
  { key: 'goma', name: 'Goma', unlockedAtNetWorth: 12000 },
  { key: 'matadi', name: 'Matadi', unlockedAtNetWorth: 25000 },
  { key: 'mbandaka', name: 'Mbandaka', unlockedAtNetWorth: 50000 },
];

const WEEKLY_BASE_INFLATION = [0.002, 0.015]; // 0.2% - 1.5%
const FX_INITIAL = 2800; // 1 USD = 2800 CDF

// ------------------ Utilities ------------------
function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}
function randomInt(min, max) {
  return Math.floor(randomInRange(min, max + 1));
}
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatMoneyUSD(amount) {
  return `$${amount.toFixed(2)}`;
}
function formatCDF(amount) {
  return `${Math.round(amount).toLocaleString('fr-CD')} CDF`;
}

// ------------------ Persistence ------------------
function loadSave() {
  try {
    if (fs.existsSync(SAVE_PATH)) {
      const raw = fs.readFileSync(SAVE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function saveGame(state) {
  try {
    fs.writeFileSync(SAVE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) {
    // ignore
  }
}

// ------------------ Game State ------------------
function createInitialState() {
  return {
    week: 1,
    cashUSD: 50,
    cashCDF: 0,
    fx: FX_INITIAL,
    inflation: 0.005,
    reputation: 50, // 0-100
    cityKey: 'kinshasa',
    sectors: [],
    bankruptWeeks: 0,
    history: [],
  };
}

function netWorthUSD(state) {
  const cash = state.cashUSD + state.cashCDF / state.fx;
  const sectorsValue = state.sectors.reduce((sum, s) => sum + s.investedUSD * 0.8, 0);
  return cash + sectorsValue;
}

function unlockedCities(state) {
  const worth = netWorthUSD(state);
  return CITIES.filter(c => worth >= c.unlockedAtNetWorth).map(c => c.key);
}

function cityName(key) {
  const c = CITIES.find(x => x.key === key);
  return c ? c.name : key;
}

// ------------------ Events & Economy ------------------
function applyMacroEconomy(state, log) {
  // Inflation base
  const baseInf = randomInRange(WEEKLY_BASE_INFLATION[0], WEEKLY_BASE_INFLATION[1]);
  let inflationShock = 0;
  // FX drift ±0-4%
  const fxDrift = 1 + randomInRange(-0.04, 0.04);

  // Random macro event
  const eventRoll = Math.random();
  if (eventRoll < 0.08) {
    // Fuel shortage
    inflationShock += randomInRange(0.01, 0.05);
    log.push('Pénurie de carburant: coûts logistiques en hausse.');
  } else if (eventRoll < 0.16) {
    // Power cuts
    log.push('Coupures d’électricité: baisse de productivité.');
  } else if (eventRoll < 0.22) {
    // FX shock
    const shock = randomInRange(-0.06, 0.06);
    state.fx = Math.max(1200, Math.round(state.fx * (1 + shock)));
    log.push(`Choc de change: nouveau taux ≈ ${state.fx} CDF/USD`);
  }

  state.inflation = clamp(baseInf + inflationShock, 0, 0.2);
  state.fx = Math.max(1200, Math.round(state.fx * fxDrift));
}

function sectorWeeklyResult(state, sector, log) {
  const [minRev, maxRev] = sector.baseWeeklyRevenue;
  let revenue = randomInRange(minRev, maxRev);

  // City and reputation modifiers (simple)
  const repMult = 1 + (state.reputation - 50) / 200; // 0.75–1.25 roughly
  const cityMult = state.cityKey === 'kinshasa' ? 1 : 1.05; // later cities slightly better
  revenue *= repMult * cityMult;

  // Event based modifiers
  const eventRoll = Math.random();
  if (sector.risk === 'power' && eventRoll < 0.15) {
    revenue *= 0.7;
    log.push(`${sector.name}: coupure réseau, production réduite.`);
  }
  if (sector.risk === 'fx' && eventRoll < 0.15) {
    revenue *= 0.85;
    log.push(`${sector.name}: volatilité du change, marge compressée.`);
  }
  if (sector.risk === 'seasonal' && eventRoll < 0.12) {
    revenue *= 0.8;
    log.push(`${sector.name}: saison faible.`);
  }
  if (sector.risk === 'sanitary' && eventRoll < 0.10) {
    revenue *= 0.75;
    log.push(`${sector.name}: alerte sanitaire, pertes.`);
  }

  // Costs
  const fixedCosts = 5 + Math.max(0, sector.investedUSD * 0.02);
  const generatorCost = 10 + randomInRange(0, 15);
  const logisticInflation = 1 + state.inflation;

  const gross = revenue;
  const variableCosts = revenue * randomInRange(0.25, 0.55);
  const totalCosts = fixedCosts + generatorCost + variableCosts * logisticInflation;
  const profit = gross - totalCosts;

  return { revenue: gross, costs: totalCosts, profit };
}

function applyCorruptionChoice(state, log) {
  const bribe = randomInt(10, 200);
  const gainNow = bribe * randomInRange(1.1, 2.3);
  state.cashUSD += gainNow - bribe;
  state.reputation = clamp(state.reputation - randomInt(5, 20), 0, 100);
  log.push(`Corruption: -${formatMoneyUSD(bribe)} + ${formatMoneyUSD(gainNow)} immédiat, réputation ↓.`);
}

// ------------------ CLI Helpers ------------------
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function ask(question) {
  return new Promise(resolve => rl.question(question, ans => resolve(ans.trim())));
}

function printState(state) {
  console.log('\n===========================');
  console.log(`Semaine ${state.week} | Ville: ${cityName(state.cityKey)}`);
  console.log(`Cash: ${formatMoneyUSD(state.cashUSD)} | ${formatCDF(state.cashCDF)} | FX: ${state.fx} CDF/USD`);
  console.log(`Réputation: ${state.reputation} | Valeur nette: ${formatMoneyUSD(netWorthUSD(state))}`);
  console.log(`Secteurs: ${state.sectors.map(s => s.name).join(', ') || '—'}`);
  console.log('===========================\n');
}

function listOptions(options) {
  options.forEach((opt, idx) => {
    console.log(`${idx + 1}. ${opt}`);
  });
}

// ------------------ Game Flow ------------------
async function chooseInitialSector(state) {
  console.log('Choisis ton secteur initial:');
  const keys = Object.keys(SECTORS);
  listOptions(keys.map(k => `${SECTORS[k].name} (capex min ${formatMoneyUSD(SECTORS[k].capexMin)})`));
  let idx = parseInt(await ask('> '), 10) - 1;
  if (Number.isNaN(idx) || idx < 0 || idx >= keys.length) idx = 0;
  const key = keys[idx];
  const sector = { ...SECTORS[key], key, investedUSD: SECTORS[key].capexMin };
  if (state.cashUSD < sector.investedUSD) {
    console.log("Capital insuffisant, allocation minimale automatique.");
  }
  state.cashUSD = Math.max(0, state.cashUSD - sector.investedUSD);
  state.sectors.push(sector);
}

async function mainMenu(state) {
  console.log('Actions:');
  const opts = [
    'Passer la semaine',
    'Investir dans un secteur',
    'Changer de ville',
    'Tenter une corruption (risqué)',
    'Sauvegarder et quitter',
  ];
  listOptions(opts);
  const choice = parseInt(await ask('> '), 10) - 1;
  return choice;
}

async function investInSector(state) {
  console.log('Secteurs disponibles:');
  const keys = Object.keys(SECTORS);
  listOptions(keys.map(k => `${SECTORS[k].name} (capex min ${formatMoneyUSD(SECTORS[k].capexMin)})`));
  let idx = parseInt(await ask('> '), 10) - 1;
  if (Number.isNaN(idx) || idx < 0 || idx >= keys.length) return;
  const key = keys[idx];
  const capex = SECTORS[key].capexMin;
  if (state.cashUSD < capex) {
    console.log("Fonds insuffisants.");
    return;
  }
  state.cashUSD -= capex;
  state.sectors.push({ ...SECTORS[key], key, investedUSD: capex });
  console.log(`Investi ${formatMoneyUSD(capex)} dans ${SECTORS[key].name}.`);
}

async function changeCity(state) {
  const unlocked = unlockedCities(state);
  const options = CITIES.filter(c => unlocked.includes(c.key));
  console.log('Villes débloquées:');
  options.forEach((c, i) => console.log(`${i + 1}. ${c.name}`));
  let idx = parseInt(await ask('> '), 10) - 1;
  if (Number.isNaN(idx) || idx < 0 || idx >= options.length) return;
  state.cityKey = options[idx].key;
}

function simulateWeek(state) {
  const log = [];
  applyMacroEconomy(state, log);

  let totalProfit = 0;
  for (const s of state.sectors) {
    const { revenue, costs, profit } = sectorWeeklyResult(state, s, log);
    totalProfit += profit;
  }

  // Taxes simple (2% sur profit positif)
  const tax = totalProfit > 0 ? totalProfit * 0.02 : 0;
  totalProfit -= tax;

  // Convertir une partie des CDF vers USD si dispo
  if (state.cashCDF > 0) {
    const toUsd = state.cashCDF / state.fx;
    state.cashUSD += toUsd;
    state.cashCDF = 0;
  }

  state.cashUSD += totalProfit;
  if (totalProfit >= 0) log.push(`Profit hebdomadaire: ${formatMoneyUSD(totalProfit)} (après taxes)`);
  else log.push(`Perte hebdomadaire: ${formatMoneyUSD(totalProfit)} (après taxes)`);

  if (state.cashUSD < 0) state.bankruptWeeks += 1; else state.bankruptWeeks = 0;

  state.week += 1;
  state.history.push({ week: state.week, log, netWorth: netWorthUSD(state) });
  return log;
}

function checkEndgame(state) {
  if (netWorthUSD(state) >= 1_000_000 && state.reputation >= 60) {
    return 'win';
  }
  if (state.bankruptWeeks >= 2 || state.reputation < 10) {
    return 'lose';
  }
  return null;
}

async function gameLoop(state) {
  if (state.sectors.length === 0) {
    await chooseInitialSector(state);
  }

  while (true) {
    printState(state);
    const choice = await mainMenu(state);
    if (choice === 0) {
      const log = simulateWeek(state);
      console.log(log.map(l => `- ${l}`).join('\n'));
      const end = checkEndgame(state);
      if (end === 'win') {
        console.log('Victoire! Tu as bâti un empire congolais.');
        break;
      } else if (end === 'lose') {
        console.log('Défaite. Faillite ou réputation détruite.');
        break;
      }
    } else if (choice === 1) {
      await investInSector(state);
    } else if (choice === 2) {
      await changeCity(state);
    } else if (choice === 3) {
      applyCorruptionChoice(state, []);
    } else if (choice === 4) {
      saveGame(state);
      console.log('Sauvegardé. À bientôt.');
      break;
    } else {
      console.log('Choix invalide.');
    }
  }
}

async function run() {
  console.log('Invest In DRC — Prototype CLI');
  let state = loadSave() || createInitialState();
  await gameLoop(state);
  rl.close();
}

run();
