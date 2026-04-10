/**
 * Import questions custom → Supabase
 * ────────────────────────────────────
 * Lit un fichier JSON local et insère toutes les questions dans la table `questions`.
 *
 * Usage :
 *   node scripts/import-custom.mjs <fichier.json>
 *
 * Exemple :
 *   node scripts/import-custom.mjs questions_custom.json
 *
 * Variables d'env requises (dans .env.local) :
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const BATCH_SIZE = 100

// ─── Env ─────────────────────────────────────────────────────────────────────

function loadEnv() {
  try {
    const raw = readFileSync('.env.local', 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) process.env[m[1].trim()] = m[2].trim()
    }
  } catch { /* variables déjà dans l'env */ }
}

loadEnv()
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquants dans .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ─── Validation légère ────────────────────────────────────────────────────────

const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard'])
const VALID_LANGUAGES    = new Set(['fr', 'en'])

function validateRow(q, index) {
  const errors = []
  if (!q.question?.trim())                          errors.push('question manquante')
  if (!q.correct_answer?.trim())                    errors.push('correct_answer manquant')
  if (!Array.isArray(q.incorrect_answers) || q.incorrect_answers.length < 1)
                                                    errors.push('incorrect_answers invalide')
  if (!VALID_DIFFICULTIES.has(q.difficulty))        errors.push(`difficulty invalide: ${q.difficulty}`)
  if (!VALID_LANGUAGES.has(q.language))             errors.push(`language invalide: ${q.language}`)
  if (!q.category?.trim())                          errors.push('category manquante')
  if (errors.length) console.warn(`  ⚠️  [${index}] ${errors.join(', ')} — ignoré`)
  return errors.length === 0
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const reset = args.includes('--reset')
  const filepath = args.find(a => !a.startsWith('--'))
  if (!filepath) {
    console.error('Usage : node scripts/import-custom.mjs <fichier.json> [--reset]')
    process.exit(1)
  }

  if (reset) {
    console.log('🗑️   Suppression de toutes les questions existantes...')
    const { error } = await supabase.from('questions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) { console.error('❌  Erreur suppression :', error.message); process.exit(1) }
    console.log('✅  Table vidée\n')
  }

  let raw
  try {
    raw = readFileSync(filepath, 'utf8')
  } catch {
    console.error(`❌  Impossible de lire le fichier : ${filepath}`)
    process.exit(1)
  }

  let questions
  try {
    questions = JSON.parse(raw)
    if (!Array.isArray(questions)) throw new Error('le JSON doit être un tableau []')
  } catch (err) {
    console.error(`❌  JSON invalide : ${err.message}`)
    process.exit(1)
  }

  console.log(`📦  ${questions.length} questions trouvées dans le fichier`)

  // Validation + nettoyage
  const valid = questions
    .map((q, i) => ({ q, i }))
    .filter(({ q, i }) => validateRow(q, i))
    .map(({ q }) => ({
      language:          q.language,
      category:          q.category.trim(),
      difficulty:        q.difficulty,
      question:          q.question.trim(),
      correct_answer:    q.correct_answer.trim(),
      incorrect_answers: q.incorrect_answers.map(a => String(a).trim()),
      anecdote:          q.anecdote?.trim() || null,
      source:            q.source ?? 'custom',
    }))

  const skipped = questions.length - valid.length
  console.log(`✅  ${valid.length} valides  •  ⚠️  ${skipped} ignorées\n`)

  if (valid.length === 0) {
    console.log('Rien à insérer.')
    return
  }

  // Résumé par catégorie
  const byCategory = valid.reduce((acc, q) => {
    const key = `${q.category} (${q.difficulty})`
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
  for (const [key, count] of Object.entries(byCategory)) {
    console.log(`  ${key} : ${count} questions`)
  }
  console.log()

  // Insertion par batches
  let inserted = 0
  for (let i = 0; i < valid.length; i += BATCH_SIZE) {
    const batch = valid.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('questions').insert(batch)
    if (error) {
      console.error(`❌  Erreur batch ${i}–${i + batch.length} : ${error.message}`)
      process.exit(1)
    }
    inserted += batch.length
    process.stdout.write(`\r  Insertion... ${inserted}/${valid.length}`)
  }

  console.log(`\n\n✨  Import terminé — ${inserted} questions insérées`)
}

main().catch(err => {
  console.error('❌  Erreur fatale :', err)
  process.exit(1)
})
