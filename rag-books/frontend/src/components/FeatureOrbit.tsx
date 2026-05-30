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
    short: 'Natural language Q&A',
    detail: 'Type any question in plain English — about characters, themes, plot events, or specific scenes. The AI searches across every embedded passage and returns a precise, grounded answer drawn exclusively from your book.',
  },
  {
    id: 2,
    icon: '⌖',
    title: 'Clickable citations',
    short: 'Jump to the exact page',
    detail: 'Every answer surfaces the passages it used as source chips showing page numbers. Click any chip and the PDF viewer jumps directly to that page — no manual searching, no guessing.',
  },
  {
    id: 3,
    icon: '⊞',
    title: 'Side-by-side reading',
    short: 'PDF + chat simultaneously',
    detail: 'The PDF viewer and chat panel live side by side in a single view. Read and interrogate the text at the same time — citation clicks scroll the viewer while you stay in the conversation.',
  },
  {
    id: 4,
    icon: '↻',
    title: 'Follow-up questions',
    short: 'Keep the exploration going',
    detail: 'After each answer, three contextual follow-up questions appear automatically — each one tailored to the passage retrieved and your original query, so the thread of inquiry never goes cold.',
  },
  {
    id: 5,
    icon: '◈',
    title: 'Hybrid retrieval',
    short: 'Dense + BM25 re-ranking',
    detail: 'Every query runs a dense vector search over 19,000+ embedded chunks, then re-ranks results with BM25 for keyword precision. The top passages are the most semantically and lexically relevant text in the book.',
  },
  {
    id: 6,
    icon: '⇌',
    title: 'Streaming answers',
    short: 'Tokens appear in real time',
    detail: 'Responses stream token by token over a server-sent events connection so you start reading the answer as it forms — no spinner, no waiting for the full response to arrive before content appears.',
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
