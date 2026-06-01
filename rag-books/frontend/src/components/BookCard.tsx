import type { Book } from '../types'
import CoverImage from './CoverImage'

interface Props {
  book: Book
  isSelected: boolean
  onHover: (book: Book) => void
  onClick: (book: Book) => void
}

export default function BookCard({ book, isSelected, onHover, onClick }: Props) {
  const isProcessing = book.status === 'processing'

  return (
    <div
      className={[
        'lib-card',
        isSelected && !isProcessing ? 'lib-card--selected' : '',
        isProcessing ? 'lib-card--processing' : '',
      ].filter(Boolean).join(' ')}
      onMouseEnter={() => { if (!isProcessing) onHover(book) }}
      onClick={() => { if (!isProcessing) onClick(book) }}
    >
      <div className="lib-card-cover">
        <CoverImage book={book} />
        {isProcessing ? (
          <div className="lib-card-processing-overlay">
            <div className="lib-card-processing-sweep" />
          </div>
        ) : (
          <div className="lib-card-overlay">
            <span className="lib-card-chat">Chat →</span>
          </div>
        )}
      </div>
      <div className="lib-card-info">
        <div className="lib-card-title" title={book.title}>{book.title}</div>
        {isProcessing ? (
          <div className="lib-card-ingesting">
            <span className="lib-card-ingesting-dot" />
            Ingesting
          </div>
        ) : (
          <div className="lib-card-author">{book.author}</div>
        )}
      </div>
    </div>
  )
}
