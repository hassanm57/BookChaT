import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle, memo } from 'react'
import { Document, Page } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

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

// Memoized page item — only re-renders when its index changes (never during scroll)
const PageItem = memo(function PageItem({
  index,
  refCallback,
}: {
  index: number
  refCallback: (el: HTMLDivElement | null) => void
}) {
  return (
    <div ref={refCallback} className="pdf-page-wrapper">
      <Page
        pageNumber={index + 1}
        width={520}
        renderTextLayer={true}
        renderAnnotationLayer={false}
        loading={<PageSkeleton />}
      />
    </div>
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
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])
  const observerRef = useRef<IntersectionObserver | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useImperativeHandle(ref, () => ({
    jumpToPage: (page: number) => {
      pageRefs.current[page - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
  }))

  // Stable ref callbacks — recreated only when numPages changes, not on every render
  const refCallbacks = useRef<((el: HTMLDivElement | null) => void)[]>([])
  useEffect(() => {
    refCallbacks.current = Array.from({ length: numPages }, (_, i) => (el: HTMLDivElement | null) => {
      pageRefs.current[i] = el
    })
  }, [numPages])

  const setupObserver = useCallback(() => {
    observerRef.current?.disconnect()
    if (!scrollRef.current || numPages === 0) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        let best: { ratio: number; idx: number } = { ratio: 0, idx: -1 }
        entries.forEach(entry => {
          const idx = pageRefs.current.indexOf(entry.target as HTMLDivElement)
          if (entry.isIntersecting && entry.intersectionRatio > best.ratio) {
            best = { ratio: entry.intersectionRatio, idx }
          }
        })
        if (best.idx === -1) return

        // Debounce: wait for scroll to settle before updating page indicator
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
          setCurrentPage(best.idx + 1)
        }, 80)
      },
      { root: scrollRef.current, threshold: [0.1, 0.3, 0.5, 0.75] },
    )
    pageRefs.current.forEach(ref => ref && observerRef.current!.observe(ref))
  }, [numPages])

  useEffect(() => {
    setupObserver()
    return () => {
      observerRef.current?.disconnect()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [setupObserver])

  const handleLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n)
    pageRefs.current = Array(n).fill(null)
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
              <PageItem
                key={i}
                index={i}
                refCallback={refCallbacks.current[i] ?? (() => {})}
              />
            ))}
          </Document>
        )}
      </div>
    </div>
  )
})

export default PdfViewer
