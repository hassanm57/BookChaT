import React, { useState } from 'react'
import HorizontalScroller from './HorizontalScroller'

interface BookData {
  title: string
  author: string
  isbn: string
  width?: number
  depth?: number
}

const BOOKS: BookData[] = [
  { title: 'The Great Gatsby',        author: 'F. Scott Fitzgerald', isbn: '9780743273565', width: 172, depth: 22 },
  { title: 'A Brief History of Time', author: 'Stephen Hawking',     isbn: '9780553380163', width: 168, depth: 20 },
  { title: 'Pride and Prejudice',     author: 'Jane Austen',          isbn: '9780141439518', width: 163, depth: 21 },
  { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman',     isbn: '9780374533557', width: 175, depth: 24 },
  { title: 'Sapiens',                 author: 'Yuval Noah Harari',    isbn: '9780062316097', width: 168, depth: 23 },
  { title: 'Cosmos',                  author: 'Carl Sagan',           isbn: '9780345539434', width: 170, depth: 22 },
  { title: 'The Origin of Species',   author: 'Charles Darwin',       isbn: '9780140432053', width: 162, depth: 19 },
  { title: 'Quiet',                   author: 'Susan Cain',           isbn: '9780307352149', width: 165, depth: 20 },
  { title: 'Outliers',                author: 'Malcolm Gladwell',     isbn: '9780316017930', width: 160, depth: 21 },
  { title: 'Atomic Habits',           author: 'James Clear',          isbn: '9780735211292', width: 173, depth: 23 },
  { title: 'The Selfish Gene',        author: 'Richard Dawkins',      isbn: '9780199291144', width: 166, depth: 20 },
  { title: 'Meditations',             author: 'Marcus Aurelius',      isbn: '9780140449334', width: 161, depth: 19 },
  { title: 'Crime and Punishment',    author: 'Fyodor Dostoevsky',    isbn: '9780679734505', width: 174, depth: 24 },
]

function Book3D({ title, author, isbn, width = 120, depth = 16 }: BookData) {
  const [imgErr, setImgErr] = useState(false)
  const coverUrl = `/bookshelf-covers/${isbn}.jpg`

  return (
    <div
      className="b3d-outer"
      style={{
        '--book-color': '#ffffff',
        '--book-width': `${width}px`,
        '--book-depth': `${depth}px`,
      } as React.CSSProperties}
    >
      <div className="b3d-inner">

        {/* Front cover */}
        <div className="b3d-front">
          <div className="b3d-bind-overlay" />
          <div className="b3d-art b3d-art--cover">
            {imgErr
              ? <div className="b3d-art-fallback">{title[0]}</div>
              : <img
                  src={coverUrl}
                  alt={title}
                  onError={() => setImgErr(true)}
                  className="b3d-cover-img"
                />
            }
          </div>
          <div className="b3d-footer">
            <div className="b3d-footer-bind" />
            <div className="b3d-footer-text">
              <span className="b3d-title">{title}</span>
              <span className="b3d-author">{author}</span>
            </div>
          </div>
        </div>

        {/* Page edges (visible on right spine) */}
        <div className="b3d-pages" aria-hidden="true" />

        {/* Back cover */}
        <div className="b3d-back" aria-hidden="true" />

      </div>
    </div>
  )
}

export default function BookShelf() {
  return (
    <div className="bookshelf">
      <p className="bookshelf-label">Chat with the classics.</p>
      <HorizontalScroller>
        {BOOKS.map((b, i) => <Book3D key={i} {...b} />)}
      </HorizontalScroller>
      <p className="bookshelf-caption">
        Fiction, science, history, research. It all belongs here.
      </p>
    </div>
  )
}
