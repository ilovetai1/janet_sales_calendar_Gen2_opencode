import { Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Home } from '@/pages/Home'
import { Follows } from '@/pages/Follows'
import { Upload } from '@/pages/Upload'
import { Digest } from '@/pages/Digest'
import { Admin } from '@/pages/Admin'

const NotFound = () => <section className="p-4">找不到頁面</section>

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/follows" element={<Follows />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/digest" element={<Digest />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
