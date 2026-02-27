import { Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'

// Mock Pages for MVP setup
const Home = () => (
  <div className="p-4">
    <h1 className="text-xl font-bold">首頁視圖 (Dashboard)</h1>
  </div>
)
const Follows = () => <div className="p-4">關注名單</div>
const Upload = () => <div className="p-4">解析 OCR</div>
const Digest = () => <div className="p-4">每日推播</div>

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/follows" element={<Follows />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/digest" element={<Digest />} />
      </Route>
    </Routes>
  )
}

export default App
