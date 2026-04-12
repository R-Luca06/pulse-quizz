import { useState, useEffect, useRef } from 'react'
import { TIMER_TICK } from '../constants/game'

interface UseTimerReturn {
  timeLeft: number   // seconds remaining
  progress: number   // 1 → 0
}

export function useTimer(
  duration: number,
  active: boolean,
  questionKey: number,
  onTimeout: () => void,
): UseTimerReturn {
  const [elapsed, setElapsed] = useState(0)
  const onTimeoutRef = useRef(onTimeout)
  useEffect(() => { onTimeoutRef.current = onTimeout })

  useEffect(() => {
    // Reset via microtask — runs before first interval tick
    queueMicrotask(() => setElapsed(0))
    if (!active) return

    const id = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + TIMER_TICK
        if (next >= duration * 1000) {
          clearInterval(id)
          onTimeoutRef.current()
          return duration * 1000
        }
        return next
      })
    }, TIMER_TICK)

    return () => clearInterval(id)
  }, [active, questionKey, duration])

  const timeLeft = Math.max(0, duration - elapsed / 1000)
  const progress = timeLeft / duration

  return { timeLeft, progress }
}
