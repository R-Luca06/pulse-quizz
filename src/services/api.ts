/**
 * Couche d'abstraction API — point d'entrée unique pour les données du jeu.
 *
 * Aujourd'hui : OpenTDB
 * Plus tard   : remplacer les implémentations ici pour pointer vers le backend,
 *               sans toucher aux hooks ni aux composants.
 */

import { fetchQuestions as fetchFromOpenTDB } from '../utils/trivia'
import type { TriviaQuestion, Difficulty, Language, Category } from '../types/quiz'

export interface QuizParams {
  difficulty: Difficulty
  language: Language
  category: Category
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

export async function fetchQuestions(params: QuizParams, signal?: AbortSignal): Promise<TriviaQuestion[]> {
  try {
    return await fetchFromOpenTDB(params.difficulty, params.language, params.category, signal)
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'rate_limit') throw new ApiError('rate_limit')
      if (err.message === 'api_error')  throw new ApiError('api_error')
    }
    throw new ApiError('network_error')
  }
}

/** Batch de 10 questions aléatoires (sans filtre difficulté/catégorie) pour le mode compétitif */
export async function fetchCompetitifBatch(language: Language, signal?: AbortSignal): Promise<TriviaQuestion[]> {
  return fetchQuestions({ difficulty: 'mixed', language, category: 'all' }, signal)
}
