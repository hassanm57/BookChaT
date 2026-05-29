import { useEffect, useState } from 'react'
import type { Book } from '../types'

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #2C3E50, #4CA1AF)',
  'linear-gradient(135deg, #8B1A1A, #D4A017)',
  'linear-gradient(135deg, #1a472a, #52b788)',
  'linear-gradient(135deg, #4a1942, #7b2d8b)',
  'linear-gradient(135deg, #2c1810, #8b4513)',
]

function getAvatarGradient(bookId: string): string {
  const hash = bookId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length]
}

function getInitials(author: string): string {
  return author
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

interface Props {
  book: Book | null
  onPrev: () => void
  onNext: () => void
}

export default function FeaturedPanel({ book, onPrev, onNext }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [book?.book_id])

  if (!book) return null

  return (
    <div className="featured-panel" style={{ opacity: visible ? 1 : 0 }}>
      <div className="featured-header">
        <div
          className="author-avatar"
          style={{ background: getAvatarGradient(book.book_id) }}
        >
          {getInitials(book.author)}
        </div>
        <div className="author-info">
          <div className="author-name">{book.author}</div>
          <div className="author-label">author</div>
        </div>
        <button className="featured-menu-btn" title="More options">···</button>
      </div>

      <div className="featured-title">"{book.title}"</div>
      <div className="genre-badge">{book.genre}</div>

      <div className="featured-nav">
        <button className="nav-arrow" onClick={onPrev} title="Previous">←</button>
        <button className="nav-arrow" onClick={onNext} title="Next">→</button>
      </div>
    </div>
  )
}
