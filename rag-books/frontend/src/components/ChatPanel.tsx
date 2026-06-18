import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function ShiningText({ text }: { text: string }) {
  return (
    <motion.span
      style={{
        background: 'linear-gradient(110deg, #7a7470 35%, #1c1c1c 50%, #7a7470 75%, #7a7470)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        fontSize: '0.7rem',
        fontWeight: 600,
        fontFamily: 'var(--font-sans)',
        letterSpacing: '0.04em',
        textTransform: 'uppercase' as const,
        display: 'inline-block',
      }}
      initial={{ backgroundPosition: '200% 0' }}
      animate={{ backgroundPosition: '-200% 0' }}
      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
    >
      {text}
    </motion.span>
  )
}

interface Citation {
  page_number: number
  text: string
  title: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  followUps?: string[]
  isError?: boolean
  isDailyLimit?: boolean
  isPro?: boolean
}

interface Props {
  bookId: string
  bookTitle: string
  bookAuthor: string
  bookGenre: string
  onCitationClick: (page: number) => void
}

const PROMPTS: Record<string, string[]> = {
  fiction: [
    'Who are the main characters and what drives them?',
    'What is the central conflict in this story?',
    'What themes does this book explore?',
    'How does the story resolve?',
  ],
  fantasy: [
    'Who are the main characters?',
    'How does the magic or world-building work?',
    'What is the central quest or conflict?',
    'What are the major themes?',
  ],
  'non-fiction': [
    'What is the main argument of this book?',
    'What are the most important takeaways?',
    'What evidence does the author use?',
    'How does this challenge common assumptions?',
  ],
  science: [
    'Explain the core concept in simple terms',
    'What is the most significant discovery discussed?',
    'How do these ideas apply in real life?',
    'What are the key mechanisms or processes?',
  ],
  biology: [
    'What are the key biological concepts covered?',
    'How do cells or DNA work according to this book?',
    'What are the most important mechanisms described?',
    'How does evolution connect to the topics here?',
  ],
  history: [
    'What were the most significant events in this book?',
    'Who were the key figures and what role did they play?',
    'What caused the events described?',
    'What was the lasting impact of this period?',
  ],
  biography: [
    "What were this person's greatest achievements?",
    'What challenges did they overcome?',
    'How did their early life shape them?',
    "What is this person's most important legacy?",
  ],
  philosophy: [
    'What is the central philosophical argument?',
    'What are the key concepts introduced?',
    'How does this challenge mainstream thinking?',
    'What are the practical implications of these ideas?',
  ],
  psychology: [
    'What are the main psychological findings?',
    'How can these insights be applied in daily life?',
    'What research supports the claims in this book?',
    'What are the key theories presented?',
  ],
  economics: [
    'What is the core economic argument?',
    'What evidence does the author provide?',
    'How does this challenge mainstream economic thinking?',
    'What policies or decisions does this inform?',
  ],
}

const DEFAULT_PROMPTS = [
  'Give me a brief summary of this book',
  'What are the key ideas or arguments?',
  'What is the most interesting part?',
  'What questions does this book raise?',
]

function getSuggestedPrompts(genre: string): string[] {
  const g = (genre ?? '').toLowerCase()
  if (g.includes('non-fiction') || g.includes('nonfiction')) return PROMPTS['non-fiction']
  if (g.includes('fiction')) return PROMPTS.fiction
  if (g.includes('fantasy')) return PROMPTS.fantasy
  if (g.includes('biology')) return PROMPTS.biology
  if (g.includes('science')) return PROMPTS.science
  if (g.includes('history')) return PROMPTS.history
  if (g.includes('biograph')) return PROMPTS.biography
  if (g.includes('philosoph')) return PROMPTS.philosophy
  if (g.includes('psycholog')) return PROMPTS.psychology
  if (g.includes('econom')) return PROMPTS.economics
  return DEFAULT_PROMPTS
}

const PageIcon = () => (
  <svg width="9" height="10" viewBox="0 0 9 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1.5 1h4l2 2v7h-6V1z"/>
    <path d="M5.5 1v2h2"/>
  </svg>
)

const chipContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.055, delayChildren: 0.05 },
  },
}

const chipItemVariants = {
  hidden: { opacity: 0, scale: 0.7, y: 8 },
  show: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring' as const, stiffness: 480, damping: 22 },
  },
}

function CitationChips({ citations, onPageClick }: { citations: Citation[]; onPageClick: (p: number) => void }) {
  const seen = new Set<number>()
  const unique = [...citations]
    .sort((a, b) => a.page_number - b.page_number)
    .filter(c => { if (seen.has(c.page_number)) return false; seen.add(c.page_number); return true })

  return (
    <motion.div
      className="citation-chips"
      variants={chipContainerVariants}
      initial="hidden"
      animate="show"
    >
      {unique.map(c => (
        <motion.button
          key={c.page_number}
          className="citation-chip"
          variants={chipItemVariants}
          whileHover={{ scale: 1.07, y: -2 }}
          whileTap={{ scale: 0.91 }}
          onClick={() => onPageClick(c.page_number)}
          title={c.text}
        >
          <PageIcon />
          <span>p.{c.page_number}</span>
        </motion.button>
      ))}
    </motion.div>
  )
}

const SendIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
  </svg>
)

const StopIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="3"/>
  </svg>
)

