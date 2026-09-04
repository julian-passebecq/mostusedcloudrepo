import { useEffect, useMemo, useRef, useState } from 'react'
import { format, max, scaleLinear } from 'd3'
import {
  BarChart3,
  BookOpen,
  Boxes,
  BrainCircuit,
  Cloud,
  Code2,
  Database,
  ExternalLink,
  GitFork,
  Hash,
  Layers3,
  LayoutDashboard,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Wrench,
} from 'lucide-react'
import {
  CONTENT_TYPES,
  SORT_OPTIONS,
  TECHNOLOGIES,
  TOPIC_FILTERS,
  buildSearchQuery,
} from './lib/github.js'
import { searchRepositoriesEnhanced } from './lib/search.js'

const contentIcons = {
  all: GitFork,
  projects: Boxes,
  libraries: Layers3,
  tools: Wrench,
  samples: Code2,
  templates: Sparkles,
  learning: BookOpen,
}

const topicIcons = {
  all: Hash,
  cloud: Cloud,
  'data-engineering': GitFork,
  analytics: BarChart3,
  dashboard: LayoutDashboard,
  'business-intelligence': Database,
  'machine-learning': BrainCircuit,
  etl: RefreshCw,
  lakehouse: Layers3,
  'data-visualization': Sparkles,
}

const QUICK_VIEWS = [
  { id: 'all', label: 'All' },
  { id: 'recent', label: 'Updated ≤ 90d' },
  { id: 'licensed', label: 'Licensed' },
  { id: 'popular', label: '1k+ stars' },
]

function formatCompact(value) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0)
}

function daysSince(dateString) {
  if (!dateString) return Number.POSITIVE_INFINITY
  return Math.max(0, Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000))
}

