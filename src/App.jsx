import { useEffect, useMemo, useRef, useState } from 'react'
import { format, max, scaleLinear } from 'd3'
import {
  BarChart3,
  BookOpen,
  Boxes,
  Code2,
  Database,
  ExternalLink,
  GitFork,
  Hash,
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
  TOPIC_FILTERS,
  buildSearchQuery,
  searchRepositories,
} from './lib/github.js'

const contentIcons = {
  all: GitFork,
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

function exactDate(dateString) {
  if (!dateString) return '—'
  return new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'short', day: '2-digit' }).format(new Date(dateString))
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
      <div className="lane-label"><Hash size={12} /> Category</div>
      <div className="topic-tags" role="list" aria-label="Repository topic filter">
        {TOPIC_FILTERS.map((item) => (
          <button
            type="button"
            key={item.id}
            className={activeId === item.id ? 'active' : ''}
            onClick={() => onSelect(item.id)}
            aria-pressed={activeId === item.id}
            title={item.hint}
          >
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

  const width = 920
  const rowHeight = 38
  const left = 250
  const right = 80
  const height = Math.max(170, top.length * rowHeight + 24)
  const starMax = max(top, (repo) => repo.stargazers_count) || 1
  const x = scaleLinear().domain([0, starMax]).range([0, width - left - right])
  const starFormat = format('~s')

  if (!top.length) return null

  return (
    <section className="chart-card" aria-labelledby="chart-title">
      <div className="chart-title-row">
        <div>
          <span className="mini-label"><BarChart3 size={13} /> D3 view</span>
          <h2 id="chart-title">Top repositories by stars</h2>
        </div>
        <span>Current result set</span>
      </div>
      <div className="chart-scroll">
        <svg className="repo-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Top repositories by GitHub stars">
          {top.map((repo, index) => {
            const y = index * rowHeight + 10
            const barWidth = Math.max(4, x(repo.stargazers_count))
            return (
              <g key={repo.id ?? repo.full_name} transform={`translate(0 ${y})`} className="chart-row">
                <text x="0" y="18" className="chart-rank">{String(index + 1).padStart(2, '0')}</text>
                <text x="36" y="18" className="chart-name">{repo.full_name}</text>
                <rect x={left} y="4" width={barWidth} height="18" rx="4" className="chart-bar" />
                <text x={left + barWidth + 10} y="18" className="chart-value">{starFormat(repo.stargazers_count)}</text>
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
              <span>{repo.topics?.slice(0, 2).join(' · ') || 'GitHub repository'}</span>
            </div>
          </div>
        </td>
        <td title={exactDate(repo.updated_at)}>{relativeDate(repo.updated_at)}</td>
        <td><span className="metric"><Star size={13} /> {formatCompact(repo.stargazers_count)}</span></td>
        <td><span className="metric"><GitFork size={13} /> {formatCompact(repo.forks_count)}</span></td>
        <td><span className="language-pill">{repo.language}</span></td>
        <td className="signal-cell">{signalValue(repo, sort)}</td>
      </tr>
      {expanded && (
        <tr className="detail-row">
          <td colSpan="7">
            <div className="detail-panel">
              <div>
                <strong>Description</strong>
                <p>{repo.description}</p>
              </div>
              <div className="detail-meta">
                <span>Updated <b>{exactDate(repo.updated_at)}</b></span>
                <span>Owner <b>{repo.owner?.login || repo.full_name.split('/')[0]}</b></span>
                <span>Topics <b>{repo.topics?.slice(0, 4).join(', ') || '—'}</b></span>
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
  const [searchDraft, setSearchDraft] = useState('')
  const [searchText, setSearchText] = useState('')
  const [repos, setRepos] = useState([])
  const [status, setStatus] = useState('loading')
  const [source, setSource] = useState('live')
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

  useEffect(() => {
    const controller = new AbortController()
    const requestId = ++requestCounter.current
    setStatus('loading')

    const timer = setTimeout(() => {
      searchRepositories({
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
            <span className={`data-status ${source}`}><CloudStatus source={source} status={status} /></span>
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

        {source === 'demo' && status === 'ready' && (
          <div className="notice" role="status">
            GitHub search is unavailable or rate-limited. Showing a filter-aware fallback set; metrics may not be current.
            <button type="button" onClick={() => setRetryNonce((value) => value + 1)}>
              <RefreshCw size={13} /> Retry live data
            </button>
          </div>
        )}

        {status === 'loading' ? (
          <div className="state-box"><RefreshCw size={20} className="spin" /> Loading GitHub repositories…</div>
        ) : status === 'error' ? (
          <div className="state-box">Could not load repositories. Change a filter to retry.</div>
        ) : repos.length === 0 ? (
          <div className="state-box">No repositories matched this combination. Try All topics or broaden the content type.</div>
        ) : (
          <>
            <div className="table-meta">
              <span><b>{repos.length}</b> results loaded</span>
              <span>Click a row to expand its description</span>
            </div>
            <RepoTable repos={repos} sort={sort} />
            {showChart && <PopularityChart repos={repos} />}
          </>
        )}
      </main>

      <footer className="site-footer">
        <span>React + Vite + D3 · GitHub REST API</span>
        <span>Local SVG technology marks · no image CDN dependency</span>
      </footer>
    </div>
  )
}

function CloudStatus({ source, status }) {
  if (status === 'loading') return <><RefreshCw size={12} className="spin" /> Loading</>
  if (source === 'live') return <><Sparkles size={12} /> Live</>
  if (source === 'cache') return <><Database size={12} /> Cached</>
  return <><Database size={12} /> Fallback</>
}

export default App
