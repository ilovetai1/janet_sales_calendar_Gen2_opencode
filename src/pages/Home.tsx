import { getAppointments, getFollowDoctors, getUserStatus } from '@/lib/appData'

function formatDate(value: string): string {
  return new Date(value).toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function Home() {
  const follows = getFollowDoctors()
  const appointments = getAppointments().filter((item) => !item.isHistorical)
  const status = getUserStatus()

  return (
    <section className="mx-auto w-full max-w-3xl p-4 pb-24">
      <header className="rounded-2xl bg-cyan-700 p-5 text-white shadow-md">
        <p className="text-sm opacity-90">首頁視圖</p>
        <h1 className="mt-1 text-2xl font-semibold">今日門診概況</h1>
        <p className="mt-2 text-sm opacity-90">
          訂閱狀態：{status.subscriptionStatus} | 活躍裝置：{status.activeDevices}
        </p>
      </header>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">關注醫師</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{follows.length}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">下週排程</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{appointments.length}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Onboarding</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {status.isOnboarded ? '完成' : '未完成'}
          </p>
        </article>
      </div>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-900">近期拜訪排程</h2>
        <ul className="mt-3 space-y-2">
          {appointments.slice(0, 4).map((item) => (
            <li key={item.id} className="rounded-lg bg-slate-50 p-3 text-sm">
              <p className="font-medium text-slate-800">{item.hospitalName}</p>
              <p className="text-slate-600">{formatDate(item.startTime)}</p>
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}
