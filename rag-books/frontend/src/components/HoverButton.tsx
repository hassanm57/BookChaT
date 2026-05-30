import * as React from 'react'

interface HoverButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const HoverButton = React.forwardRef<HTMLButtonElement, HoverButtonProps>(
  ({ className = '', children, ...props }, ref) => {
    const innerRef = React.useRef<HTMLButtonElement>(null)
    const [listening, setListening] = React.useState(false)
    const [circles, setCircles] = React.useState<
      { id: number; x: number; y: number; fade: 'in' | 'out' | null }[]
    >([])
    const lastTs = React.useRef(0)

    const addCircle = React.useCallback((x: number, y: number) => {
      setCircles(prev => [...prev, { id: Date.now(), x, y, fade: null }])
    }, [])

    const onPointerMove = React.useCallback(
      (e: React.PointerEvent<HTMLButtonElement>) => {
        if (!listening) return
        const now = Date.now()
        if (now - lastTs.current < 100) return
        lastTs.current = now
        const rect = e.currentTarget.getBoundingClientRect()
        addCircle(e.clientX - rect.left, e.clientY - rect.top)
      },
      [listening, addCircle]
    )

    React.useEffect(() => {
      circles.forEach(c => {
        if (c.fade !== null) return
        setTimeout(() =>
          setCircles(p => p.map(x => x.id === c.id ? { ...x, fade: 'in' } : x)), 0)
        setTimeout(() =>
          setCircles(p => p.map(x => x.id === c.id ? { ...x, fade: 'out' } : x)), 900)
        setTimeout(() =>
          setCircles(p => p.filter(x => x.id !== c.id)), 2100)
      })
    }, [circles])

    return (
      <button
        ref={ref ?? innerRef}
        className={`hover-btn ${className}`}
        onPointerMove={onPointerMove}
        onPointerEnter={() => setListening(true)}
        onPointerLeave={() => setListening(false)}
        {...props}
      >
        {circles.map(({ id, x, y, fade }) => (
          <span
            key={id}
            className="hover-btn-glow"
            style={{
              left: x,
              top: y,
              opacity: fade === 'in' ? 0.75 : 0,
              transition: fade === 'out'
                ? 'opacity 1.2s ease'
                : fade === 'in'
                ? 'opacity 0.25s ease'
                : 'none',
            }}
          />
        ))}
        <span className="hover-btn-text">{children}</span>
      </button>
    )
  }
)

HoverButton.displayName = 'HoverButton'
export { HoverButton }
