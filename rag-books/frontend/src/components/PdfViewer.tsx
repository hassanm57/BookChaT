import { useState, useCallback } from 'react'
import { Document, Page } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

interface Props {
  pdfUrl: string
  page: number
  onPageChange: (page: number) => void
}

export default function PdfViewer({ pdfUrl, page, onPageChange }: Props) {
  const [numPages, setNumPages] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const onLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
  }, [])

  const onLoadError = useCallback(() => {
    setLoading(false)
    setError(true)
  }, [])

  const safePage = Math.min(Math.max(1, page), numPages || 1)

  return (
    <div className="pdf-pane">
      <div className="pdf-controls">
        <button
          className="pdf-nav-btn"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
        >←</button>
        <span className="pdf-page-info">
          {loading ? '...' : `${safePage} / ${numPages}`}
        </span>
        <button
          className="pdf-nav-btn"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= numPages}
        >→</button>
      </div>

      <div className="pdf-scroll">
        {error ? (
          <div className="pdf-error">Could not load PDF</div>
        ) : (
          <Document
            file={pdfUrl}
            onLoadSuccess={onLoadSuccess}
            onLoadError={onLoadError}
            loading={<div className="pdf-loading"><div className="spinner" /></div>}
          >
            <Page
              pageNumber={safePage}
              width={520}
              renderTextLayer={true}
              renderAnnotationLayer={false}
            />
          </Document>
        )}
      </div>
    </div>
  )
}
