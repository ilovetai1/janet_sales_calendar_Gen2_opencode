import { useMemo, useState } from 'react'
import { getDoctors, getFollowDoctors, removeFollowDoctor, updateFollowNote } from '@/lib/appData'

export function Follows() {
  const [query, setQuery] = useState('')
  const [version, setVersion] = useState(0)

  const follows = useMemo(() => getFollowDoctors(), [version])
  const searchResult = useMemo(() => getDoctors(query), [query])

  return (
    <section className="mx-auto w-full max-w-3xl p-4 pb-24">
      <header className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">我的關注</h1>
        <p className="mt-1 text-sm text-slate-600">管理重點醫師與私人拜訪備註</p>
      </header>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
        <input
          type="text"
          placeholder="搜尋醫師或醫院..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-500 focus:ring"
        />
      </div>

      <section className="mt-4 grid gap-3">
        {follows.map((doctor) => (
          <article key={doctor.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-900">{doctor.name}</h2>
                <p className="text-sm text-slate-600">
                  {doctor.specialty} | {doctor.hospitalName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  removeFollowDoctor(doctor.id)
                  setVersion((prev) => prev + 1)
                }}
                className="rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
              >
                取消關注
              </button>
            </div>
            <textarea
              value={doctor.privateNotes}
              onChange={(event) => {
                updateFollowNote(doctor.id, event.target.value)
                setVersion((prev) => prev + 1)
              }}
              rows={3}
              className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-500 focus:ring"
              placeholder="記錄拜訪重點..."
            />
          </article>
        ))}
      </section>

      <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="font-semibold text-slate-900">搜尋結果</h3>
        <ul className="mt-2 space-y-2">
          {searchResult.slice(0, 5).map((item) => (
            <li key={item.id} className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {item.name} - {item.hospitalName}
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}
