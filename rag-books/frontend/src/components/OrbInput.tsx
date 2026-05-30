import { useEffect, useMemo, useRef, useState } from 'react'

const PLACEHOLDERS = [
  'Can you summarize Chapter 4 of Sapiens?',
  'What does the green light symbolize in Gatsby?',
  'Why did Winston betray Julia in 1984?',
  'Find every time Raskolnikov justifies the murder...',
  'What is the significance of the conch shell?',
  'Explain the ending of The Trial — did Josef K. deserve it?',
  'How does Fitzgerald use colour to signal wealth?',
  'What were Atticus Finch\'s closing arguments?',
  'Compare how loneliness is portrayed in Of Mice and Men...',
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
