import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchBooks, fetchBook, uploadBook, extractMetadata, deleteBook, UploadLimitError } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import type { Book } from '../types'
import BookCard from '../components/BookCard'
import FeaturedPanel from '../components/FeaturedPanel'
import OnboardingModal from '../components/OnboardingModal'
import { ExpandingSearchDock } from '../components/ExpandingSearchDock'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}
const cardVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
}

const GENRES = ['Fiction', 'Non-Fiction', 'Science', 'History', 'Philosophy', 'Biography', 'Research', 'Other']


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
type UploadPhase = 'pick' | 'loading' | 'confirm'

function UploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: (book: Book) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [phase, setPhase] = useState<UploadPhase>('pick')
  const [progress, setProgress] = useState(0)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [genre, setGenre] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [limitReached, setLimitReached] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const animTimer = useRef<number>()
  const doneTimer = useRef<number>()

  useEffect(() => () => {
    clearTimeout(animTimer.current)
    clearTimeout(doneTimer.current)
  }, [])

  const handleFile = async (f: File) => {
    if (!f.name.endsWith('.pdf')) { setError('Only PDF files are supported.'); return }
    clearTimeout(animTimer.current)
    clearTimeout(doneTimer.current)

    setFile(f)
    setError('')
    setTitle('')
    setAuthor('')
    setProgress(0)
    setPhase('loading')

    // Delay one tick so the bar renders at 0% before the CSS transition kicks in
    animTimer.current = window.setTimeout(() => setProgress(75), 20)

    try {
      const meta = await extractMetadata(f)
      if (meta.title) setTitle(meta.title)
      if (meta.author) setAuthor(meta.author)
    } catch {
      setTitle(f.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '))
    }

    clearTimeout(animTimer.current)
    setProgress(100)
    doneTimer.current = window.setTimeout(() => setPhase('confirm'), 380)
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
    setUploading(true)
    setError('')
    try {
      const book = await uploadBook(file, title.trim(), author.trim(), genre)
      onUploaded(book)
      onClose()
    } catch (err: unknown) {
      if (err instanceof UploadLimitError) {
        setLimitReached(true)
      } else {
        setError(err instanceof Error ? err.message : 'Upload failed.')
      }
      setUploading(false)
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
        layout
      >
        {limitReached ? (
          <div className="upload-limit-screen">
            <div className="upload-limit-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </div>
            <h2 className="upload-limit-heading">You've reached the free limit</h2>
            <p className="upload-limit-body">
              The free plan includes up to 3 books. Upgrade to Pro for unlimited uploads, larger PDFs, and priority processing.
            </p>
            <div className="upload-limit-actions">
              <button className="upload-limit-cta" onClick={() => { onClose(); window.location.href = '/pricing' }}>
                Upgrade to Pro — $4.99/mo
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
              <button className="upload-limit-dismiss" onClick={onClose}>Maybe later</button>
            </div>
          </div>
        ) : (
        <>
        <div className="upload-modal-header">
          <h2 className="upload-modal-title">Add a book</h2>
          <button className="upload-modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* ── Drop zone ── */}
          <div
            className={`upload-drop${dragOver ? ' upload-drop--over' : ''}${file ? ' upload-drop--filled upload-drop--compact' : ''}`}
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
                <div className="upload-drop-icon upload-drop-icon--ok upload-drop-icon--sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div className="upload-drop-compact-info">
                  <p className="upload-drop-name">{file.name}</p>
                  <p className="upload-drop-hint">Click to change file</p>
                </div>
              </>
            ) : (
              <>
                <div className="upload-drop-icon"><UploadIcon /></div>
                <p className="upload-drop-label">Drop PDF here or <span>browse</span></p>
                <p className="upload-drop-hint">PDF files only</p>
              </>
            )}
          </div>

          {/* ── Progress bar (loading phase) ── */}
          {phase === 'loading' && (
            <div className="upload-progress-wrap">
              <div className="upload-progress">
                <div
                  className="upload-progress-fill"
                  style={{
                    width: `${progress}%`,
                    transition: progress >= 100
                      ? 'width 0.25s ease'
                      : 'width 1.8s cubic-bezier(0.05, 0.85, 0.1, 1)',
                  }}
                />
              </div>
              <p className="upload-progress-reading">Reading your PDF…</p>
            </div>
          )}

          {/* ── Fields (confirm phase) ── */}
          {phase === 'confirm' && (
            <motion.div
              className="upload-fields"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="upload-field">
                <label className="upload-label">Title</label>
                <input
                  className="upload-input"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Book title"
                  autoFocus
                  required
                />
              </div>
              <div className="upload-field">
                <label className="upload-label">Author</label>
                <input
                  className="upload-input"
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  placeholder="Author name"
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
            </motion.div>
          )}

          {error && <p className="upload-error">{error}</p>}

          {phase === 'confirm' && (
            <button className="upload-submit" type="submit" disabled={uploading}>
              {uploading ? <><span className="auth-spinner" /> Uploading…</> : 'Upload'}
            </button>
          )}
        </form>
        </>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Library Skeleton ─────────────────────────────────────────────────────────
function LibrarySkeleton() {
  // Each row of skeletons gets a slight animation-delay offset for a stagger effect
  const d = (ms: number): React.CSSProperties => ({ animationDelay: `${ms}ms` })

  return (
    <div className="lib-page">
      {/* Nav */}
      <nav className="lib-nav">
        <div className="lib-nav-logo">
          <div className="skel" style={{ width: 28, height: 28, borderRadius: 6 }} />
          <div className="skel" style={{ width: 52, height: 14, borderRadius: 4, ...d(60) }} />
        </div>
        <div className="lib-nav-center">
          <div className="skel" style={{ width: 148, height: 13, borderRadius: 4, ...d(80) }} />
        </div>
        <div className="lib-nav-actions">
          <div className="skel" style={{ width: 36, height: 36, borderRadius: '50%', ...d(100) }} />
          <div className="skel" style={{ width: 36, height: 36, borderRadius: '50%', ...d(140) }} />
        </div>
      </nav>

      {/* Hero */}
      <section className="lib-hero">
        {/* Left: text column */}
        <div className="lib-hero-text" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="skel" style={{ width: 88, height: 11, ...d(0) }} />
          <div className="skel" style={{ width: '72%', height: 44, borderRadius: 8, ...d(60) }} />
          <div className="skel" style={{ width: '52%', height: 44, borderRadius: 8, ...d(100) }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
            <div className="skel" style={{ width: '80%', height: 13, ...d(160) }} />
            <div className="skel" style={{ width: '62%', height: 13, ...d(200) }} />
          </div>
          <div className="skel" style={{ width: 152, height: 46, borderRadius: 40, marginTop: 8, ...d(240) }} />
        </div>

        {/* Right: featured panel */}
        <div className="lib-feat" style={{ overflow: 'hidden' }}>
          <div className="lib-feat-inner">
            <div className="skel" style={{ width: 148, flexShrink: 0, aspectRatio: '2/3', borderRadius: 10, ...d(80) }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="skel" style={{ width: 56, height: 10, ...d(120) }} />
              <div className="skel" style={{ width: '88%', height: 20, borderRadius: 6, ...d(160) }} />
              <div className="skel" style={{ width: '62%', height: 12, ...d(200) }} />
              <div className="skel" style={{ width: 112, height: 40, borderRadius: 40, marginTop: 8, ...d(240) }} />
            </div>
          </div>
        </div>
      </section>

      {/* Collection */}
      <section className="lib-collection">
        <div className="lib-collection-header">
          <div className="lib-collection-title">
            <div className="skel" style={{ width: 128, height: 22, borderRadius: 6, ...d(0) }} />
            <div className="skel" style={{ width: 34, height: 24, borderRadius: 20, ...d(60) }} />
          </div>
        </div>

        <div className="lib-grid">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i}>
              <div
                className="skel lib-card-cover"
                style={{ ...d(i * 70) }}
              />
              <div className="lib-card-info">
                <div className="skel" style={{ width: '82%', height: 12, ...d(i * 70 + 50) }} />
                <div className="skel" style={{ width: '56%', height: 11, marginTop: 5, ...d(i * 70 + 90) }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
const EMPTY_STEPS = [
  {
    n: '01',
    title: 'Upload any PDF',
    body: 'Textbooks, research papers, novels — anything up to 50 MB.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
  },
  {
    n: '02',
    title: 'We process it',
    body: 'Folio chunks and embeds your document. Usually done in under a minute.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    n: '03',
    title: 'Chat with citations',
    body: 'Ask anything. Every answer includes clickable page citations.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
]

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <motion.div
      className="lib-empty-state"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
    >
      <div className="lib-empty-hero">
        <div className="lib-empty-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
        </div>
        <h2 className="lib-empty-heading">Your library is empty</h2>
        <p className="lib-empty-text">Upload a PDF and start having a conversation with it in seconds.</p>
        <button className="lib-hero-cta lib-empty-cta" onClick={onUpload}>
          <UploadIcon />
          Upload your first book
        </button>
      </div>

      <div className="lib-empty-steps">
        {EMPTY_STEPS.map((step, i) => (
          <motion.div
            key={step.n}
            className="lib-empty-step"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
          >
            <div className="lib-empty-step-icon">{step.icon}</div>
            <div>
              <span className="lib-empty-step-n">{step.n}</span>
              <h4 className="lib-empty-step-title">{step.title}</h4>
              <p className="lib-empty-step-body">{step.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Library() {
  const navigate = useNavigate()
  const { user, signOut, isNewUser } = useAuth()
  const { theme, toggleTheme } = useTheme()

  // Cache key is per-user — stable once authenticated
  const cacheKey = `folio_books_${user?.id ?? ''}`

  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const raw = localStorage.getItem(cacheKey)
      if (raw) return JSON.parse(raw) as Book[]
    } catch {}
    return []
  })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(() => {
    try {
      const raw = localStorage.getItem(cacheKey)
      if (raw) return (JSON.parse(raw) as Book[]).length === 0
    } catch {}
    return true
  })
  const [query, setQuery] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [uploadKey, setUploadKey] = useState(0)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const pollingRef = useRef<Map<string, number>>(new Map())
  const menuRef = useRef<HTMLDivElement>(null)

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

  // Close user dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
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

  // Keep cache in sync whenever books list changes
  useEffect(() => {
    try { localStorage.setItem(cacheKey, JSON.stringify(books)) } catch {}
  }, [books, cacheKey])

  useEffect(() => {
    if (isNewUser) setShowOnboarding(true)
  }, [isNewUser])

  useEffect(() => {
    // Start polling for any processing books already in cache
    books.filter(b => b.status === 'processing').forEach(b => startPolling(b.book_id))

    // Always fetch fresh data in background
    fetchBooks()
      .then(data => {
        setBooks(data)
        setLoading(false)
        data.filter(b => b.status === 'processing').forEach(b => startPolling(b.book_id))
      })
      .catch(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleDelete = async (bookId: string) => {
    await deleteBook(bookId)
    setBooks(prev => {
      const next = prev.filter(b => b.book_id !== bookId)
      // Keep selectedIndex in range
      setSelectedIndex(i => Math.min(i, Math.max(0, next.length - 1)))
      return next
    })
    stopPolling(bookId)
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'U'

  if (loading) return <LibrarySkeleton />

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
          <motion.div
            className="lib-nav-breadcrumb"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <span className="lib-breadcrumb-root" onClick={() => navigate('/')}>Folio</span>
            <span className="lib-breadcrumb-sep">›</span>
            <span className="lib-breadcrumb-current">Library</span>
          </motion.div>
        </div>

        <div className="lib-nav-actions">
          <button className="lib-upload-btn" onClick={openUpload} title="Upload PDF">
            <UploadIcon />
          </button>

          <div className="lib-user-menu" ref={menuRef}>
            <button
              className={`lib-user-avatar${showUserMenu ? ' lib-user-avatar--open' : ''}`}
              onClick={() => setShowUserMenu(v => !v)}
            >
              {initials}
            </button>
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  className="lib-user-dropdown"
                  initial={{ opacity: 0, scale: 0.94, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: -6 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="lib-dropdown-header">
                    <div className="lib-dropdown-avatar">{initials}</div>
                    <div className="lib-dropdown-info">
                      <div className="lib-dropdown-name">{user?.email?.split('@')[0]}</div>
                      <div className="lib-dropdown-email">{user?.email}</div>
                    </div>
                  </div>
                  <div className="lib-dropdown-divider" />
                  <button
                    className="lib-dropdown-theme-row"
                    onClick={toggleTheme}
                  >
                    <span className="lib-dropdown-theme-icon">
                      {theme === 'dark' ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="5"/>
                          <line x1="12" y1="1" x2="12" y2="3"/>
                          <line x1="12" y1="21" x2="12" y2="23"/>
                          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                          <line x1="1" y1="12" x2="3" y2="12"/>
                          <line x1="21" y1="12" x2="23" y2="12"/>
                          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                        </svg>
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                        </svg>
                      )}
                    </span>
                    <span className="lib-dropdown-theme-label">
                      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                    </span>
                    <span className={`theme-pill${theme === 'dark' ? ' theme-pill--on' : ''}`}>
                      <span className="theme-pill-thumb" />
                    </span>
                  </button>
                  <div className="lib-dropdown-divider" />
                  <button
                    className="lib-dropdown-signout"
                    onClick={() => { setShowUserMenu(false); signOut() }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
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
                onClick={() => selected && selected.status !== 'processing' && navigate(`/chat/${selected.book_id}`, { state: { book: selected } })}
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
                onRead={() => selected && selected.status !== 'processing' && navigate(`/chat/${selected.book_id}`, { state: { book: selected } })}
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
            </div>

            <div className="lib-collection-toolbar">
              <ExpandingSearchDock
                value={query}
                onChange={setQuery}
                placeholder="Search title or author..."
              />
            </div>

            {filteredBooks.length === 0 && query ? (
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
                      onClick={() => navigate(`/chat/${book.book_id}`, { state: { book } })}
                      onDelete={handleDelete}
                    />
                  </motion.div>
                ))}
                {/* Add book card */}
                <motion.div variants={cardVariants}>
                  <button className="lib-add-card" onClick={openUpload} title="Add a book">
                    <div className="lib-add-card-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </div>
                    <span className="lib-add-card-label">Add book</span>
                  </button>
                </motion.div>
              </motion.div>
            )}
          </section>
        </>
      )}

      <footer className="lib-footer">
        <span>{books.length} book{books.length !== 1 ? 's' : ''} in collection</span>
        <span className="lib-footer-legal">
          <span>Folio © 2026</span>
          <span className="lib-footer-sep">·</span>
          <button className="lib-footer-link" onClick={() => navigate('/privacy')}>Privacy</button>
          <span className="lib-footer-sep">·</span>
          <button className="lib-footer-link" onClick={() => navigate('/terms')}>Terms</button>
        </span>
      </footer>
    </div>
  )
}
