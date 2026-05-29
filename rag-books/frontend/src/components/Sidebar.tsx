import { useLocation, useNavigate } from 'react-router-dom'

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
)

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7"/>
    <path d="M21 21l-4.35-4.35"/>
  </svg>
)

const CollectionsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
  </svg>
)

const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M4 6h16M4 12h10M4 18h16"/>
  </svg>
)

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  const nav = [
    { icon: <HomeIcon />, path: '/', label: 'Library' },
    { icon: <SearchIcon />, path: '/search', label: 'Search' },
    { icon: <CollectionsIcon />, path: '/collections', label: 'Collections' },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#1C1C1C"/>
          <text x="7" y="22" fontSize="16" fill="white" fontFamily="serif">B</text>
        </svg>
      </div>

      <nav className="sidebar-nav">
        {nav.map(({ icon, path, label }) => (
          <button
            key={path}
            className={`sidebar-btn ${location.pathname === path ? 'active' : ''}`}
            title={label}
            onClick={() => navigate(path)}
          >
            {icon}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button className="sidebar-btn" title="Menu">
          <MenuIcon />
        </button>
      </div>
    </aside>
  )
}
