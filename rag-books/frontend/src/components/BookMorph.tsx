import { useState, useEffect, useRef } from 'react'
import { motion, useTransform, useSpring, useMotionValue, useInView } from 'framer-motion'
import { useLenis } from 'lenis/react'
import BookShelf from './BookShelf'

const IMG_W = 70
const IMG_H = 95
const N = 20
const V_MAX = 3200

const COVERS = [
  'https://covers.openlibrary.org/b/isbn/9780743273565-M.jpg',
  'https://covers.openlibrary.org/b/isbn/9780451524935-M.jpg',
  'https://covers.openlibrary.org/b/isbn/9780061743528-M.jpg',
  'https://covers.openlibrary.org/b/isbn/9780316769174-M.jpg',
  'https://covers.openlibrary.org/b/isbn/9780060850524-M.jpg',
  'https://covers.openlibrary.org/b/isbn/9780399501487-M.jpg',
  'https://covers.openlibrary.org/b/isbn/9780679734505-M.jpg',
  'https://covers.openlibrary.org/b/isbn/9780062315007-M.jpg',
  'https://covers.openlibrary.org/b/isbn/9780439708180-M.jpg',
  'https://covers.openlibrary.org/b/isbn/9780547928227-M.jpg',
  'https://covers.openlibrary.org/b/isbn/9781451673319-M.jpg',
  'https://covers.openlibrary.org/b/isbn/9780451526342-M.jpg',
  'https://covers.openlibrary.org/b/isbn/9780679720201-M.jpg',
  'https://covers.openlibrary.org/b/isbn/9780140177398-M.jpg',
  'https://covers.openlibrary.org/b/isbn/9780684801223-M.jpg',
  'https://covers.openlibrary.org/b/isbn/9780743477123-M.jpg',
  'https://covers.openlibrary.org/b/isbn/9780142437247-M.jpg',
  'https://covers.openlibrary.org/b/isbn/9780141439518-M.jpg',
  'https://covers.openlibrary.org/b/isbn/9780142437230-M.jpg',
  'https://covers.openlibrary.org/b/isbn/9780743477116-M.jpg',
]

const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t

interface Pos { x: number; y: number; rotation: number; scale: number; opacity: number }

