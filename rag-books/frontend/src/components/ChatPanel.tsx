import { useState, useRef, useEffect, useCallback } from 'react'

interface Citation {
  page_number: number
  text: string
  title: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
}

interface Props {
  bookId: string
  bookTitle: string
  onCitationClick: (page: number) => void
}

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)

export default function ChatPanel({ bookId, bookTitle, onCitationClick }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async () => {
    const query = input.trim()
    if (!query || streaming) return

    setInput('')
    setStreaming(true)

    const userMsg: Message = { role: 'user', content: query }
    const assistantMsg: Message = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, userMsg, assistantMsg])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id: bookId, query }),
      })

      if (!res.ok || !res.body) throw new Error('Request failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break

          try {
            const event = JSON.parse(data)
            if (event.type === 'token') {
              setMessages(prev => {
                const msgs = [...prev]
                msgs[msgs.length - 1] = {
                  ...msgs[msgs.length - 1],
                  content: msgs[msgs.length - 1].content + event.content,
                }
                return msgs
              })
            } else if (event.type === 'citations') {
              setMessages(prev => {
                const msgs = [...prev]
                msgs[msgs.length - 1] = {
                  ...msgs[msgs.length - 1],
                  citations: event.sources,
                }
                return msgs
              })
            }
          } catch {
            // ignore malformed events
          }
        }
      }
    } catch {
      setMessages(prev => {
        const msgs = [...prev]
        msgs[msgs.length - 1] = {
          ...msgs[msgs.length - 1],
          content: 'Something went wrong. Please try again.',
        }
        return msgs
      })
    } finally {
      setStreaming(false)
      inputRef.current?.focus()
    }
  }, [bookId, input, streaming])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="chat-pane">
      <div className="messages-list">
        {messages.length === 0 && (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <p className="chat-empty-title">Ask anything about</p>
            <p className="chat-empty-book">{bookTitle}</p>
            <p className="chat-empty-hint">Try: "Summarise the first chapter" or "What are the key themes?"</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`msg-wrap ${msg.role}`}>
            {msg.role === 'assistant' && (
              <div className="msg-avatar">AI</div>
            )}
            <div className={`msg-bubble msg-${msg.role}`}>
              {msg.content || (streaming && i === messages.length - 1
                ? <span className="typing-dots"><span /><span /><span /></span>
                : null
              )}
              {msg.citations && msg.citations.length > 0 && (
                <div className="citation-chips">
                  {msg.citations.map((c, j) => (
                    <button
                      key={j}
                      className="citation-chip"
                      onClick={() => onCitationClick(c.page_number)}
                      title={c.text}
                    >
                      p.{c.page_number} — {c.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-bar">
        <textarea
          ref={inputRef}
          className="chat-textarea"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question... (Enter to send, Shift+Enter for newline)"
          rows={1}
          disabled={streaming}
        />
        <button
          className="send-btn"
          onClick={sendMessage}
          disabled={!input.trim() || streaming}
          title="Send"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  )
}
