import * as React from 'react'
import { motion, MotionConfig } from 'framer-motion'

const STEPS = [
  {
    n: '01',
    title: 'Upload your PDF',
    desc: 'Drop any PDF into Folio. Every page is read and indexed automatically so you can search and chat with it.',
    visual: <UploadVisual />,
  },
  {
    n: '02',
    title: 'Ask a question',
    desc: 'Type anything in plain language. A character name, a theme, a specific scene or passage.',
    visual: <AskVisual />,
  },
  {
    n: '03',
    title: 'Read cited answers',
    desc: 'Every response surfaces the exact passages it used as clickable page number chips.',
    visual: <AnswerVisual />,
  },
  {
    n: '04',
    title: 'Jump to the source',
    desc: 'Click any citation chip and the PDF viewer scrolls instantly to that exact passage.',
    visual: <NavigateVisual />,
  },
]

function splitChars(text: string) {
  return Array.from(text.split(' ').map(w => w + ' ').join(''))
}

const clipVariants = {
  visible: { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' },
  hidden:  { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)' },
}

const HowItWorksContext = React.createContext<{
  active: number
  setActive: (i: number) => void
}>({ active: 0, setActive: () => {} })

export default function HowItWorks() {
  const [active, setActive] = React.useState(0)

  return (
    <HowItWorksContext.Provider value={{ active, setActive }}>
      <div className="hiw-layout">
        {/* Left: steps */}
        <div className="hiw-steps">
          {STEPS.map((step, i) => (
            <StepRow key={i} index={i} n={step.n} title={step.title} desc={step.desc} />
          ))}
        </div>

        {/* Right: visuals */}
        <div className="hiw-visuals">
          {STEPS.map((step, i) => (
            <VisualPanel key={i} index={i}>
              {step.visual}
            </VisualPanel>
          ))}
        </div>
      </div>
    </HowItWorksContext.Provider>
  )
}

function StepRow({ index, n, title, desc }: { index: number; n: string; title: string; desc: string }) {
  const { active, setActive } = React.useContext(HowItWorksContext)
  const isActive = active === index
  const chars = splitChars(title)

  return (
    <div
      className={`hiw-step ${isActive ? 'hiw-step--active' : ''}`}
      onMouseEnter={() => setActive(index)}
    >
      <span className="hiw-step-num">{n}</span>
      <div className="hiw-step-body">
        <div className="hiw-step-title">
          {chars.map((char, ci) => (
            <span key={ci} className="hiw-char-outer">
              <MotionConfig
                transition={{
                  delay: ci * 0.022,
                  duration: 0.28,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                <motion.span
                  className="hiw-char-dim"
                  initial={{ y: '0%' }}
                  animate={isActive ? { y: '-110%' } : { y: '0%' }}
                >
                  {char === ' ' ? ' ' : char}
                </motion.span>
                <motion.span
                  className="hiw-char-bright"
                  initial={{ y: '110%' }}
                  animate={isActive ? { y: '0%' } : { y: '110%' }}
                >
                  {char === ' ' ? ' ' : char}
                </motion.span>
              </MotionConfig>
            </span>
          ))}
        </div>
        <p className={`hiw-step-desc ${isActive ? 'hiw-step-desc--visible' : ''}`}>{desc}</p>
      </div>
    </div>
  )
}

function VisualPanel({ index, children }: { index: number; children: React.ReactNode }) {
  const { active } = React.useContext(HowItWorksContext)
  return (
    <motion.div
      className="hiw-visual-panel"
      variants={clipVariants}
      animate={active === index ? 'visible' : 'hidden'}
      transition={{ ease: [0.33, 1, 0.68, 1], duration: 0.65 }}
    >
      {children}
    </motion.div>
  )
}

/* ── Visuals ── */

function UploadVisual() {
  return (
    <div className="hiw-visual-content">
      <div className="hiw-upload-zone">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
        <p className="hiw-upload-label">Drop your PDF here</p>
        <p className="hiw-upload-sub">or click to browse</p>
      </div>
      <div className="hiw-upload-files">
        {['The Great Gatsby.pdf', 'Dune.pdf', '1984.pdf'].map((f, i) => (
          <div key={i} className="hiw-upload-file">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D94F3D" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span>{f}</span>
            <span className="hiw-upload-check">✓</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AskVisual() {
  return (
    <div className="hiw-visual-content">
      <div className="hiw-ask-book">The Great Gatsby</div>
      <div className="hiw-ask-input-wrap">
        <input readOnly className="hiw-ask-input" placeholder="What does the green light symbolize?" />
        <button className="hiw-ask-send">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
      <div className="hiw-ask-suggestions">
        {['Themes in Chapter 4', 'Who is Nick Carraway?', 'Describe Daisy'].map((s, i) => (
          <span key={i} className="hiw-ask-suggestion">{s}</span>
        ))}
      </div>
    </div>
  )
}

function AnswerVisual() {
  return (
    <div className="hiw-visual-content">
      <div className="hiw-answer-msg user">What does the green light symbolize?</div>
      <div className="hiw-answer-msg assistant">
        <p>The green light represents Gatsby's longing for Daisy and the broader American Dream, a hope perpetually deferred across the water.</p>
        <div className="hiw-answer-chips">
          <span className="hiw-chip">p. 21</span>
          <span className="hiw-chip">p. 98</span>
          <span className="hiw-chip">p. 141</span>
        </div>
      </div>
    </div>
  )
}

function NavigateVisual() {
  return (
    <div className="hiw-visual-content hiw-nav-layout">
      <div className="hiw-nav-pdf">
        <div className="hiw-nav-pdf-header">
          <span>The Great Gatsby</span>
          <span className="hiw-nav-page">p. 24</span>
        </div>
        <div className="hiw-nav-pdf-image-wrap">
          <img src="/gatsby-p24.png" alt="PDF page" className="hiw-nav-pdf-image" />
        </div>
      </div>
      <div className="hiw-nav-arrow">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(217,79,61,0.8)" strokeWidth="2" strokeLinecap="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </div>
      <div className="hiw-nav-chat">
        <div className="hiw-nav-cited">
          Cited source
          <span className="hiw-chip hiw-chip--active">p. 24</span>
        </div>
        <p className="hiw-nav-excerpt">"...a single green light, minute and far away, that might have been the end of a dock."</p>
      </div>
    </div>
  )
}
