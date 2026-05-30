import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ContainerScroll } from '../components/ContainerScroll'
import FeatureOrbit from '../components/FeatureOrbit'
import HowItWorks from '../components/HowItWorks'
import { HoverButton } from '../components/HoverButton'
import OrbInput from '../components/OrbInput'

const ASCII_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:!?"\'—§¶*#@'



const faqs = [
  {
    q: 'What kinds of books can I use?',
    a: 'Any PDF — novels, textbooks, research papers, manuals. If it\'s a PDF, you can chat with it.',
  },
  {
    q: 'How accurate are the answers?',
    a: 'Answers are grounded exclusively in your book\'s text using RAG (retrieval-augmented generation). The AI cites the exact passages it used and won\'t invent facts from outside the text.',
  },
  {
    q: 'Can I upload my own PDFs?',
    a: 'User uploads are coming in an upcoming release. For now, explore the curated seed library to see BookChat in action.',
  },
  {
    q: 'What\'s the Pro plan?',
    a: 'Pro ($4.99/mo) will include unlimited uploads, larger context windows, and priority processing. Launching soon.',
  },
]

export default function Hero() {
  const navigate = useNavigate()
  const asciiRef = useRef<HTMLPreElement>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
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

    // Measure actual rendered character width once
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
      // Base ambient update ~1.2% of cells
      const baseUpdates = Math.floor(cols * rows * 0.012)
      for (let i = 0; i < baseUpdates; i++) {
        const idx = Math.floor(Math.random() * grid.length)
        grid[idx] = Math.random() < 0.52
          ? ASCII_CHARS[Math.floor(Math.random() * ASCII_CHARS.length)]
          : ' '
      }

      // Mouse warp: cells near cursor cycle rapidly
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

            // Closer = higher chance of being a dense warp char
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
    <div className="hero-page">
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
          <a className="hero-nav-link" href="#pricing">Pricing</a>
        </div>
        <div className="hero-nav-actions">
          <button className="hero-nav-cta" onClick={() => navigate('/library')}>Get started</button>
          <HoverButton onClick={() => navigate('/library')}>Sign in</HoverButton>
        </div>
      </nav>

      {/* ── Section 1: Hero ───────────────────────────────── */}
      <section className="hero-main-section">
        {/* ASCII background — scoped to this section */}
        <div className="hero-ascii-wrap">
          <pre ref={asciiRef} className="hero-ascii-pre" aria-hidden="true" />
        </div>
        <div className="hero-main-content">
          <h1 className="hero-headline">
            <span className="hero-headline-line">Your books,</span>
            <span className="hero-headline-line hero-headline-italic">finally alive.</span>
          </h1>
          <OrbInput />
          <button className="hero-cta" onClick={() => navigate('/library')}>
            Open your library
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </section>

      {/* ── Section 1.5: Scroll animation ────────────────── */}
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

      {/* ── Section 2: Feature orbit ─────────────────────── */}
      <section id="features" className="hero-section hero-features-section">
        <div className="hero-section-inner">
          <p className="hero-section-eyebrow">Features</p>
          <h2 className="hero-section-heading">Everything you need to read deeper</h2>
        </div>
        <FeatureOrbit />
      </section>

      {/* ── Section 3: How it works ──────────────────────── */}
      <section id="how-it-works" className="hero-section hero-how-section">
        <div className="hero-section-inner">
          <p className="hero-section-eyebrow">How it works</p>
          <h2 className="hero-section-heading">From PDF to insight in four steps</h2>
        </div>
        <HowItWorks />
      </section>

      {/* ── Section 4: FAQ ───────────────────────────────── */}
      <section id="faq" className="hero-section hero-faq-section">
        <div className="hero-section-inner">
          <p className="hero-section-eyebrow">FAQ</p>
          <h2 className="hero-section-heading">Common questions</h2>
          <div className="hero-faq-list">
            {faqs.map((faq, i) => (
              <div className={`hero-faq-item ${openFaq === i ? 'open' : ''}`} key={i}>
                <button
                  className="hero-faq-trigger"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{faq.q}</span>
                  <svg
                    className="hero-faq-icon"
                    width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  >
                    {openFaq === i
                      ? <path d="M5 12h14"/>
                      : <path d="M12 5v14M5 12h14"/>
                    }
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="hero-faq-answer"><p>{faq.a}</p></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────── */}
      <section className="hero-bottom-cta">
        <h2 className="hero-bottom-cta-heading">Start reading differently.</h2>
        <button className="hero-cta" onClick={() => navigate('/library')}>
          Open your library
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </section>

      {/* Footer */}
      <footer className="hero-footer">
        <span className="hero-footer-copy">© 2026 BookChat - made by hassanM57</span>
      </footer>
    </div>
  )
}
