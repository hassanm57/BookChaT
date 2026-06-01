import { useState, useEffect, useRef } from 'react'

interface FeatureNode {
  id: number
  icon: string
  title: string
  short: string
  detail: string
}

const NODES: FeatureNode[] = [
  {
    id: 1,
    icon: '⟐',
    title: 'Ask anything',
    short: 'Any question, instant answer',
    detail: 'Ask about a character, a theme, an event, or even something you half-remember from two chapters ago. Folio has read every page and finds the answer in seconds.',
  },
  {
    id: 2,
    icon: '⌖',
    title: 'See the source',
    short: 'Jump to the exact page',
    detail: 'Every answer comes with the page numbers it drew from. Click one and the book opens right there. No more flipping through chapters hunting for a passage you know exists somewhere.',
  },
  {
    id: 3,
    icon: '⊞',
    title: 'Read side by side',
    short: 'Book and chat, together',
    detail: 'The book and the conversation sit next to each other on screen. Ask a question, click a citation, and the exact page appears right beside your answer. No switching tabs, no losing your place.',
  },
  {
    id: 4,
    icon: '↻',
    title: 'Keep exploring',
    short: 'The conversation keeps going',
    detail: 'After every answer, three questions appear that you might want to ask next, tailored to exactly what you just found. It is like having a reading partner who always knows what to explore next.',
  },
  {
    id: 5,
    icon: '◎',
    title: 'Reads everything',
    short: 'Nothing is ever missed',
    detail: 'Before you ask your first question, Folio quietly reads and remembers every single page. It does not skip. It does not skim. Even a 1,000-page textbook becomes fully searchable the moment you upload it.',
  },
  {
    id: 6,
    icon: '⇌',
    title: 'Answers appear live',
    short: 'Watch it think in real time',
    detail: 'Words arrive on screen the moment they are ready, one by one, as the answer forms. You start reading before it has finished writing. No loading bar, no waiting for the full response to land.',
  },
]

export default function FeatureOrbit() {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [rotation, setRotation] = useState(0)
  const [autoRotate, setAutoRotate] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const lastRef = useRef<number>(0)

  useEffect(() => {
    if (!autoRotate) return
    const tick = (now: number) => {
      if (lastRef.current) {
        const delta = now - lastRef.current
        setRotation(prev => (prev + delta * 0.008) % 360)
      }
      lastRef.current = now
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafRef.current)
      lastRef.current = 0
    }
  }, [autoRotate])

  const openNode = (idx: number) => {
    setSelectedIdx(idx)
    setAutoRotate(false)
  }

  const closeNode = () => {
    setSelectedIdx(null)
    setAutoRotate(true)
  }

  const handleBgClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current) closeNode()
  }

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIdx(prev => prev === null ? 0 : (prev + 1) % NODES.length)
  }

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIdx(prev => prev === null ? NODES.length - 1 : (prev - 1 + NODES.length) % NODES.length)
  }

  const getPos = (index: number) => {
    const angle = ((index / NODES.length) * 360 + rotation) % 360
    const rad = (angle * Math.PI) / 180
    const R = 260
    return {
      x: R * Math.cos(rad),
      y: R * Math.sin(rad),
      opacity: Math.max(0.35, 0.35 + 0.65 * ((1 + Math.sin(rad)) / 2)),
      z: Math.round(100 + 50 * Math.cos(rad)),
    }
  }

  const selectedNode = selectedIdx !== null ? NODES[selectedIdx] : null

  return (
    <div className="fo-wrap" ref={containerRef} onClick={handleBgClick}>
      <div className="fo-ring" />

      {/* Center */}
      <div className="fo-center">
        {selectedNode ? (
          <div className="fo-detail" key={selectedNode.id}>
            <div className="fo-detail-icon">{selectedNode.icon}</div>
            <h3 className="fo-detail-title">{selectedNode.title}</h3>
            <p className="fo-detail-short">{selectedNode.short}</p>
            <p className="fo-detail-body">{selectedNode.detail}</p>
            <div className="fo-nav-arrows">
              <button className="fo-arrow" onClick={goPrev} aria-label="Previous feature">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
              </button>
              <span className="fo-nav-dots">
                {NODES.map((_, i) => (
                  <span key={i} className={`fo-dot ${i === selectedIdx ? 'fo-dot--active' : ''}`} />
                ))}
              </span>
              <button className="fo-arrow" onClick={goNext} aria-label="Next feature">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="fo-orb">
            <div className="fo-orb-ring fo-orb-ring-1" />
            <div className="fo-orb-ring fo-orb-ring-2" />
            <div className="fo-orb-core" />
            <p className="fo-orb-hint">click a feature</p>
          </div>
        )}
      </div>

      {/* Nodes */}
      {NODES.map((node, i) => {
        const pos = getPos(i)
        const isActive = selectedIdx === i

        return (
          <button
            key={node.id}
            className={`fo-node ${isActive ? 'fo-node--active' : ''}`}
            style={{
              transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
              opacity: isActive ? 1 : pos.opacity,
              zIndex: isActive ? 200 : pos.z,
            }}
            onClick={e => { e.stopPropagation(); isActive ? closeNode() : openNode(i) }}
          >
            <span className="fo-node-icon">{node.icon}</span>
            <span className="fo-node-label">{node.title}</span>
          </button>
        )
      })}
    </div>
  )
}
