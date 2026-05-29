import type { Book } from '../types'
import CoverImage from './CoverImage'

interface Props {
  book: Book
  isSelected: boolean
  onHover: (book: Book) => void
  onClick: (book: Book) => void
}

export default function BookCard({ book, isSelected, onHover, onClick }: Props) {
  return (
    <div
      className={`book-card ${isSelected ? 'selected' : ''}`}
      onMouseEnter={() => onHover(book)}
      onClick={() => onClick(book)}
    >
      <div className="book-cover-wrap">
        <CoverImage book={book} />
      </div>
      <div className="book-info">
        <div className="book-title" title={book.title}>{book.title}</div>
        <div className="book-author">{book.author}</div>
      </div>
    </div>
  )
}
