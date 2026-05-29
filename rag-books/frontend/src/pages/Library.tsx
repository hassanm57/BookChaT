import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchBooks } from '../api'
import type { Book } from '../types'
import Sidebar from '../components/Sidebar'
import BookCard from '../components/BookCard'
import FeaturedPanel from '../components/FeaturedPanel'

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
  </svg>
)

const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
)

export default function Library() {
  const navigate = useNavigate()
  const [books, setBooks] = useState<Book[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

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
    <div className="library-layout">
      <Sidebar />

      <div className="library-main">
        {/* Header */}
        <header className="library-header">
          <div className="search-wrap">
            <SearchIcon />
            <input
              className="search-input"
              placeholder="Search book name, author, genre..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className="header-spacer" />
          <div className="user-area">
            <div className="user-avatar">U</div>
            <span className="user-name">Reader</span>
            <button className="notif-btn" title="Notifications">
              <BellIcon />
            </button>
          </div>
        </header>

        {/* Hero */}
        <section className="hero-section">
          <div className="hero-text">
            <h1 className="hero-headline">Keep the story going..</h1>
            <p className="hero-sub">
              Don't let the story end just yet. Continue reading your last book
              and immerse yourself in the world of literature.
            </p>
            <button
              className="cta-btn"
              onClick={() => selected && navigate(`/chat/${selected.book_id}`)}
            >
              Start reading ↗
            </button>
          </div>

          <FeaturedPanel
            book={selected}
            onPrev={() => setSelectedIndex(i => (i - 1 + books.length) % books.length)}
            onNext={() => setSelectedIndex(i => (i + 1) % books.length)}
          />
        </section>

        {/* Book Row */}
        <section className="books-section">
          <div className="books-section-label">Your Library</div>
          <div className="book-row">
            {filteredBooks.map((book, i) => (
              <BookCard
                key={book.book_id}
                book={book}
                isSelected={book.book_id === selected?.book_id}
                onHover={() => setSelectedIndex(books.indexOf(book) === -1 ? i : books.indexOf(book))}
                onClick={() => navigate(`/chat/${book.book_id}`)}
              />
            ))}
            {filteredBooks.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '8px' }}>
                No books match "{query}"
              </p>
            )}
          </div>
        </section>

        {/* Status Bar */}
        <div className="status-bar">
          <div className="status-left">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            Upload your own books to chat with them —{' '}
            <a href="#">coming soon</a>
          </div>
          <div className="status-right">
            <strong>{String(books.length).padStart(2, '0')}</strong>/ {books.length} books
          </div>
        </div>
      </div>
    </div>
  )
}
