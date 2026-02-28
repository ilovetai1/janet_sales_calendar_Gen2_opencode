import {
  defaultAppointments,
  defaultDigests,
  defaultFollows,
  defaultUserStatus,
  doctors
} from '@/lib/mockData'
import type { Appointment, DigestItem, Doctor, FollowDoctor, UserStatus } from '@/types/domain'

const KEYS = {
  follows: 'jsc.follows',
  appointments: 'jsc.appointments',
  digests: 'jsc.digests',
  userStatus: 'jsc.userStatus'
} as const

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback
  }

  const raw = window.localStorage.getItem(key)
  if (!raw) {
    window.localStorage.setItem(key, JSON.stringify(fallback))
    return fallback
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    window.localStorage.setItem(key, JSON.stringify(fallback))
    return fallback
  }
}

function saveJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function getDoctors(query: string): Doctor[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return doctors
  }

  return doctors.filter((doctor) => {
    return (
      doctor.name.toLowerCase().includes(normalized) ||
      doctor.specialty.toLowerCase().includes(normalized) ||
      doctor.hospitalName.toLowerCase().includes(normalized) ||
      doctor.region.toLowerCase().includes(normalized)
    )
  })
}

export function getFollowDoctors(): Array<Doctor & { privateNotes: string }> {
  const follows = loadJson<FollowDoctor[]>(KEYS.follows, defaultFollows)
  return follows
    .map((follow) => {
      const doctor = doctors.find((item) => item.id === follow.doctorId)
      if (!doctor) {
        return null
      }
      return {
        ...doctor,
        privateNotes: follow.privateNotes
      }
    })
    .filter((item): item is Doctor & { privateNotes: string } => item !== null)
}

export function updateFollowNote(doctorId: string, note: string): void {
  const follows = loadJson<FollowDoctor[]>(KEYS.follows, defaultFollows)
  const next = follows.map((item) => {
    if (item.doctorId !== doctorId) {
      return item
    }
    return { ...item, privateNotes: note }
  })
  saveJson(KEYS.follows, next)
}

export function addFollowDoctor(doctorId: string): void {
  const follows = loadJson<FollowDoctor[]>(KEYS.follows, defaultFollows)
  if (follows.some((item) => item.doctorId === doctorId)) {
    return
  }
  saveJson(KEYS.follows, [...follows, { doctorId, privateNotes: '' }])
}

export function removeFollowDoctor(doctorId: string): void {
  const follows = loadJson<FollowDoctor[]>(KEYS.follows, defaultFollows)
  saveJson(
    KEYS.follows,
    follows.filter((item) => item.doctorId !== doctorId)
  )
}

export function getAppointments(): Appointment[] {
  return loadJson<Appointment[]>(KEYS.appointments, defaultAppointments)
}

export function createAppointment(payload: Omit<Appointment, 'id' | 'isHistorical'>): Appointment {
  const appointments = loadJson<Appointment[]>(KEYS.appointments, defaultAppointments)
  const next: Appointment = {
    id: `apt-${Date.now()}`,
    isHistorical: false,
    ...payload
  }
  saveJson(KEYS.appointments, [...appointments, next])
  return next
}

export function getDigests(): DigestItem[] {
  return loadJson<DigestItem[]>(KEYS.digests, defaultDigests)
}

export function getUserStatus(): UserStatus {
  return loadJson<UserStatus>(KEYS.userStatus, defaultUserStatus)
}
