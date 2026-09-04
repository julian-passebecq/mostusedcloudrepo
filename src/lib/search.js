import { getFallbackRepositories, normalizeRepository } from './github.js'

const CACHE_TTL_MS = 15 * 60 * 1000
const RESULTS_PER_PAGE = 50

function getCacheKey(query, sort) {
  return `cloud-repo-radar:v2:${sort}:${query}`
}

function readCache(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const age = Date.now() - parsed.savedAt
    if (!Array.isArray(parsed.items) || age > CACHE_TTL_MS) {
      localStorage.removeItem(key)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeCache(key, payload) {
  try {
    localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), ...payload }))
  } catch {
    // Browser storage can be disabled. Live search still works.
  }
}

export function parseRateLimit(headers) {
  const number = (name) => {
    const value = headers?.get?.(name)
    if (value == null || value === '') return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return {
    limit: number('x-ratelimit-limit'),
    remaining: number('x-ratelimit-remaining'),
    reset: number('x-ratelimit-reset'),
  }
}

export async function searchRepositoriesEnhanced({
  query,
  sort = 'stars',
  signal,
  technologyId = 'python',
  contentTypeId = 'all',
  topicId = 'all',
  searchText = '',
}) {
  const key = getCacheKey(query, sort)
  const cached = readCache(key)
  if (cached) {
    return {
      items: cached.items,
      source: 'cache',
      rateLimit: cached.rateLimit ?? null,
      totalCount: cached.totalCount ?? cached.items.length,
      incompleteResults: Boolean(cached.incompleteResults),
    }
  }

  const params = new URLSearchParams({
    q: query,
    sort,
    order: 'desc',
    per_page: String(RESULTS_PER_PAGE),
  })

  try {
    const response = await fetch(`https://api.github.com/search/repositories?${params.toString()}`, {
      signal,
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2026-03-10',
      },
    })

    const rateLimit = parseRateLimit(response.headers)

    if (!response.ok) {
      const error = new Error(`GitHub returned ${response.status}`)
      error.status = response.status
      error.rateLimited = response.status === 403 || response.status === 429
      error.rateLimit = rateLimit
      throw error
    }

    const payload = await response.json()
    const result = {
      items: (payload.items || []).map(normalizeRepository),
      rateLimit,
      totalCount: payload.total_count || 0,
      incompleteResults: Boolean(payload.incomplete_results),
    }
    writeCache(key, result)
    return { ...result, source: 'live' }
  } catch (error) {
    if (error.name === 'AbortError') throw error
    const items = getFallbackRepositories({ technologyId, contentTypeId, topicId, searchText, sort })
    return {
      items,
      source: 'demo',
      error,
      rateLimit: error.rateLimit ?? null,
      totalCount: items.length,
      incompleteResults: false,
    }
  }
}
