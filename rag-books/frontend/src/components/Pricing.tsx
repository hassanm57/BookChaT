import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const FREE_FEATURES = [
  '1 book in your library',
  '10 messages lifetime',
  'Full PDF viewer',
  'Clickable page citations',
]

const PRO_FEATURES = [
  'Up to 10 books',
  '50 messages per day',
  'Full PDF viewer',
  'Clickable page citations',
  'Priority email support',
]

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

export default function Pricing() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleFree = () => navigate(user ? '/library' : '/signup')
  const handlePro = () => navigate(user ? '/upgrade' : '/signup?intent=pro')

  return (
    <div className="pricing-wrapper">
      <div className="pricing-cards">
        {/* Free */}
        <motion.div
          className="pricing-card"
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <div className="pricing-plan-name">Free</div>
          <div className="pricing-plan-desc">Try it out, no strings attached</div>

          <div className="pricing-price-row">
            <span className="pricing-currency">$</span>
            <span className="pricing-price-num">0</span>
            <span className="pricing-per-mo">/mo</span>
          </div>

          <div className="pricing-divider" />

          <ul className="pricing-features">
            {FREE_FEATURES.map(f => (
              <li key={f} className="pricing-feature">
                <span className="pricing-check"><CheckIcon /></span>
                {f}
              </li>
            ))}
          </ul>

          <button className="pricing-cta-btn" onClick={handleFree}>
            Get started free
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </motion.div>

        {/* Pro */}
        <motion.div
          className="pricing-card pricing-card--hi"
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <div className="pricing-badge">Most Popular</div>
          <div className="pricing-plan-name">Pro</div>
          <div className="pricing-plan-desc">For readers who go deep</div>

          <div className="pricing-price-row">
            <span className="pricing-currency">$</span>
            <span className="pricing-price-num">9.99</span>
            <span className="pricing-per-mo">/mo</span>
          </div>
          <p className="pricing-billed-note">Billed monthly · Cancel anytime</p>

          <div className="pricing-divider" />

          <ul className="pricing-features">
            {PRO_FEATURES.map(f => (
              <li key={f} className="pricing-feature">
                <span className="pricing-check"><CheckIcon /></span>
                {f}
              </li>
            ))}
          </ul>

          <button className="pricing-cta-btn pricing-cta-btn--hi" onClick={handlePro}>
            Upgrade to Pro
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </motion.div>
      </div>

      <p className="pricing-footnote">Manual bank transfer · Activated within 24 hours</p>
    </div>
  )
}
