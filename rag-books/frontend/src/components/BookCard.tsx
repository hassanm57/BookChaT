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
      className={`lib-card${isSelected ? ' lib-card--selected' : ''}`}
      onMouseEnter={() => onHover(book)}
      onClick={() => onClick(book)}
    >
      <div className="lib-card-cover">
        <CoverImage book={book} />
        <div className="lib-card-overlay">
          <span className="lib-card-chat">Chat →</span>
        </div>
      </div>
      <div className="lib-card-info">
        <div className="lib-card-title" title={book.title}>{book.title}</div>
        <div className="lib-card-author">{book.author}</div>
      </div>
    </div>
  )
}
