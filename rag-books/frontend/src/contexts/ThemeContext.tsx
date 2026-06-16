import { createContext, useContext, useEffect, useRef, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeCtx {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeCtx>({ theme: 'light', toggleTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem('folio_theme') as Theme) ?? 'light'
  )
  const isFirst = useRef(true)

  useEffect(() => {
    const root = document.documentElement
    if (isFirst.current) {
      // Apply immediately on first mount with no transition
      isFirst.current = false
      root.setAttribute('data-theme', theme)
      return
    }
    root.classList.add('theme-transition')
    root.setAttribute('data-theme', theme)
    localStorage.setItem('folio_theme', theme)
    const t = setTimeout(() => root.classList.remove('theme-transition'), 500)
    return () => clearTimeout(t)
  }, [theme])

  const toggleTheme = () => {
    setTheme(t => {
      const next = t === 'light' ? 'dark' : 'light'
      localStorage.setItem('folio_theme', next)
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
