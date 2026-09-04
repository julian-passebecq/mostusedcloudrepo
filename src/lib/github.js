export const CONTENT_TYPES = [
  { id: 'all', label: 'Repositories', hint: 'All relevant repositories', query: '' },
  { id: 'projects', label: 'Projects', hint: 'Established projects', query: 'stars:>50' },
  { id: 'libraries', label: 'Libraries', hint: 'Reusable libraries and SDKs', query: 'library in:name,description' },
  { id: 'tools', label: 'Tools', hint: 'CLI, utilities and developer tools', query: 'tool in:name,description' },
  { id: 'samples', label: 'Samples', hint: 'Examples and sample projects', query: 'sample in:name,description' },
  { id: 'templates', label: 'Templates', hint: 'Starter and template repositories', query: 'template in:name,description' },
  { id: 'learning', label: 'Learning', hint: 'Tutorials and learning resources', query: 'tutorial in:name,description' },
]

export const TECHNOLOGIES = [
  { id: 'python', label: 'Python', short: 'PY', group: 'code', query: 'language:Python' },
  { id: 'pyspark', label: 'PySpark', short: 'SP', group: 'code', query: 'pyspark in:name,description,readme' },
  { id: 'pandas', label: 'Pandas', short: 'PD', group: 'code', query: 'pandas in:name,description,readme language:Python' },
  { id: 'sklearn', label: 'scikit-learn', short: 'SK', group: 'code', query: 'scikit-learn in:name,description,readme language:Python' },
  { id: 'powershell', label: 'PowerShell', short: 'PS', group: 'code', query: 'language:PowerShell' },
  { id: 'sql', label: 'SQL', short: 'SQL', group: 'code', query: 'sql in:name,description,readme' },
  { id: 'powerbi', label: 'Power BI', short: 'BI', group: 'service', query: 'power bi in:name,description,readme' },
  { id: 'fabric', label: 'Microsoft Fabric', short: 'MF', group: 'service', query: 'microsoft fabric in:name,description,readme' },
  { id: 'sqlserver', label: 'SQL Server', short: 'SS', group: 'service', query: 'sql server in:name,description,readme' },
  { id: 'databricks', label: 'Databricks', short: 'DB', group: 'service', query: 'databricks in:name,description,readme' },
]

export const SORT_OPTIONS = [
  { id: 'stars', label: 'Most starred', apiSort: 'stars' },
  { id: 'forks', label: 'Most forked', apiSort: 'forks' },
  { id: 'updated', label: 'Recently active', apiSort: 'updated' },
]

const CACHE_TTL_MS = 15 * 60 * 1000
const MAX_SEARCH_TEXT = 120

