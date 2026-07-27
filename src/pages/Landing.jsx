import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import AP3D from '../utils/ap3d'
import * as THREE from 'three'

import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Landing() {
  const bgCanvasRef = useRef(null)
  const earthCanvasRef = useRef(null)
  const kgCanvas1Ref = useRef(null)
  const kgCanvas2Ref = useRef(null)

  useEffect(() => {
    // Particle background
    if (bgCanvasRef.current) {
      AP3D.initParticleBG(bgCanvasRef.current, 300)
    }

    // 3D Earth Globe
    const canvas = earthCanvasRef.current
    if (canvas) {
      const size = 420
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
      camera.position.z = 2.8
      
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
      renderer.setSize(size, size)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 0)
      
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
      scene.add(ambientLight)
      
      const sunLight = new THREE.DirectionalLight(0xfff5e0, 1.2)
      sunLight.position.set(5, 3, 5)
      scene.add(sunLight)
      
      const rimLight = new THREE.DirectionalLight(0x7c6fff, 0.3)
      rimLight.position.set(-3, -1, -3)
      scene.add(rimLight)
      
      const geometry = new THREE.SphereGeometry(1.15, 64, 64)
      const loader = new THREE.TextureLoader()
      const nightTex = loader.load('img/earth-night.png')
      const dayTex = loader.load('img/earth-day.png')
      
      const isDark = () => document.documentElement.getAttribute('data-theme') !== 'light'
      
      const material = new THREE.MeshStandardMaterial({
        map: isDark() ? nightTex : dayTex,
        roughness: 0.7,
        metalness: 0.05,
      })
      
      const globe = new THREE.Mesh(geometry, material)
      globe.rotation.x = 0.35
      scene.add(globe)
      
      const observer = new MutationObserver(() => {
        material.map = isDark() ? nightTex : dayTex
        material.needsUpdate = true
      })
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
      
      let isDragging = false
      let prevX = 0
      let dragSpeed = 0
      
      canvas.addEventListener('mousedown', (e) => {
        isDragging = true
        prevX = e.clientX
        dragSpeed = 0
      })
      
      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return
        const dx = e.clientX - prevX
        dragSpeed = dx * 0.005
        prevX = e.clientX
      })
      
      window.addEventListener('mouseup', () => {
        isDragging = false
      })
      
      const autoSpeed = 0.002
      let animationFrameId
      
      function animate() {
        animationFrameId = requestAnimationFrame(animate)
        if (!isDragging) {
          dragSpeed *= 0.95
          globe.rotation.y += autoSpeed + dragSpeed
        } else {
          globe.rotation.y += dragSpeed
        }
        renderer.render(scene, camera)
      }
      
      animate()

      return () => {
        cancelAnimationFrame(animationFrameId)
        observer.disconnect()
        renderer.dispose()
      }
    }
  }, [])

  useEffect(() => {
    if (kgCanvas1Ref.current) AP3D.initKnowledgeGraph(kgCanvas1Ref.current)
    if (kgCanvas2Ref.current) AP3D.initKnowledgeGraph(kgCanvas2Ref.current)
  }, [])

  useEffect(() => {
    // Intersection Observer for animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1 })
    
    document.querySelectorAll('.animated-group').forEach(group => {
      observer.observe(group)
    })
    
    return () => observer.disconnect()
  }, [])

  return (
    <div className="landing">
      <Navbar />
      <canvas className="bg-canvas" id="bg-canvas" ref={bgCanvasRef}></canvas>

      <section className="hero-section content-layer">
        <div className="hero-left">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            <span>Reinforcement learning · Live decisions</span>
          </div>
          <h1 className="hero-h1">
            The path<br />
            reshapes itself<br />
            <span className="gradient-text">around you.</span>
          </h1>
          <p className="hero-p">
            AdaptivePath tracks your evolving mastery, frustration, and engagement in real-time — then a deep RL agent chooses your next best action after every single interaction.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary">Start for free →</Link>
            <Link to="/dashboard" className="btn btn-secondary">See dashboard</Link>
          </div>
          <div className="hero-stats">
            <div>
              <div className="hstat-val gradient-text-gold">94%</div>
              <div className="hstat-label">Learner retention</div>
            </div>
            <div>
              <div className="hstat-val" style={{ color: 'var(--cyan)' }}>3.2×</div>
              <div className="hstat-label">Faster mastery</div>
            </div>
            <div>
              <div className="hstat-val" style={{ color: 'var(--indigo-bright)' }}>12K+</div>
              <div className="hstat-label">Active learners</div>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="earth-container" id="earth-container">
            <div className="earth-glow"></div>
            <canvas id="earth-3d-canvas" ref={earthCanvasRef}></canvas>
            <div className="earth-atmosphere"></div>
          </div>

          <div className="metric-chip glass-md chip1">
            <span className="chip-icon">✦</span>
            <div>
              <div className="chip-val" style={{ color: 'var(--gold)' }}>92%</div>
              <div className="chip-label">Arrays mastered</div>
            </div>
          </div>
          <div className="metric-chip glass-md chip2">
            <span className="chip-icon">⬡</span>
            <div>
              <div className="chip-val" style={{ color: 'var(--cyan)' }}>0.78</div>
              <div className="chip-label">Agent confidence</div>
            </div>
          </div>
          <div className="metric-chip glass-md chip3">
            <span className="chip-icon">🔥</span>
            <div>
              <div className="chip-val" style={{ color: 'var(--indigo-bright)' }}>12 days</div>
              <div className="chip-label">Current streak</div>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section content-layer" id="features">
        <div className="section-head">
          <div className="eyebrow">What makes us different</div>
          <h2>Built for <span className="gradient-text">continuous adaptation</span></h2>
        </div>
        <div className="feat-grid animated-group">
          {/* Feature Cards here */}
          {[
            { icon: '🧠', title: 'Bayesian Knowledge Tracing', desc: "Estimates your per-topic mastery from every quiz result — not just your latest score, your entire response trajectory and timing patterns.", color: 'var(--indigo-dim)' },
            { icon: '⚡', title: 'RL-Driven Next Action', desc: "A LinUCB contextual bandit selects the highest-value next action in real time. A DQN agent handles long-horizon curriculum planning.", color: 'var(--cyan-dim)' },
            { icon: '🔭', title: 'Explainable Decisions', desc: "See exactly why the agent chose this lesson — Q-values, alternative actions, and human-readable reasoning right in your dashboard.", color: 'var(--gold-dim)' },
            { icon: '🌐', title: '3D Knowledge Graph', desc: "Your entire curriculum as an interactive 3D graph — mastered nodes glow gold, your current topic pulses cyan, locked topics are dim.", color: 'var(--indigo-dim)' },
            { icon: '🏋️', title: 'Learner Simulator', desc: "RL policies are stress-tested against simulated learner archetypes before they ever touch a real user. Zero risk, continuous improvement.", color: 'var(--rose-dim)' },
            { icon: '📊', title: 'Admin Analytics', desc: "Mastery trends, RL vs baseline comparisons, drop-off rates — all in a cohesive analytics view designed for curriculum managers.", color: 'var(--cyan-dim)' }
          ].map((feat, i) => (
            <div className="glow-card animated-item" key={i}>
              <div className="feat-card glass">
                <div className="feat-header">
                  <div className="feat-icon" style={{ background: 'rgba(124,111,255,.08)', border: `1px solid ${feat.color}` }}>{feat.icon}</div>
                </div>
                <h3>{feat.title}</h3>
                <p>{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="how-section content-layer" id="how">
        <div className="section-head">
          <div className="eyebrow">Under the hood</div>
          <h2>How AdaptivePath <span className="gradient-text">makes decisions</span></h2>
        </div>

        <div className="how-grid">
          <div className="how-3d-box" id="kg-canvas1" ref={kgCanvas1Ref}></div>
          <div className="how-copy">
            <div className="eyebrow">Knowledge tracing</div>
            <h2>Your mastery, <span className="gradient-text-gold">mapped.</span></h2>
            <p>Every answer, lesson completion, and time-on-task feeds a Bayesian model estimating the probability you truly understand each concept — not just whether you clicked the right option.</p>
            <div className="bullet-list">
              <div className="bullet">
                <div className="bullet-dot" style={{ background: 'rgba(0,212,170,.1)', border: '1px solid var(--cyan-dim)', color: 'var(--cyan)' }}>✓</div>
                <span>Tracks mastery across 7+ topic dimensions simultaneously</span>
              </div>
              <div className="bullet">
                <div className="bullet-dot" style={{ background: 'rgba(0,212,170,.1)', border: '1px solid var(--cyan-dim)', color: 'var(--cyan)' }}>✓</div>
                <span>Handles uncertainty — doesn't pretend a guess was mastery</span>
              </div>
              <div className="bullet">
                <div className="bullet-dot" style={{ background: 'rgba(0,212,170,.1)', border: '1px solid var(--cyan-dim)', color: 'var(--cyan)' }}>✓</div>
                <span>Feeds directly into the RL agent's real-time state vector</span>
              </div>
            </div>
          </div>
        </div>

        <div className="how-grid" style={{ marginTop: '64px' }}>
          <div className="how-copy">
            <div className="eyebrow">Adaptive pathfinding</div>
            <h2>An agent that <span className="gradient-text">never stops learning.</span></h2>
            <p>After every interaction the RL agent re-evaluates your full state — mastery, engagement, frustration, time-since-review — and selects the action that maximises long-term learning, not just today's score.</p>
            <div className="bullet-list">
              <div className="bullet">
                <div className="bullet-dot" style={{ background: 'rgba(124,111,255,.1)', border: '1px solid var(--indigo-dim)', color: 'var(--indigo-bright)' }}>✓</div>
                <span>Contextual bandit for immediate single-step decisions</span>
              </div>
              <div className="bullet">
                <div className="bullet-dot" style={{ background: 'rgba(124,111,255,.1)', border: '1px solid var(--indigo-dim)', color: 'var(--indigo-bright)' }}>✓</div>
                <span>DQN / PPO for multi-step curriculum planning</span>
              </div>
              <div className="bullet">
                <div className="bullet-dot" style={{ background: 'rgba(124,111,255,.1)', border: '1px solid var(--indigo-dim)', color: 'var(--indigo-bright)' }}>✓</div>
                <span>Every decision logged with confidence + alternatives shown</span>
              </div>
            </div>
          </div>
          <div className="how-3d-box" id="kg-canvas2" ref={kgCanvas2Ref}></div>
        </div>
      </section>

      <section className="cta-section content-layer">
        <div className="eyebrow">Start today</div>
        <h2>Ready to learn <span className="gradient-text">smarter?</span></h2>
        <p>Join thousands of learners whose curriculum adapts to them in real time — not the other way around.</p>
        <div className="cta-actions">
          <Link to="/signup" className="btn btn-primary">Create free account →</Link>
          <Link to="/login" className="btn btn-secondary">Sign in</Link>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}
