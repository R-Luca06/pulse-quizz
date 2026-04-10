import type { TriviaQuestion, Difficulty, Language, Category } from '../types/quiz'

interface RawTriviaResult {
  question: string
  correct_answer: string
  incorrect_answers: string[]
  category: string
  difficulty: string
}

function decodeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.documentElement.textContent ?? html
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function fetchQuestions(difficulty: Difficulty = 'mixed', language: Language = 'en', category: Category = 'all', externalSignal?: AbortSignal): Promise<TriviaQuestion[]> {
  const params = new URLSearchParams({ amount: '10', type: 'multiple' })
  if (difficulty !== 'mixed') params.set('difficulty', difficulty)
  if (language !== 'en') params.set('lang', language)
  if (category !== 'all') params.set('category', String(category))
  const controller = new AbortController()
  // Propagate external abort (e.g. component unmount) into internal controller
  externalSignal?.addEventListener('abort', () => controller.abort(), { once: true })
  const timer = setTimeout(() => controller.abort(), 8000)
  let res: Response
  try {
    res = await fetch(`https://opentdb.com/api.php?${params}`, { signal: controller.signal })
  } catch (err) {
    clearTimeout(timer)
    if ((err as Error).name === 'AbortError') throw new Error('api_error')
    throw err
  }
  clearTimeout(timer)
  if (res.status === 429) throw new Error('rate_limit')
  if (!res.ok) throw new Error('api_error')
  const data = await res.json()
  if (data.response_code === 5) throw new Error('rate_limit')
  if (data.response_code !== 0) throw new Error('api_error')

  return data.results.map((q: RawTriviaResult) => {
    const question = decodeHtml(q.question)
    const correct_answer = decodeHtml(q.correct_answer)
    const incorrect_answers = q.incorrect_answers.map(decodeHtml)
    return {
      question,
      correct_answer,
      incorrect_answers,
      shuffledAnswers: shuffle([correct_answer, ...incorrect_answers]),
      category: decodeHtml(q.category),
      difficulty: q.difficulty as TriviaQuestion['difficulty'],
    }
  })
}
