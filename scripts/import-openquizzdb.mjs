/**
 * Import OpenQuizzDB → Supabase
 * ─────────────────────────────
 * Télécharge tous les quiz JSON depuis le miroir GitHub de OpenQuizzDB
 * et les insère dans la table `questions` de Supabase.
 *
 * Usage :
 *   node scripts/import-openquizzdb.mjs
 *
 * Variables d'env requises (dans .env.local ou exportées dans le shell) :
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   ← Supabase Dashboard → Settings → API → service_role
 *
 * Prérequis :
 *   - Avoir exécuté scripts/supabase_questions.sql dans Supabase
 *   - npm install (pour @supabase/supabase-js disponible dans node_modules)
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

// ─── Config ──────────────────────────────────────────────────────────────────

const GITHUB_API = 'https://api.github.com/repos/Zeuh/OpenQuizzDB/contents/data'
const RAW_BASE   = 'https://raw.githubusercontent.com/Zeuh/OpenQuizzDB/master/data'
const LANGUAGE   = 'fr'
const BATCH_SIZE = 50   // questions insérées par appel insert
const DELAY_MS   = 300  // délai entre requêtes GitHub (évite le rate-limit)

// Mapping difficulté OpenQuizzDB → difficulty app
const DIFF_MAP = {
  'débutant': 'easy',
  'confirmé': 'medium',
  'expert':   'hard',
}

// ─── Env ─────────────────────────────────────────────────────────────────────

function loadEnv() {
  try {
    const raw = readFileSync('.env.local', 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) process.env[m[1].trim()] = m[2].trim()
    }
  } catch {
    // Variables déjà dans l'environnement, c'est ok
  }
}

loadEnv()
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquants')
  console.error('    → Ajouter SUPABASE_SERVICE_ROLE_KEY dans .env.local')
  console.error('    → Supabase Dashboard → Settings → API → service_role secret')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return res.json()
}

/**
 * Extrait les questions d'un objet quizz (niveaux → questions).
 * Gère les deux formats OpenQuizzDB :
 *   - Ancien : { débutant: [...], confirmé: [...], expert: [...] }
 *   - Nouveau : { fr: [{ débutant: [...], ... }], en: [...] }
 */
function extractLevels(quizz) {
  // Nouveau format : quizz.fr[0] contient les niveaux
  if (quizz[LANGUAGE] && Array.isArray(quizz[LANGUAGE])) {
    return quizz[LANGUAGE][0] ?? {}
  }
  // Ancien format : quizz contient directement les niveaux
  if (quizz['débutant'] || quizz['confirmé'] || quizz['expert']) {
    return quizz
  }
  return {}
}

/**
 * Parse un fichier OpenQuizzDB et retourne un tableau de questions normalisées.
 */
function parseQuizzFile(raw, filename) {
  // Corriger "difficulté": 2 / 5 (pas du JSON valide, présent dans les anciens fichiers)
  const fixed = raw.replace(/"difficulté":\s*\d+\s*\/\s*\d+/g, '"difficulté": null')
  let data
  try {
    data = JSON.parse(fixed)
  } catch {
    return []
  }

  const theme   = (data['thème'] ?? data['theme'] ?? 'Divers').trim()
  const quizz   = data['quizz'] ?? {}
  const levels  = extractLevels(quizz)
  const results = []

  for (const [levelKey, questions] of Object.entries(levels)) {
    const difficulty = DIFF_MAP[levelKey]
    if (!difficulty || !Array.isArray(questions)) continue

    for (const q of questions) {
      const question      = (q['question'] ?? '').trim()
      const correctAnswer = (q['réponse'] ?? q['reponse'] ?? '').trim()
      const propositions  = q['propositions'] ?? []
      const anecdote      = (q['anecdote'] ?? '').trim() || null

      if (!question || !correctAnswer || propositions.length < 2) continue

      // Extraire les 3 mauvaises réponses (filtrer la première occurrence de la bonne)
      const incorrectAnswers = []
      let correctFound = false
      for (const p of propositions) {
        const trimmed = String(p).trim()
        if (trimmed === correctAnswer && !correctFound) {
          correctFound = true
        } else {
          incorrectAnswers.push(trimmed)
        }
      }

      if (incorrectAnswers.length < 1) continue

      results.push({
        language:          LANGUAGE,
        category:          theme,
        difficulty,
        question,
        correct_answer:    correctAnswer,
        incorrect_answers: incorrectAnswers,
        anecdote,
        source:            'openquizzdb',
      })
    }
  }

  return results
}

async function insertBatch(rows) {
  const { error } = await supabase.from('questions').insert(rows)
  if (error) throw new Error(error.message)
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔍  Récupération de la liste des fichiers depuis GitHub...')
  const files = await fetchJson(GITHUB_API)
  const jsonFiles = files.filter(f => f.name.endsWith('.json'))
  console.log(`📦  ${jsonFiles.length} fichiers JSON trouvés\n`)

  let totalInserted = 0
  let filesDone     = 0
  let filesSkipped  = 0

  for (const file of jsonFiles) {
    const url = `${RAW_BASE}/${file.name}`
    process.stdout.write(`[${++filesDone}/${jsonFiles.length}] ${file.name} ... `)

    let raw
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      raw = await res.text()
    } catch (err) {
      console.log(`❌  fetch échoué : ${err.message}`)
      filesSkipped++
      continue
    }

    const rows = parseQuizzFile(raw, file.name)
    if (rows.length === 0) {
      console.log('⚠️  aucune question FR valide')
      filesSkipped++
      continue
    }

    try {
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        await insertBatch(rows.slice(i, i + BATCH_SIZE))
      }
      console.log(`✅  ${rows.length} questions`)
      totalInserted += rows.length
    } catch (err) {
      console.log(`❌  insertion échouée : ${err.message}`)
      filesSkipped++
    }

    await sleep(DELAY_MS)
  }

  console.log(`\n✨  Import terminé`)
  console.log(`    ${totalInserted} questions insérées`)
  console.log(`    ${filesSkipped} fichiers sans questions FR ou en erreur`)
}

main().catch(err => {
  console.error('❌  Erreur fatale :', err)
  process.exit(1)
})
