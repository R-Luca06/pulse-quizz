import { useState, useEffect, useRef } from 'react'

const TICK = 100 // ms

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
  const [elapsed, setElapsed] = useState(0) // ms
  const onTimeoutRef = useRef(onTimeout)
  onTimeoutRef.current = onTimeout

  // Reset whenever the question changes
  useEffect(() => {
    setElapsed(0)
  }, [questionKey])

  useEffect(() => {
    if (!active) return

    const id = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + TICK
        if (next >= duration * 1000) {
          clearInterval(id)
          onTimeoutRef.current()
          return duration * 1000
        }
        return next
      })
    }, TICK)

    return () => clearInterval(id)
  }, [active, questionKey, duration]) // questionKey restarts the interval too

  const timeLeft = Math.max(0, duration - elapsed / 1000)
  const progress = timeLeft / duration

  return { timeLeft, progress }
}
