export interface Book {
  book_id: string
  title: string
  author: string
  genre: string
  pdf_filename: string
  cover_image: string | null
  status: 'processing' | 'ready' | 'error'
  created_at?: string
}
