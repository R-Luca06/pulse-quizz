/**
 * Couche d'abstraction API — point d'entrée unique pour les données du jeu.
 *
 * Routing :
 *   language = 'fr'  → Supabase table `questions` (via RPC get_random_questions)
 *
 * Note : le routing vers OpenTDB (language = 'en') est conservé en commentaire
 * pour réactivation future si une source EN est ajoutée.
 */

import { supabase } from './supabase'
import { QUESTIONS_PER_BATCH } from '../constants/game'
import type { TriviaQuestion, Difficulty, Language, Category } from '../types/quiz'

export interface QuizParams {
  difficulty: Difficulty
  language: Language
  category: Category
  limit?: number
}

export class ApiError extends Error {
  readonly code: 'rate_limit' | 'api_error' | 'network_error'

  constructor(
    code: 'rate_limit' | 'api_error' | 'network_error',
    message?: string,
  ) {
    super(message ?? code)
    this.name = 'ApiError'
    this.code = code
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Supabase (langue française) ─────────────────────────────────────────────

interface SupabaseQuestionRow {
  id: string
  language: string
  category: string
  difficulty: string
  question: string
  correct_answer: string
  incorrect_answers: string[]
  anecdote: string | null
}

async function fetchQuestionsFromSupabase(
  difficulty: Difficulty,
  category: Category,
  signal?: AbortSignal,
  limit?: number,
): Promise<TriviaQuestion[]> {
  const { data, error } = await supabase.rpc('get_random_questions', {
    p_language:   'fr',
    p_difficulty: difficulty,
    p_category:   category === 'all' ? 'all' : category,
    p_limit:      limit ?? QUESTIONS_PER_BATCH,
  })

  if (signal?.aborted) throw new ApiError('network_error', 'aborted')
  if (error) throw new ApiError('api_error', error.message)
  if (!data || data.length === 0) throw new ApiError('api_error', 'no questions returned')

  return (data as SupabaseQuestionRow[]).map(row => ({
    question:          row.question,
    correct_answer:    row.correct_answer,
    incorrect_answers: row.incorrect_answers,
    shuffledAnswers:   shuffle([row.correct_answer, ...row.incorrect_answers]),
    category:          row.category,
    difficulty:        row.difficulty as TriviaQuestion['difficulty'],
  }))
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function fetchQuestions(params: QuizParams, signal?: AbortSignal): Promise<TriviaQuestion[]> {
  // Routing conditionnel réservé pour future réactivation d'une source EN :
  // if (params.language === 'en') { return fetchFromExternalSource(...) }
  try {
    return await fetchQuestionsFromSupabase(params.difficulty, params.category, signal, params.limit)
  } catch (err) {
    if (err instanceof ApiError) throw err
    throw new ApiError('network_error')
  }
}

/** Batch de 10 questions aléatoires pour le mode compétitif */
export async function fetchCompetitifBatch(language: Language, signal?: AbortSignal): Promise<TriviaQuestion[]> {
  return fetchQuestions({ difficulty: 'mixed', language, category: 'all' }, signal)
}

/**
 * Récupère les 5 questions déterministes du défi journalier pour une date donnée.
 * Utilise la RPC get_daily_questions qui fixe un setseed basé sur la date,
 * garantissant que tous les joueurs reçoivent exactement les mêmes questions.
 */
export async function fetchDailyQuestions(date: string, signal?: AbortSignal): Promise<TriviaQuestion[]> {
  const { data, error } = await supabase.rpc('get_daily_questions', { p_date: date })

  if (signal?.aborted) throw new ApiError('network_error', 'aborted')
  if (error) throw new ApiError('api_error', error.message)
  if (!data || data.length === 0) throw new ApiError('api_error', 'no questions returned')

  return (data as SupabaseQuestionRow[]).map(row => ({
    question:          row.question,
    correct_answer:    row.correct_answer,
    incorrect_answers: row.incorrect_answers,
    shuffledAnswers:   shuffle([row.correct_answer, ...row.incorrect_answers]),
    category:          row.category,
    difficulty:        row.difficulty as TriviaQuestion['difficulty'],
  }))
}
