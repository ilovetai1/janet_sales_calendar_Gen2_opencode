import { getDigests } from '@/lib/appData'

function formatTime(value: string): string {
  return new Date(value).toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function Digest() {
  const digests = getDigests()

  return (
    <section className="mx-auto w-full max-w-3xl p-4 pb-24">
      <header className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">每日推播</h1>
        <p className="mt-1 text-sm text-slate-600">彙整你關注名單的門診異動與回訪提醒</p>
      </header>

      <ul className="mt-4 space-y-3">
        {digests.map((item) => (
          <li key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{formatTime(item.createdAt)}</p>
            <p className="mt-1 text-slate-800">{item.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
