import React from 'react'

interface BookData {
  title: string
  author: string
  color: string
  accent: string
  width?: number
  depth?: number
}

const BOOKS: BookData[] = [
  { title: 'The Great Gatsby',        author: 'F. Scott Fitzgerald', color: '#1B3A2D', accent: '#D4AF37', width: 148, depth: 20 },
  { title: 'A Brief History of Time', author: 'Stephen Hawking',     color: '#12253A', accent: '#7EB8D4', width: 158, depth: 23 },
  { title: 'Pride and Prejudice',     author: 'Jane Austen',          color: '#6B2737', accent: '#F2C87E', width: 140, depth: 19 },
  { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman',     color: '#3D2B1F', accent: '#C98A5E', width: 162, depth: 25 },
  { title: 'Sapiens',                 author: 'Yuval Noah Harari',    color: '#4A3010', accent: '#D4A853', width: 145, depth: 21 },
]

function Book3D({ title, author, color, accent, width = 120, depth = 16 }: BookData) {
  return (
    <div
      className="b3d-outer"
      style={{
        '--book-color': color,
        '--book-accent': accent,
        '--book-width': `${width}px`,
        '--book-depth': `${depth}px`,
      } as React.CSSProperties}
    >
      <div className="b3d-inner">

        {/* Front cover */}
        <div className="b3d-front">
          <div className="b3d-bind-overlay" />
          <div className="b3d-art">
            <div className="b3d-art-circle b3d-art-circle--lg" />
            <div className="b3d-art-circle b3d-art-circle--sm" />
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
      <div className="bookshelf-row">
        {BOOKS.map((b, i) => <Book3D key={i} {...b} />)}
      </div>
      <p className="bookshelf-caption">
        Fiction, science, history, research. It all belongs here.
      </p>
    </div>
  )
}
