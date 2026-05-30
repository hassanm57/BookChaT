import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Hero from './pages/Hero'
import Library from './pages/Library'
import Chat from './pages/Chat'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/library" element={<Library />} />
        <Route path="/chat/:bookId" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  )
}
