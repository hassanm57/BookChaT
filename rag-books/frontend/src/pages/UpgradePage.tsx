import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { submitUpgradeRequest } from '../api'

const NAYAPAY_ACCOUNT_NAME = 'Hassan Mansoor'
const NAYAPAY_IBAN = 'PK55NAYA1234503325560873'
const NAYAPAY_SWIFT = 'MCIBPKKA'
const NAYAPAY_BANK = 'MCB Islamic Bank (NayaPay)'

const PRICE_USD = 9.99

interface Country {
  name: string
  currency: string
  symbol: string
  flag: string
}

const COUNTRIES: Country[] = [
  { name: 'United States',  currency: 'USD', symbol: '$',    flag: '🇺🇸' },
  { name: 'United Kingdom', currency: 'GBP', symbol: '£',    flag: '🇬🇧' },
  { name: 'Germany',        currency: 'EUR', symbol: '€',    flag: '🇩🇪' },
  { name: 'France',         currency: 'EUR', symbol: '€',    flag: '🇫🇷' },
  { name: 'Netherlands',    currency: 'EUR', symbol: '€',    flag: '🇳🇱' },
  { name: 'Spain',          currency: 'EUR', symbol: '€',    flag: '🇪🇸' },
  { name: 'Italy',          currency: 'EUR', symbol: '€',    flag: '🇮🇹' },
  { name: 'Canada',         currency: 'CAD', symbol: 'CA$',  flag: '🇨🇦' },
  { name: 'Australia',      currency: 'AUD', symbol: 'A$',   flag: '🇦🇺' },
  { name: 'New Zealand',    currency: 'NZD', symbol: 'NZ$',  flag: '🇳🇿' },
  { name: 'Switzerland',    currency: 'CHF', symbol: 'CHF',  flag: '🇨🇭' },
  { name: 'Sweden',         currency: 'SEK', symbol: 'kr',   flag: '🇸🇪' },
  { name: 'Norway',         currency: 'NOK', symbol: 'kr',   flag: '🇳🇴' },
  { name: 'Denmark',        currency: 'DKK', symbol: 'kr',   flag: '🇩🇰' },
  { name: 'India',          currency: 'INR', symbol: '₹',    flag: '🇮🇳' },
  { name: 'UAE',            currency: 'AED', symbol: 'AED',  flag: '🇦🇪' },
  { name: 'Singapore',      currency: 'SGD', symbol: 'S$',   flag: '🇸🇬' },
  { name: 'Malaysia',       currency: 'MYR', symbol: 'RM',   flag: '🇲🇾' },
  { name: 'Nigeria',        currency: 'NGN', symbol: '₦',    flag: '🇳🇬' },
  { name: 'South Africa',   currency: 'ZAR', symbol: 'R',    flag: '🇿🇦' },
  { name: 'Brazil',         currency: 'BRL', symbol: 'R$',   flag: '🇧🇷' },
  { name: 'Japan',          currency: 'JPY', symbol: '¥',    flag: '🇯🇵' },
  { name: 'South Korea',    currency: 'KRW', symbol: '₩',    flag: '🇰🇷' },
  { name: 'Bangladesh',     currency: 'BDT', symbol: '৳',    flag: '🇧🇩' },
  { name: 'Other',          currency: 'USD', symbol: '$',    flag: '🌍' },
]

// Fallback rates (USD → foreign) used if live fetch fails
const FALLBACK_RATES: Record<string, number> = {
  USD: 1, GBP: 0.792, EUR: 0.925, CAD: 1.370, AUD: 1.545,
  NZD: 1.643, CHF: 0.898, SEK: 10.52, NOK: 10.61, DKK: 6.89,
  INR: 83.50, AED: 3.673, SGD: 1.345, MYR: 4.71, NGN: 1625,
  ZAR: 18.45, BRL: 5.08, JPY: 154.2, KRW: 1332, BDT: 109.5,
}

const NO_DECIMAL_CURRENCIES = new Set(['JPY', 'KRW', 'IDR'])

