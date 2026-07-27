import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AP3D from '../utils/ap3d'
import { fetchLearnerState, logout } from '../api/api'

// Topics with their 3D positions (static layout, state driven by API)
const TOPIC_LABELS = {
  foundations: 'Foundations',
  arrays: 'Arrays',
  twopointers: 'Two Pointers',
  slidingwindow: 'Sliding Window',
  linkedlists: 'Linked Lists',
  trees: 'Trees',
  graphs: 'Graphs',
  dp: 'Dynamic Prog.',
}

const MASTERY_ORDER = ['arrays', 'twopointers', 'slidingwindow', 'linkedlists', 'trees', 'graphs', 'dp']

export default function Dashboard() {
  const graphHostRef = useRef(null)
  const graphInitRef = useRef(false)

  const [theme, setTheme] = useState(localStorage.getItem('ap_theme') || 'dark')
  const [menuActive, setMenuActive] = useState(false)

  const [learnerData, setLearnerData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  // Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ap_theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = () => setMenuActive(false)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Load real learner state from API
  useEffect(() => {
    const learnerId = localStorage.getItem('ap_learner_id')
    if (!learnerId) {
      navigate('/login')
      return
    }

    fetchLearnerState(learnerId)
      .then(data => {
        setLearnerData(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || 'Failed to load your learning data.')
        setLoading(false)
      })
  }, [navigate])

  // Init 3D graph — only after data is loaded
  useEffect(() => {
    if (!learnerData || !graphHostRef.current || graphInitRef.current) return
    graphInitRef.current = true
    AP3D.initDashboardGraph(
      graphHostRef.current,
      learnerData.state,
      learnerData.recommendation?.topic_id,
    )
  }, [learnerData])

  const fullName = localStorage.getItem('ap_full_name') || 'Learner'
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  const handleSignOut = () => {
    logout()
    navigate('/')
  }

  // Mastery stats
  const mastery = learnerData?.mastery || {}
  const state = learnerData?.state || {}
  const rec = learnerData?.recommendation || {}

  const masteredCount = Object.values(state).filter(s => s === 'mastered').length
  const totalCount = Object.keys(state).length
  const avgAccuracy = masteredCount > 0
    ? Math.round(Object.values(mastery).reduce((a, b) => a + b, 0) / Math.max(Object.values(mastery).length, 1))
    : 0

  const recLabel = rec.topic_id ? TOPIC_LABELS[rec.topic_id] || rec.topic_id : '—'
  const recConf = rec.confidence ? Math.round(rec.confidence * 100) : 0
  const recMode = rec.mode || 'heuristic'

  return (
    <div className="dashboard">
      <header className="topbar">
        <Link to="/" className="topbar-logo" style={{ color: 'inherit', textDecoration: 'none' }}>
          <div className="logo-icon">A</div>
          AdaptivePath
          <span className="sub">/ learner</span>
        </Link>
        <div className="topbar-right">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle light/dark theme" style={{ marginRight: '8px' }}>
            <svg className="theme-icon-sun" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            <svg className="theme-icon-moon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </button>
          <div className="pill">
            {recMode === 'exploit' ? '🤖' : recMode === 'explore' ? '🔍' : '🎯'}
            &nbsp;agent&nbsp;<b className="cyan">{recConf}%</b>&nbsp;confident
          </div>
          <div className="pill">📚 <b className="gold">{masteredCount}/{totalCount}</b>&nbsp;mastered</div>
          <div className="avatar" onClick={(e) => { e.stopPropagation(); setMenuActive(!menuActive) }}>{initials}</div>
          <div className={`user-menu ${menuActive ? 'active' : ''}`} id="user-menu">
            <a href="#">👤&nbsp; {fullName}</a>
            <a href="#">⚙️&nbsp; Settings</a>
            <a href="#">📊&nbsp; My Progress</a>
            <hr />
            <a href="#" onClick={handleSignOut} style={{ color: '#f87171' }}>↩&nbsp; Sign Out</a>
          </div>
        </div>
      </header>

      <div className="dash-main">
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--cyan)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading your adaptive path…</p>
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: '#f87171', marginBottom: '12px' }}>{error}</p>
            <button className="cta-btn" onClick={() => navigate('/login')}>← Back to login</button>
          </div>
        ) : (
          <>
            <div className="greeting">
              <h1>{greeting}, <em>{fullName.split(' ')[0]}</em> 👋</h1>
              <p>
                Your RL agent ({recMode === 'exploit' ? 'exploiting' : recMode === 'explore' ? 'exploring' : 'heuristic'} mode) has a
                personalised recommendation ready — <strong style={{ color: 'var(--cyan)' }}>{recLabel}</strong>.
              </p>
            </div>

            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-label">Topics mastered</div>
                <div className="stat-val gold">{masteredCount} / {totalCount}</div>
                <div className="stat-delta">BKT P(L) ≥ 0.8</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Avg mastery</div>
                <div className="stat-val cyan">{avgAccuracy}%</div>
                <div className="stat-delta">across all topics</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Agent mode</div>
                <div className="stat-val indigo" style={{ textTransform: 'capitalize' }}>{recMode}</div>
                <div className="stat-delta">{recMode === 'exploit' ? 'using Q-values' : recMode === 'explore' ? 'ε-greedy explore' : 'cold-start'}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Agent confidence</div>
                <div className="stat-val">{recConf}%</div>
                <div className="stat-delta">on next recommendation</div>
              </div>
            </div>

            <div className="dash-grid">
              <div className="panel" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
                <div className="panel-head" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, pointerEvents: 'none' }}>
                  <div>
                    <div className="panel-eyebrow">Your knowledge graph</div>
                    <div className="panel-title">Data Structures &amp; Algorithms — DSA track</div>
                  </div>
                  <div className="hint" style={{ textAlign: 'right' }}>drag to rotate</div>
                </div>
                <div id="graphhost" ref={graphHostRef}></div>
                <div id="legend">
                  <div className="lk"><div className="sw" style={{ background: 'var(--gold)', boxShadow: '0 0 7px var(--gold-glow)' }}></div> mastered</div>
                  <div className="lk"><div className="sw" style={{ background: 'var(--cyan)', boxShadow: '0 0 7px var(--cyan-glow)' }}></div> recommended</div>
                  <div className="lk"><div className="sw" style={{ background: 'var(--indigo)' }}></div> unlocked</div>
                  <div className="lk"><div className="sw" style={{ background: 'var(--text-faint)' }}></div> locked</div>
                </div>
              </div>

              <div className="stack">
                <div className="panel next-card">
                  <div className="next-tag">
                    <span className="next-tag-dot"></span>
                    RL Recommendation
                    {recMode && <span style={{ marginLeft: '8px', fontSize: '10px', opacity: 0.6 }}>({recMode})</span>}
                  </div>
                  <div className="next-topic">{recLabel}</div>
                  <div className="next-why">
                    {recMode === 'exploit'
                      ? `The bandit agent is routing you here based on your highest Q-value arm — it has learned this topic gives you the best mastery gain.`
                      : recMode === 'explore'
                      ? `The agent is exploring a less-visited topic. Your feedback will help it learn which topics work best for you.`
                      : `Your mastery pattern suggests this topic will give you the most effective next step in your DSA journey.`
                    }
                  </div>
                  <div className="conf-lbl">Agent confidence</div>
                  <div className="conf-row">
                    <div className="conf-track">
                      <div className="conf-fill" style={{ width: `${recConf}%` }}></div>
                    </div>
                    <div className="conf-num">{(recConf / 100).toFixed(2)}</div>
                  </div>
                  {rec.alternatives && rec.alternatives.length > 0 && (
                    <div className="alt-actions">
                      {rec.alternatives.map((alt, i) => (
                        <div className="alt" key={i}>
                          alt: <b>{TOPIC_LABELS[alt.topic_id] || alt.topic_id}</b>&nbsp;{alt.confidence?.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  )}
                  <button className="cta-btn">▶&nbsp; Start Lesson</button>
                </div>

                <div className="panel mastery-card">
                  <div className="panel-eyebrow">Topic mastery</div>
                  {MASTERY_ORDER.map(id => {
                    const pct = mastery[id] ?? 0
                    const topicState = state[id] || 'locked'
                    const fillClass = topicState === 'mastered' ? 'mastered' : topicState === 'locked' ? 'locked' : 'current'
                    return (
                      <div className="mrow" key={id}>
                        <div className="mname">{TOPIC_LABELS[id]}</div>
                        <div className="mtrack">
                          <div className={`mfill ${fillClass}`} style={{ width: `${pct}%` }}></div>
                        </div>
                        <div className="mpct">{pct}%</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .conf-fill { height: 100%; background: linear-gradient(90deg, var(--indigo), var(--cyan)); border-radius: 4px; transition: width 0.6s ease; }
      `}</style>
    </div>
  )
}