const DEMO_REPOS = [
  {
    fullName: 'apache/spark',
    description: 'Unified analytics engine for large-scale data processing.',
    language: 'Scala',
    stars: 42000,
    forks: 28000,
    topics: ['spark', 'pyspark', 'data-engineering'],
    technologies: ['pyspark', 'python'],
    contentTypes: ['projects', 'libraries'],
  },
  {
    fullName: 'pandas-dev/pandas',
    description: 'Flexible and powerful data analysis and manipulation library for Python.',
    language: 'Python',
    stars: 46000,
    forks: 19000,
    topics: ['pandas', 'python', 'data-analysis'],
    technologies: ['python', 'pandas'],
    contentTypes: ['projects', 'libraries'],
  },
  {
    fullName: 'pandas-dev/pandas-stubs',
    description: 'Public type stubs for pandas.',
    language: 'Python',
    stars: 1800,
    forks: 300,
    topics: ['pandas', 'typing', 'python'],
    technologies: ['python', 'pandas'],
    contentTypes: ['libraries', 'tools'],
  },
  {
    fullName: 'scikit-learn/scikit-learn',
    description: 'Machine learning in Python.',
    language: 'Python',
    stars: 62000,
    forks: 26000,
    topics: ['machine-learning', 'python', 'scikit-learn'],
    technologies: ['python', 'sklearn'],
    contentTypes: ['projects', 'libraries'],
  },
  {
    fullName: 'scikit-learn-contrib/imbalanced-learn',
    description: 'A Python toolbox to tackle the curse of imbalanced datasets in machine learning.',
    language: 'Python',
    stars: 8000,
    forks: 1300,
    topics: ['scikit-learn', 'machine-learning', 'imbalanced-learning'],
    technologies: ['python', 'sklearn'],
    contentTypes: ['libraries', 'learning'],
  },
  {
    fullName: 'PowerShell/PowerShell',
    description: 'PowerShell for every system.',
    language: 'C#',
    stars: 47000,
    forks: 7800,
    topics: ['powershell', 'automation', 'shell'],
    technologies: ['powershell'],
    contentTypes: ['projects', 'tools'],
  },
  {
    fullName: 'MicrosoftDocs/PowerShell-Docs',
    description: 'The official PowerShell documentation source.',
    language: 'PowerShell',
    stars: 1800,
    forks: 2900,
    topics: ['powershell', 'documentation', 'learning'],
    technologies: ['powershell'],
    contentTypes: ['learning'],
  },
  {
    fullName: 'microsoft/sql-server-samples',
    description: 'Official SQL Server and Azure SQL samples.',
    language: 'TSQL',
    stars: 11000,
    forks: 5200,
    topics: ['sql-server', 'sql', 'samples'],
    technologies: ['sql', 'sqlserver'],
    contentTypes: ['projects', 'samples', 'templates'],
  },
  {
    fullName: 'dbt-labs/dbt-core',
    description: 'Framework for transforming data in the warehouse.',
    language: 'Python',
    stars: 12000,
    forks: 2100,
    topics: ['sql', 'analytics-engineering', 'data-transformation'],
    technologies: ['python', 'sql'],
    contentTypes: ['projects', 'tools'],
  },
  {
    fullName: 'apache/airflow',
    description: 'Platform to programmatically author, schedule and monitor workflows.',
    language: 'Python',
    stars: 42000,
    forks: 15000,
    topics: ['workflow', 'orchestration', 'data-engineering'],
    technologies: ['python'],
    contentTypes: ['projects', 'tools'],
  },
  {
    fullName: 'microsoft/PowerBI-Developer-Samples',
    description: 'Developer samples for Power BI embedding and APIs.',
    language: 'C#',
    stars: 2300,
    forks: 1500,
    topics: ['power-bi', 'samples', 'embedded-analytics'],
    technologies: ['powerbi'],
    contentTypes: ['samples', 'templates'],
  },
  {
    fullName: 'microsoft/fabric-samples',
    description: 'Samples and reference material for Microsoft Fabric workloads.',
    language: 'Jupyter Notebook',
    stars: 2700,
    forks: 1100,
    topics: ['microsoft-fabric', 'analytics', 'samples'],
    technologies: ['fabric', 'pyspark', 'python'],
    contentTypes: ['samples', 'templates', 'learning'],
  },
  {
    fullName: 'databricks/cli',
    description: 'Databricks command line interface.',
    language: 'Go',
    stars: 900,
    forks: 260,
    topics: ['databricks', 'cli', 'cloud'],
    technologies: ['databricks'],
    contentTypes: ['projects', 'tools'],
  },
  {
    fullName: 'databricks/databricks-sdk-py',
    description: 'Databricks SDK for Python.',
    language: 'Python',
    stars: 900,
    forks: 330,
    topics: ['databricks', 'python', 'sdk'],
    technologies: ['databricks', 'python'],
    contentTypes: ['libraries', 'tools'],
  },
  {
    fullName: 'delta-io/delta',
    description: 'Open-source storage framework for a Lakehouse architecture.',
    language: 'Scala',
    stars: 8200,
    forks: 1800,
    topics: ['delta-lake', 'lakehouse', 'data-engineering'],
    technologies: ['databricks', 'pyspark'],
    contentTypes: ['projects', 'libraries'],
  },
]

