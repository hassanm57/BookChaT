#!/usr/bin/env node
// Downloads 13 BookShelf cover images from Open Library and saves them to
// public/bookshelf-covers/ so they're served as local static assets.
// Run once: node scripts/download-covers.mjs

import https from 'https'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '../public/bookshelf-covers')
fs.mkdirSync(outDir, { recursive: true })

function download(url, dest, hops = 0) {
  return new Promise((resolve, reject) => {
    if (hops > 5) return reject(new Error('Too many redirects'))
    const client = url.startsWith('https') ? https : http
    client.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(download(res.headers.location, dest, hops + 1))
      }
      if (res.statusCode !== 200) {
        res.resume()
        return reject(new Error(`HTTP ${res.statusCode}`))
      }
      const file = fs.createWriteStream(dest)
      res.pipe(file)
      file.on('finish', () => { file.close(); resolve() })
      file.on('error', reject)
    }).on('error', reject)
  })
}

const ISBNS = [
  '9780743273565', // The Great Gatsby
  '9780553380163', // A Brief History of Time
  '9780141439518', // Pride and Prejudice
  '9780374533557', // Thinking, Fast and Slow
  '9780062316097', // Sapiens
  '9780345539434', // Cosmos
  '9780140432053', // The Origin of Species
  '9780307352149', // Quiet
  '9780316017930', // Outliers
  '9780735211292', // Atomic Habits
  '9780199291144', // The Selfish Gene
  '9780140449334', // Meditations
  '9780679734505', // Crime and Punishment
]

let ok = 0
for (const isbn of ISBNS) {
  const url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
  const dest = path.join(outDir, `${isbn}.jpg`)
  process.stdout.write(`  ${isbn}... `)
  try {
    await download(url, dest)
    const size = Math.round(fs.statSync(dest).size / 1024)
    console.log(`${size} KB`)
    ok++
  } catch (err) {
    console.log(`FAILED (${err.message})`)
  }
}
console.log(`\n${ok}/${ISBNS.length} covers saved to public/bookshelf-covers/`)