function Card({ src, index, pos }: { src: string; index: number; pos: Pos }) {
  const [err, setErr] = useState(false)
  return (
    <motion.div
      animate={{ x: pos.x, y: pos.y, rotate: pos.rotation, scale: pos.scale, opacity: pos.opacity }}
      transition={{ type: 'spring', stiffness: 40, damping: 15 }}
      style={{ position: 'absolute', width: IMG_W, height: IMG_H, transformStyle: 'preserve-3d', perspective: 1000, cursor: 'pointer' }}
    >
      <motion.div
        style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
        whileHover={{ rotateY: 180 }}
      >
        <div className="bm-face bm-front">
          {err
            ? <div className="bm-fallback" style={{ background: `hsl(${(index * 43 + 11) % 360},38%,57%)` }} />
            : <img src={src} alt="" onError={() => setErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          }
        </div>
        <div className="bm-face bm-back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D94F3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
          <span className="bm-back-label">Read</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function BookMorph() {
  const sectionRef  = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 1200, h: 700 })
  const [morphReady, setMorphReady] = useState(false)
  const [visible, setVisible] = useState(false)
  const lenis = useLenis()

  // ── Virtual scroll (mirrors original component's approach) ───────────────
  const virtualScroll = useMotionValue(0)
  const vRef          = useRef(0)
  const lockedRef     = useRef(false)
  const doneRef       = useRef(false)

  // Morph: 0→600 maps circle→arc
  const morphProgress    = useTransform(virtualScroll, [0, 600], [0, 1])
  const smoothMorph      = useSpring(morphProgress,    { stiffness: 40, damping: 20 })
  // Rotate: 600→3000 scrolls the arc right→left
  const scrollRotate     = useTransform(virtualScroll, [600, 3000], [0, 360])
  const smoothRotate     = useSpring(scrollRotate,     { stiffness: 40, damping: 20 })

  const [morphValue,  setMorphValue]  = useState(0)
  const [rotateValue, setRotateValue] = useState(0)

  useEffect(() => {
    const u1 = smoothMorph.on('change',  setMorphValue)
    const u2 = smoothRotate.on('change', setRotateValue)
    return () => { u1(); u2() }
  }, [smoothMorph, smoothRotate])

  // ── Mouse parallax ───────────────────────────────────────────────────────
  const mouseX       = useMotionValue(0)
  const smoothMouseX = useSpring(mouseX, { stiffness: 30, damping: 20 })
  const [parallax, setParallax] = useState(0)

  useEffect(() => smoothMouseX.on('change', setParallax), [smoothMouseX])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const nx = (e.clientX - rect.left) / rect.width * 2 - 1
      mouseX.set(nx * 80)
    }
    el.addEventListener('mousemove', onMove)
    return () => el.removeEventListener('mousemove', onMove)
  }, [mouseX])

  // ── Container size ───────────────────────────────────────────────────────
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    setSize({ w: el.offsetWidth, h: el.offsetHeight })
    return () => ro.disconnect()
  }, [])

  // ── Intro sequence ───────────────────────────────────────────────────────
  const inView = useInView(sectionRef, { once: true, margin: '0px' })

  useEffect(() => {
    if (!inView) return
    const c = setTimeout(() => setMorphReady(true), 800)
    return () => clearTimeout(c)
  }, [inView])

  // ── Scroll lock ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!morphReady) return

    const unlock = () => {
      if (!lockedRef.current) return
      lockedRef.current = false
      if (lenis) lenis.start()
    }
    const lock = () => {
      if (lockedRef.current) return
      lockedRef.current = true
      if (lenis) lenis.stop()
    }

    // Lock when section top reaches viewport top — exact and consistent
    const checkLock = () => {
      const el = sectionRef.current
      if (!el) return
      const top = el.getBoundingClientRect().top
      if (top <= -80 && vRef.current < V_MAX - 10) lock()
    }
    window.addEventListener('scroll', checkLock, { passive: true })

    const io = new IntersectionObserver(entries => {
      const ratio = entries[0].intersectionRatio
      setVisible(ratio > 0 && !doneRef.current)
      if (ratio < 0.1) unlock()
    }, { threshold: [0, 0.1] })

    if (sectionRef.current) io.observe(sectionRef.current)

    const onWheel = (e: WheelEvent) => {
      if (!lockedRef.current) return
      e.preventDefault()
      const next = vRef.current + e.deltaY
      if (next < -60) { unlock(); return }
      vRef.current = Math.max(0, Math.min(V_MAX, next))
      virtualScroll.set(vRef.current)
      if (vRef.current >= V_MAX) { doneRef.current = true; unlock() }
    }

    let lastTY = 0
    const onTouchStart = (e: TouchEvent) => { lastTY = e.touches[0].clientY }
    const onTouchMove  = (e: TouchEvent) => {
      if (!lockedRef.current) return
      e.preventDefault()
      const delta = lastTY - e.touches[0].clientY
      lastTY = e.touches[0].clientY
      vRef.current = Math.max(0, Math.min(V_MAX, vRef.current + delta * 1.4))
      virtualScroll.set(vRef.current)
      if (vRef.current >= V_MAX) unlock()
    }

    window.addEventListener('wheel',      onWheel,      { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true  })
    window.addEventListener('touchmove',  onTouchMove,  { passive: false })

    return () => {
      io.disconnect()
      window.removeEventListener('scroll',     checkLock)
      window.removeEventListener('wheel',      onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove',  onTouchMove)
      unlock()
    }
  }, [morphReady, lenis, virtualScroll])


  return (
    <div ref={sectionRef} className="bm-section">
      <div className="bm-stage">

        {/* Heading — visible during circle, fades as arc forms */}
        <div className="bm-text-block">
          <motion.p
            className="bm-text-eyebrow"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            Your Library
          </motion.p>
          <motion.h2
            className="bm-text-heading"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.08 }}
          >
            Every book you love,
            <span className="bm-text-italic"> at your fingertips.</span>
          </motion.h2>
          <motion.p
            className="bm-text-sub"
            animate={{ opacity: morphValue < 0.3 ? 1 : 0 }}
            transition={{ duration: 0.7, delay: 0.18 }}
          >
            Upload any PDF — novels, textbooks, research papers — and start chatting instantly.
          </motion.p>
        </div>

        {/* Cards — unmounted when section is off screen to avoid paint overhead */}
        {visible && COVERS.slice(0, N).map((src, i) => {
          let pos: Pos = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 }

          {
            // ── Circle ──────────────────────────────────────────────────
            const isMobile   = size.w < 768
            const minDim     = Math.min(size.w, size.h)
            // Radius capped so the full circle fits within the section height
            const circleR    = Math.min(minDim * 0.28, 230)
            const circleOffsetY = isMobile ? 80 : 100
            const cAngle     = (i / N) * 360
            const cRad       = cAngle * Math.PI / 180
            const circlePos  = {
              x:        Math.cos(cRad) * circleR,
              y:        Math.sin(cRad) * circleR + circleOffsetY,
              rotation: cAngle + 90,
            }

            // ── Arc (exact original formula) ─────────────────────────────
            const baseRadius = Math.min(size.w, size.h * 1.5)
            const arcRadius  = baseRadius * (isMobile ? 1.4 : 1.1)
            const arcApexY   = size.h * (isMobile ? 0.35 : 0.25)
            const arcCenterY = arcApexY + arcRadius

            const spreadAngle = isMobile ? 100 : 130
            const startAngle  = -90 - spreadAngle / 2
            const step        = spreadAngle / (N - 1)

            const scrollProg     = Math.min(Math.max(rotateValue / 360, 0), 1)
            const boundedRot     = -scrollProg * spreadAngle * 0.8
            const currentAngle   = startAngle + i * step + boundedRot
            const arcRad         = currentAngle * Math.PI / 180

            const arcPos = {
              x:        Math.cos(arcRad) * arcRadius + parallax,
              y:        Math.sin(arcRad) * arcRadius + arcCenterY,
              rotation: currentAngle + 90,
              scale:    isMobile ? 1.4 : 1.8,
            }

            pos = {
              x:        lerp(circlePos.x,        arcPos.x,        morphValue),
              y:        lerp(circlePos.y,        arcPos.y,        morphValue),
              rotation: lerp(circlePos.rotation, arcPos.rotation, morphValue),
              scale:    lerp(1,                  arcPos.scale,    morphValue),
              opacity:  1,
            }
          }

          return <Card key={i} src={src} index={i} pos={pos} />
        })}

        <motion.p
          className="bm-hint"
          animate={{ opacity: morphValue < 0.05 ? 1 : 0 }}
          transition={{ duration: 0.6 }}
        >
          scroll to explore
        </motion.p>

        {/* Text — top of end-state */}
        <motion.p
          className="bm-end-text"
          animate={{ opacity: rotateValue > 300 ? 1 : 0, y: rotateValue > 300 ? 0 : 20 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        >
          Upload any book: novels, textbooks, academic papers, research.<br />
          <span className="bm-end-text-em">Your entire library, all in one place.</span>
        </motion.p>

        {/* Bookshelf — anchored to bottom of section */}
        <motion.div
          className="bm-shelf-anchor"
          animate={{ opacity: rotateValue > 300 ? 1 : 0, y: rotateValue > 300 ? 0 : 30 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          <BookShelf />
        </motion.div>
      </div>
    </div>
  )
}
