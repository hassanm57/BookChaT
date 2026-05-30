import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import NumberFlow from '@number-flow/react'
import confetti from 'canvas-confetti'
import { useNavigate } from 'react-router-dom'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 2.99,
    annualPrice: 1.99,
    description: 'Perfect for casual readers',
    features: [
      'Up to 3 books',
      'Standard chat (50 msgs/day)',
      'Basic citation chips',
      'Curated library access',
    ],
    cta: 'Start reading',
    highlighted: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    monthlyPrice: 9.99,
    annualPrice: 6.99,
    description: 'For the serious reader',
    features: [
      'Up to 50 books',
      'Unlimited chat',
      'Priority processing',
      'Full citation + page jump',
      'Larger context windows',
      'Early access to new features',
    ],
    cta: 'Go Premium',
    highlighted: true,
  },
]

interface Star {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  opacity: number
}

function Starfield({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const mouseRef = useRef<{ x: number; y: number } | null>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')!
    let W = 0, H = 0

    const resize = () => {
      const rect = container.getBoundingClientRect()
      W = rect.width
      H = rect.height
      canvas.width = W
      canvas.height = H
    }
    resize()

    const COUNT = 120
    starsRef.current = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.6 + 0.4,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      opacity: Math.random() * 0.5 + 0.2,
    }))

    const tick = () => {
      ctx.clearRect(0, 0, W, H)
      const mouse = mouseRef.current
      const stars = starsRef.current

      for (const s of stars) {
        if (mouse) {
          const dx = mouse.x - s.x
          const dy = mouse.y - s.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            const force = (1 - dist / 120) * 0.4
            s.vx -= (dx / dist) * force
            s.vy -= (dy / dist) * force
          }
        }
        s.vx *= 0.96
        s.vy *= 0.96
        s.x += s.vx
        s.y += s.vy
        if (s.x < 0) s.x = W
        if (s.x > W) s.x = 0
        if (s.y < 0) s.y = H
        if (s.y > H) s.y = 0

        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${s.opacity})`
        ctx.fill()
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    tick()

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const onMouseLeave = () => { mouseRef.current = null }
    container.addEventListener('mousemove', onMouseMove)
    container.addEventListener('mouseleave', onMouseLeave)
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(rafRef.current)
      container.removeEventListener('mousemove', onMouseMove)
      container.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('resize', resize)
    }
  }, [containerRef])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  )
}

export default function Pricing() {
  const navigate = useNavigate()
  const [annual, setAnnual] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const fireConfetti = useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.55 },
      colors: ['#D94F3D', '#F0EBE3', '#1C1C1C', '#fff'],
    })
  }, [])

  const handleToggle = (val: boolean) => {
    setAnnual(val)
    if (val) fireConfetti()
  }

  return (
    <div className="pricing-wrapper" ref={containerRef}>
      <Starfield containerRef={containerRef} />

      {/* Toggle */}
      <div className="pricing-toggle-row">
        <span className={`pricing-toggle-label ${!annual ? 'active' : ''}`}>Monthly</span>
        <button
          className="pricing-toggle-track"
          style={{ background: annual ? '#D94F3D' : undefined, borderColor: annual ? '#D94F3D' : undefined }}
          onClick={() => handleToggle(!annual)}
          aria-label="Toggle billing period"
        >
          <motion.span
            className="pricing-toggle-thumb"
            animate={{ x: annual ? 20 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          />
        </button>
        <span className={`pricing-toggle-label ${annual ? 'active' : ''}`}>
          Annual
          <AnimatePresence>
            {annual && (
              <motion.span
                className="pricing-save-badge"
                initial={{ opacity: 0, scale: 0.7, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.25 }}
              >
                Save ~30%
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </div>

      {/* Cards */}
      <div className="pricing-cards">
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.id}
            className={`pricing-card ${plan.highlighted ? 'pricing-card--hi' : ''}`}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px 0px -80px 0px' }}
            transition={{ duration: 0.6, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={{ y: -6 }}
          >
            {plan.highlighted && (
              <div className="pricing-badge">Most Popular</div>
            )}

            <div className="pricing-plan-name">{plan.name}</div>
            <div className="pricing-plan-desc">{plan.description}</div>

            <div className="pricing-price-row">
              <span className="pricing-currency">$</span>
              <NumberFlow
                value={annual ? plan.annualPrice : plan.monthlyPrice}
                format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                className="pricing-price-num"
              />
              <span className="pricing-per-mo">/mo</span>
            </div>

            {annual && (
              <motion.p
                className="pricing-billed-annual"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                Billed ${(plan.annualPrice * 12).toFixed(2)}/year
              </motion.p>
            )}

            <ul className="pricing-features">
              {plan.features.map(f => (
                <li key={f} className="pricing-feature">
                  <span className="pricing-check">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              className={`pricing-cta-btn ${plan.highlighted ? 'pricing-cta-btn--hi' : ''}`}
              onClick={() => navigate('/library')}
            >
              {plan.cta}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
