import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import { submitContact } from '../api'
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

const MAX_WORDS = 200
function countWords(t: string) { return t.trim() ? t.trim().split(/\s+/).length : 0 }

export default function Hero() {
  const navigate = useNavigate()
  const { user, loading: authLoading, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const asciiRef = useRef<HTMLPreElement>(null)
  const mouseRef = useRef<{ x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const [cName, setCName] = useState('')
  const [cEmail, setCEmail] = useState('')
  const [cMsg, setCMsg] = useState('')
  const [cSubmitting, setCSubmitting] = useState(false)
  const [cDone, setCDone] = useState(false)
  const [cError, setCError] = useState('')
  const cWords = countWords(cMsg)
  const cOverLimit = cWords > MAX_WORDS

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cOverLimit) { setCError(`Please keep your message under ${MAX_WORDS} words.`); return }
    setCError('')
    setCSubmitting(true)
    try {
      await submitContact({ name: cName, email: cEmail, message: cMsg })
      setCDone(true)
    } catch (err) {
      setCError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setCSubmitting(false)
    }
  }

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
          <a className="hero-nav-link" href="#contact">Contact</a>
        </div>
        <div className="hero-nav-actions">
          {/* "Open Library" sits left of dark mode when signed in */}
          {!authLoading && user && (
            <button className="hero-nav-cta" onClick={() => navigate('/library')}>Open Library</button>
          )}

          <motion.button
            className="hero-theme-toggle"
            onClick={toggleTheme}
            whileTap={{ scale: 0.84 }}
            aria-label="Toggle dark mode"
          >
            <AnimatePresence mode="wait" initial={false}>
              {theme === 'dark' ? (
                <motion.span
                  key="sun"
                  initial={{ rotate: -60, opacity: 0, scale: 0.4 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 60, opacity: 0, scale: 0.4 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  style={{ display: 'flex' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/>
                    <line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                </motion.span>
              ) : (
                <motion.span
                  key="moon"
                  initial={{ rotate: 60, opacity: 0, scale: 0.4 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -60, opacity: 0, scale: 0.4 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  style={{ display: 'flex' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Rightmost: avatar dropdown (signed in) or CTA buttons (signed out) */}
          {!authLoading && (user ? (
            <div className="lib-user-menu" ref={menuRef}>
              <button
                className={`lib-user-avatar${showUserMenu ? ' lib-user-avatar--open' : ''}`}
                onClick={() => setShowUserMenu(v => !v)}
              >
                {user.email?.slice(0, 2).toUpperCase() ?? 'U'}
              </button>
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    className="lib-user-dropdown"
                    initial={{ opacity: 0, scale: 0.94, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: -6 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="lib-dropdown-header">
                      <div className="lib-dropdown-avatar">{user.email?.slice(0, 2).toUpperCase() ?? 'U'}</div>
                      <div className="lib-dropdown-info">
                        <div className="lib-dropdown-name">{user.email?.split('@')[0]}</div>
                        <div className="lib-dropdown-email">{user.email}</div>
                      </div>
                    </div>
                    <div className="lib-dropdown-divider" />
                    <button
                      className="lib-dropdown-signout"
                      onClick={() => { setShowUserMenu(false); signOut() }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
                  Myrtle met Tom on a train to New York. She was transfixed by his dress suit and patent leather shoes. They ended up sharing a taxi, and she couldn't stop thinking: <em>"You can't live forever."</em>
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

      {/* Section 5: Contact */}
      <section id="contact" className="hero-contact-section">
        <div className="hero-contact-inner">
          {/* Left */}
          <motion.div
            className="hero-contact-left"
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <p className="hero-contact-eyebrow">Contact us</p>
            <h2 className="hero-contact-heading">
              Got a question?<br />
              <span className="hero-contact-italic">We're here.</span>
            </h2>
            <p className="hero-contact-sub">
              Support, refunds, billing questions, or just feedback — reach out and we'll handle it personally.
            </p>
            <div className="hero-contact-badges">
              <span className="hero-contact-badge">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                24-hour response
              </span>
              <span className="hero-contact-badge">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Hassle-free refunds
              </span>
              <span className="hero-contact-badge">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Human support
              </span>
            </div>
          </motion.div>

          {/* Right: form */}
          <motion.div
            className="hero-contact-right"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <AnimatePresence mode="wait">
              {cDone ? (
                <motion.div
                  key="done"
                  className="hero-contact-success"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="hero-contact-success-icon">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <h3 className="hero-contact-success-title">Message sent!</h3>
                  <p className="hero-contact-success-body">We'll get back to you within 24 hours.</p>
                  <button className="hero-contact-success-reset" onClick={() => { setCDone(false); setCName(''); setCEmail(''); setCMsg('') }}>
                    Send another
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  className="hero-contact-form"
                  onSubmit={handleContact}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="hero-contact-field">
                    <label className="hero-contact-label">Name</label>
                    <input
                      className="hero-contact-input"
                      placeholder="Your name"
                      value={cName}
                      onChange={e => setCName(e.target.value)}
                      required
                      maxLength={100}
                    />
                  </div>
                  <div className="hero-contact-field">
                    <label className="hero-contact-label">Email</label>
                    <input
                      className="hero-contact-input"
                      type="email"
                      placeholder="you@example.com"
                      value={cEmail}
                      onChange={e => setCEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="hero-contact-field">
                    <div className="hero-contact-label-row">
                      <label className="hero-contact-label">Message</label>
                      <span className={`hero-contact-wordcount${cWords > 180 ? ' warn' : ''}${cOverLimit ? ' over' : ''}`}>
                        {cWords} / {MAX_WORDS} words
                      </span>
                    </div>
                    <textarea
                      className={`hero-contact-input hero-contact-textarea${cOverLimit ? ' hero-contact-input--error' : ''}`}
                      placeholder="Describe your question, issue, or feedback…"
                      rows={5}
                      value={cMsg}
                      onChange={e => setCMsg(e.target.value)}
                      required
                    />
                  </div>
                  <AnimatePresence>
                    {cError && (
                      <motion.p
                        className="hero-contact-error"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {cError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <button
                    type="submit"
                    className="hero-contact-submit"
                    disabled={cSubmitting || cOverLimit || !cName.trim() || !cEmail.trim() || !cMsg.trim()}
                  >
                    {cSubmitting ? <span className="upg-submit-spinner" /> : (
                      <>
                        Send message
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

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
        <span className="hero-footer-copy">© 2026 Folio</span>
        <span className="hero-footer-sep">·</span>
        <a className="hero-footer-link" onClick={() => navigate('/privacy')}>Privacy Policy</a>
        <span className="hero-footer-sep">·</span>
        <a className="hero-footer-link" onClick={() => navigate('/terms')}>Terms of Service</a>
        <span className="hero-footer-sep">·</span>
        <a className="hero-footer-link" href="#contact">Contact</a>
      </footer>
    </div>
    </ReactLenis>
  )
}
