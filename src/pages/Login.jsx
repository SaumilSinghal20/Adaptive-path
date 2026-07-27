import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AP3D from '../utils/ap3d'
import * as THREE from 'three'
import { login } from '../api/api'

export default function Login() {
  const bgCanvasRef = useRef(null)
  const auth3dRef = useRef(null)
  const [theme, setTheme] = useState(localStorage.getItem('ap_theme') || 'dark')
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ap_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  useEffect(() => {
    if (bgCanvasRef.current) AP3D.initParticleBG(bgCanvasRef.current, 50)
    if (auth3dRef.current) AP3D.initAuthScene(auth3dRef.current, AP3D.INDIGO, AP3D.CYAN)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth">
      <canvas className="bg-canvas" id="bg-canvas" ref={bgCanvasRef}></canvas>

      <nav className="auth-nav content-layer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" className="logo">
          <div className="logo-icon">A</div>
          AdaptivePath
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle light/dark theme">
            <svg className="theme-icon-sun" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            <svg className="theme-icon-moon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </button>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            New here? <Link to="/signup" style={{ color: 'var(--indigo)', fontWeight: 500 }}>Create an account →</Link>
          </div>
        </div>
      </nav>

      <div className="auth-wrap content-layer">
        <div className="auth-visual">
          <div className="auth-3d-box" id="auth-3d" ref={auth3dRef}></div>
          <div className="auth-visual-text">
            <div className="eyebrow">Why AdaptivePath</div>
            <h2>Every session, a smarter path.</h2>
            <p>The RL agent profiles your cognitive state and builds curriculum around what you actually need — not a static syllabus.</p>
            <div className="auth-quote">
              <p>"I went from struggling with trees to solving graph problems in 3 weeks. The agent just knew what I needed before I did."</p>
              <div className="auth-quote-author">
                <div className="auth-quote-av">MK</div>
                <div>
                  <strong style={{ color: 'var(--text)', fontSize: '12px' }}>Maya K.</strong><br />
                  Software Engineer at Stripe
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-form-side">
          <div className="auth-card-wrap">
            <div className="auth-card-head">
              <div className="eyebrow">Welcome back</div>
              <h1>Sign in to continue</h1>
              <p>Your adaptive path is waiting.</p>
            </div>

            {error && (
              <div style={{
                background: 'rgba(248,113,113,0.12)',
                border: '1px solid rgba(248,113,113,0.35)',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '18px',
                color: '#f87171',
                fontSize: '13px',
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <input
                  type="email"
                  id="email"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <div style={{ textAlign: 'right', margin: '-10px 0 18px' }}>
                <a href="#" style={{ fontSize: '12px', color: 'var(--text-faint)', transition: 'color .2s' }}>Forgot password?</a>
              </div>
              <button type="submit" className="btn btn-primary form-submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in →'}
              </button>
            </form>

            <div className="form-divider">or continue with</div>
            <div className="social-btns">
              <button 
                type="button" 
                className="btn btn-secondary social-btn"
                onClick={() => window.location.href = "http://localhost:8000/api/auth/google/login"}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </button>
              <button 
                type="button" 
                className="btn btn-secondary social-btn"
                onClick={() => window.location.href = "http://localhost:8000/api/auth/github/login"}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                GitHub
              </button>
            </div>

            <div className="auth-footer-link">Don't have an account? <Link to="/signup">Sign up free</Link></div>
          </div>
        </div>
      </div>
    </div>
  )
}
