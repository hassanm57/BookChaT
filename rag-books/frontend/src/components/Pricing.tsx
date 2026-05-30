import { useState, useCallback } from 'react'
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

export default function Pricing() {
  const navigate = useNavigate()
  const [annual, setAnnual] = useState(false)

  const fireConfetti = useCallback(() => {
    confetti({
      particleCount: 90,
      spread: 65,
      origin: { y: 0.5 },
      colors: ['#D94F3D', '#1C1C1C', '#ffffff', '#E8E2DA'],
    })
  }, [])

  const handleToggle = (val: boolean) => {
    setAnnual(val)
    if (val) fireConfetti()
  }

  return (
    <div className="pricing-wrapper">

      {/* Toggle */}
      <div className="pricing-toggle-row">
        <span className={`pricing-toggle-label ${!annual ? 'active' : ''}`}>Monthly</span>
        <button
          className="pricing-toggle-track"
          style={{
            background: annual ? '#D94F3D' : '#d0c8be',
            borderColor: annual ? '#D94F3D' : '#bfb6aa',
          }}
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
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
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

            <AnimatePresence>
              {annual && (
                <motion.p
                  className="pricing-billed-annual"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  Billed ${(plan.annualPrice * 12).toFixed(2)}/year
                </motion.p>
              )}
            </AnimatePresence>

            <div className="pricing-divider" />

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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </motion.div>
        ))}
      </div>

      <p className="pricing-footnote">No credit card required · Cancel anytime</p>
    </div>
  )
}
