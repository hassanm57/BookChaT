import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchBooks, fetchBook, uploadBook, extractMetadata } from '../api'
import { useAuth } from '../contexts/AuthContext'
import type { Book } from '../types'
import BookCard from '../components/BookCard'
import FeaturedPanel from '../components/FeaturedPanel'
import OnboardingModal from '../components/OnboardingModal'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}
const cardVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
}

const GENRES = ['Fiction', 'Non-Fiction', 'Science', 'History', 'Philosophy', 'Biography', 'Research', 'Other']

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: (book: Book) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [genre, setGenre] = useState('')
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (f: File) => {
    if (!f.name.endsWith('.pdf')) { setError('Only PDF files are supported.'); return }
    setFile(f)
    setError('')
    setExtracting(true)
    try {
      const meta = await extractMetadata(f)
      if (meta.title) setTitle(meta.title)
      if (meta.author) setAuthor(meta.author)
    } catch {
      setTitle(f.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '))
    } finally {
      setExtracting(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { setError('Please select a PDF.'); return }
    if (!title.trim()) { setError('Title is required.'); return }
    if (!author.trim()) { setError('Author is required.'); return }
    if (!genre) { setError('Please choose a genre.'); return }
    setLoading(true)
    setError('')
    try {
      const book = await uploadBook(file, title.trim(), author.trim(), genre)
      onUploaded(book)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
      setLoading(false)
    }
  }

  return (
    <motion.div
      className="upload-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="upload-modal"
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
      >
        <div className="upload-modal-header">
          <h2 className="upload-modal-title">Add a book</h2>
          <button className="upload-modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            className={`upload-drop${dragOver ? ' upload-drop--over' : ''}${file ? ' upload-drop--filled' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
            />
            {file ? (
              <>
                <div className="upload-drop-icon upload-drop-icon--ok">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <p className="upload-drop-name">{file.name}</p>
                <p className="upload-drop-hint">Click to change</p>
              </>
            ) : (
              <>
                <div className="upload-drop-icon">
                  <UploadIcon />
                </div>
                <p className="upload-drop-label">Drop PDF here or <span>browse</span></p>
                <p className="upload-drop-hint">PDF files only</p>
              </>
            )}
          </div>

          <div className="upload-fields">
            <div className="upload-field">
              <label className="upload-label">
                Title
                {extracting && <span className="upload-extracting">reading PDF…</span>}
              </label>
              <input
                className={`upload-input${extracting ? ' upload-input--extracting' : ''}`}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={extracting ? '' : 'Book title'}
                disabled={extracting}
                required
              />
            </div>
            <div className="upload-field">
              <label className="upload-label">
                Author
                {extracting && <span className="upload-extracting">reading PDF…</span>}
              </label>
              <input
                className={`upload-input${extracting ? ' upload-input--extracting' : ''}`}
                value={author}
                onChange={e => setAuthor(e.target.value)}
                placeholder={extracting ? '' : 'Author name'}
                disabled={extracting}
                required
              />
            </div>
            <div className="upload-field">
              <label className="upload-label">Genre</label>
              <select
                className={`upload-input upload-select${!genre ? ' upload-select--placeholder' : ''}`}
                value={genre}
                onChange={e => setGenre(e.target.value)}
              >
                <option value="" disabled>Choose a genre</option>
                {GENRES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {error && <p className="upload-error">{error}</p>}

          <button className="upload-submit" type="submit" disabled={loading || extracting}>
            {loading
              ? <><span className="auth-spinner" /> Uploading...</>
              : 'Upload'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <motion.div
      className="lib-empty-state"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="lib-empty-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      </div>
      <h3 className="lib-empty-heading">Your library is empty</h3>
      <p className="lib-empty-text">Upload your first PDF to start chatting with it.</p>
      <button className="lib-hero-cta" onClick={onUpload}>
        <UploadIcon />
        Upload your first book
      </button>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Library() {
  const navigate = useNavigate()
  const { user, signOut, isNewUser } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [uploadKey, setUploadKey] = useState(0)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const pollingRef = useRef<Map<string, number>>(new Map())

  // Scroll fix
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

  // Cleanup all polling on unmount
  useEffect(() => {
    const ref = pollingRef.current
    return () => { ref.forEach(id => window.clearInterval(id)) }
  }, [])

  const stopPolling = useCallback((bookId: string) => {
    const id = pollingRef.current.get(bookId)
    if (id !== undefined) {
      window.clearInterval(id)
      pollingRef.current.delete(bookId)
    }
  }, [])

  const startPolling = useCallback((bookId: string) => {
    if (pollingRef.current.has(bookId)) return
    const id = window.setInterval(async () => {
      try {
        const book = await fetchBook(bookId)
        if (book.status !== 'processing') {
          stopPolling(bookId)
          setBooks(prev => prev.map(b => b.book_id === bookId ? book : b))
        }
      } catch {
        stopPolling(bookId)
      }
    }, 3000)
    pollingRef.current.set(bookId, id)
  }, [stopPolling])

  useEffect(() => {
    if (isNewUser) setShowOnboarding(true)
  }, [isNewUser])

  useEffect(() => {
    fetchBooks()
      .then(data => {
        setBooks(data)
        setLoading(false)
        data.filter(b => b.status === 'processing').forEach(b => startPolling(b.book_id))
      })
      .catch(() => setLoading(false))
  }, [startPolling])

  const selected = books[selectedIndex] ?? null

  const filteredBooks = query.trim()
    ? books.filter(b =>
        b.title.toLowerCase().includes(query.toLowerCase()) ||
        b.author.toLowerCase().includes(query.toLowerCase())
      )
    : books

  const handleUploaded = (book: Book) => {
    setBooks(prev => [book, ...prev])
    setSelectedIndex(0)
    if (book.status === 'processing') startPolling(book.book_id)
  }

  const openUpload = () => {
    setUploadKey(k => k + 1)
    setShowUpload(true)
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'U'

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="lib-page">
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}

      <AnimatePresence>
        {showUpload && (
          <UploadModal key={uploadKey} onClose={() => setShowUpload(false)} onUploaded={handleUploaded} />
        )}
      </AnimatePresence>

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
          <button className="lib-upload-btn" onClick={openUpload}>
            <UploadIcon />
            Upload PDF
          </button>
          <div className="lib-user-menu">
            <div className="lib-user-avatar" title={user?.email}>{initials}</div>
            <button className="lib-signout-btn" onClick={signOut} title="Sign out">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {books.length === 0 ? (
        <EmptyState onUpload={openUpload} />
      ) : (
        <>
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
                Pick up where you left off.
              </p>
              <button
                className="lib-hero-cta"
                onClick={() => selected && selected.status !== 'processing' && navigate(`/chat/${selected.book_id}`)}
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
                onRead={() => selected && selected.status !== 'processing' && navigate(`/chat/${selected.book_id}`)}
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
        </>
      )}

      <footer className="lib-footer">
        <span>{books.length} book{books.length !== 1 ? 's' : ''} in collection</span>
        <span>Folio © 2026</span>
      </footer>
    </div>
  )
}
