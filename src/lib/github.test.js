import { describe, expect, it } from 'vitest'
import {
  TECHNOLOGIES,
  buildSearchQuery,
  getFallbackRepositories,
  normalizeRepository,
} from './github.js'

describe('technology filters', () => {
  it('keeps exactly two technology groups and includes pandas/scikit-learn', () => {
    expect(new Set(TECHNOLOGIES.map((item) => item.group))).toEqual(new Set(['code', 'service']))
    expect(TECHNOLOGIES.some((item) => item.id === 'pandas')).toBe(true)
    expect(TECHNOLOGIES.some((item) => item.id === 'sklearn')).toBe(true)
  })
})

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

  it('builds targeted pandas and scikit-learn searches', () => {
    expect(buildSearchQuery({ technologyId: 'pandas', contentTypeId: 'all' })).toContain('pandas in:name,description,readme')
    expect(buildSearchQuery({ technologyId: 'sklearn', contentTypeId: 'all' })).toContain('scikit-learn in:name,description,readme')
  })

  it('falls back to Python and repository filters for unknown ids', () => {
    const query = buildSearchQuery({ technologyId: 'nope', contentTypeId: 'nope' })
    expect(query).toContain('language:Python')
    expect(query).toContain('archived:false')
  })

  it('caps user-entered text so a pasted paragraph cannot create an oversized query', () => {
    const query = buildSearchQuery({ technologyId: 'python', contentTypeId: 'all', searchText: 'x'.repeat(400) })
    expect(query).not.toContain('x'.repeat(121))
  })
})

describe('fallback repositories', () => {
  it('does not mix unrelated technologies when GitHub is unavailable', () => {
    const powerBi = getFallbackRepositories({ technologyId: 'powerbi', contentTypeId: 'all' })
    expect(powerBi.some((repo) => repo.full_name === 'microsoft/PowerBI-Developer-Samples')).toBe(true)
    expect(powerBi.some((repo) => repo.full_name === 'apache/airflow')).toBe(false)
  })

  it('returns pandas and scikit-learn examples for the new filters', () => {
    const pandas = getFallbackRepositories({ technologyId: 'pandas' })
    const sklearn = getFallbackRepositories({ technologyId: 'sklearn' })
    expect(pandas.some((repo) => repo.full_name === 'pandas-dev/pandas')).toBe(true)
    expect(sklearn.some((repo) => repo.full_name === 'scikit-learn/scikit-learn')).toBe(true)
  })

  it('honors fallback sort mode', () => {
    const repos = getFallbackRepositories({ technologyId: 'python', sort: 'forks' })
    for (let index = 1; index < repos.length; index += 1) {
      expect(repos[index - 1].forks_count).toBeGreaterThanOrEqual(repos[index].forks_count)
    }
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
