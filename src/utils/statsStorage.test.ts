import { describe, it, expect, beforeEach } from 'vitest'
import { isReturningAnonymous, markPlayedAnonymous } from './statsStorage'

describe('isReturningAnonymous', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns false when localStorage is empty', () => {
    expect(isReturningAnonymous()).toBe(false)
  })

  it('returns true after markPlayedAnonymous is called', () => {
    markPlayedAnonymous()
    expect(isReturningAnonymous()).toBe(true)
  })

  it('returns false when only unrelated keys exist', () => {
    localStorage.setItem('pulse_stats_normal_easy_all', JSON.stringify({ version: 1 }))
    localStorage.setItem('other_key', 'value')
    expect(isReturningAnonymous()).toBe(false)
  })

  it('returns false when flag is explicitly false', () => {
    localStorage.setItem('pulse_played_anonymous', 'false')
    expect(isReturningAnonymous()).toBe(false)
  })
})
