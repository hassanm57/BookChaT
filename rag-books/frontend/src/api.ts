import { supabase } from './lib/supabase'
import type { Book } from './types'

async function authHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { 'Content-Type': 'application/json' }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  }
}

async function authHeadersFormData(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return {}
  return { 'Authorization': `Bearer ${session.access_token}` }
}

export async function fetchBooks(): Promise<Book[]> {
  const res = await fetch('/api/books', { headers: await authHeaders() })
  if (!res.ok) throw new Error('Failed to fetch books')
  return res.json()
}

export async function fetchBook(bookId: string): Promise<Book> {
  const res = await fetch(`/api/books/${bookId}`, { headers: await authHeaders() })
  if (!res.ok) throw new Error('Book not found')
  return res.json()
}

export async function uploadBook(file: File, title: string, author: string, genre: string): Promise<Book> {
  const form = new FormData()
  form.append('file', file)
  form.append('title', title)
  form.append('author', author)
  form.append('genre', genre)
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: await authHeadersFormData(),
    body: form,
  })
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: 'Upload failed' }))
    throw new Error(detail.detail ?? 'Upload failed')
  }
  return res.json()
}
