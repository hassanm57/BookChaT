import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'
import ReactLenis from 'lenis/react'
import { ContainerScroll } from '../components/ContainerScroll'
import FeatureOrbit from '../components/FeatureOrbit'
import HowItWorks from '../components/HowItWorks'
import { HoverButton } from '../components/HoverButton'
import OrbInput from '../components/OrbInput'
import ScrollUI from '../components/ScrollUI'
import FaqPhone from '../components/FaqPhone'
import { ScatterReveal } from '../components/ScatterReveal'
import BookMorph from '../components/BookMorph'

const ASCII_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:!?"\'—§¶*#@'


export default function Hero() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const asciiRef = useRef<HTMLPreElement>(null)
  const mouseRef = useRef<{ x: number; y: number } | null>(null)

  // Allow page to scroll
  useEffect(() => {
    document.body.style.overflow = 'auto'
    document.documentElement.style.overflow = 'auto'
    document.body.style.height = 'auto'
    document.documentElement.style.height = 'auto'
    const root = document.getElementById('root')
    if (root) { root.style.height = 'auto'; root.style.overflow = 'visible' }
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      document.body.style.height = ''
      document.documentElement.style.height = ''
      if (root) { root.style.height = ''; root.style.overflow = '' }
    }
  }, [])

  // ASCII background animation with mouse-hover warp
  useEffect(() => {
    const pre = asciiRef.current
    if (!pre) return

    const CHAR_H = 15
    const WARP_RADIUS = 100
    let CHAR_W = 6.6
    let cols = 0
    let rows = 0
    let grid: string[] = []

    const measureCharW = () => {
      const ctx = document.createElement('canvas').getContext('2d')
      if (ctx) {
        ctx.font = '11px Courier New'
        CHAR_W = ctx.measureText('M').width || 6.6
      }
    }
    measureCharW()

    const buildGrid = () => {
      cols = Math.ceil(window.innerWidth / CHAR_W) + 10
      rows = 60
      grid = Array.from({ length: rows * cols }, () =>
        Math.random() < 0.52
          ? ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)]
          : ' '
      )
    }

    const render = () => {
      const lines: string[] = []
      for (let r = 0; r < rows; r++) {
        lines.push(grid.slice(r * cols, (r + 1) * cols).join(''))
      }
      pre.textContent = lines.join('\n')
    }

    buildGrid()
    render()

    const ticker = setInterval(() => {
      const baseUpdates = Math.floor(cols * rows * 0.012)
      for (let i = 0; i < baseUpdates; i++) {
        const idx = Math.floor(Math.random() * grid.length)
        grid[idx] = Math.random() < 0.52
          ? ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)]
          : ' '
      }

      const mouse = mouseRef.current
      if (mouse && pre) {
        const rect = pre.getBoundingClientRect()
        const localX = mouse.x - rect.left
        const localY = mouse.y - rect.top
        const mouseCol = Math.floor(localX / CHAR_W)
        const mouseRow = Math.floor(localY / CHAR_H)
        const radiusCols = Math.ceil(WARP_RADIUS / CHAR_W)
        const radiusRows = Math.ceil(WARP_RADIUS / CHAR_H)

        for (let dr = -radiusRows; dr <= radiusRows; dr++) {
          for (let dc = -radiusCols; dc <= radiusCols; dc++) {
            const r = mouseRow + dr
            const c = mouseCol + dc
            if (r < 0 || r >= rows || c < 0 || c >= cols) continue

            const px = (c * CHAR_W) - localX
            const py = (r * CHAR_H) - localY
            const dist = Math.sqrt(px * px + py * py)
            if (dist > WARP_RADIUS) continue

            const intensity = 1 - dist / WARP_RADIUS
            if (Math.random() < intensity * 0.85) {
              grid[r * cols + c] = ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)]
            }
          }
        }
      }

      render()
    }, 50)

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    const onMouseLeave = () => { mouseRef.current = null }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseleave', onMouseLeave)

    const onResize = () => { buildGrid(); render() }
    window.addEventListener('resize', onResize)

    return () => {
      clearInterval(ticker)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <ReactLenis root options={{ lerp: 0.09, duration: 1.4, smoothWheel: true }}>
    <div className="hero-page">
      <ScrollUI />

      {/* Nav */}
      <nav className="hero-nav">
        <button className="hero-nav-logo" onClick={() => navigate('/')}>
          <img src="/logo.png" alt="Folio" className="hero-nav-logo-img" />
          <span className="hero-nav-logo-text">Folio</span>
        </button>
        <div className="hero-nav-center">
          <a className="hero-nav-link" href="#features">Features</a>
          <a className="hero-nav-link" href="#how-it-works">How it works</a>
          <a className="hero-nav-link" href="#faq">FAQ</a>
          <a className="hero-nav-link" href="/pricing">Pricing</a>
        </div>
        <div className="hero-nav-actions">
          {!authLoading && (user ? (
            <button className="hero-nav-cta" onClick={() => navigate('/library')}>Open Library</button>
          ) : (
            <>
              <button className="hero-nav-cta" onClick={() => navigate('/signup')}>Get started</button>
              <HoverButton onClick={() => navigate('/login')}>Sign in</HoverButton>
            </>
          ))}
        </div>
      </nav>

      {/* Section 1: Hero */}
      <section className="hero-main-section">
        <div className="hero-ascii-wrap">
          <pre ref={asciiRef} className="hero-ascii-pre" aria-hidden="true" />
        </div>
        <motion.div
          className="hero-main-content"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
        >
          <h1 className="hero-headline">
            <span className="hero-headline-line">Your books,</span>
            <span className="hero-headline-line hero-headline-italic">finally alive.</span>
          </h1>
          <OrbInput />
          <motion.button
            className="hero-cta"
            onClick={() => navigate('/library')}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.45 }}
          >
            Open your library
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </motion.button>
        </motion.div>
      </section>

      {/* Section 1.2: Book morph */}
      <BookMorph />

      {/* Section 1.5: Scroll animation */}
      <section className="hero-scroll-section">
        <ContainerScroll
          titleComponent={
            <div className="scroll-title-block">
              <p className="scroll-title-eyebrow">See it in action</p>
              <h2 className="scroll-title-heading">
                Chat with any book.<br />
                <span className="scroll-title-italic">Instantly.</span>
              </h2>
            </div>
          }
        >
          <div className="scroll-app-preview">
            {/* Sidebar */}
            <div className="scroll-preview-sidebar">
              <div className="scroll-preview-logo">B</div>
              <div className="scroll-preview-nav">
                {['⌂', '⊞', '↻'].map((icon, i) => (
                  <div key={i} className={`scroll-preview-nav-item ${i === 0 ? 'active' : ''}`}>{icon}</div>
                ))}
              </div>
            </div>
            {/* PDF panel */}
            <div className="scroll-preview-pdf">
              <div className="scroll-preview-pdf-header">
                <div className="scroll-preview-pdf-title">The Great Gatsby</div>
                <div className="scroll-preview-pdf-page">p. 40</div>
              </div>
              <div className="scroll-preview-pdf-body scroll-preview-pdf-image-wrap">
                <img src="/gatsby-p40.png" alt="The Great Gatsby p.40" className="scroll-preview-pdf-image" />
              </div>
            </div>
            {/* Chat panel */}
            <div className="scroll-preview-chat">
              <div className="scroll-preview-chat-header">Ask anything</div>
              <div className="scroll-preview-messages">
                <div className="scroll-preview-msg user">How did Myrtle first meet Tom?</div>
                <div className="scroll-preview-msg assistant">
                  Myrtle met Tom on a train to New York — she was transfixed by his dress suit and patent leather shoes. They ended up sharing a taxi, and she couldn't stop thinking: <em>"You can't live forever."</em>
                  <div className="scroll-preview-chips">
                    <span className="scroll-preview-chip">p. 40</span>
                    <span className="scroll-preview-chip">p. 41</span>
                    <span className="scroll-preview-chip">p. 55</span>
                  </div>
                </div>
              </div>
              <div className="scroll-preview-input">
                <span>Ask a question...</span>
              </div>
            </div>
          </div>
        </ContainerScroll>
      </section>

      {/* Section 2: Feature orbit */}
      <ScatterReveal
        id="features"
        eyebrow="Features"
        title="Everything you need to"
        titleItalic="read deeper."
        sectionClass="scatter-sec-features"
      >
        <FeatureOrbit />
      </ScatterReveal>

      {/* Section 3: How it works */}
      <ScatterReveal
        id="how-it-works"
        eyebrow="How it works"
        title="From PDF to insight"
        titleItalic="in four steps."
        sectionClass="scatter-sec-how"
      >
        <HowItWorks />
      </ScatterReveal>

      {/* Section 4: FAQ */}
      <ScatterReveal
        id="faq"
        eyebrow="FAQ"
        title="Got questions?"
        titleItalic="Just ask."
        sectionClass="scatter-sec-faq"
      >
        <FaqPhone />
      </ScatterReveal>

      {/* Bottom CTA */}
      <ScatterReveal
        title="Start reading"
        titleItalic="differently."
        sectionClass="scatter-sec-cta"
        headingClass="hero-bottom-cta-heading"
      >
        <button className="hero-cta hero-cta--light" onClick={() => navigate('/library')}>
          Open your library
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </ScatterReveal>

      {/* Footer */}
      <footer className="hero-footer">
        <span className="hero-footer-copy">© 2026 BookChat - made by hassanM57</span>
      </footer>
    </div>
    </ReactLenis>
  )
}