function formatConverted(amount: number, currency: string, symbol: string): string {
  const value = NO_DECIMAL_CURRENCIES.has(currency)
    ? Math.round(amount).toLocaleString()
    : amount.toFixed(2)
  return `${symbol}${value}`
}

const TRANSFER_METHODS = ['Wise', 'Remitly', 'WorldRemit', 'Western Union', 'Other']

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }
  return (
    <button className="upg-copy-btn" onClick={copy} title="Copy">
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span key="done" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </motion.span>
        ) : (
          <motion.span key="copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}

function BankDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="upg-bank-row">
      <span className="upg-bank-label">{label}</span>
      <div className="upg-bank-value-wrap">
        <span className="upg-bank-value">{value}</span>
        <CopyButton value={value} />
      </div>
    </div>
  )
}

export default function UpgradePage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [country, setCountry] = useState('')
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES)
  const [ratesLive, setRatesLive] = useState(false)
  const [form, setForm] = useState({
    name: '',
    transfer_method: '',
    transaction_ref: '',
    amount_sent: String(PRICE_USD),
    notes: '',
  })
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Fetch live exchange rates from open.er-api.com (free, no key required)
  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(r => r.json())
      .then(d => {
        if (d.rates && typeof d.rates === 'object') {
          setRates(d.rates)
          setRatesLive(true)
        }
      })
      .catch(() => {}) // silently fall back to FALLBACK_RATES
  }, [])

  // Overflow fix
  useEffect(() => {
    document.body.style.overflow = 'auto'
    document.documentElement.style.overflow = 'auto'
    document.body.style.height = 'auto'
    document.documentElement.style.height = 'auto'
    const root = document.getElementById('root')
    if (root) { root.style.height = 'auto'; root.style.overflow = 'visible' }
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      document.body.style.height = ''
      document.documentElement.style.height = ''
      if (root) { root.style.height = ''; root.style.overflow = '' }
    }
  }, [])

  // Derived currency info
  const selectedCountry = COUNTRIES.find(c => c.name === country)
  const currencyCode = selectedCountry?.currency ?? 'USD'
  const currencySymbol = selectedCountry?.symbol ?? '$'
  const rate = rates[currencyCode] ?? 1
  const convertedRaw = PRICE_USD * rate
  const convertedFormatted = formatConverted(convertedRaw, currencyCode, currencySymbol)
  const isNonUSD = currencyCode !== 'USD'

  // Auto-fill amount when country or rates change
  useEffect(() => {
    if (!country) return
    const val = NO_DECIMAL_CURRENCIES.has(currencyCode)
      ? String(Math.round(convertedRaw))
      : convertedRaw.toFixed(2)
    setForm(f => ({ ...f, amount_sent: val }))
  }, [country, rates]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFile = (file: File) => {
    setScreenshot(file)
    const reader = new FileReader()
    reader.onload = e => setScreenshotPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!screenshot) { setError('Please attach a screenshot of your payment.'); return }
    if (!form.name.trim()) { setError('Please enter your name.'); return }
    if (!country) { setError('Please select your country using the selector on the left.'); return }
    if (!form.transfer_method) { setError('Please select your transfer method.'); return }
    if (!form.transaction_ref.trim()) { setError('Please enter your transaction reference.'); return }

    setError('')
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('country', country)
      fd.append('transfer_method', form.transfer_method)
      fd.append('transaction_ref', form.transaction_ref)
      fd.append('amount_sent', `${form.amount_sent} ${currencyCode}`)
      fd.append('notes', form.notes)
      fd.append('screenshot', screenshot)
      await submitUpgradeRequest(fd)
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="upg-page">
        <nav className="upg-nav">
          <button className="upg-nav-logo" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="Folio" className="hero-nav-logo-img" />
            <span className="hero-nav-logo-text">Folio</span>
          </button>
        </nav>
        <div className="upg-success">
          <motion.div
            className="upg-success-card"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="upg-success-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="upg-success-title">Request received</h2>
            <p className="upg-success-body">
              We'll verify your payment and activate your Pro account within 24 hours.
              You'll be able to chat with up to 10 books and 50 messages per day.
            </p>
            <button className="upg-success-cta" onClick={() => navigate('/library')}>
              Back to library
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="upg-page">
      <nav className="upg-nav">
        <button className="upg-nav-logo" onClick={() => navigate('/')}>
          <img src="/logo.png" alt="Folio" className="hero-nav-logo-img" />
          <span className="hero-nav-logo-text">Folio</span>
        </button>
        <button className="upg-nav-back" onClick={() => navigate(-1)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>
      </nav>

      <div className="upg-body">
        {/* Left: payment info */}
        <motion.div
          className="upg-info"
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Country selector — top of left panel */}
          <div className="upg-country-row">
            <label className="upg-country-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              Sending from
            </label>
            <select
              className="upg-country-picker"
              value={country}
              onChange={e => setCountry(e.target.value)}
            >
              <option value="">Select your country</option>
              {COUNTRIES.map(c => (
                <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Live currency conversion display */}
          <AnimatePresence>
            {country && (
              <motion.div
                className="upg-currency-display"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="upg-currency-amount-row">
                  <span className="upg-currency-usd">${PRICE_USD} USD</span>
                  {isNonUSD && (
                    <>
                      <span className="upg-currency-eq">≈</span>
                      <span className="upg-currency-converted">{convertedFormatted}</span>
                      <span className="upg-currency-code">{currencyCode}</span>
                    </>
                  )}
                </div>
                {isNonUSD && (
                  <p className="upg-currency-note">
                    {ratesLive ? 'Live rate · ' : 'Approximate rate · '}
                    send in {currencyCode} via Wise or Remitly
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="upg-info-badge">Upgrade to Pro</div>
          <h1 className="upg-info-heading">
            More books.<br />
            <span className="upg-info-italic">More conversations.</span>
          </h1>
          <p className="upg-info-sub">
            Send EXACTLY{' '}
            {isNonUSD && country
              ? <><strong>{convertedFormatted} {currencyCode}</strong> (≈ ${PRICE_USD}) </>
              : <><strong>${PRICE_USD}</strong> </>
            }
            via bank transfer to the account below, then submit the form with your transaction screenshot.
            We'll activate your account within 24 hours. If EXACT amount is not sent, your account will not be upgraded. 
          </p>

          {/* Plan comparison */}
          <div className="upg-compare">
            <div className="upg-compare-col">
              <div className="upg-compare-label">Free</div>
              <div className="upg-compare-item dim">1 book</div>
              <div className="upg-compare-item dim">10 messages lifetime</div>
            </div>
            <div className="upg-compare-arrow">→</div>
            <div className="upg-compare-col upg-compare-col--pro">
              <div className="upg-compare-label pro">Pro · $9.99/mo</div>
              <div className="upg-compare-item">10 books</div>
              <div className="upg-compare-item">50 messages / day</div>
            </div>
          </div>

          {/* Bank details */}
          <div className="upg-bank-card">
            <div className="upg-bank-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              Bank Transfer Details
            </div>
            <BankDetail label="Account name" value={NAYAPAY_ACCOUNT_NAME} />
            <BankDetail label="IBAN" value={NAYAPAY_IBAN} />
            <BankDetail label="SWIFT / BIC" value={NAYAPAY_SWIFT} />
            <BankDetail label="Bank" value={NAYAPAY_BANK} />
            <BankDetail
              label="Amount"
              value={isNonUSD && country ? `${convertedFormatted} ${currencyCode} (≈ $${PRICE_USD} USD)` : `$${PRICE_USD} USD`}
            />
          </div>

          {/* Transfer instructions */}
          <div className="upg-instructions">
            <div className="upg-instructions-title">How to send via Wise</div>
            <div className="upg-step-list">
              {[
                { n: '1', text: 'Go to wise.com — the cheapest option (~1% fee, arrives in 1–2 days)' },
                { n: '2', text: 'Click "Send money" → choose Pakistan as destination' },
                { n: '3', text: `Enter the IBAN and account name above, send ${isNonUSD && country ? `${convertedFormatted} ${currencyCode}` : `$${PRICE_USD} USD`}` },
                { n: '4', text: 'Save your transaction reference number' },
                { n: '5', text: 'Take a screenshot of the confirmation and submit the form' },
              ].map(s => (
                <div key={s.n} className="upg-step">
                  <span className="upg-step-n">{s.n}</span>
                  <span className="upg-step-text">{s.text}</span>
                </div>
              ))}
            </div>
            <p className="upg-alt-methods">
              Also works with: Remitly, WorldRemit, Western Union
            </p>
          </div>
        </motion.div>

        {/* Right: form */}
        <motion.div
          className="upg-form-wrap"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="upg-form-card">
            <h2 className="upg-form-title">Confirm your payment</h2>
            <p className="upg-form-sub">Fill in the details from your transfer. We review every request manually.</p>

            {!user && (
              <div className="upg-form-auth-note">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                You need to be signed in to submit.{' '}
                <button className="upg-auth-link" onClick={() => navigate('/login')}>Sign in</button>
              </div>
            )}

            {!country && (
              <div className="upg-form-country-hint">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Select your country on the left to see the exact amount to send.
              </div>
            )}

            <form className="upg-form" onSubmit={handleSubmit}>
              <div className="upg-field">
                <label className="upg-label">Full name</label>
                <input
                  className="upg-input"
                  placeholder="As on your bank account"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              <div className="upg-field">
                <label className="upg-label">Transfer method</label>
                <select
                  className="upg-input upg-select"
                  value={form.transfer_method}
                  onChange={e => setForm(f => ({ ...f, transfer_method: e.target.value }))}
                  required
                >
                  <option value="">Select method</option>
                  {TRANSFER_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="upg-field">
                <label className="upg-label">Transaction reference / ID</label>
                <input
                  className="upg-input upg-mono"
                  placeholder="e.g. WT-XXXXXXXXXX"
                  value={form.transaction_ref}
                  onChange={e => setForm(f => ({ ...f, transaction_ref: e.target.value }))}
                  required
                />
              </div>

              <div className="upg-field">
                <label className="upg-label">
                  Amount sent
                  {country && <span className="upg-label-currency"> ({currencyCode})</span>}
                </label>
                <input
                  className="upg-input"
                  value={form.amount_sent}
                  onChange={e => setForm(f => ({ ...f, amount_sent: e.target.value }))}
                  required
                />
              </div>

              {/* Screenshot upload */}
              <div className="upg-field">
                <label className="upg-label">Payment screenshot <span className="upg-required">Required</span></label>
                <div
                  className={`upg-dropzone ${screenshotPreview ? 'upg-dropzone--has-file' : ''}`}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  {screenshotPreview ? (
                    <div className="upg-preview-wrap">
                      <img src={screenshotPreview} alt="Payment screenshot" className="upg-preview-img" />
                      <button
                        type="button"
                        className="upg-preview-remove"
                        onClick={e => { e.stopPropagation(); setScreenshot(null); setScreenshotPreview(null) }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="upg-dropzone-inner">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <span>Click or drag to upload screenshot</span>
                      <span className="upg-dropzone-hint">PNG, JPG, WEBP up to 10 MB</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                />
              </div>

              <div className="upg-field">
                <label className="upg-label">Notes <span className="upg-optional">Optional</span></label>
                <textarea
                  className="upg-input upg-textarea"
                  placeholder="Anything else we should know"
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    className="upg-error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                className="upg-submit-btn"
                disabled={submitting || !user}
              >
                {submitting ? (
                  <span className="upg-submit-spinner" />
                ) : (
                  <>
                    Submit upgrade request
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </button>

              <p className="upg-form-note">
                We review every request within 24 hours. Your Folio account
                ({user?.email ?? 'sign in first'}) will be activated once verified.
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
