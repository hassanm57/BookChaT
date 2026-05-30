import { motion } from 'framer-motion'

const EASE = [0.25, 0.46, 0.45, 0.94] as const
const CHAR_VP = { once: true, margin: '0px 0px -200px 0px' } as const
const BLOCK_VP = { once: true, margin: '0px 0px -120px 0px' } as const

function ScatterChar({ char, dist }: { char: string; dist: number }) {
  const isSpace = char === ' '
  const clamped = Math.sign(dist) * Math.min(Math.abs(dist), 15)
  return (
    <motion.span
      style={{ display: 'inline-block', whiteSpace: isSpace ? 'pre' : 'normal' }}
      initial={{ x: clamped * 38, rotateX: clamped * 26, opacity: 0 }}
      whileInView={{ x: 0, rotateX: 0, opacity: 1 }}
      viewport={CHAR_VP}
      transition={{
        duration: 0.9,
        delay: Math.abs(clamped) * 0.022,
        ease: EASE,
      }}
    >
      {isSpace ? ' ' : char}
    </motion.span>
  )
}

function ScatterLine({ text, italic }: { text: string; italic?: boolean }) {
  const chars = Array.from(text)
  const center = Math.floor(chars.length / 2)
  return (
    <span style={{ display: 'block', fontStyle: italic ? 'italic' : undefined }}>
      {chars.map((c, i) => (
        <ScatterChar key={i} char={c} dist={i - center} />
      ))}
    </span>
  )
}

export interface ScatterRevealProps {
  eyebrow?: string
  title: string
  titleItalic?: string
  id?: string
  sectionClass?: string
  headingClass?: string
  children?: React.ReactNode
}

export function ScatterReveal({
  eyebrow,
  title,
  titleItalic,
  id,
  sectionClass = '',
  headingClass = 'hero-section-heading',
  children,
}: ScatterRevealProps) {
  return (
    <section id={id} className={`scatter-section ${sectionClass}`}>
      {eyebrow && (
        <motion.p
          className="hero-section-eyebrow"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={BLOCK_VP}
          transition={{ duration: 0.6, ease: EASE }}
        >
          {eyebrow}
        </motion.p>
      )}

      <h2 className={headingClass} style={{ perspective: 600, textAlign: 'center' }}>
        <ScatterLine text={title} />
        {titleItalic && <ScatterLine text={titleItalic} italic />}
      </h2>

      {children && (
        <motion.div
          className="scatter-content"
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={BLOCK_VP}
          transition={{ duration: 0.85, delay: 0.28, ease: EASE }}
        >
          {children}
        </motion.div>
      )}
    </section>
  )
}
