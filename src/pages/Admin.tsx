import { useState } from 'react'

interface PendingSubmission {
  id: string
  hospitalName: string
  targetMonth: string
  sourceType: 'pdf' | 'image' | 'url'
  status: 'pending' | 'needs_admin'
}

const pendingSubmissions: PendingSubmission[] = [
  {
    id: 'sub-001',
    hospitalName: '台北榮民總醫院',
    targetMonth: '2026-03',
    sourceType: 'pdf',
    status: 'pending'
  },
  {
    id: 'sub-002',
    hospitalName: '台大醫院',
    targetMonth: '2026-03',
    sourceType: 'image',
    status: 'needs_admin'
  }
]

export function Admin() {
  const [hospital, setHospital] = useState('')
  const [department, setDepartment] = useState('')
  const [doctor, setDoctor] = useState('')
  const [validFrom, setValidFrom] = useState('')

  const canSave =
    hospital.trim().length > 0 &&
    department.trim().length > 0 &&
    doctor.trim().length > 0 &&
    validFrom.trim().length > 0

  return (
    <section className="mx-auto w-full max-w-4xl p-4 pb-24">
      <header className="rounded-2xl bg-slate-900 p-5 text-white shadow-md">
        <p className="text-xs uppercase tracking-wide text-slate-300">Admin</p>
        <h1 className="mt-1 text-2xl font-semibold">門診表審核與手動建檔</h1>
        <p className="mt-2 text-sm text-slate-200">
          對應 PRD：待審核 OCR 任務、重新框選、純手動週曆建檔流程
        </p>
      </header>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">待審核上傳清單</h2>
        <ul className="mt-3 space-y-2">
          {pendingSubmissions.map((item) => (
            <li key={item.id} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-medium text-slate-900">{item.hospitalName}</p>
              <p>
                {item.targetMonth} | {item.sourceType.toUpperCase()} | {item.status}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">純手動建檔（MVP）</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            value={hospital}
            onChange={(event) => setHospital(event.target.value)}
            placeholder="醫院"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-500 focus:ring"
          />
          <input
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            placeholder="科別"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-500 focus:ring"
          />
          <input
            value={doctor}
            onChange={(event) => setDoctor(event.target.value)}
            placeholder="醫師"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-500 focus:ring"
          />
          <input
            type="date"
            value={validFrom}
            onChange={(event) => setValidFrom(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-500 focus:ring"
          />
        </div>

        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          週曆網格輸入區（下一步會接 `/rpc/admin_batch_insert_timetables`）
        </div>

        <button
          type="button"
          disabled={!canSave}
          className="mt-4 rounded-md bg-cyan-700 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          儲存手動建檔（預留 API 串接）
        </button>
      </section>
    </section>
  )
}
