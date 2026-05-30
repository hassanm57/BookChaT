import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchBooks } from '../api'
import type { Book } from '../types'
import BookCard from '../components/BookCard'
import FeaturedPanel from '../components/FeaturedPanel'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
}

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
  </svg>
)

const UploadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)

export default function Library() {
  const navigate = useNavigate()
  const [books, setBooks] = useState<Book[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    document.body.style.overflow = 'auto'
    document.documentElement.style.overflow = 'auto'
    document.body.style.height = 'auto'
    document.documentElement.style.height = 'auto'
    const root = document.getElementById('root')
    if (root) { root.style.height = 'auto'; root.style.overflow = 'visible' }
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      document.body.style.height = ''
      document.documentElement.style.height = ''
      if (root) { root.style.height = ''; root.style.overflow = '' }
    }
  }, [])

  useEffect(() => {
    fetchBooks()
      .then(data => { setBooks(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const selected = books[selectedIndex] ?? null

  const filteredBooks = query.trim()
    ? books.filter(b =>
        b.title.toLowerCase().includes(query.toLowerCase()) ||
        b.author.toLowerCase().includes(query.toLowerCase())
      )
    : books

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        Loading your library...
      </div>
    )
  }

  return (
    <div className="lib-page">
      {/* Nav */}
      <nav className="lib-nav">
        <button className="lib-nav-logo" onClick={() => navigate('/')}>
          <img src="/logo.png" alt="Folio" className="lib-nav-logo-img" />
          <span className="lib-nav-logo-text">Folio</span>
        </button>
        <div className="lib-nav-center">
          <span className="lib-nav-tag">My Library</span>
        </div>
        <div className="lib-nav-actions">
          <button className="lib-upload-btn">
            <UploadIcon />
            Upload PDF
          </button>
          <div className="lib-user-avatar">H</div>
        </div>
      </nav>

      {/* Hero */}
      <section className="lib-hero">
        <motion.div
          className="lib-hero-text"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <p className="lib-hero-eyebrow">Your collection</p>
          <h1 className="lib-hero-heading">
            Your library,<br />
            <span className="lib-hero-italic">always open.</span>
          </h1>
          <p className="lib-hero-sub">
            {books.length} {books.length === 1 ? 'book' : 'books'} ready to chat.
            Pick up where you left off or start something new.
          </p>
          <button
            className="lib-hero-cta"
            onClick={() => selected && navigate(`/chat/${selected.book_id}`)}
          >
            Continue reading
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
        >
          <FeaturedPanel
            book={selected}
            onPrev={() => setSelectedIndex(i => (i - 1 + books.length) % books.length)}
            onNext={() => setSelectedIndex(i => (i + 1) % books.length)}
            onRead={() => selected && navigate(`/chat/${selected.book_id}`)}
          />
        </motion.div>
      </section>

      {/* Collection */}
      <section className="lib-collection">
        <div className="lib-collection-header">
          <div className="lib-collection-title">
            <h2 className="lib-collection-heading">Your Books</h2>
            <span className="lib-collection-count">{filteredBooks.length}</span>
          </div>
          <div className="lib-search-wrap">
            <SearchIcon />
            <input
              className="lib-search-input"
              placeholder="Search title or author..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>

        {filteredBooks.length === 0 ? (
          <p className="lib-empty">No books match &ldquo;{query}&rdquo;</p>
        ) : (
          <motion.div
            className="lib-grid"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredBooks.map((book, i) => (
              <motion.div key={book.book_id} variants={cardVariants}>
                <BookCard
                  book={book}
                  isSelected={book.book_id === selected?.book_id}
                  onHover={() => setSelectedIndex(books.indexOf(book) === -1 ? i : books.indexOf(book))}
                  onClick={() => navigate(`/chat/${book.book_id}`)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      <footer className="lib-footer">
        <span>{books.length} book{books.length !== 1 ? 's' : ''} in collection</span>
        <span>Folio © 2026</span>
      </footer>
    </div>
  )
}
