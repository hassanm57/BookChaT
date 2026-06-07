import { useNavigate } from 'react-router-dom'
import { HoverButton } from '../components/HoverButton'
import Pricing from '../components/Pricing'
import { ScatterReveal } from '../components/ScatterReveal'
import ReactLenis from 'lenis/react'
import { useEffect } from 'react'

export default function PricingPage() { // this is not implemented yet. shelving this for now.
  const navigate = useNavigate()

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

  return (
    <ReactLenis root options={{ lerp: 0.095, duration: 1.45, smoothWheel: true }}>
      <div className="hero-page">
        {/* Nav */}
        <nav className="hero-nav">
          <button className="hero-nav-logo" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="Folio" className="hero-nav-logo-img" />
            <span className="hero-nav-logo-text">Folio</span>
          </button>
          <div className="hero-nav-center">
            <a className="hero-nav-link" href="/#features">Features</a>
            <a className="hero-nav-link" href="/#how-it-works">How it works</a>
            <a className="hero-nav-link" href="/#faq">FAQ</a>
            <a className="hero-nav-link" href="/pricing">Pricing</a>
          </div>
          <div className="hero-nav-actions">
            <button className="hero-nav-cta" onClick={() => navigate('/library')}>Get started</button>
            <HoverButton onClick={() => navigate('/library')}>Sign in</HoverButton>
          </div>
        </nav>

        <ScatterReveal
          eyebrow="Pricing"
          title="Simple, honest"
          titleItalic="pricing."
          sectionClass="scatter-sec-pricing pricing-page-section"
        >
          <Pricing />
        </ScatterReveal>

        <footer className="hero-footer">
          <span className="hero-footer-copy">© 2026 BookChat - made by hassanM57</span>
        </footer>
      </div>
    </ReactLenis>
  )
}
