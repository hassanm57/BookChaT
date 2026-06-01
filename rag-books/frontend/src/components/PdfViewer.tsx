import { useEffect, useRef, useMemo } from 'react'
import { Worker, Viewer } from '@react-pdf-viewer/core'
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout'
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation'
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/default-layout/lib/styles/index.css'
import type { PageChangeEvent } from '@react-pdf-viewer/core'

const WORKER_URL = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString()

interface Props {
  pdfUrl: string
  page: number
  onPageChange: (page: number) => void
}

export default function PdfViewer({ pdfUrl, page, onPageChange }: Props) {
  const pageNavPlugin = useMemo(() => pageNavigationPlugin(), [])
  const defaultLayout = useMemo(() => defaultLayoutPlugin(), [])
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    pageNavPlugin.jumpToPage(page - 1)
  }, [page])

  return (
    <div className="pdf-pane">
      <Worker workerUrl={WORKER_URL}>
        <div style={{ height: '100%' }}>
          <Viewer
            fileUrl={pdfUrl}
            plugins={[pageNavPlugin, defaultLayout]}
            initialPage={page - 1}
            onPageChange={(e: PageChangeEvent) => onPageChange(e.currentPage + 1)}
          />
        </div>
      </Worker>
    </div>
  )
}
