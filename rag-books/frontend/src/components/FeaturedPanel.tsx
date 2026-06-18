import { AnimatePresence, motion } from 'framer-motion'
import type { Book } from '../types'
import CoverImage from './CoverImage'

interface Props {
  book: Book | null
  onRead: () => void
}

export default function FeaturedPanel({ book, onRead }: Props) {
  if (!book) return null

  return (
    <div className="lib-feat">
      <AnimatePresence mode="wait">
        <motion.div
          key={book.book_id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="lib-feat-inner"
        >
          <div className="lib-feat-cover">
            <CoverImage book={book} />
          </div>

          <div className="lib-feat-info">
            {book.genre && (
              <span className="lib-feat-genre">{book.genre}</span>
            )}
            <h3 className="lib-feat-title">{book.title}</h3>
            <p className="lib-feat-author">{book.author}</p>
            <button
              className="lib-feat-cta"
              onClick={onRead}
              disabled={book.status === 'processing'}
            >
              {book.status === 'processing' ? 'Preparing...' : 'Open book'}
              {book.status !== 'processing' && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              )}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