const demoItems = DEMO_REPOS.map((repo, index) => {
  const [owner, name] = repo.fullName.split('/')
  return {
    id: `demo-${index}`,
    name,
    full_name: repo.fullName,
    description: repo.description,
    html_url: `https://github.com/${repo.fullName}`,
    stargazers_count: repo.stars,
    forks_count: repo.forks,
    open_issues_count: 0,
    language: repo.language,
    topics: repo.topics,
    updated_at: new Date(Date.now() - index * 86400000 * 7).toISOString(),
    owner: { login: owner, avatar_url: `https://github.com/${owner}.png?size=96` },
    license: null,
    _technologies: repo.technologies,
    _contentTypes: repo.contentTypes,
  }
})

function sanitizeSearchText(value = '') {
  return String(value).trim().slice(0, MAX_SEARCH_TEXT)
}

export function buildSearchQuery({ technologyId, contentTypeId, searchText = '' }) {
  const technology = TECHNOLOGIES.find((item) => item.id === technologyId) ?? TECHNOLOGIES[0]
  const contentType = CONTENT_TYPES.find((item) => item.id === contentTypeId) ?? CONTENT_TYPES[0]
  const terms = [technology.query, contentType.query, sanitizeSearchText(searchText), 'archived:false', 'fork:false']
  return terms.filter(Boolean).join(' ')
}

export function normalizeRepository(item) {
  return {
    id: item.id,
    name: item.name,
    full_name: item.full_name,
    description: item.description || 'No description provided.',
    html_url: item.html_url,
    stargazers_count: item.stargazers_count || 0,
    forks_count: item.forks_count || 0,
    open_issues_count: item.open_issues_count || 0,
    language: item.language || 'Mixed',
    topics: Array.isArray(item.topics) ? item.topics : [],
    updated_at: item.updated_at,
    owner: item.owner,
    license: item.license,
  }
}

function sortFallback(items, sort) {
  const copy = [...items]
  if (sort === 'forks') return copy.sort((a, b) => b.forks_count - a.forks_count)
  if (sort === 'updated') return copy.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
  return copy.sort((a, b) => b.stargazers_count - a.stargazers_count)
}

export function getFallbackRepositories({ technologyId = 'python', contentTypeId = 'all', searchText = '', sort = 'stars' } = {}) {
  const text = sanitizeSearchText(searchText).toLowerCase()
  let matches = demoItems.filter((item) => item._technologies.includes(technologyId))

  if (contentTypeId !== 'all') {
    const byType = matches.filter((item) => item._contentTypes.includes(contentTypeId))
    if (byType.length) matches = byType
  }

  if (text) {
    const byText = matches.filter((item) => {
      const haystack = [item.full_name, item.description, item.language, ...(item.topics || [])].join(' ').toLowerCase()
      return text.split(/\s+/).every((term) => haystack.includes(term))
    })
    if (byText.length) matches = byText
  }

  return sortFallback(matches.map(normalizeRepository), sort)
}

function getCacheKey(query, sort) {
  return `cloud-repo-radar:${sort}:${query}`
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
    return parsed.items
  } catch {
    return null
  }
}

function writeCache(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), items }))
  } catch {
    // Storage can be disabled; live results still work.
  }
}

export async function searchRepositories({
  query,
  sort = 'stars',
  signal,
  technologyId = 'python',
  contentTypeId = 'all',
  searchText = '',
}) {
  const key = getCacheKey(query, sort)
  const cached = readCache(key)
  if (cached) return { items: cached, source: 'cache' }

  const params = new URLSearchParams({
    q: query,
    sort,
    order: 'desc',
    per_page: '30',
  })

  try {
    const response = await fetch(`https://api.github.com/search/repositories?${params.toString()}`, {
      signal,
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2026-03-10',
      },
    })

    if (!response.ok) {
      const error = new Error(`GitHub returned ${response.status}`)
      error.status = response.status
      error.rateLimited = response.status === 403 || response.status === 429
      throw error
    }

    const payload = await response.json()
    const items = (payload.items || []).map(normalizeRepository)
    writeCache(key, items)
    return { items, source: 'live' }
  } catch (error) {
    if (error.name === 'AbortError') throw error
    const items = getFallbackRepositories({ technologyId, contentTypeId, searchText, sort })
    return { items, source: 'demo', error }
  }
}
