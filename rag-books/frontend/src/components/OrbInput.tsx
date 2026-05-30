import { useEffect, useMemo, useRef, useState } from 'react'

const PLACEHOLDERS = [
  'What does the green light symbolize?',
  'Summarize the ending of 1984...',
  'Who is the narrator in Gatsby?',
  'Find every mention of Daisy Buchanan...',
  'What themes run through Crime and Punishment?',
  'Explain the significance of the conch shell...',
]

const CHAR_DELAY = 55
const IDLE_DELAY = 2000

export default function OrbInput() {
  const [focused] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [typing, setTyping] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const placeholders = useMemo(() => PLACEHOLDERS, [])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    const current = placeholders[placeholderIndex]
    const chars = Array.from(current)
    setDisplayed('')
    setTyping(true)
    let i = 0

    intervalRef.current = setInterval(() => {
      if (i < chars.length) {
        setDisplayed(chars.slice(0, i + 1).join(''))
        i++
      } else {
        clearInterval(intervalRef.current!)
        intervalRef.current = null
        setTyping(false)
        timeoutRef.current = setTimeout(() => {
          setPlaceholderIndex(p => (p + 1) % placeholders.length)
        }, IDLE_DELAY)
      }
    }, CHAR_DELAY)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [placeholderIndex, placeholders])

  return (
    <div className={`orb-input-wrap ${focused ? 'orb-input-wrap--focused' : ''}`}>
      {/* Orb */}
      <div className="orb-img-wrap">
        <img src="/logo.png" alt="Folio" className="orb-img" />
      </div>

      {/* Divider */}
      <div className="orb-divider" />

      {/* Input */}
      <input
        type="text"
        readOnly
        tabIndex={-1}
        placeholder={`${displayed}${typing ? '|' : ''}`}
        aria-hidden="true"
        className="orb-input"
      />
    </div>
  )
}