export default function ChatPanel({ bookId, bookTitle, bookAuthor, bookGenre, onCitationClick }: Props) {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const suggestions = getSuggestedPrompts(bookGenre)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const adjustHeight = () => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  const stopStreaming = () => {
    abortRef.current?.abort()
  }

  const sendMessage = useCallback(async (query?: string) => {
    const text = (query ?? input).trim()
    if (!text || streaming) return

    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    setStreaming(true)

    const userMsg: Message = { role: 'user', content: text }
    const assistantMsg: Message = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, userMsg, assistantMsg])

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/chat', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ book_id: bookId, query: text }),
      })

      if (!res.ok || !res.body) {
        const json = await res.json().catch(() => null)
        const detail = json?.detail
        const isQuotaLimit = typeof detail === 'object' &&
          (detail?.code === 'DAILY_LIMIT' || detail?.code === 'LIFETIME_LIMIT')
        const msg = typeof detail === 'object' && detail?.message
          ? detail.message
          : res.status === 503
            ? 'Search is temporarily unavailable. Please try again in a moment.'
            : res.status === 429
              ? 'You\'re sending messages too fast. Wait a moment and try again.'
              : res.status === 404
                ? 'Nothing found on that topic. Try asking it a different way.'
                : 'Something went wrong. Please try again.'
        if (isQuotaLimit) {
          setMessages(prev => {
            const msgs = [...prev]
            msgs[msgs.length - 1] = {
              ...msgs[msgs.length - 1],
              content: msg,
              isError: true,
              isDailyLimit: true,
              isPro: detail?.is_pro ?? false,
            }
            return msgs
          })
          setStreaming(false)
          abortRef.current = null
          inputRef.current?.focus()
          return
        }
        throw new Error(msg)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break

          try {
            const event = JSON.parse(data)
            if (event.type === 'token') {
              setMessages(prev => {
                const msgs = [...prev]
                msgs[msgs.length - 1] = {
                  ...msgs[msgs.length - 1],
                  content: msgs[msgs.length - 1].content + event.content,
                }
                return msgs
              })
            } else if (event.type === 'citations') {
              setMessages(prev => {
                const msgs = [...prev]
                msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], citations: event.sources }
                return msgs
              })
            } else if (event.type === 'follow_ups') {
              setMessages(prev => {
                const msgs = [...prev]
                msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], followUps: event.questions }
                return msgs
              })
            } else if (event.type === 'error') {
              setMessages(prev => {
                const msgs = [...prev]
                msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: event.message ?? 'Something went wrong. Please try again.', isError: true }
                return msgs
              })
            }
          } catch {
            // ignore malformed events
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setMessages(prev => {
        const msgs = [...prev]
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: 'Something went wrong. Please try again.' }
        return msgs
      })
    } finally {
      setStreaming(false)
      abortRef.current = null
      inputRef.current?.focus()
    }
  }, [bookId, input, streaming])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="chat-pane">
      <div className="messages-list">
        {messages.length === 0 && (
          <div className="chat-welcome">
            <div className="chat-welcome-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
              </svg>
            </div>
            <h2 className="chat-welcome-title">{bookTitle}</h2>
            <p className="chat-welcome-author">by {bookAuthor}</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`msg-wrap ${msg.role}`}>
            {msg.role === 'assistant' && (
              <img src="/logo.png" alt="Folio" className="msg-avatar-img" />
            )}
            <div className="msg-body">
              {msg.role === 'assistant' && (
                <div className="msg-sender-label">
                  {streaming && i === messages.length - 1
                    ? <ShiningText text="Folio AI" />
                    : <span className="msg-sender-static">Folio AI</span>
                  }
                </div>
              )}
              <div className={`msg-bubble msg-${msg.role}${msg.isError ? ' msg-error' : ''}`}>
              {msg.content || (streaming && i === messages.length - 1
                ? <span className="typing-dots"><span /><span /><span /></span>
                : null
              )}

              {msg.isDailyLimit && !msg.isPro && (
                <button className="msg-upgrade-btn" onClick={() => navigate('/upgrade')}>
                  Upgrade to Pro — $9.99/mo
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              )}

              {msg.citations && msg.citations.length > 0 && (
                <CitationChips citations={msg.citations} onPageClick={onCitationClick} />
              )}

              {msg.followUps && msg.followUps.length > 0 && (
                <div className="follow-up-chips">
                  {msg.followUps.map((q, j) => (
                    <button
                      key={j}
                      className="follow-up-chip"
                      onClick={() => sendMessage(q)}
                      disabled={streaming}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        {messages.length === 0 && (
          <div className="chat-suggestions">
            {suggestions.map((s, i) => (
              <button
                key={i}
                className="chat-suggestion-chip"
                onClick={() => sendMessage(s)}
                disabled={streaming}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="chat-input-card">
          <textarea
            ref={inputRef}
            className="chat-input-field"
            value={input}
            onChange={e => { setInput(e.target.value); adjustHeight() }}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about ${bookTitle}…`}
            rows={1}
            disabled={streaming}
          />
          <div className="chat-input-actions">
            <span className="chat-input-hint">Enter to send · Shift+Enter for newline</span>
            <button
              className={`chat-send-btn${streaming ? ' stop' : ''}`}
              onClick={streaming ? stopStreaming : () => sendMessage()}
              disabled={!streaming && !input.trim()}
              title={streaming ? 'Stop generating' : 'Send'}
            >
              {streaming ? <StopIcon /> : <SendIcon />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
