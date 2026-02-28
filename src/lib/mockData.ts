import type { Appointment, DigestItem, Doctor, FollowDoctor, UserStatus } from '@/types/domain'

export const doctors: Doctor[] = [
  {
    id: 'doc-001',
    name: '林志安 醫師',
    specialty: '心臟內科',
    hospitalName: '台北榮民總醫院',
    region: '北投區',
    nextClinicDate: '2026-03-03T08:30:00+08:00'
  },
  {
    id: 'doc-002',
    name: '陳怡君 醫師',
    specialty: '腎臟內科',
    hospitalName: '台大醫院',
    region: '中正區',
    nextClinicDate: '2026-03-04T13:30:00+08:00'
  },
  {
    id: 'doc-003',
    name: '王建宏 醫師',
    specialty: '神經內科',
    hospitalName: '新光醫院',
    region: '士林區',
    nextClinicDate: '2026-03-05T18:00:00+08:00'
  }
]

export const defaultFollows: FollowDoctor[] = [
  { doctorId: 'doc-001', privateNotes: '偏好早診，建議先預約。' },
  { doctorId: 'doc-002', privateNotes: '上次討論新適應症，待補文獻。' }
]

export const defaultAppointments: Appointment[] = [
  {
    id: 'apt-001',
    doctorId: 'doc-001',
    hospitalName: '台北榮民總醫院',
    startTime: '2026-03-03T08:30:00+08:00',
    endTime: '2026-03-03T12:00:00+08:00',
    sessionType: 'morning',
    isHistorical: false
  },
  {
    id: 'apt-002',
    doctorId: 'doc-002',
    hospitalName: '台大醫院',
    startTime: '2026-02-20T13:30:00+08:00',
    endTime: '2026-02-20T17:00:00+08:00',
    sessionType: 'afternoon',
    isHistorical: true
  }
]

export const defaultDigests: DigestItem[] = [
  {
    id: 'dg-001',
    summary: '台北榮總 林志安醫師 新增 1 筆上午門診',
    createdAt: '2026-02-28T08:10:00+08:00',
    type: 'timetable_changed'
  },
  {
    id: 'dg-002',
    summary: '陳怡君醫師超過 30 天未拜訪，建議安排追蹤。',
    createdAt: '2026-02-28T08:10:00+08:00',
    type: 'visit_reminder'
  }
]

export const defaultUserStatus: UserStatus = {
  isOnboarded: false,
  subscriptionStatus: 'free_trial',
  activeDevices: 1
}
