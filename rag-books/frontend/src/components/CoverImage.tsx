import { useState } from 'react'
import type { Book } from '../types'

const GRADIENTS = [
  'linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(160deg, #3d0000 0%, #7b0000 50%, #b91c1c 100%)',
  'linear-gradient(160deg, #1a3a2a 0%, #2d5a3d 50%, #4a7c59 100%)',
  'linear-gradient(160deg, #2c1810 0%, #5c3317 50%, #8b4513 100%)',
  'linear-gradient(160deg, #1c1c3a 0%, #3a1a42 50%, #5c2d6e 100%)',
]

function getGradient(bookId: string): string {
  const hash = bookId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return GRADIENTS[hash % GRADIENTS.length]
}

interface Props {
  book: Book
  className?: string
}

export default function CoverImage({ book }: Props) {
  const [failed, setFailed] = useState(false)

  if (failed || !book.cover_image) {
    return (
      <div className="cover-fallback" style={{ background: getGradient(book.book_id) }}>
        <div className="cover-fallback-title">{book.title}</div>
        <div className="cover-fallback-author">{book.author}</div>
      </div>
    )
  }

  return (
    <img
      src={book.cover_image ?? undefined} // book.cover_image can be null, but img src should be undefined if no image
      alt={book.title}
      onError={() => setFailed(true)}
    />
  )
}
