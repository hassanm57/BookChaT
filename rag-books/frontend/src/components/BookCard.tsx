import { useState } from 'react'
import type { Book } from '../types'
import CoverImage from './CoverImage'

interface Props {
  book: Book
  isSelected: boolean
  onHover: (book: Book) => void
  onClick: (book: Book) => void
  onDelete: (bookId: string) => Promise<void>
}

export default function BookCard({ book, isSelected, onHover, onClick, onDelete }: Props) {
  const isProcessing = book.status === 'processing'
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setConfirming(true)
  }

  const handleConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleting(true)
    try {
      await onDelete(book.book_id)
    } catch {
      setDeleting(false)
      setConfirming(false)
    }
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    setConfirming(false)
  }

  return (
    <div
      className={[
        'lib-card',
        isSelected && !isProcessing ? 'lib-card--selected' : '',
        isProcessing ? 'lib-card--processing' : '',
        deleting ? 'lib-card--deleting' : '',
      ].filter(Boolean).join(' ')}
      onMouseEnter={() => { if (!isProcessing && !confirming) onHover(book) }}
      onMouseLeave={() => { if (!deleting) setConfirming(false) }}
      onClick={() => { if (!isProcessing && !confirming && !deleting) onClick(book) }}
    >
      <div className="lib-card-cover">
        <CoverImage book={book} />

        {isProcessing ? (
          <div className="lib-card-processing-overlay">
            <div className="lib-card-processing-sweep" />
          </div>
        ) : deleting ? (
          <div className="lib-card-overlay lib-card-overlay--deleting">
            <span className="lib-card-deleting-label">
              <span className="auth-spinner" />
              Deleting…
            </span>
          </div>
        ) : confirming ? (
          <div className="lib-card-overlay lib-card-overlay--confirm">
            <p className="lib-card-confirm-text">Remove from library?</p>
            <div className="lib-card-confirm-actions">
              <button className="lib-card-confirm-yes" onClick={handleConfirm}>Delete</button>
              <button className="lib-card-confirm-no" onClick={handleCancel}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="lib-card-overlay">
            <span className="lib-card-chat">Chat →</span>
            <button
              className="lib-card-delete-btn"
              onClick={handleDeleteClick}
              title="Remove book"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        )}
      </div>
      <div className="lib-card-info">
        <div className="lib-card-title" title={book.title}>{book.title}</div>
        {isProcessing ? (
          <div className="lib-card-ingesting">
            <span className="lib-card-ingesting-dot" />
            Preparing
          </div>
        ) : (
          <div className="lib-card-author">{book.author}</div>
        )}
      </div>
    </div>
  )
}
