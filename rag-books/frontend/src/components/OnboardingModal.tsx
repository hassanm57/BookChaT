import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const STEPS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
    title: 'Upload any PDF',
    desc: 'Novels, textbooks, research papers. Any PDF becomes instantly searchable.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: 'Chat with your book',
    desc: 'Ask anything. Folio finds the exact passage and answers in context.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
    title: 'Navigate by citation',
    desc: 'Every answer includes clickable page citations that jump the PDF viewer directly.',
  },
]

interface Props {
  onClose: () => void
}

export default function OnboardingModal({ onClose }: Props) {
  const navigate = useNavigate()
  const { clearNewUser } = useAuth()

  const handleDone = () => {
    localStorage.setItem('folio_onboarded', 'true')
    clearNewUser()
    onClose()
    navigate('/library')
  }

  return (
    <AnimatePresence>
      <motion.div
        className="ob-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleDone}
      >
        <motion.div
          className="ob-modal"
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          onClick={e => e.stopPropagation()}
        >
          <div className="ob-top">
            <img src="/logo.png" alt="Folio" className="ob-logo" />
            <h2 className="ob-heading">Welcome to Folio</h2>
            <p className="ob-sub">Your personal AI-powered library. Here's how it works.</p>
          </div>

          <div className="ob-steps">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                className="ob-step"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.1, duration: 0.4 }}
              >
                <div className="ob-step-icon">{step.icon}</div>
                <div className="ob-step-text">
                  <div className="ob-step-title">{step.title}</div>
                  <div className="ob-step-desc">{step.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="ob-footer">
            <p className="ob-paid-note">
              Folio is a paid product. You're on the free tier.
              <span className="ob-paid-link" onClick={() => { handleDone(); navigate('/pricing') }}> Upgrade anytime →</span>
            </p>
            <button className="ob-cta" onClick={handleDone}>
              Go to my library
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
