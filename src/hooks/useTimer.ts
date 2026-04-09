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
  const [trackedKey, setTrackedKey] = useState(questionKey)
  const onTimeoutRef = useRef(onTimeout)
  onTimeoutRef.current = onTimeout

  // Synchronous reset: detect key change DURING render so there is no
  // one-frame flash of stale elapsed when the next question starts
  let effectiveElapsed = elapsed
  if (trackedKey !== questionKey) {
    setTrackedKey(questionKey)
    setElapsed(0)
    effectiveElapsed = 0
  }

  useEffect(() => {
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

  const timeLeft = Math.max(0, duration - effectiveElapsed / 1000)
  const progress = timeLeft / duration

  return { timeLeft, progress }
}
