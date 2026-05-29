import type { Book } from './types'

export async function fetchBooks(): Promise<Book[]> {
  const res = await fetch('/api/books')
  if (!res.ok) throw new Error('Failed to fetch books')
  return res.json()
}

export async function fetchBook(bookId: string): Promise<Book> {
  const res = await fetch(`/api/books/${bookId}`)
  if (!res.ok) throw new Error('Book not found')
  return res.json()
}
