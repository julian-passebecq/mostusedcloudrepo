import { describe, expect, it } from 'vitest'
import { buildSearchQuery, normalizeRepository } from './github.js'

describe('buildSearchQuery', () => {
  it('combines technology, content type and text filters', () => {
    const query = buildSearchQuery({
      technologyId: 'pyspark',
      contentTypeId: 'samples',
      searchText: 'delta lake',
    })

    expect(query).toContain('pyspark')
    expect(query).toContain('sample in:name,description')
    expect(query).toContain('delta lake')
    expect(query).toContain('archived:false')
    expect(query).toContain('fork:false')
  })

  it('falls back to Python and repository filters for unknown ids', () => {
    const query = buildSearchQuery({ technologyId: 'nope', contentTypeId: 'nope' })
    expect(query).toContain('language:Python')
    expect(query).toContain('archived:false')
  })
})

describe('normalizeRepository', () => {
  it('provides safe defaults for optional GitHub fields', () => {
    const normalized = normalizeRepository({
      id: 1,
      name: 'repo',
      full_name: 'owner/repo',
      html_url: 'https://github.com/owner/repo',
      owner: { login: 'owner' },
    })

    expect(normalized.description).toBe('No description provided.')
    expect(normalized.language).toBe('Mixed')
    expect(normalized.topics).toEqual([])
    expect(normalized.stargazers_count).toBe(0)
  })
})
