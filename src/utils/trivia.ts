import type { TriviaQuestion } from '../types/quiz'

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

export async function fetchQuestions(): Promise<TriviaQuestion[]> {
  const res = await fetch('https://opentdb.com/api.php?amount=10&type=multiple')
  if (!res.ok) throw new Error('Failed to fetch questions')
  const data = await res.json()
  if (data.response_code !== 0) throw new Error('OpenTDB error: ' + data.response_code)

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
