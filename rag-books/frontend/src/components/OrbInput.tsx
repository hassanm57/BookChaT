import { useEffect, useMemo, useRef, useState } from 'react'

const PLACEHOLDERS = [
  'Can you summarize Chapter 4 of Sapiens?',
  'What does the green light symbolize in Gatsby?',
  'Which chapter introduces the concept of doublethink?',
  'What drives Ahab\'s obsession with the whale?',
  'Give me a quote about ambition from Macbeth.',
  'How does Orwell foreshadow the ending in the first chapter?',
  'What does the conch represent when it shatters?',
  'Summarise the relationship between Lennie and George...',
  'Who are the three witches and what do they represent?',
  'Find the passage where Daisy cries over Gatsby\'s shirts.',
  'What does Meursault feel at his mother\'s funeral?',
  'Explain the allegory in Animal Farm in one paragraph.',
  'Which page does Holden first mention the red hunting hat?',
  'Find every time Raskolnikov justifies the murder...',
  'What is the significance of the conch shell?',
  'Explain the ending of The Trial — did Josef K. deserve it?',
  'How does Fitzgerald use colour to signal wealth?',
  'What were Atticus Finch\'s closing arguments?',
  'Compare how loneliness is portrayed in Of Mice and Men...',
]

const CHAR_DELAY = 55   // ms per character typed
const ERASE_DELAY = 28  // ms per character erased (faster = more natural)
const IDLE_DELAY = 1800 // ms to hold after typing completes

type Phase = 'typing' | 'idle' | 'erasing'

export default function OrbInput() {
  const [focused] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [phase, setPhase] = useState<Phase>('typing')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const placeholders = useMemo(() => PLACEHOLDERS, [])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    const current = placeholders[placeholderIndex]
    const chars = Array.from(current)
    setDisplayed('')
    setPhase('typing')
    let i = 0

    // Phase 1: type character by character
    intervalRef.current = setInterval(() => {
      if (i < chars.length) {
        setDisplayed(chars.slice(0, i + 1).join(''))
        i++
      } else {
        clearInterval(intervalRef.current!)
        intervalRef.current = null
        setPhase('idle')

        // Phase 2: hold, then start erasing
        timeoutRef.current = setTimeout(() => {
          setPhase('erasing')
          let len = chars.length

          // Phase 3: erase character by character
          intervalRef.current = setInterval(() => {
            if (len > 0) {
              len--
              setDisplayed(chars.slice(0, len).join(''))
            } else {
              clearInterval(intervalRef.current!)
              intervalRef.current = null
              setPlaceholderIndex(p => (p + 1) % placeholders.length)
            }
          }, ERASE_DELAY)
        }, IDLE_DELAY)
      }
    }, CHAR_DELAY)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [placeholderIndex, placeholders])

  // Show cursor while actively typing or erasing; hide during idle pause
  const showCursor = phase === 'typing' || phase === 'erasing'

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
        placeholder={`${displayed}${showCursor ? '|' : ''}`}
        aria-hidden="true"
        className="orb-input"
      />
    </div>
  )
}