function relativeDate(dateString) {
  if (!dateString) return 'Unknown'
  const days = daysSince(dateString)
  if (days === 0) return 'today'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.round(days / 30)}mo ago`
  return `${Math.round(days / 365)}y ago`
}

function exactDate(dateString) {
  if (!dateString) return '—'
  return new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'short', day: '2-digit' }).format(new Date(dateString))
}

function licenseLabel(repo) {
  const license = repo.license
  if (!license) return 'No license metadata'
  if (license.spdx_id && license.spdx_id !== 'NOASSERTION') return license.spdx_id
  return license.name || 'License declared'
}

function hasLicense(repo) {
  return Boolean(repo.license && (repo.license.spdx_id !== 'NOASSERTION' || repo.license.name))
}

function activityBand(repo) {
  const age = daysSince(repo.updated_at)
  if (age <= 30) return { id: 'fresh', label: 'Fresh', detail: 'Updated within 30 days' }
  if (age <= 180) return { id: 'active', label: 'Active', detail: 'Updated within 6 months' }
  if (age <= 365) return { id: 'quiet', label: 'Quiet', detail: 'Updated within 1 year' }
  return { id: 'stale', label: 'Stale', detail: 'No repository update for over 1 year' }
}

function TechnologyRow({ label, items, activeId, onSelect }) {
  return (
    <div className="tech-lane">
      <div className="lane-label">{label}</div>
      <div className="tech-slider-mask">
        <div className="tech-slider" role="list" aria-label={label}>
          {items.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`tech-tile ${activeId === item.id ? 'active' : ''}`}
              onClick={() => onSelect(item.id)}
              aria-pressed={activeId === item.id}
              title={item.label}
            >
              <span className="tech-logo-shell">
                <img className={`tech-logo logo-${item.id}`} src={item.icon} alt="" aria-hidden="true" decoding="async" />
              </span>
              <span className="tech-name">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function TopicFilterRow({ activeId, onSelect }) {
  return (
    <div className="topic-lane">
      <div className="lane-label"><Layers3 size={12} /> Category</div>
      <div className="topic-filter-grid" role="list" aria-label="Repository topic filter">
        {TOPIC_FILTERS.map((item) => {
          const Icon = topicIcons[item.id] ?? Hash
          return (
            <button
              type="button"
              key={item.id}
              className={`topic-domain-button ${activeId === item.id ? 'active' : ''}`}
              onClick={() => onSelect(item.id)}
              aria-pressed={activeId === item.id}
              title={item.hint}
            >
              <span className="topic-domain-icon" aria-hidden="true"><Icon size={15} strokeWidth={1.9} /></span>
              <span className="topic-domain-label">{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PopularityChart({ repos, sort }) {
  const metric = sort === 'forks' ? 'forks' : sort === 'updated' ? 'updated' : 'stars'
  const accessor = (repo) => {
    if (metric === 'forks') return repo.forks_count || 0
    if (metric === 'updated') return repo.updated_at ? new Date(repo.updated_at).getTime() : 0
    return repo.stargazers_count || 0
  }

  const top = useMemo(
    () => [...repos].sort((a, b) => accessor(b) - accessor(a)).slice(0, 10),
    [repos, metric],
  )

  const width = 920
  const rowHeight = 38
  const left = 250
  const right = 96
  const height = Math.max(170, top.length * rowHeight + 24)
  const minimum = metric === 'updated' && top.length ? Math.min(...top.map(accessor)) : 0
  const visualValue = (repo) => metric === 'updated' ? Math.max(0, accessor(repo) - minimum) : accessor(repo)
  const metricMax = max(top, visualValue) || 1
  const x = scaleLinear().domain([0, metricMax]).range([0, width - left - right])
  const compactFormat = format('~s')
  const title = metric === 'forks'
    ? 'Top repositories by forks'
    : metric === 'updated'
      ? 'Most recently active repositories'
      : 'Top repositories by stars'
  const ariaLabel = metric === 'forks'
    ? 'Top repositories by GitHub forks'
    : metric === 'updated'
      ? 'Repositories ordered by most recent GitHub activity'
      : 'Top repositories by GitHub stars'

  if (!top.length) return null

  return (
    <section className="chart-card" data-metric={metric} aria-labelledby="chart-title">
      <div className="chart-title-row">
        <div>
          <span className="mini-label"><BarChart3 size={13} /> D3 view</span>
          <h2 id="chart-title">{title}</h2>
        </div>
        <span>{metric === 'updated' ? 'Bar length = relative recency' : 'Current quick view'}</span>
      </div>
      <div className="chart-scroll">
        <svg className="repo-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
          {top.map((repo, index) => {
            const y = index * rowHeight + 10
            const barWidth = Math.max(4, x(visualValue(repo)))
            const valueLabel = metric === 'updated' ? relativeDate(repo.updated_at) : compactFormat(accessor(repo))
            return (
              <g key={repo.id ?? repo.full_name} transform={`translate(0 ${y})`} className="chart-row">
                <text x="0" y="18" className="chart-rank">{String(index + 1).padStart(2, '0')}</text>
                <text x="36" y="18" className="chart-name">{repo.full_name}</text>
                <rect x={left} y="4" width={barWidth} height="18" rx="4" className="chart-bar" />
                <text x={left + barWidth + 10} y="18" className="chart-value">{valueLabel}</text>
              </g>
            )
          })}
        </svg>
      </div>
    </section>
  )
}

function signalValue(repo, sort) {
  if (sort === 'forks') return formatCompact(repo.forks_count)
  if (sort === 'updated') return relativeDate(repo.updated_at)
  return formatCompact(repo.stargazers_count)
}

function signalLabel(sort) {
  if (sort === 'forks') return 'Fork signal'
  if (sort === 'updated') return 'Activity'
  return 'Star signal'
}

function ActivityBadge({ repo }) {
  const band = activityBand(repo)
  return <span className={`activity-badge ${band.id}`} title={band.detail}>{band.label}</span>
}

function RepoTable({ repos, sort }) {
  const [expanded, setExpanded] = useState(null)

  function toggle(repo) {
    const key = repo.id ?? repo.full_name
    setExpanded((current) => (current === key ? null : key))
  }

  return (
    <div className="table-shell">
      <div className="table-scroll">
        <table className="repo-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Repository</th>
              <th>Updated</th>
              <th>Stars</th>
              <th>Forks</th>
              <th>Language</th>
              <th>{signalLabel(sort)}</th>
            </tr>
          </thead>
          <tbody>
            {repos.map((repo, index) => {
              const key = repo.id ?? repo.full_name
              return (
                <FragmentRow
                  key={key}
                  repo={repo}
                  rank={index + 1}
                  sort={sort}
                  expanded={expanded === key}
                  onToggle={() => toggle(repo)}
                />
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FragmentRow({ repo, rank, sort, expanded, onToggle }) {
  function handleKey(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onToggle()
    }
  }

  return (
    <>
      <tr
        className={`repo-row ${expanded ? 'expanded' : ''}`}
        onClick={onToggle}
        onKeyDown={handleKey}
        tabIndex={0}
        aria-expanded={expanded}
      >
        <td className="rank-cell">{rank}</td>
        <td className="repo-cell">
          <div className="repo-identity">
            <img src={repo.owner?.avatar_url} alt="" loading="lazy" />
            <div>
              <a
                href={repo.html_url}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
              >
                {repo.full_name} <ExternalLink size={12} />
              </a>
              <span>{repo.topics?.slice(0, 3).map((topic) => `#${topic}`).join(' · ') || 'GitHub repository'}</span>
            </div>
          </div>
        </td>
        <td title={exactDate(repo.updated_at)}>
          <div className="updated-cell"><ActivityBadge repo={repo} /><span>{relativeDate(repo.updated_at)}</span></div>
        </td>
        <td><span className="metric"><Star size={13} /> {formatCompact(repo.stargazers_count)}</span></td>
        <td><span className="metric"><GitFork size={13} /> {formatCompact(repo.forks_count)}</span></td>
        <td><span className="language-pill">{repo.language}</span></td>
        <td className="signal-cell">{signalValue(repo, sort)}</td>
      </tr>
      {expanded && (
        <tr className="detail-row">
          <td colSpan="7">
            <div className="detail-panel enriched-detail">
              <div className="detail-copy">
                <strong>Description</strong>
                <p>{repo.description}</p>
                <div className="topic-chip-row" aria-label="Repository topics">
                  {(repo.topics || []).slice(0, 7).map((topic) => <span key={topic}>#{topic}</span>)}
                  {!repo.topics?.length && <span className="muted-chip">No topics</span>}
                </div>
              </div>
              <div className="detail-side">
                <div className="detail-facts">
                  <span>Activity <b><ActivityBadge repo={repo} /> {exactDate(repo.updated_at)}</b></span>
                  <span>License <b>{licenseLabel(repo)}</b></span>
                  <span>Open issues / PRs <b>{formatCompact(repo.open_issues_count)}</b></span>
                  <span>Owner <b>{repo.owner?.login || repo.full_name.split('/')[0]}</b></span>
                </div>
                <a className="detail-github-link" href={repo.html_url} target="_blank" rel="noreferrer">
                  Open repository <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function App() {
  const [contentType, setContentType] = useState('all')
  const [technology, setTechnology] = useState('python')
  const [topic, setTopic] = useState('all')
  const [sort, setSort] = useState('stars')
  const [quickView, setQuickView] = useState('all')
  const [searchDraft, setSearchDraft] = useState('')
  const [searchText, setSearchText] = useState('')
  const [repos, setRepos] = useState([])
  const [status, setStatus] = useState('loading')
  const [source, setSource] = useState('live')
  const [rateLimit, setRateLimit] = useState(null)
  const [totalCount, setTotalCount] = useState(null)
  const [incompleteResults, setIncompleteResults] = useState(false)
  const [retryNonce, setRetryNonce] = useState(0)
  const [showChart, setShowChart] = useState(false)
  const requestCounter = useRef(0)

  const codeTechnologies = TECHNOLOGIES.filter((item) => item.group === 'code')
  const serviceTechnologies = TECHNOLOGIES.filter((item) => item.group === 'service')
  const selectedTechnology = TECHNOLOGIES.find((item) => item.id === technology)
  const selectedContentType = CONTENT_TYPES.find((item) => item.id === contentType)
  const selectedTopic = TOPIC_FILTERS.find((item) => item.id === topic)
  const selectedSort = SORT_OPTIONS.find((item) => item.id === sort)

  const query = useMemo(
    () => buildSearchQuery({ technologyId: technology, contentTypeId: contentType, topicId: topic, searchText }),
    [technology, contentType, topic, searchText],
  )

  const viewCounts = useMemo(() => ({
    all: repos.length,
    recent: repos.filter((repo) => daysSince(repo.updated_at) <= 90).length,
    licensed: repos.filter(hasLicense).length,
    popular: repos.filter((repo) => repo.stargazers_count >= 1000).length,
  }), [repos])

  const visibleRepos = useMemo(() => {
    if (quickView === 'recent') return repos.filter((repo) => daysSince(repo.updated_at) <= 90)
    if (quickView === 'licensed') return repos.filter(hasLicense)
    if (quickView === 'popular') return repos.filter((repo) => repo.stargazers_count >= 1000)
    return repos
  }, [repos, quickView])

  useEffect(() => {
    setQuickView('all')
  }, [query])

  useEffect(() => {
    const controller = new AbortController()
    const requestId = ++requestCounter.current
    setStatus('loading')

    const timer = setTimeout(() => {
      searchRepositoriesEnhanced({
        query,
        sort: selectedSort.apiSort,
        signal: controller.signal,
        technologyId: technology,
        contentTypeId: contentType,
        topicId: topic,
        searchText,
      })
        .then((result) => {
          if (requestId !== requestCounter.current) return
          setRepos(result.items)
          setSource(result.source)
          setRateLimit(result.rateLimit)
          setTotalCount(result.totalCount)
          setIncompleteResults(result.incompleteResults)
          setStatus('ready')
        })
        .catch((error) => {
          if (error.name !== 'AbortError' && requestId === requestCounter.current) setStatus('error')
        })
    }, 280)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, selectedSort.apiSort, technology, contentType, topic, searchText, retryNonce])

  function submitSearch(event) {
    event.preventDefault()
    setSearchText(searchDraft)
  }

  return (
    <div className="page-shell" id="top">
      <header className="starry-header">
        <div className="header-inner">
          <a className="brand" href="#top" aria-label="Cloud Repo Radar home">
            <span className="brand-title">Cloud Repo Radar</span>
            <span className="brand-subtitle">GitHub rankings for data · BI · cloud</span>
          </a>
          <div className="header-actions">
            <span className={`data-status ${source}`}><CloudStatus source={source} status={status} rateLimit={rateLimit} /></span>
            <a className="yellow-button" href="https://github.com/julian-passebecq/mostusedcloudrepo" target="_blank" rel="noreferrer">
              <GitFork size={15} /> GitHub
            </a>
          </div>
        </div>
      </header>

      <main className="content-shell">
        <section className="intro-line">
          <div>
            <strong>Rank useful GitHub projects without the generic-search noise.</strong>
            <span>Stars, forks and recent activity are discovery signals; GitHub does not expose a literal “most used” metric.</span>
          </div>
        </section>

        <section className="selector-stack" aria-label="Repository filters">
          <div className="content-filter">
            <span className="selector-caption">Content</span>
            <div className="content-ribbon">
              {CONTENT_TYPES.map((item) => {
                const Icon = contentIcons[item.id]
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={contentType === item.id ? 'active' : ''}
                    onClick={() => setContentType(item.id)}
                    aria-pressed={contentType === item.id}
                    title={item.hint}
                  >
                    <Icon size={14} /> {item.label}
                  </button>
                )
              })}
            </div>
          </div>

          <TechnologyRow label="Code, query & libraries" items={codeTechnologies} activeId={technology} onSelect={setTechnology} />
          <TechnologyRow label="Platforms & services" items={serviceTechnologies} activeId={technology} onSelect={setTechnology} />
          <TopicFilterRow activeId={topic} onSelect={setTopic} />
        </section>

        <section className="result-toolbar">
          <div className="current-selection">
            <span className="mini-label">Selected ranking</span>
            <h1>
              {selectedTechnology.label} <span>·</span> {selectedContentType.label}
              {topic !== 'all' && <><span> · </span>{selectedTopic.label}</>}
            </h1>
            <p>{searchText ? `Extra filter: “${searchText}”` : selectedTopic.hint}</p>
          </div>
          <div className="tools-row">
            <form className="search-box" onSubmit={submitSearch}>
              <Search size={16} />
              <input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="medallion, semantic model, ETL…"
                aria-label="Additional GitHub search keywords"
              />
              <button type="submit">Search</button>
            </form>
            <label className="sort-control">
              <span>Rank</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                {SORT_OPTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <button type="button" className={`chart-toggle ${showChart ? 'active' : ''}`} onClick={() => setShowChart((value) => !value)}>
              <BarChart3 size={15} /> D3
            </button>
          </div>
        </section>

        {status === 'ready' && repos.length > 0 && (
          <div className="quick-view-bar" aria-label="Client-side repository quick views">
            <span className="quick-view-label">Quick view</span>
            <div className="quick-view-options">
              {QUICK_VIEWS.map((view) => (
                <button
                  type="button"
                  key={view.id}
                  className={quickView === view.id ? 'active' : ''}
                  onClick={() => setQuickView(view.id)}
                  aria-pressed={quickView === view.id}
                >
                  {view.label} <b>{viewCounts[view.id]}</b>
                </button>
              ))}
            </div>
            <span className="quick-view-note">client-side · no extra API request</span>
          </div>
        )}

        {source === 'demo' && status === 'ready' && (
          <div className="notice" role="status">
            GitHub search is unavailable or rate-limited. Showing a filter-aware fallback set; metrics may not be current.
            <button type="button" onClick={() => setRetryNonce((value) => value + 1)}>
              <RefreshCw size={13} /> Retry live data
            </button>
          </div>
        )}

        {incompleteResults && status === 'ready' && source !== 'demo' && (
          <div className="subtle-notice" role="status">GitHub marked this search as incomplete; the ranking may omit some matching repositories.</div>
        )}

        {status === 'loading' ? (
          <div className="state-box"><RefreshCw size={20} className="spin" /> Loading GitHub repositories…</div>
        ) : status === 'error' ? (
          <div className="state-box">Could not load repositories. Change a filter to retry.</div>
        ) : repos.length === 0 ? (
          <div className="state-box">No repositories matched this combination. Try All topics or broaden the content type.</div>
        ) : visibleRepos.length === 0 ? (
          <div className="state-box compact-state">
            No loaded repositories match this quick view.
            <button type="button" onClick={() => setQuickView('all')}>Show all loaded results</button>
          </div>
        ) : (
          <>
            <div className="table-meta enriched-table-meta">
              <span><b>{visibleRepos.length}</b> shown · {repos.length} loaded{totalCount > repos.length ? ` · ${formatCompact(totalCount)} GitHub matches` : ''}</span>
              <span>Click a row to inspect topics, license and activity</span>
            </div>
            <RepoTable repos={visibleRepos} sort={sort} />
            {showChart && <PopularityChart repos={visibleRepos} sort={sort} />}
          </>
        )}
      </main>

      <footer className="site-footer">
        <span>React + Vite + D3 · GitHub REST API</span>
        <span>50-result search · 15 min browser cache · local SVG technology marks</span>
      </footer>
    </div>
  )
}

function CloudStatus({ source, status, rateLimit }) {
  if (status === 'loading') return <><RefreshCw size={12} className="spin" /> Loading</>
  if (source === 'live') {
    const hasQuota = Number.isFinite(rateLimit?.remaining) && Number.isFinite(rateLimit?.limit)
    return <><Sparkles size={12} /> Live{hasQuota ? ` · ${rateLimit.remaining}/${rateLimit.limit}` : ''}</>
  }
  if (source === 'cache') return <><Database size={12} /> Cached</>
  return <><Database size={12} /> Fallback</>
}

export default App
