import { useEffect, useMemo, useRef, useState } from 'react'
import { format, max, scaleLinear } from 'd3'
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Boxes,
  Code2,
  Database,
  ExternalLink,
  GitFork,
  Github,
  Layers3,
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
  buildSearchQuery,
  searchRepositories,
} from './lib/github.js'

const contentIcons = {
  all: Github,
  projects: Boxes,
  libraries: Layers3,
  tools: Wrench,
  samples: Code2,
  templates: Sparkles,
  learning: BookOpen,
}

function formatCompact(value) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0)
}

function relativeDate(dateString) {
  if (!dateString) return 'Unknown'
  const days = Math.max(0, Math.round((Date.now() - new Date(dateString).getTime()) / 86400000))
  if (days === 0) return 'today'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.round(days / 30)}mo ago`
  return `${Math.round(days / 365)}y ago`
}

function TechnologyRow({ label, items, activeId, onSelect }) {
  return (
    <div className="tech-row">
      <div className="row-label">{label}</div>
      <div className="tech-buttons" role="list" aria-label={label}>
        {items.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`tech-button ${activeId === item.id ? 'active' : ''} ${item.group}`}
            onClick={() => onSelect(item.id)}
            aria-pressed={activeId === item.id}
          >
            <span className="tech-monogram">{item.short}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function PopularityChart({ repos }) {
  const top = useMemo(
    () => [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 10),
    [repos],
  )

  const width = 860
  const rowHeight = 40
  const left = 210
  const right = 70
  const height = Math.max(180, top.length * rowHeight + 28)
  const starMax = max(top, (repo) => repo.stargazers_count) || 1
  const x = scaleLinear().domain([0, starMax]).range([0, width - left - right])
  const starFormat = format('~s')

  if (!top.length) return null

  return (
    <section className="chart-card" aria-labelledby="chart-title">
      <div className="section-heading compact">
        <div>
          <span className="eyebrow"><BarChart3 size={14} /> D3 view</span>
          <h2 id="chart-title">Top repositories by stars</h2>
        </div>
        <span className="chart-caption">Current result set</span>
      </div>
      <div className="chart-scroll">
        <svg className="repo-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Top repositories by GitHub stars">
          {top.map((repo, index) => {
            const y = index * rowHeight + 12
            const barWidth = Math.max(4, x(repo.stargazers_count))
            return (
              <g key={repo.id} transform={`translate(0 ${y})`} className="chart-row">
                <text x="0" y="18" className="chart-rank">{String(index + 1).padStart(2, '0')}</text>
                <text x="36" y="18" className="chart-name">{repo.full_name}</text>
                <rect x={left} y="4" width={barWidth} height="19" rx="8" className="chart-bar" />
                <text x={left + barWidth + 10} y="18" className="chart-value">{starFormat(repo.stargazers_count)}</text>
              </g>
            )
          })}
        </svg>
      </div>
    </section>
  )
}

function RepoCard({ repo, rank }) {
  return (
    <article className="repo-card">
      <div className="repo-topline">
        <div className="repo-owner">
          <img src={repo.owner?.avatar_url} alt="" loading="lazy" />
          <span>{repo.owner?.login || repo.full_name.split('/')[0]}</span>
        </div>
        <span className="rank">#{rank}</span>
      </div>

      <div>
        <a className="repo-title" href={repo.html_url} target="_blank" rel="noreferrer">
          {repo.name}
          <ArrowUpRight size={17} />
        </a>
        <p className="repo-description">{repo.description}</p>
      </div>

      <div className="topic-list">
        {(repo.topics || []).slice(0, 4).map((topic) => <span key={topic}>{topic}</span>)}
      </div>

      <div className="repo-metrics">
        <span><Star size={15} /> {formatCompact(repo.stargazers_count)}</span>
        <span><GitFork size={15} /> {formatCompact(repo.forks_count)}</span>
        <span><Code2 size={15} /> {repo.language}</span>
      </div>

      <div className="repo-footer">
        <span>Updated {relativeDate(repo.updated_at)}</span>
        <a href={repo.html_url} target="_blank" rel="noreferrer" aria-label={`Open ${repo.full_name} on GitHub`}>
          GitHub <ExternalLink size={13} />
        </a>
      </div>
    </article>
  )
}

function App() {
  const [contentType, setContentType] = useState('all')
  const [technology, setTechnology] = useState('python')
  const [sort, setSort] = useState('stars')
  const [searchDraft, setSearchDraft] = useState('')
  const [searchText, setSearchText] = useState('')
  const [repos, setRepos] = useState([])
  const [status, setStatus] = useState('loading')
  const [source, setSource] = useState('live')
  const [retryNonce, setRetryNonce] = useState(0)
  const requestCounter = useRef(0)

  const codeTechnologies = TECHNOLOGIES.filter((item) => item.group === 'code')
  const serviceTechnologies = TECHNOLOGIES.filter((item) => item.group === 'service')
  const selectedTechnology = TECHNOLOGIES.find((item) => item.id === technology)
  const selectedContentType = CONTENT_TYPES.find((item) => item.id === contentType)
  const selectedSort = SORT_OPTIONS.find((item) => item.id === sort)

  const query = useMemo(
    () => buildSearchQuery({ technologyId: technology, contentTypeId: contentType, searchText }),
    [technology, contentType, searchText],
  )

  useEffect(() => {
    const controller = new AbortController()
    const requestId = ++requestCounter.current
    setStatus('loading')

    // Small debounce avoids spending GitHub Search requests while someone rapidly clicks filters.
    const timer = setTimeout(() => {
      searchRepositories({
        query,
        sort: selectedSort.apiSort,
        signal: controller.signal,
        technologyId: technology,
        contentTypeId: contentType,
        searchText,
      })
        .then((result) => {
          if (requestId !== requestCounter.current) return
          setRepos(result.items)
          setSource(result.source)
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
  }, [query, selectedSort.apiSort, technology, contentType, searchText, retryNonce])

  function submitSearch(event) {
    event.preventDefault()
    setSearchText(searchDraft)
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Cloud Repo Radar home">
          <span className="brand-mark"><Github size={22} /></span>
          <span>
            <strong>Cloud Repo Radar</strong>
            <small>Data · BI · Cloud GitHub explorer</small>
          </span>
        </a>
        <a className="source-link" href="https://github.com/julian-passebecq/mostusedcloudrepo" target="_blank" rel="noreferrer">
          Source <Github size={16} />
        </a>
      </header>

      <main id="top">
        <section className="hero">
          <div>
            <span className="hero-kicker">Modern GitHub discovery</span>
            <h1>Find the repositories that matter for modern data work.</h1>
            <p>Filter GitHub by content type, language, data library or platform, then compare popularity and activity without digging through generic search results.</p>
          </div>
          <div className="hero-note">
            <Database size={20} />
            <div>
              <strong>Popularity, not literal usage</strong>
              <span>GitHub does not expose a public “most used” metric. Rankings use stars, forks and recency as practical signals.</span>
            </div>
          </div>
        </section>

        <section className="filter-panel" aria-label="Repository filters">
          <div className="filter-block content-block">
            <div className="filter-title">
              <span>1</span>
              <div>
                <strong>Content type</strong>
                <small>Choose what kind of GitHub material you want</small>
              </div>
            </div>
            <div className="content-ribbon">
              {CONTENT_TYPES.map((item) => {
                const Icon = contentIcons[item.id]
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={contentType === item.id ? 'active' : ''}
                    onClick={() => setContentType(item.id)}
                    title={item.hint}
                    aria-pressed={contentType === item.id}
                  >
                    <Icon size={16} />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="filter-block technology-block">
            <div className="filter-title">
              <span>2</span>
              <div>
                <strong>Technology</strong>
                <small>Two rows: code/query/data libraries, then platforms/services</small>
              </div>
            </div>
            <TechnologyRow label="Code, query & libraries" items={codeTechnologies} activeId={technology} onSelect={setTechnology} />
            <TechnologyRow label="Platforms & services" items={serviceTechnologies} activeId={technology} onSelect={setTechnology} />
          </div>

          <div className="toolbar">
            <form className="search-box" onSubmit={submitSearch}>
              <Search size={18} />
              <input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Add keywords, e.g. medallion, semantic model, ETL…"
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
          </div>
        </section>

        <section className="results-header">
          <div>
            <span className="eyebrow"><CloudStatus source={source} status={status} /></span>
            <h2>{selectedTechnology.label} · {selectedContentType.label}</h2>
            <p>{searchText ? `Extra filter: “${searchText}”` : selectedContentType.hint}</p>
          </div>
          <div className="result-count">
            <strong>{status === 'loading' ? '—' : repos.length}</strong>
            <span>results loaded</span>
          </div>
        </section>

        {source === 'demo' && status === 'ready' && (
          <div className="notice" role="status">
            GitHub search is temporarily unavailable or rate-limited. Showing a technology-aware illustrative fallback set; metrics may not be current.{' '}
            <button type="button" className="source-link" onClick={() => setRetryNonce((value) => value + 1)}>
              Retry live data <RefreshCw size={13} />
            </button>
          </div>
        )}

        {status === 'loading' ? (
          <div className="loading-state"><RefreshCw size={20} className="spin" /> Loading GitHub repositories…</div>
        ) : status === 'error' ? (
          <div className="empty-state">Could not load repositories. Change a filter to retry.</div>
        ) : repos.length === 0 ? (
          <div className="empty-state">No repositories matched this combination. Try a broader content type or remove the extra keyword.</div>
        ) : (
          <>
            <PopularityChart repos={repos} />
            <section className="repo-grid" aria-label="Repository results">
              {repos.map((repo, index) => <RepoCard key={repo.id ?? repo.full_name} repo={repo} rank={index + 1} />)}
            </section>
          </>
        )}
      </main>

      <footer>
        <span>React + Vite + D3 · GitHub REST API</span>
        <span>No backend required for the public demo</span>
      </footer>
    </div>
  )
}

function CloudStatus({ source, status }) {
  if (status === 'loading') return <><RefreshCw size={14} className="spin" /> Loading</>
  if (source === 'live') return <><Sparkles size={14} /> Live GitHub data</>
  if (source === 'cache') return <><Database size={14} /> Cached GitHub data</>
  return <><Database size={14} /> Fallback data</>
}

export default App
