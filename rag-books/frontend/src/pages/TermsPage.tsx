import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'

const EFFECTIVE_DATE = 'June 18, 2026'
const CONTACT_EMAIL = 'legal@getfolio.app'
const PRIVACY_EMAIL = 'privacy@getfolio.app'

export default function TermsPage() {
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
          <h1 className="priv-title">Terms of Service</h1>
          <p className="priv-meta">Effective date: {EFFECTIVE_DATE} · Please read carefully before using Folio</p>
        </motion.div>
      </header>

      {/* Body */}
      <div className="priv-body">
        <aside className="priv-toc">
          <p className="priv-toc-label">Contents</p>
          <ol className="priv-toc-list">
            {[
              'Acceptance of Terms',
              'Description of Service',
              'Eligibility & Account',
              'Acceptable Use',
              'Your Content & Copyright',
              'AI-Generated Content',
              'Intellectual Property',
              'Subscriptions & Payments',
              'Cancellation & Termination',
              'Disclaimers',
              'Limitation of Liability',
              'Indemnification',
              'DMCA / Copyright Complaints',
              'Governing Law & Disputes',
              'Changes to These Terms',
              'Contact',
            ].map((item, i) => (
              <li key={i}>
                <a href={`#tos-${i + 1}`} className="priv-toc-link">{item}</a>
              </li>
            ))}
          </ol>
        </aside>

        <main className="priv-main">

          <div className="priv-section-body" style={{ paddingBottom: 32, borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
            <p style={{ fontSize: '0.87rem', lineHeight: 1.75, color: 'var(--text-secondary)' }}>
              These Terms of Service ("<strong>Terms</strong>") govern your access to and use of Folio ("<strong>Folio</strong>", "<strong>we</strong>", "<strong>us</strong>", "<strong>our</strong>"). By creating an account or using any part of the Service, you agree to be bound by these Terms. If you do not agree, do not use Folio.
            </p>
          </div>

          <Section id="tos-1" n="1" title="Acceptance of Terms">
            <p>By accessing or using Folio — including by creating an account, uploading a document, or sending a chat message — you agree to these Terms and our <button className="priv-link tos-inline-link" onClick={() => navigate('/privacy')}>Privacy Policy</button>, which is incorporated herein by reference.</p>
            <p>If you are using Folio on behalf of an organisation, you represent that you have authority to bind that organisation to these Terms, and references to "you" include that organisation.</p>
          </Section>

          <Section id="tos-2" n="2" title="Description of Service">
            <p>Folio is an AI-powered document reading platform that allows users to upload PDF files, generate vector embeddings of the content, and interact with the content through a conversational interface powered by large language models (LLMs). The Service includes:</p>
            <ul className="priv-list">
              <li>Secure PDF upload and storage</li>
              <li>AI-powered chat with citations referencing specific pages in your documents</li>
              <li>An in-browser PDF viewer with citation-linked navigation</li>
              <li>A personal library of uploaded documents</li>
            </ul>
            <p>We reserve the right to modify, suspend, or discontinue any part of the Service at any time, with reasonable notice where practicable.</p>
          </Section>

          <Section id="tos-3" n="3" title="Eligibility & Account">
            <p><strong>Age requirement.</strong> You must be at least 16 years of age to use Folio. By using the Service, you represent that you meet this requirement. If you are under 16, do not use Folio.</p>
            <p><strong>Account security.</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us immediately at <a href={`mailto:${CONTACT_EMAIL}`} className="priv-link">{CONTACT_EMAIL}</a> if you suspect unauthorised access.</p>
            <p><strong>Accurate information.</strong> You agree to provide accurate, current, and complete information during registration and to keep it updated.</p>
            <p><strong>One account per person.</strong> You may not create multiple accounts to circumvent free-tier limits or any suspension of your account.</p>
          </Section>

          <Section id="tos-4" n="4" title="Acceptable Use">
            <p>You agree <strong>not</strong> to use Folio to:</p>
            <ul className="priv-list">
              <li>Upload content that infringes any third party's intellectual property rights, including copyrighted books, journal articles, or other materials you do not have the right to reproduce or process</li>
              <li>Upload documents containing classified information, protected health information (PHI) subject to HIPAA, or any data regulated by law as requiring special handling</li>
              <li>Attempt to reverse-engineer, scrape, or extract the underlying AI models, embeddings, or infrastructure</li>
              <li>Use the Service to generate spam, misinformation, or content that harasses, defames, or discriminates against others</li>
              <li>Circumvent rate limits, upload limits, or subscription tier restrictions through technical or other means</li>
              <li>Use automated scripts, bots, or crawlers to access the Service in ways not intended by Folio</li>
              <li>Upload malware, malicious code, or any content designed to harm Folio's infrastructure or other users</li>
              <li>Violate any applicable local, national, or international law or regulation</li>
            </ul>
            <p>We reserve the right to suspend or terminate accounts that violate these restrictions without prior notice.</p>
          </Section>

          <Section id="tos-5" n="5" title="Your Content & Copyright">
            <p><strong>You own your content.</strong> You retain all intellectual property rights in the PDF files and other content you upload to Folio ("<strong>User Content</strong>"). We do not claim ownership of your documents.</p>
            <p><strong>License to operate the Service.</strong> By uploading User Content, you grant Folio a limited, non-exclusive, worldwide, royalty-free licence to store, process, and transmit your content solely to the extent necessary to provide the Service to you. This licence terminates when you delete the content or close your account.</p>
            <p><strong>Copyright responsibility.</strong> You represent and warrant that:</p>
            <ul className="priv-list">
              <li>You own, or have the necessary rights or permissions to upload, every document you submit</li>
              <li>Your use of User Content through Folio does not infringe any third party's copyright, trademark, privacy, or other rights</li>
            </ul>
            <p><strong>No training on your data.</strong> We do not use your uploaded PDFs or chat queries to train AI models. Your content is processed in real time by OpenAI's API and stored for your retrieval only.</p>
            <Callout>
              <strong>Important:</strong> Uploading a copyrighted book, academic paper, or other protected work that you did not purchase a licence to reproduce may expose <em>you</em> to copyright liability. Folio is not a tool for pirating or mass-reproducing copyrighted material. Use it with documents you own, have written, or have a legitimate licence to process.
            </Callout>
          </Section>

          <Section id="tos-6" n="6" title="AI-Generated Content">
            <p><strong>No guarantee of accuracy.</strong> AI responses generated by Folio are produced by large language models and may contain errors, hallucinations, omissions, or outdated information. Citations reference pages in your uploaded documents but do not guarantee the accuracy of the AI's interpretation of that content.</p>
            <p><strong>Not professional advice.</strong> Nothing in Folio's AI-generated responses constitutes legal, medical, financial, psychological, or any other form of professional advice. Do not rely on Folio's output as a substitute for qualified professional guidance.</p>
            <p><strong>You are responsible for your decisions.</strong> Any decisions you make based on information provided by the Service are made at your own risk. Folio expressly disclaims liability for any harm arising from reliance on AI-generated content.</p>
          </Section>

          <Section id="tos-7" n="7" title="Intellectual Property">
            <p><strong>Folio's property.</strong> The Folio platform, including its software, design, trademarks, logos, and all content created by us (excluding User Content), is owned by or licenced to Folio and is protected by intellectual property laws. You may not copy, modify, distribute, sell, or create derivative works from any part of the Service without our explicit written permission.</p>
            <p><strong>Feedback.</strong> If you submit suggestions, ideas, or feedback about Folio, you grant us an irrevocable, royalty-free, worldwide licence to use that feedback for any purpose, including improving the Service, without any obligation to you.</p>
          </Section>

          <Section id="tos-8" n="8" title="Subscriptions & Payments">
            <p><strong>Free tier.</strong> Folio offers a free tier with the following limitations: up to 3 uploaded documents, standard processing speed, and standard chat usage. Free-tier limits may change with 14 days' notice.</p>
            <p><strong>Pro plan.</strong> Paid subscriptions ("<strong>Pro</strong>") are available at the price displayed at checkout, currently <strong>$4.99/month</strong>. Pro plans are billed monthly in advance via Stripe.</p>
            <p><strong>Payments.</strong> All payments are processed by Stripe. By subscribing, you authorise Stripe to charge your payment method on a recurring basis until you cancel. Folio does not store your full card details.</p>
            <p><strong>Taxes.</strong> Prices are exclusive of applicable taxes. You are responsible for all taxes associated with your subscription in your jurisdiction.</p>
            <p><strong>Refunds.</strong> Subscription fees are non-refundable except where required by law. If you believe you were charged in error, contact us at <a href={`mailto:${CONTACT_EMAIL}`} className="priv-link">{CONTACT_EMAIL}</a> within 14 days of the charge.</p>
            <p><strong>Price changes.</strong> We may change subscription prices with at least 30 days' notice. Continued use after the price change takes effect constitutes acceptance of the new price.</p>
          </Section>

          <Section id="tos-9" n="9" title="Cancellation & Termination">
            <p><strong>You may cancel at any time</strong> by managing your subscription in your account settings or by contacting us. Cancellation takes effect at the end of your current billing period. You retain access to Pro features until that date.</p>
            <p><strong>We may suspend or terminate your account</strong> immediately and without prior notice if we determine, in our sole discretion, that you have violated these Terms, engaged in fraudulent activity, or your use of the Service creates legal risk for Folio or other users.</p>
            <p><strong>Effect of termination.</strong> Upon termination:</p>
            <ul className="priv-list">
              <li>Your right to access the Service ceases immediately</li>
              <li>Your uploaded documents and embeddings will be deleted within 30 days</li>
              <li>You remain liable for any outstanding charges accrued prior to termination</li>
              <li>Provisions of these Terms that by their nature should survive termination will do so, including Sections 5, 6, 7, 10, 11, and 12</li>
            </ul>
          </Section>

          <Section id="tos-10" n="10" title="Disclaimers">
            <p>THE SERVICE IS PROVIDED "<strong>AS IS</strong>" AND "<strong>AS AVAILABLE</strong>" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ACCURACY OF AI-GENERATED CONTENT.</p>
            <p>FOLIO DOES NOT WARRANT THAT:</p>
            <ul className="priv-list">
              <li>The Service will be uninterrupted, error-free, or available at any particular time</li>
              <li>AI-generated responses will be accurate, complete, or fit for any particular purpose</li>
              <li>Any errors in the Service will be corrected</li>
              <li>The Service is free from viruses or other harmful components</li>
            </ul>
            <p>Some jurisdictions do not allow the exclusion of implied warranties. In such jurisdictions, the above exclusions apply to the fullest extent permitted by applicable law.</p>
          </Section>

          <Section id="tos-11" n="11" title="Limitation of Liability">
            <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, FOLIO AND ITS OPERATORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY:</p>
            <ul className="priv-list">
              <li>Indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, data, goodwill, or business opportunities</li>
              <li>Damages arising from your reliance on AI-generated content</li>
              <li>Damages arising from unauthorised access to or alteration of your content</li>
              <li>Damages arising from third-party services (OpenAI, Supabase, Stripe) outages or failures</li>
            </ul>
            <p>IN NO EVENT WILL FOLIO'S TOTAL AGGREGATE LIABILITY EXCEED THE GREATER OF: (A) THE TOTAL AMOUNT YOU PAID TO FOLIO IN THE 12 MONTHS PRECEDING THE CLAIM, OR (B) USD $50.</p>
            <p>Some jurisdictions do not allow limitations on liability for certain types of damages. In those jurisdictions, our liability is limited to the greatest extent permitted by law.</p>
          </Section>

          <Section id="tos-12" n="12" title="Indemnification">
            <p>You agree to indemnify, defend, and hold harmless Folio and its operators, affiliates, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of or related to:</p>
            <ul className="priv-list">
              <li>Your violation of these Terms</li>
              <li>Your User Content, including any claim that your content infringes a third party's intellectual property rights</li>
              <li>Your use of the Service in a manner not authorised by these Terms</li>
              <li>Your violation of any applicable law or third-party rights</li>
            </ul>
            <p>We reserve the right to assume exclusive control of the defence of any matter subject to indemnification by you, at your expense. You agree to cooperate with our defence of such claims.</p>
          </Section>

          <Section id="tos-13" n="13" title="DMCA / Copyright Complaints">
            <p>Folio respects intellectual property rights. If you believe that content accessible through the Service infringes your copyright, you may submit a notice under the Digital Millennium Copyright Act (DMCA) by providing the following information in writing to our designated agent:</p>
            <ul className="priv-list">
              <li>A physical or electronic signature of the copyright owner or authorised representative</li>
              <li>Identification of the copyrighted work claimed to be infringed</li>
              <li>Identification of the material alleged to be infringing and where it is located in the Service</li>
              <li>Your contact information (name, address, telephone, email)</li>
              <li>A statement that you have a good-faith belief that the use is not authorised by the copyright owner</li>
              <li>A statement, under penalty of perjury, that the information in the notice is accurate and you are authorised to act on behalf of the copyright owner</li>
            </ul>
            <p>Send DMCA notices to: <a href={`mailto:${CONTACT_EMAIL}`} className="priv-link">{CONTACT_EMAIL}</a> with the subject line "DMCA Notice".</p>
            <p>We will respond to valid DMCA notices by removing or disabling access to the allegedly infringing content and notifying the user who uploaded it. Repeat infringers will have their accounts terminated.</p>
            <p><strong>Counter-notice.</strong> If you believe your content was removed by mistake, you may submit a counter-notice with the information required by 17 U.S.C. § 512(g)(3).</p>
          </Section>

          <Section id="tos-14" n="14" title="Governing Law & Disputes">
            <p><strong>Governing law.</strong> These Terms are governed by and construed in accordance with the laws of the United States, without regard to conflict-of-law principles. Where applicable, the laws of the state in which Folio's operator is domiciled shall apply.</p>
            <p><strong>Informal resolution.</strong> Before initiating any formal legal proceeding, you agree to attempt to resolve the dispute informally by contacting us at <a href={`mailto:${CONTACT_EMAIL}`} className="priv-link">{CONTACT_EMAIL}</a>. We will attempt to resolve the dispute within 30 days of receiving your notice.</p>
            <p><strong>Binding arbitration.</strong> If informal resolution fails, any dispute arising from or relating to these Terms or the Service shall be resolved by binding individual arbitration administered by the American Arbitration Association (AAA) under its Consumer Arbitration Rules, not in a court of law.</p>
            <p><strong>Class action waiver.</strong> You agree that disputes will be resolved on an individual basis only. You waive any right to participate in a class action lawsuit or class-wide arbitration against Folio.</p>
            <p><strong>Exception.</strong> Either party may seek injunctive or other equitable relief in a court of competent jurisdiction to prevent actual or threatened infringement of intellectual property rights.</p>
            <p><strong>EU / UK users.</strong> Nothing in this section removes your rights under mandatory consumer protection laws in your jurisdiction. EU users may also bring claims before the courts of their country of residence.</p>
          </Section>

          <Section id="tos-15" n="15" title="Changes to These Terms">
            <p>We may update these Terms from time to time. When we make material changes, we will:</p>
            <ul className="priv-list">
              <li>Update the "Effective date" at the top of this page</li>
              <li>Send an email notification to your registered address at least 14 days before the changes take effect</li>
              <li>Display a prominent notice in the app</li>
            </ul>
            <p>Your continued use of Folio after the updated Terms take effect constitutes your acceptance of the new Terms. If you do not agree to the updated Terms, you must stop using the Service and may close your account before the effective date.</p>
          </Section>

          <Section id="tos-16" n="16" title="Contact">
            <p>For questions about these Terms, to report a violation, or to submit a legal notice:</p>
            <div className="priv-contact-card">
              <p className="priv-contact-name">Folio — Legal</p>
              <a href={`mailto:${CONTACT_EMAIL}`} className="priv-link priv-contact-email">{CONTACT_EMAIL}</a>
              <p className="priv-contact-note">For privacy-related requests, email <a href={`mailto:${PRIVACY_EMAIL}`} className="priv-link">{PRIVACY_EMAIL}</a> instead. We aim to respond to all legal enquiries within <strong>5 business days</strong>.</p>
            </div>
          </Section>

          <div className="priv-footer-note">
            <p>© 2026 Folio. These Terms were last updated on {EFFECTIVE_DATE}.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="priv-back-btn" onClick={() => navigate('/privacy')}>Privacy Policy</button>
              <button className="priv-back-btn" onClick={() => navigate('/')}>← Back to Folio</button>
            </div>
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

function Callout({ children }: { children: React.ReactNode }) {
  return <div className="priv-callout">{children}</div>
}
