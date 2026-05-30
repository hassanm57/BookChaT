import { useRef, useState, useEffect, ReactNode } from 'react'

export default function HorizontalScroller({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(false)

  const checkScroll = () => {
    const el = ref.current
    if (!el) return
    setShowLeft(el.scrollLeft > 2)
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
  }

  useEffect(() => {
    const el = ref.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })
    const ro = new ResizeObserver(checkScroll)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', checkScroll); ro.disconnect() }
  }, [])

  const scroll = (dir: 'left' | 'right') => {
    ref.current?.scrollBy({ left: dir === 'right' ? 550 : -550, behavior: 'smooth' })
  }

  return (
    <div className="hscroll-wrap">
      <div className="hscroll-track" ref={ref}>
        {children}
      </div>
      <div className={`hscroll-fade hscroll-fade--left${showLeft ? ' active' : ''}`} />
      <div className={`hscroll-fade hscroll-fade--right${showRight ? ' active' : ''}`} />
      <button className={`hscroll-btn hscroll-btn--left${showLeft ? ' active' : ''}`} onClick={() => scroll('left')} aria-label="Scroll left">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path fillRule="evenodd" clipRule="evenodd" d="M10.5 14.0607L9.96966 13.5303L5.14644 8.7071C4.75592 8.31658 4.75592 7.68341 5.14644 7.29289L9.96966 2.46966L10.5 1.93933L11.5607 2.99999L11.0303 3.53032L6.56065 7.99999L11.0303 12.4697L11.5607 13L10.5 14.0607Z"/>
        </svg>
      </button>
      <button className={`hscroll-btn hscroll-btn--right${showRight ? ' active' : ''}`} onClick={() => scroll('right')} aria-label="Scroll right">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path fillRule="evenodd" clipRule="evenodd" d="M5.50001 1.93933L6.03034 2.46966L10.8536 7.29288C11.2441 7.68341 11.2441 8.31657 10.8536 8.7071L6.03034 13.5303L5.50001 14.0607L4.43935 13L4.96968 12.4697L9.43935 7.99999L4.96968 3.53032L4.43935 2.99999L5.50001 1.93933Z"/>
        </svg>
      </button>
    </div>
  )
}
