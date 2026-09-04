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

const DEMO_REPOS = [
  ['apache/spark', 'Unified analytics engine for large-scale data processing.', 'Scala', 42000, 28000, ['spark', 'pyspark', 'data-engineering']],
  ['PowerShell/PowerShell', 'PowerShell for every system.', 'C#', 47000, 7800, ['powershell', 'automation', 'shell']],
  ['microsoft/sql-server-samples', 'Official SQL Server and Azure SQL samples.', 'TSQL', 11000, 5200, ['sql-server', 'sql', 'samples']],
  ['microsoft/PowerBI-Developer-Samples', 'Developer samples for Power BI embedding and APIs.', 'C#', 2300, 1500, ['power-bi', 'samples', 'embedded-analytics']],
  ['microsoft/fabric-samples', 'Samples and reference material for Microsoft Fabric workloads.', 'Jupyter Notebook', 2700, 1100, ['microsoft-fabric', 'analytics', 'samples']],
  ['databricks/cli', 'Databricks command line interface.', 'Go', 900, 260, ['databricks', 'cli', 'cloud']],
  ['delta-io/delta', 'Open-source storage framework for a Lakehouse architecture.', 'Scala', 8200, 1800, ['delta-lake', 'lakehouse', 'data-engineering']],
  ['pandas-dev/pandas', 'Flexible and powerful data analysis / manipulation library for Python.', 'Python', 46000, 19000, ['python', 'data-analysis', 'data-science']],
  ['dbt-labs/dbt-core', 'Framework for transforming data in the warehouse.', 'Python', 12000, 2100, ['sql', 'analytics-engineering', 'data-transformation']],
  ['apache/airflow', 'Platform to programmatically author, schedule and monitor workflows.', 'Python', 42000, 15000, ['workflow', 'orchestration', 'data-engineering']],
]

const demoItems = DEMO_REPOS.map(([fullName, description, language, stars, forks, topics], index) => {
  const [owner, name] = fullName.split('/')
  return {
    id: `demo-${index}`,
    name,
    full_name: fullName,
    description,
    html_url: `https://github.com/${fullName}`,
    stargazers_count: stars,
    forks_count: forks,
    open_issues_count: 0,
    language,
    topics,
    updated_at: new Date(Date.now() - index * 86400000 * 7).toISOString(),
    owner: { login: owner, avatar_url: `https://github.com/${owner}.png?size=96` },
    license: null,
  }
})

export function buildSearchQuery({ technologyId, contentTypeId, searchText = '' }) {
  const technology = TECHNOLOGIES.find((item) => item.id === technologyId) ?? TECHNOLOGIES[0]
  const contentType = CONTENT_TYPES.find((item) => item.id === contentTypeId) ?? CONTENT_TYPES[0]
  const terms = [technology.query, contentType.query, searchText.trim(), 'archived:false', 'fork:false']
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

function getCacheKey(query, sort) {
  return `cloud-repo-radar:${sort}:${query}`
}

function readCache(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const age = Date.now() - parsed.savedAt
    if (age > 15 * 60 * 1000) return null
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

export async function searchRepositories({ query, sort = 'stars', signal }) {
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
      throw error
    }

    const payload = await response.json()
    const items = (payload.items || []).map(normalizeRepository)
    writeCache(key, items)
    return { items, source: 'live' }
  } catch (error) {
    if (error.name === 'AbortError') throw error
    return { items: demoItems, source: 'demo', error }
  }
}
