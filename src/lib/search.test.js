import { describe, expect, it } from 'vitest'
import { parseRateLimit } from './search.js'

describe('parseRateLimit', () => {
  it('reads GitHub rate-limit headers safely', () => {
    const headers = new Headers({
      'x-ratelimit-limit': '10',
      'x-ratelimit-remaining': '7',
      'x-ratelimit-reset': '1788540000',
    })

    expect(parseRateLimit(headers)).toEqual({
      limit: 10,
      remaining: 7,
      reset: 1788540000,
    })
  })

  it('returns null values when headers are unavailable', () => {
    expect(parseRateLimit(null)).toEqual({ limit: null, remaining: null, reset: null })
  })
})
