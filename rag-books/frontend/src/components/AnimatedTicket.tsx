import { useRef, useState, useEffect, useMemo } from 'react'
import { toPng } from 'html-to-image'

export interface TicketData {
  receiptId: string
  ticketId: string      // bank transaction reference
  name: string
  email: string
  amount: string        // formatted: "£7.89 GBP" or "$9.99 USD"
  country: string
  transferMethod: string
  date: Date
}

// ─── Barcode (deterministic from value string) ────────────────────────────────

function hashStr(s: string) {
  return s.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0)
}
function seededRand(n: number) {
  const x = Math.sin(n) * 10000
  return x - Math.floor(x)
}

function Barcode({ value }: { value: string }) {
  const bars = useMemo(() => {
    const seed = hashStr(value)
    return Array.from({ length: 62 }, (_, i) => ({
      width: seededRand(seed + i) > 0.68 ? 2.8 : 1.4,
      isGuard: i < 2 || i > 59,
    }))
  }, [value])

  const GAP = 1.4
  const svgW = 224
  const totalW = bars.reduce((a, b) => a + b.width + GAP, 0) - GAP
  let cx = (svgW - totalW) / 2

  return (
    <div className="atk-barcode">
      <svg xmlns="http://www.w3.org/2000/svg" width={svgW} height={54} viewBox={`0 0 ${svgW} 54`}>
        {bars.map((bar, i) => {
          const x = cx
          cx += bar.width + GAP
          return (
            <rect
              key={i}
              x={x}
              y={bar.isGuard ? 2 : 6}
              width={bar.width}
              height={bar.isGuard ? 46 : 38}
              fill="#1a1a1a"
            />
          )
        })}
      </svg>
      <p className="atk-barcode-label">{value}</p>
    </div>
  )
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#ef4444','#3b82f6','#22c55e','#eab308','#8b5cf6','#f97316','#ec4899']

function Confetti() {
  const pieces = useMemo(() =>
    Array.from({ length: 90 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${-22 + Math.random() * 12}%`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotate: Math.random() * 360,
      duration: 2.4 + Math.random() * 2.6,
      delay: Math.random() * 2.2,
      wide: Math.random() > 0.5,
    })),
  []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <style>{`
        @keyframes atk-fall {
          0%   { transform: translateY(-10vh) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(112vh) rotate(740deg); opacity: 0; }
        }
        @keyframes atk-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ position:'fixed', inset:0, zIndex:9999, pointerEvents:'none' }} aria-hidden>
        {pieces.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: p.left,
              top: p.top,
              width:  p.wide ? 10 : 5,
              height: p.wide ? 5  : 12,
              borderRadius: 2,
              backgroundColor: p.color,
              transform: `rotate(${p.rotate}deg)`,
              animation: `atk-fall ${p.duration}s ${p.delay}s linear forwards`,
            }}
          />
        ))}
      </div>
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AnimatedTicket({ data }: { data: TicketData }) {
  const [showConfetti, setShowConfetti] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const captureRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t1 = setTimeout(() => setShowConfetti(true), 120)
    const t2 = setTimeout(() => setShowConfetti(false), 7000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const formattedDate = useMemo(() =>
    new Intl.DateTimeFormat('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(data.date).replace(',', ' •'),
  [data.date])

  const initials = data.name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  const handleDownload = async () => {
    if (!captureRef.current || downloading) return
    setDownloading(true)
    try {
      const png = await toPng(captureRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2.5,
        style: { borderRadius: '20px' },
      })
      const a = document.createElement('a')
      a.download = `folio-receipt-${data.receiptId}.png`
      a.href = png
      a.click()
    } catch {
      // silent — user can screenshot
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="atk-wrapper">
      {showConfetti && <Confetti />}

      {/* Notch cutouts — purely decorative, not captured */}
      <div className="atk-notch atk-notch--l" aria-hidden />
      <div className="atk-notch atk-notch--r" aria-hidden />

      {/* Download button — positioned over top-right corner, not captured */}
      <button
        className={`atk-dl-btn${downloading ? ' atk-dl-btn--busy' : ''}`}
        onClick={handleDownload}
        disabled={downloading}
        title="Download receipt as image"
      >
        {downloading ? (
          <span className="atk-dl-spin" />
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Receipt
          </>
        )}
      </button>

      {/* ── Capturable ticket ── */}
      <div ref={captureRef} className="atk-ticket">

        {/* Header */}
        <div className="atk-header">
          <div className="atk-check-ring">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h2 className="atk-title">Payment received</h2>
          <p className="atk-subtitle">Your payment was successful</p>
        </div>

        <div className="atk-rule" />

        {/* Receipt ID + Amount */}
        <div className="atk-section">
          <div className="atk-grid-2">
            <div>
              <p className="atk-lbl">Receipt no.</p>
              <p className="atk-val atk-mono">{data.receiptId}</p>
            </div>
            <div className="atk-align-right">
              <p className="atk-lbl">Amount sent</p>
              <p className="atk-val atk-val--price">{data.amount}</p>
            </div>
          </div>

          {/* Transaction ref */}
          <div>
            <p className="atk-lbl">Bank ref / Transaction ID</p>
            <p className="atk-val atk-mono atk-val--sm">{data.ticketId}</p>
          </div>

          {/* Date */}
          <div>
            <p className="atk-lbl">Submitted</p>
            <p className="atk-val">{formattedDate}</p>
          </div>

          {/* Sender card */}
          <div className="atk-sender">
            <div className="atk-sender-avatar">{initials || '?'}</div>
            <div className="atk-sender-info">
              <p className="atk-sender-name">{data.name}</p>
              <p className="atk-sender-email">{data.email}</p>
              <p className="atk-sender-meta">{data.transferMethod} · {data.country}</p>
            </div>
          </div>
        </div>

        <div className="atk-rule" />

        {/* Barcode */}
        <Barcode value={data.ticketId || data.receiptId} />

        {/* Tagline */}
        <p className="atk-tagline">Pro access activated within 24 hours · Folio</p>
      </div>
    </div>
  )
}
