import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'

const EFFECTIVE_DATE = 'June 18, 2026'
const CONTACT_EMAIL = 'privacy@getfolio.app'

export default function PrivacyPage() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="priv-page">
      {/* Nav */}
      <nav className="priv-nav">
        <button className="priv-nav-logo" onClick={() => navigate('/')}>
          <img src="/logo.png" alt="Folio" className="priv-nav-logo-img" />
          <span className="priv-nav-logo-text">Folio</span>
        </button>
        <div className="priv-nav-actions">
          <motion.button
            className="hero-theme-toggle"
            onClick={toggleTheme}
            whileTap={{ scale: 0.84 }}
            aria-label="Toggle dark mode"
          >
            <AnimatePresence mode="wait" initial={false}>
              {theme === 'dark' ? (
                <motion.span
                  key="sun"
                  initial={{ rotate: -60, opacity: 0, scale: 0.4 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 60, opacity: 0, scale: 0.4 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  style={{ display: 'flex' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/>
                    <line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                </motion.span>
              ) : (
                <motion.span
                  key="moon"
                  initial={{ rotate: 60, opacity: 0, scale: 0.4 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -60, opacity: 0, scale: 0.4 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  style={{ display: 'flex' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <button className="priv-nav-back" onClick={() => navigate(-1)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back
          </button>
        </div>
      </nav>

      {/* Header */}
      <header className="priv-header">
        <motion.div
          className="priv-header-inner"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <span className="priv-eyebrow">Legal</span>
          <h1 className="priv-title">Privacy Policy</h1>
          <p className="priv-meta">Effective date: {EFFECTIVE_DATE} · Applies to all users worldwide</p>
        </motion.div>
      </header>

      {/* Body */}
      <div className="priv-body">
        <aside className="priv-toc">
          <p className="priv-toc-label">Contents</p>
          <ol className="priv-toc-list">
            {[
              'Who We Are',
              'Data We Collect',
              'How We Use Your Data',
              'Third-Party Services',
              'International Data Transfers',
              'Data Retention',
              'Your Rights (GDPR)',
              'California Residents (CCPA)',
              'Cookies & Tracking',
              "Children's Privacy",
              'Security',
              'Changes to This Policy',
              'Contact Us',
            ].map((item, i) => (
              <li key={i}>
                <a href={`#section-${i + 1}`} className="priv-toc-link">{item}</a>
              </li>
            ))}
          </ol>
        </aside>

        <main className="priv-main">

          <Section id="section-1" n="1" title="Who We Are">
            <p>Folio ("<strong>Folio</strong>", "<strong>we</strong>", "<strong>us</strong>", or "<strong>our</strong>") is a software product that lets you upload PDF documents and have AI-powered conversations with them. Folio operates as a sole proprietor / independent operator.</p>
            <p>For the purposes of the General Data Protection Regulation (GDPR), Folio is the <strong>data controller</strong> of your personal data.</p>
            <p>Contact us at any time: <a href={`mailto:${CONTACT_EMAIL}`} className="priv-link">{CONTACT_EMAIL}</a></p>
          </Section>

          <Section id="section-2" n="2" title="Data We Collect">
            <p>We collect only the data necessary to provide the service. Here is what that includes:</p>
            <Table rows={[
              ['Account data', 'Email address, password hash (never stored in plaintext)', 'When you create an account'],
              ['PDF content', 'PDF files you upload, stored encrypted in Supabase Storage', 'When you upload a document'],
              ['Chat queries', 'The questions and messages you send in the chat interface', 'Each time you send a message'],
              ['AI-generated responses', 'Responses generated by OpenAI based on your documents and queries', 'Each chat session'],
              ['Payment data', 'Billing name, last-4 card digits, transaction history (Stripe handles all card data — we never see or store full card numbers)', 'When you subscribe to a paid plan'],
              ['Technical data', 'IP address, browser type, device type, pages visited, timestamps', 'Automatically, while using the service'],
              ['Analytics data', 'Anonymised usage events (e.g. pages visited, features used). We may introduce product analytics in the future and will update this policy before doing so.', 'If and when analytics are enabled'],
            ]} />
            <Callout>
              <strong>Important — your documents and queries go to OpenAI.</strong> When you ask a question in Folio, your query and relevant excerpts from your PDF are sent to OpenAI's API to generate a response. Please do not upload documents containing sensitive personal data (health records, social security numbers, financial credentials) that you would not want processed by a third-party AI provider.
            </Callout>
          </Section>

          <Section id="section-3" n="3" title="How We Use Your Data">
            <p>We use your data only for the following purposes, each supported by a lawful basis under GDPR:</p>
            <Table rows={[
              ['Providing the service', 'Processing your uploads, running search and retrieval, returning AI chat responses', 'Contract performance (Art. 6(1)(b))'],
              ['Account management', 'Creating your account, verifying your identity, sending password resets', 'Contract performance (Art. 6(1)(b))'],
              ['Payment processing', 'Charging your subscription, issuing receipts, handling refunds', 'Contract performance (Art. 6(1)(b))'],
              ['Security & abuse prevention', 'Detecting fraudulent activity, enforcing terms of service', 'Legitimate interests (Art. 6(1)(f))'],
              ['Product improvement', 'Understanding how features are used to make better decisions', 'Legitimate interests (Art. 6(1)(f))'],
              ['Legal compliance', 'Retaining financial records as required by law', 'Legal obligation (Art. 6(1)(c))'],
            ]} />
            <p>We do <strong>not</strong> sell your personal data. We do not use your data to train AI models. We do not share your data with advertisers.</p>
          </Section>

          <Section id="section-4" n="4" title="Third-Party Services">
            <p>Folio uses the following third-party sub-processors that may handle your personal data:</p>
            <Table rows={[
              ['Supabase', 'Authentication, database, file storage', 'United States (AWS)', 'supabase.com/privacy'],
              ['OpenAI', 'AI language model (chat responses, embeddings)', 'United States', 'openai.com/policies/privacy-policy'],
              ['Stripe', 'Payment processing and subscription management', 'United States', 'stripe.com/privacy'],
            ]} />
            <p>Each sub-processor has agreed to handle data in accordance with applicable privacy law. OpenAI's API usage policies state that data submitted via the API is not used to train OpenAI's models by default. For Supabase and Stripe, standard contractual clauses or Data Processing Addendums are in place for EU data transfers where applicable.</p>
          </Section>

          <Section id="section-5" n="5" title="International Data Transfers">
            <p>Folio is operated from the United States. If you are located in the European Economic Area (EEA), the United Kingdom, or another jurisdiction with data transfer restrictions, please be aware that your personal data — including the content of your uploaded documents and chat messages — is processed and stored in the United States.</p>
            <p>We rely on the following transfer mechanisms to lawfully export EEA/UK data:</p>
            <ul className="priv-list">
              <li><strong>Standard Contractual Clauses (SCCs)</strong> — where our sub-processors have these in place with us or with their own sub-processors.</li>
              <li><strong>Adequacy decisions</strong> — where applicable for the recipient country.</li>
            </ul>
            <p>By using Folio and accepting this policy, you acknowledge that your data will be processed in the United States under these safeguards.</p>
          </Section>

          <Section id="section-6" n="6" title="Data Retention">
            <Table rows={[
              ['Account data', 'Until you delete your account, plus up to 30 days in backups'],
              ['Uploaded PDFs', 'Until you delete the file or your account'],
              ['Chat messages', 'Chat messages are not persistently stored by Folio. They are transmitted to OpenAI in real time and subject to OpenAI\'s retention policies (currently 30 days via API).'],
              ['Payment records', 'Minimum 7 years as required by financial regulations'],
              ['Technical / log data', 'Up to 90 days'],
            ]} />
            <p>You may request deletion of your data at any time by emailing <a href={`mailto:${CONTACT_EMAIL}`} className="priv-link">{CONTACT_EMAIL}</a>. We will process deletion requests within 30 days.</p>
          </Section>

          <Section id="section-7" n="7" title="Your Rights (GDPR)">
            <p>If you are located in the EEA or UK, you have the following rights under the GDPR. To exercise any of these rights, email <a href={`mailto:${CONTACT_EMAIL}`} className="priv-link">{CONTACT_EMAIL}</a>. We will respond within <strong>30 days</strong>.</p>
            <ul className="priv-list">
              <li><strong>Right of access (Art. 15)</strong> — Request a copy of all personal data we hold about you.</li>
              <li><strong>Right to rectification (Art. 16)</strong> — Ask us to correct inaccurate or incomplete data.</li>
              <li><strong>Right to erasure / "right to be forgotten" (Art. 17)</strong> — Ask us to delete your personal data. We will comply unless we are legally required to retain it (e.g. financial records).</li>
              <li><strong>Right to restriction of processing (Art. 18)</strong> — Ask us to pause processing your data while a dispute is resolved.</li>
              <li><strong>Right to data portability (Art. 20)</strong> — Request your data in a machine-readable format.</li>
              <li><strong>Right to object (Art. 21)</strong> — Object to processing based on legitimate interests. We will stop unless we have compelling grounds that override your interests.</li>
              <li><strong>Right not to be subject to automated decision-making (Art. 22)</strong> — Folio does not make automated decisions that produce legal or similarly significant effects about you.</li>
            </ul>
            <p>You also have the right to lodge a complaint with your local supervisory authority. In the EU, you can find your authority at <span className="priv-link">edpb.europa.eu/about-edpb/board/members_en</span>. In the UK, this is the Information Commissioner's Office (ico.org.uk).</p>
          </Section>

          <Section id="section-8" n="8" title="California Residents (CCPA)">
            <p>If you are a California resident, the California Consumer Privacy Act (CCPA) grants you additional rights:</p>
            <ul className="priv-list">
              <li><strong>Right to know</strong> — The categories and specific pieces of personal information we collect, the business purposes for collection, and the categories of third parties we share with (all described in Sections 2–4 above).</li>
              <li><strong>Right to delete</strong> — Request deletion of your personal information. We will comply subject to legal retention requirements.</li>
              <li><strong>Right to opt out of sale</strong> — We <strong>do not sell</strong> your personal information to any third party. We do not share data for cross-context behavioral advertising.</li>
              <li><strong>Right to non-discrimination</strong> — We will not discriminate against you for exercising any CCPA right.</li>
            </ul>
            <p>To exercise any CCPA right, email <a href={`mailto:${CONTACT_EMAIL}`} className="priv-link">{CONTACT_EMAIL}</a> with the subject line "CCPA Request".</p>
          </Section>

          <Section id="section-9" n="9" title="Cookies & Tracking">
            <p>Folio uses a small number of essential cookies and browser storage mechanisms required to operate the service:</p>
            <Table rows={[
              ['Authentication token', 'Keeps you logged in across sessions', 'Essential — cannot opt out'],
              ['Theme preference', 'Remembers your light/dark mode choice (localStorage)', 'Essential — cannot opt out'],
              ['Session storage', 'Temporary cache of your library (cleared on browser close)', 'Essential — cannot opt out'],
            ]} />
            <p>We do not currently use third-party analytics cookies, tracking pixels, or advertising cookies. <strong>If we introduce product analytics in the future</strong> (such as PostHog or a similar tool), we will update this policy, provide in-app notice, and, where required by law, obtain your consent before activating tracking.</p>
          </Section>

          <Section id="section-10" n="10" title="Children's Privacy">
            <p>Folio is not directed at children under the age of <strong>16</strong>. We do not knowingly collect personal data from anyone under 16. If we learn that we have collected data from a child under 16, we will delete it promptly. If you believe we have inadvertently collected data from a minor, please contact us at <a href={`mailto:${CONTACT_EMAIL}`} className="priv-link">{CONTACT_EMAIL}</a>.</p>
          </Section>

          <Section id="section-11" n="11" title="Security">
            <p>We take reasonable technical and organisational measures to protect your data, including:</p>
            <ul className="priv-list">
              <li>All data in transit encrypted via TLS 1.2+</li>
              <li>PDF files stored in private Supabase Storage buckets (not publicly accessible — served only via short-lived signed URLs)</li>
              <li>Database rows protected by Row Level Security (RLS) — users can only access their own data at the database level</li>
              <li>Passwords hashed and managed entirely by Supabase Auth (we never see plaintext passwords)</li>
              <li>API keys and secrets stored as environment variables, never in source code</li>
            </ul>
            <p>No method of transmission over the internet is 100% secure. We cannot guarantee absolute security, but we commit to notifying affected users without undue delay in the event of a personal data breach that is likely to result in high risk to your rights.</p>
          </Section>

          <Section id="section-12" n="12" title="Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. When we do, we will:</p>
            <ul className="priv-list">
              <li>Update the "Effective date" at the top of this page</li>
              <li>Send an email to your registered address if the changes are material</li>
              <li>Display an in-app notice for significant changes</li>
            </ul>
            <p>Continued use of Folio after changes take effect constitutes acceptance of the updated policy. We encourage you to review this page periodically.</p>
          </Section>

          <Section id="section-13" n="13" title="Contact Us">
            <p>For any privacy-related questions, requests to exercise your rights, or data breach reports, please contact:</p>
            <div className="priv-contact-card">
              <p className="priv-contact-name">Folio — Privacy</p>
              <a href={`mailto:${CONTACT_EMAIL}`} className="priv-link priv-contact-email">{CONTACT_EMAIL}</a>
              <p className="priv-contact-note">We aim to respond to all privacy requests within <strong>30 days</strong>. For urgent matters, include "URGENT" in the subject line.</p>
            </div>
          </Section>

          <div className="priv-footer-note">
            <p>© 2026 Folio. This Privacy Policy was last updated on {EFFECTIVE_DATE}.</p>
            <button className="priv-back-btn" onClick={() => navigate('/')}>← Back to Folio</button>
          </div>
        </main>
      </div>
    </div>
  )
}

function Section({ id, n, title, children }: { id: string; n: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="priv-section">
      <div className="priv-section-header">
        <span className="priv-section-n">{n}</span>
        <h2 className="priv-section-title">{title}</h2>
      </div>
      <div className="priv-section-body">{children}</div>
    </section>
  )
}

function Table({ rows }: { rows: string[][] }) {
  return (
    <div className="priv-table-wrap">
      <table className="priv-table">
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className={j === 0 ? 'priv-td priv-td-label' : 'priv-td'}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Callout({ children }: { children: React.ReactNode }) {
  return <div className="priv-callout">{children}</div>
}
