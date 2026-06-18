import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle, memo } from 'react'
import { Document, Page } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Pages within this many px of the viewport get rendered; others are placeholder divs.
// This prevents simultaneous canvas creation which exhausts browser GPU memory.
const PRERENDER_MARGIN = '500px'
const PRERENDER_NEIGHBORS = 2  // also render N pages above/below each visible one
const PLACEHOLDER_HEIGHT = 720  // px — A4 at 520px width; actual height stored after first render

const d = (ms: number): React.CSSProperties => ({ animationDelay: `${ms}ms` })

function PageSkeleton() {
  return (
    <div className="pdf-page-skeleton">
      <div className="skel-dark" style={{ width: '100%', height: 44, borderRadius: 4, ...d(0) }} />
      {[88, 93, 85, 90, 78, 92, 87, 91, 83, 89].map((w, i) => (
        <div key={i} className="skel-dark" style={{ width: `${w}%`, height: 11, borderRadius: 3, ...d(i * 35) }} />
      ))}
    </div>
  )
}

const PageItem = memo(function PageItem({
  index,
  onHeight,
}: {
  index: number
  onHeight: (idx: number, h: number) => void
}) {
  return (
    <Page
      pageNumber={index + 1}
      width={520}
      renderTextLayer={true}
      renderAnnotationLayer={false}
      loading={<PageSkeleton />}
      onRenderSuccess={(page) => {
        // Store actual rendered height so placeholder matches when page is offscreen
        if (page && 'height' in page) onHeight(index, (page as { height: number }).height)
      }}
    />
  )
})

export interface PdfViewerHandle {
  jumpToPage: (page: number) => void
}

interface Props {
  pdfUrl: string
}

const PdfViewer = forwardRef<PdfViewerHandle, Props>(function PdfViewer({ pdfUrl }, ref) {
  const [numPages, setNumPages] = useState(0)
  const [error, setError] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  // Set of page indices that have a <Page> canvas mounted
  const [renderedSet, setRenderedSet] = useState<Set<number>>(new Set())
  // Actual rendered heights — used for placeholder divs so scroll position is stable
  const [pageHeights, setPageHeights] = useState<Record<number, number>>({})

  const scrollRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])
  const observerRef = useRef<IntersectionObserver | null>(null)
  const pendingJumpRef = useRef<number | null>(null)

  const addToRendered = useCallback((indices: number[]) => {
    setRenderedSet(prev => {
      const next = new Set(prev)
      indices.forEach(i => next.add(i))
      return next
    })
  }, [])

  const handleHeight = useCallback((idx: number, h: number) => {
    setPageHeights(prev => prev[idx] === h ? prev : { ...prev, [idx]: h })
  }, [])

  useImperativeHandle(ref, () => ({
    jumpToPage: (page: number) => {
      const idx = page - 1
      if (renderedSet.has(idx)) {
        pageRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        // Render target + neighbors, then scroll once mounted
        pendingJumpRef.current = idx
        const neighbors = Array.from(
          { length: PRERENDER_NEIGHBORS * 2 + 1 },
          (_, k) => idx - PRERENDER_NEIGHBORS + k
        ).filter(i => i >= 0 && i < numPages)
        addToRendered([idx, ...neighbors])
      }
    },
  }))

  // Execute a pending jump after renderedSet update causes the target to mount
  useEffect(() => {
    if (pendingJumpRef.current === null) return
    const idx = pendingJumpRef.current
    if (!renderedSet.has(idx)) return
    pendingJumpRef.current = null
    setTimeout(() => {
      pageRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }, [renderedSet])

  const setupObserver = useCallback(() => {
    observerRef.current?.disconnect()
    if (!scrollRef.current || numPages === 0) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const toAdd: number[] = []
        let bestRatio = 0
        let bestIdx = -1

        entries.forEach(entry => {
          const idx = pageRefs.current.indexOf(entry.target as HTMLDivElement)
          if (idx === -1) return
          if (entry.isIntersecting) {
            // Render this page and its neighbors
            for (let i = Math.max(0, idx - PRERENDER_NEIGHBORS); i <= Math.min(numPages - 1, idx + PRERENDER_NEIGHBORS); i++) {
              toAdd.push(i)
            }
            if (entry.intersectionRatio > bestRatio) {
              bestRatio = entry.intersectionRatio
              bestIdx = idx
            }
          }
        })

        if (toAdd.length > 0) addToRendered(toAdd)
        if (bestIdx >= 0) setCurrentPage(bestIdx + 1)
      },
      {
        root: scrollRef.current,
        rootMargin: PRERENDER_MARGIN,
        threshold: [0, 0.25, 0.5],
      },
    )
    pageRefs.current.forEach(r => r && observerRef.current!.observe(r))
  }, [numPages, addToRendered])

  useEffect(() => {
    setupObserver()
    return () => observerRef.current?.disconnect()
  }, [setupObserver])

  const handleLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n)
    pageRefs.current = Array(n).fill(null)
    // Pre-render the first handful immediately
    setRenderedSet(new Set(Array.from({ length: Math.min(5, n) }, (_, i) => i)))
  }, [])

  return (
    <div className="pdf-pane">
      <div className="pdf-controls">
        <span className="pdf-page-info">
          {numPages > 0 ? `${currentPage} / ${numPages}` : '…'}
        </span>
      </div>

      <div className="pdf-scroll" ref={scrollRef}>
        {error ? (
          <div className="pdf-error">Could not load PDF</div>
        ) : (
          <Document
            file={pdfUrl}
            onLoadSuccess={handleLoadSuccess}
            onLoadError={() => setError(true)}
            loading={<PageSkeleton />}
          >
            {numPages > 0 && Array.from({ length: numPages }, (_, i) => (
              <div
                key={i}
                ref={el => { pageRefs.current[i] = el }}
                className="pdf-page-wrapper"
              >
                {renderedSet.has(i) ? (
                  <PageItem index={i} onHeight={handleHeight} />
                ) : (
                  <div
                    className="pdf-page-placeholder"
                    style={{ height: pageHeights[i] ?? PLACEHOLDER_HEIGHT }}
                  />
                )}
              </div>
            ))}
          </Document>
        )}
      </div>
    </div>
  )
})

export default PdfViewer
