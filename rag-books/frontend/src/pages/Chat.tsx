import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchBook, fetchPdfUrl } from '../api'
import type { Book } from '../types'
import ChatPanel from '../components/ChatPanel'
import PdfViewer, { type PdfViewerHandle } from '../components/PdfViewer'

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
)

const PdfIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)

// ─── Chat Skeleton ─────────────────────────────────────────────────────────────
function ChatSkeleton() {
  const d = (ms: number): React.CSSProperties => ({ animationDelay: `${ms}ms` })

  return (
    <div className="chat-layout">
      {/* Topbar */}
      <div className="chat-topbar">
        <div className="skel" style={{ width: 68, height: 12, borderRadius: 4, ...d(0) }} />
        <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />
        <div className="skel" style={{ width: 160, height: 14, borderRadius: 4, ...d(60) }} />
        <div className="skel" style={{ width: 90, height: 11, borderRadius: 4, ...d(100) }} />
        <div style={{ flex: 1 }} />
        <div className="skel" style={{ width: 104, height: 34, borderRadius: 9999, ...d(120) }} />
      </div>

      {/* Body */}
      <div className="chat-body">
        {/* PDF pane — dark area with simulated page blocks */}
        <div className="pdf-pane">
          <div className="pdf-controls" style={{ background: '#3a3a3a' }}>
            <div className="skel-dark" style={{ width: 30, height: 30 }} />
            <div className="skel-dark" style={{ width: 60, height: 12, borderRadius: 4, ...d(40) }} />
            <div className="skel-dark" style={{ width: 30, height: 30, ...d(80) }} />
          </div>
          <div className="skel-pdf-inner">
            {/* Simulated PDF page */}
            <div className="skel-dark" style={{ width: '100%', height: 48, borderRadius: 4, ...d(0) }} />
            <div className="skel-dark" style={{ width: '88%', height: 12, borderRadius: 3, ...d(50) }} />
            <div className="skel-dark" style={{ width: '92%', height: 12, borderRadius: 3, ...d(80) }} />
            <div className="skel-dark" style={{ width: '85%', height: 12, borderRadius: 3, ...d(110) }} />
            <div className="skel-dark" style={{ width: '90%', height: 12, borderRadius: 3, ...d(140) }} />
            <div className="skel-dark" style={{ width: '78%', height: 12, borderRadius: 3, ...d(170) }} />
            <div style={{ height: 8 }} />
            <div className="skel-dark" style={{ width: '93%', height: 12, borderRadius: 3, ...d(220) }} />
            <div className="skel-dark" style={{ width: '87%', height: 12, borderRadius: 3, ...d(250) }} />
            <div className="skel-dark" style={{ width: '91%', height: 12, borderRadius: 3, ...d(280) }} />
            <div className="skel-dark" style={{ width: '72%', height: 12, borderRadius: 3, ...d(310) }} />
            <div style={{ height: 8 }} />
            <div className="skel-dark" style={{ width: '88%', height: 12, borderRadius: 3, ...d(360) }} />
            <div className="skel-dark" style={{ width: '94%', height: 12, borderRadius: 3, ...d(390) }} />
            <div className="skel-dark" style={{ width: '80%', height: 12, borderRadius: 3, ...d(420) }} />
          </div>
        </div>

        {/* Chat pane */}
        <div className="chat-pane">
          {/* Welcome area */}
          <div className="skel-chat-welcome-area">
            <div className="skel" style={{ width: 52, height: 52, borderRadius: 14, ...d(40) }} />
            <div className="skel" style={{ width: 210, height: 22, borderRadius: 6, ...d(80) }} />
            <div className="skel" style={{ width: 130, height: 13, borderRadius: 4, ...d(120) }} />
          </div>

          {/* Input area */}
          <div className="chat-input-area">
            <div className="skel-suggestion-row">
              {([130, 160, 145, 108] as number[]).map((w, i) => (
                <div key={i} className="skel" style={{ width: w, height: 30, borderRadius: 20, ...d(i * 55) }} />
              ))}
            </div>
            <div className="chat-input-card" style={{ padding: 14 }}>
              <div className="skel" style={{ width: '55%', height: 13, borderRadius: 4, ...d(60) }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
                <div className="skel" style={{ width: 160, height: 10, borderRadius: 4, ...d(100) }} />
                <div className="skel" style={{ width: 34, height: 34, borderRadius: '50%', ...d(120) }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const GlassFilter = () => (
  <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden>
    <defs>
      <filter id="folio-liquid-glass" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="1" seed="1" result="turbulence"/>
        <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise"/>
        <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="70" xChannelSelector="R" yChannelSelector="B" result="displaced"/>
        <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur"/>
        <feComposite in="finalBlur" in2="finalBlur" operator="over"/>
      </filter>
    </defs>
  </svg>
)

const PdfToggle = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
  <button className={`lpdf-btn${active ? ' active' : ''}`} onClick={onClick} title={active ? 'Hide PDF' : 'View PDF'}>
    <div className="lpdf-shadow" />
    <div className="lpdf-glass" style={{ backdropFilter: 'url("#folio-liquid-glass")' }} />
    <span className="lpdf-label">
      <PdfIcon />
      {active ? 'Hide PDF' : 'View PDF'}
    </span>
    <GlassFilter />
  </button>
)

export default function Chat() {
  const { bookId } = useParams<{ bookId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const initialBook = useRef((location.state as { book?: Book } | null)?.book ?? null)
  const [book, setBook] = useState<Book | null>(initialBook.current)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfUrlReady, setPdfUrlReady] = useState(false)
  const [showPdf, setShowPdf] = useState(true)
  const pdfViewerRef = useRef<PdfViewerHandle>(null)

  useEffect(() => {
    if (!bookId) return
    if (!initialBook.current) {
      fetchBook(bookId).then(setBook).catch(() => navigate('/library'))
    }
    fetchPdfUrl(bookId)
      .then(setPdfUrl)
      .catch(() => {})
      .finally(() => setPdfUrlReady(true))
  }, [bookId, navigate])

  const handleCitationClick = (page: number) => {
    setShowPdf(true)
    // Small delay so the PDF pane mounts before we try to scroll
    setTimeout(() => pdfViewerRef.current?.jumpToPage(page), 50)
  }

  if (!book || !pdfUrlReady) return <ChatSkeleton />

  return (
    <motion.div
      className="chat-layout"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className="chat-topbar">
        <button className="topbar-back" onClick={() => navigate('/library')}>
          <BackIcon />
          Library
        </button>
        <div className="topbar-divider" />
        <span className="topbar-title">{book.title}</span>
        <span className="topbar-author">by {book.author}</span>
        <div className="topbar-spacer" />
        <PdfToggle active={showPdf} onClick={() => setShowPdf(v => !v)} />
      </div>

      <div className="chat-body">
        {showPdf && pdfUrl && (
          <PdfViewer
            ref={pdfViewerRef}
            pdfUrl={pdfUrl}
          />
        )}
        <ChatPanel
          bookId={book.book_id}
          bookTitle={book.title}
          bookAuthor={book.author}
          bookGenre={book.genre}
          onCitationClick={handleCitationClick}
        />
      </div>
    </motion.div>
  )
}
