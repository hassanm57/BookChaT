import { supabase } from './lib/supabase'
import type { Book } from './types'

export class UploadLimitError extends Error {
  code: string
  constructor(message: string) {
    super(message)
    this.name = 'UploadLimitError'
    this.code = 'FREE_TIER_LIMIT'
  }
}

export class DailyLimitError extends Error {
  isPro: boolean
  limit: number
  constructor(message: string, isPro: boolean, limit: number) {
    super(message)
    this.name = 'DailyLimitError'
    this.isPro = isPro
    this.limit = limit
  }
}

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

export async function fetchPdfUrl(bookId: string): Promise<string> {
  const res = await fetch(`/api/books/${bookId}/pdf-url`, { headers: await authHeaders() })
  if (!res.ok) throw new Error('Failed to get PDF URL')
  const data = await res.json()
  return data.url
}

export async function extractMetadata(file: File): Promise<{ title: string; author: string }> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/extract-metadata', {
    method: 'POST',
    headers: await authHeadersFormData(),
    body: form,
  })
  if (!res.ok) throw new Error('Extraction failed')
  return res.json()
}

export async function deleteBook(bookId: string): Promise<void> {
  const res = await fetch(`/api/books/${bookId}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete book')
}

export async function getSubscriptionStatus(): Promise<{
  is_pro: boolean
  status: string
  messages_today: number
  daily_limit: number
  messages_remaining: number
}> {
  const res = await fetch('/api/subscription-status', { headers: await authHeaders() })
  if (!res.ok) throw new Error('Failed to fetch subscription status')
  return res.json()
}

export async function submitUpgradeRequest(formData: FormData): Promise<void> {
  const res = await fetch('/api/upgrade-request', {
    method: 'POST',
    headers: await authHeadersFormData(),
    body: formData,
  })
  if (!res.ok) {
    const json = await res.json().catch(() => null)
    throw new Error(json?.detail ?? 'Submission failed. Please try again.')
  }
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
    const json = await res.json().catch(() => null)
    const detail = json?.detail
    if (res.status === 403 && typeof detail === 'object' && detail?.code === 'FREE_TIER_LIMIT') {
      throw new UploadLimitError(detail.message ?? 'Free plan limit reached.')
    }
    throw new Error(typeof detail === 'string' ? detail : 'Upload failed')
  }
  return res.json()
}
