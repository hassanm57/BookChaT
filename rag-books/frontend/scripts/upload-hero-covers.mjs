#!/usr/bin/env node
/**
 * Downloads the 20 BookMorph cover images from Open Library and uploads them
 * to Supabase Storage at covers/hero/{isbn}.jpg (public bucket).
 * Then patches BookMorph.tsx to use the Supabase URLs instead.
 *
 * Run once from rag-books/frontend/:
 *   node scripts/upload-hero-covers.mjs
 */

import https from 'https'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '../node_modules/@supabase/supabase-js/dist/index.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Load .env ─────────────────────────────────────────────────────────────────
const envPath = path.join(__dirname, '../../../.env')
const envVars = {}
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) envVars[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  })
}

const SUPABASE_URL = envVars['SUPABASE_URL']
const SERVICE_KEY  = envVars['SUPABASE_SERVICE_ROLE_KEY']

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing from .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// ── ISBNs extracted from BookMorph COVERS array ───────────────────────────────
const ISBNS = [
  '9780743273565', '9780451524935', '9780061743528', '9780316769174',
  '9780060850524', '9780399501487', '9780679734505', '9780062315007',
  '9780439708180', '9780547928227', '9781451673319', '9780451526342',
  '9780679720201', '9780140177398', '9780684801223', '9780743477123',
  '9780142437247', '9780141439518', '9780142437230', '9780743477116',
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function fetchBuffer(url, hops = 0) {
  return new Promise((resolve, reject) => {
    if (hops > 6) return reject(new Error('Too many redirects'))
    const client = url.startsWith('https') ? https : http
    client.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchBuffer(res.headers.location, hops + 1))
      }
      if (res.statusCode !== 200) {
        res.resume()
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    }).on('error', reject)
  })
}

async function uploadToSupabase(isbn, buffer) {
  const storagePath = `hero/${isbn}.jpg`
  const { error } = await supabase.storage
    .from('covers')
    .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true })

  if (error) throw new Error(error.message)

  return `${SUPABASE_URL}/storage/v1/object/public/covers/${storagePath}`
}

// ── Main ──────────────────────────────────────────────────────────────────────
const supabaseUrls = []

for (const isbn of ISBNS) {
  const olUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`
  process.stdout.write(`  ${isbn}  downloading...`)
  try {
    const buf = await fetchBuffer(olUrl)
    process.stdout.write(' uploading...')
    const publicUrl = await uploadToSupabase(isbn, buf)
    supabaseUrls.push(publicUrl)
    console.log(' ✓')
  } catch (e) {
    console.log(` ✗  ${e.message}`)
    supabaseUrls.push(olUrl) // fall back to original so the array stays complete
  }
}

// ── Patch BookMorph.tsx ───────────────────────────────────────────────────────
const morphPath = path.join(__dirname, '../src/components/BookMorph.tsx')
let src = fs.readFileSync(morphPath, 'utf8')

const newCoversBlock = `const COVERS = [\n${supabaseUrls.map(u => `  '${u}',`).join('\n')}\n]`

src = src.replace(/const COVERS = \[[\s\S]*?\]/, newCoversBlock)
fs.writeFileSync(morphPath, src, 'utf8')

console.log(`\n✅  BookMorph.tsx patched with Supabase URLs`)
console.log(`   Covers stored at: ${SUPABASE_URL}/storage/v1/object/public/covers/hero/`)
