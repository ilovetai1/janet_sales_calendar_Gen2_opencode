import { useMemo, useState } from 'react'

const sourceLabels = {
  pdf: 'PDF',
  image: '照片',
  url: '網址'
} as const

type SourceType = keyof typeof sourceLabels

export function Upload() {
  const [hospitalName, setHospitalName] = useState('')
  const [targetMonth, setTargetMonth] = useState('')
  const [sourceType, setSourceType] = useState<SourceType>('pdf')

  const isReady = useMemo(() => {
    return hospitalName.trim().length > 0 && targetMonth.trim().length > 0
  }, [hospitalName, targetMonth])

  return (
    <section className="mx-auto w-full max-w-3xl p-4 pb-24">
      <header className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">解析 OCR</h1>
        <p className="mt-1 text-sm text-slate-600">
          上傳門診表圖片 / PDF / 網址，10 秒內未完成將轉背景處理。
        </p>
      </header>

      <form className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <label className="block text-sm">
          <span className="text-slate-700">醫院名稱</span>
          <input
            value={hospitalName}
            onChange={(event) => setHospitalName(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-cyan-500 focus:ring"
            placeholder="例：台北榮民總醫院"
          />
        </label>

        <label className="block text-sm">
          <span className="text-slate-700">目標月份</span>
          <input
            type="month"
            value={targetMonth}
            onChange={(event) => setTargetMonth(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-cyan-500 focus:ring"
          />
        </label>

        <label className="block text-sm">
          <span className="text-slate-700">來源型態</span>
          <select
            value={sourceType}
            onChange={(event) => setSourceType(event.target.value as SourceType)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none ring-cyan-500 focus:ring"
          >
            {Object.entries(sourceLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-xl border-2 border-dashed border-cyan-300 bg-cyan-50 p-6 text-center text-sm text-cyan-900">
          上傳門診表圖片
        </div>

        <button
          type="button"
          disabled={!isReady}
          className="w-full rounded-md bg-cyan-700 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          送出解析任務（預留 API 串接）
        </button>
      </form>

      <p className="mt-3 text-xs text-slate-500">
        設計對應：`POST /functions/v1/upload_timetable_pdf`，實際授權金鑰待你完成 Supabase/Vercel
        設定後再啟用。
      </p>
    </section>
  )
}
