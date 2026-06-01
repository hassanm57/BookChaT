import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchBook, fetchPdfUrl } from '../api'
import type { Book } from '../types'
import ChatPanel from '../components/ChatPanel'
import PdfViewer from '../components/PdfViewer'

const BackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
)

const PdfIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
)

export default function Chat() {
  const { bookId } = useParams<{ bookId: string }>()
  const navigate = useNavigate()
  const [book, setBook] = useState<Book | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [showPdf, setShowPdf] = useState(false)
  const [pdfPage, setPdfPage] = useState(1)

  useEffect(() => {
    if (!bookId) return
    fetchBook(bookId).then(setBook).catch(() => navigate('/'))
    fetchPdfUrl(bookId).then(setPdfUrl).catch(() => {})
  }, [bookId, navigate])

  const handleCitationClick = (page: number) => {
    setPdfPage(page)
    setShowPdf(true)
  }

  if (!book) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        Loading...
      </div>
    )
  }

  return (
    <div className="chat-layout">
      <div className="chat-topbar">
        <button className="topbar-back" onClick={() => navigate('/')}>
          <BackIcon />
          Library
        </button>
        <div className="topbar-divider" />
        <span className="topbar-title">{book.title}</span>
        <span className="topbar-author">by {book.author}</span>
        <div className="topbar-spacer" />
        <button
          className={`pdf-toggle-btn ${showPdf ? 'active' : ''}`}
          onClick={() => setShowPdf(v => !v)}
        >
          <PdfIcon />
          {showPdf ? 'Hide PDF' : 'View PDF'}
        </button>
      </div>

      <div className="chat-body">
        {showPdf && pdfUrl && (
          <PdfViewer
            pdfUrl={pdfUrl}
            page={pdfPage}
            onPageChange={setPdfPage}
          />
        )}
        <ChatPanel
          bookId={book.book_id}
          bookTitle={book.title}
          onCitationClick={handleCitationClick}
        />
      </div>
    </div>
  )
}
