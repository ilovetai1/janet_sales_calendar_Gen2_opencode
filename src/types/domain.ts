export type SubscriptionStatus = 'free_trial' | 'active' | 'past_due' | 'canceled'

export type SessionType = 'morning' | 'afternoon' | 'night'

export interface Doctor {
  id: string
  name: string
  specialty: string
  hospitalName: string
  region: string
  nextClinicDate: string
}

export interface FollowDoctor {
  doctorId: string
  privateNotes: string
}

export interface Appointment {
  id: string
  doctorId: string
  hospitalName: string
  startTime: string
  endTime: string
  sessionType: SessionType
  isHistorical: boolean
}

export interface DigestItem {
  id: string
  summary: string
  createdAt: string
  type: 'timetable_changed' | 'visit_reminder' | 'system'
}

export interface UserStatus {
  isOnboarded: boolean
  subscriptionStatus: SubscriptionStatus
  activeDevices: number
}
