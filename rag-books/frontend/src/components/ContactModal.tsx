import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { submitContact } from '../api'

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

const MAX_WORDS = 200

interface Props {
  open: boolean
  onClose: () => void
}

export default function ContactModal({ open, onClose }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const words = countWords(message)
  const overLimit = words > MAX_WORDS

  const reset = () => {
    setName(''); setEmail(''); setMessage('')
    setSubmitting(false); setDone(false); setError('')
  }

  const handleClose = () => { reset(); onClose() }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (overLimit) { setError(`Please keep your message under ${MAX_WORDS} words.`); return }
    setError('')
    setSubmitting(true)
    try {
      await submitContact({ name, email, message })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="cmodal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleClose}
        >
          <motion.div
            className="cmodal-card"
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
          >
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div
                  key="success"
                  className="cmodal-success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="cmodal-success-icon">
                    <motion.svg
                      width="28" height="28" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.15 }}
                    >
                      <polyline points="20 6 9 17 4 12"/>
                    </motion.svg>
                  </div>
                  <h3 className="cmodal-success-title">Message sent!</h3>
                  <p className="cmodal-success-body">
                    We'll get back to you within 24 hours.
                  </p>
                  <button className="cmodal-success-cta" onClick={handleClose}>
                    Close
                  </button>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="cmodal-header">
                    <div>
                      <h2 className="cmodal-title">Get in touch</h2>
                      <p className="cmodal-sub">We respond within 24 hours.</p>
                    </div>
                    <button className="cmodal-close" onClick={handleClose} aria-label="Close">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>

                  <form className="cmodal-form" onSubmit={handleSubmit}>
                    <div className="cmodal-field">
                      <label className="cmodal-label">Name</label>
                      <input
                        className="cmodal-input"
                        placeholder="Your name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        maxLength={100}
                      />
                    </div>

                    <div className="cmodal-field">
                      <label className="cmodal-label">Email</label>
                      <input
                        className="cmodal-input"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="cmodal-field">
                      <div className="cmodal-label-row">
                        <label className="cmodal-label">Message</label>
                        <span className={`cmodal-word-count${words > 180 ? ' warn' : ''}${overLimit ? ' over' : ''}`}>
                          {words} / {MAX_WORDS} words
                        </span>
                      </div>
                      <textarea
                        className={`cmodal-input cmodal-textarea${overLimit ? ' cmodal-input--error' : ''}`}
                        placeholder="Describe your issue, question, or request…"
                        rows={5}
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        required
                      />
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.p
                          className="cmodal-error"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          {error}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      className="cmodal-submit"
                      disabled={submitting || overLimit || !name.trim() || !email.trim() || !message.trim()}
                    >
                      {submitting ? (
                        <span className="upg-submit-spinner" />
                      ) : (
                        <>
                          Send message
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
