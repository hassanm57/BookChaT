import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import IPhoneMockup from './IPhoneMockup'

interface Pill {
  id: number
  q: string
  a: string
}

const PILLS: Pill[] = [
  {
    id: 1,
    q: 'What books work?',
    a: 'Any PDF: novels, textbooks, research papers, even manuals. If it opens in a PDF reader, Folio can read it.',
  },
  {
    id: 2,
    q: 'How accurate is it?',
    a: "Answers are grounded in your book's actual text. Every response cites the exact passages it used, so you can verify instantly.",
  },
  {
    id: 3,
    q: 'Can I upload PDFs?',
    a: 'User uploads are landing in the next release. For now, dive into our curated library to see Folio in action.',
  },
  {
    id: 4,
    q: "What's Pro?",
    a: 'Pro is $4.99/mo: unlimited uploads, bigger books, and faster processing. Launching soon.',
  },
  {
    id: 5,
    q: 'Is it free?',
    a: 'Yes! The free tier gives full access to our curated library. No credit card required.',
  },
]

interface Msg {
  id: number
  role: 'user' | 'assistant'
  text: string
}

let msgId = 0

function TypingDots() {
  return (
    <div className="faq-typing-wrap">
      <div className="faq-avatar-sm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="#D94F3D" opacity="0.9"/>
          <polyline points="14 2 14 8 20 8" stroke="white" strokeWidth="1.5" fill="none"/>
        </svg>
      </div>
      <div className="faq-typing-bubble">
        <span className="faq-dot" style={{ animationDelay: '0ms' }} />
        <span className="faq-dot" style={{ animationDelay: '180ms' }} />
        <span className="faq-dot" style={{ animationDelay: '360ms' }} />
      </div>
    </div>
  )
}

export default function FaqPhone() {
  const [messages, setMessages] = useState<Msg[]>([
    { id: msgId++, role: 'assistant', text: "Hey! I'm Folio. Tap a question below and I'll answer anything about the app." },
  ])
  const [usedIds, setUsedIds] = useState<Set<number>>(new Set())
  const [isTyping, setIsTyping] = useState(false)
  const msgsRef = useRef<HTMLDivElement>(null)
  const sendAudio = useRef(Object.assign(new Audio('/sfx-send.mp3'), { volume: 0.27 }))
  const receiveAudio = useRef(Object.assign(new Audio('/sfx-receive.mp3'), { volume: 0.65 }))

  const playSound = useCallback((ref: React.MutableRefObject<HTMLAudioElement>) => {
    ref.current.currentTime = 0
    ref.current.play().catch(() => {})
  }, [])

  const scrollToBottom = () => {
    setTimeout(() => {
      if (msgsRef.current) {
        msgsRef.current.scrollTop = msgsRef.current.scrollHeight
      }
    }, 60)
  }

  const handlePill = (pill: Pill, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isTyping) return

    setMessages(prev => [...prev, { id: msgId++, role: 'user', text: pill.q }])
    setUsedIds(prev => new Set([...prev, pill.id]))
    setIsTyping(true)
    scrollToBottom()
    playSound(sendAudio)

    setTimeout(() => {
      setIsTyping(false)
      setMessages(prev => [...prev, { id: msgId++, role: 'assistant', text: pill.a }])
      scrollToBottom()
      playSound(receiveAudio)
    }, 900 + Math.random() * 600)
  }

  const remaining = PILLS.filter(p => !usedIds.has(p.id))

  // iPhone 15-pro outer size: (393 + 12*2) = 417w, (852 + 12*2) = 876h
  // display scale 0.84 → 350w × 736h
  const SCALE = 0.84

  return (
    <div className="faq-centered">
      <div className="faq-device-shell" style={{ width: 417 * SCALE, height: 876 * SCALE }}>
        <IPhoneMockup
          model="15-pro"
          color="space-black"
          scale={SCALE}
          screenBg="#1c1c1e"
          safeArea
          showHomeIndicator
        >
          <div className="faq-chat-root">

            {/* Contact header */}
            <div className="faq-chat-header">
              <div className="faq-avatar">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="#D94F3D"/>
                  <polyline points="14 2 14 8 20 8" stroke="white" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <div className="faq-chat-header-info">
                <span className="faq-chat-name">Folio</span>
                <span className="faq-chat-status">
                  <span className="faq-online-dot" />
                  Online
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="faq-msgs" ref={msgsRef}>
              <div className="faq-msgs-inner">
                <AnimatePresence initial={false}>
                  {messages.map(m => (
                    <motion.div
                      key={m.id}
                      className={`faq-msg-row ${m.role}`}
                      initial={{ opacity: 0, y: 10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                      {m.role === 'assistant' && (
                        <div className="faq-avatar-sm">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="#D94F3D" opacity="0.9"/>
                            <polyline points="14 2 14 8 20 8" stroke="white" strokeWidth="1.5" fill="none"/>
                          </svg>
                        </div>
                      )}
                      <div className={`faq-bubble ${m.role}`}>{m.text}</div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isTyping && (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TypingDots />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Pill suggestions */}
            <div className="faq-pills-wrap">
              <AnimatePresence>
                {remaining.length === 0 && !isTyping && (
                  <motion.p
                    className="faq-all-done"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    You've covered everything!
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="faq-pills">
                <AnimatePresence>
                  {remaining.map(p => (
                    <motion.button
                      key={p.id}
                      type="button"
                      className="faq-pill"
                      onClick={e => handlePill(p, e)}
                      disabled={isTyping}
                      initial={{ opacity: 0, scale: 0.88, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: -4 }}
                      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                      whileTap={{ scale: 0.93 }}
                    >
                      {p.q}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </IPhoneMockup>
      </div>
    </div>
  )
}
