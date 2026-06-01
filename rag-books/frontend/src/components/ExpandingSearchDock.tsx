import { AnimatePresence, motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export function ExpandingSearchDock({ value, onChange, placeholder = 'Search title or author...' }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const expand = () => setIsExpanded(true)
  const collapse = () => { setIsExpanded(false); onChange('') }

  useEffect(() => {
    if (isExpanded) inputRef.current?.focus()
  }, [isExpanded])

  // Keep expanded if there's a query
  const handleCollapse = () => {
    if (!value) collapse()
  }

  return (
    <div className="esd-wrap">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.button
            key="icon"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="esd-trigger"
            onClick={expand}
            title="Search"
          >
            <Search size={16} />
          </motion.button>
        ) : (
          <motion.div
            key="input"
            initial={{ width: 40, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="esd-input-wrap"
          >
            <Search size={14} className="esd-search-icon" />
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={e => onChange(e.target.value)}
              onBlur={handleCollapse}
              placeholder={placeholder}
              className="esd-input"
            />
            <motion.button
              type="button"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              className="esd-clear"
              onClick={collapse}
            >
              <X size={13} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
