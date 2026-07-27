# Firestore Schema Data Contract

This document defines the single source of truth for the Firestore schema across the Apollo OPD apps:
- Patient App (`APOLLO-PATIENT`)
- Staff Portal (`DEMO-DAY`)

Both apps must strictly enforce this contract.

## 1. Patients Collection (`patients`)
- **Document ID**: Cleaned phone number, digits only, no `+`, spaces, or hyphens (e.g. `"918087027178"`).
- **Fields**:
  - `name`: string (e.g., `"Priya Sharma"`)
  - `phone`: string (format: `"+918087027178"`, with `+` and country code)
  - `email`: string
  - `age`: number
  - `gender`: string
  - `city`: string
  - `bloodGroup`: string
  - `abhaId`: string
  - `persona`: string, one of exactly: `"working_professional"` | `"elderly"` | `"student"` | `"default"` | `null`
  - `trustScore`: number
  - `totalVisits`: number
  - `totalNoShows`: number
  - `createdAt`: Firestore `serverTimestamp()`
  - `updatedAt`: Firestore `serverTimestamp()`

## 2. Appointments Collection (`appointments`)
- **Document ID**: Auto-generated string (via `addDoc` or `doc(collection(db, 'appointments'))`).
- **Fields**:
  - `patientId`: string (MUST exactly match a `patients` collection document ID - i.e., the cleaned phone number, e.g. `"918087027178"`)
  - `doctorId`: string (format: `"doc_001"` through `"doc_010"`)
  - `doctorName`: string
  - `department`: string
  - `appointmentDate`: string (format: `"YYYY-MM-DD"`, e.g. `"2026-07-10"`)
  - `appointmentTime`: string (format: `"HH:MM AM/PM"`, e.g. `"10:30 AM"`)
  - `status`: string, one of exactly: `"pending"` | `"confirmed"` | `"cancelled"` | `"rescheduled"` | `"completed"` | `"no_show"` | `"walk_in"` | `"recovered"`
  - `consultationFee`: number
  - `riskScore`: number | null
  - `riskLevel`: string | null (e.g., `"LOW"` | `"MEDIUM"` | `"HIGH"`)
  - `persona`: string (matching the patient's mapped persona key)
  - `familyNotified`: boolean
  - `reminderSent48h`: boolean
  - `reminderSent24h`: boolean
  - `reminderSentMorning`: boolean
  - `reminderSentFinal`: boolean
  - `patientConfirmed`: boolean
  - `bookingId`: string
  - `hospital`: string
  - `room`: string
  - `notes`: string
  - `cancelledReason`: string
  - `consultationMode`: string, one of exactly: `"in_person"` | `"online"` (Defaults to `"in_person"`)
  - `videoRoomUrl`: string | null (URL for the Daily.co video room)
  - `videoRoomName`: string | null (Daily.co video room name ID)
  - `callStatus`: string, one of exactly: `"not_started"` | `"in_progress"` | `"completed"` (Defaults to `"not_started"`)
  - `createdAt`: Firestore `serverTimestamp()`
  - `updatedAt`: Firestore `serverTimestamp()`

## 3. Doctors Collection (`doctors`)
- **Document ID**: `"doc_001"` through `"doc_010"`.
- **Fields**:
  - `name`: string
  - `initials`: string
  - `department`: string
  - `qualifications`: string
  - `experienceYears`: number
  - `consultationFee`: number
  - `phone`: string
  - `email`: string
  - `rating`: number
  - `reviewCount`: number
  - `hospital`: string
  - `bio`: string
  - `specializations`: array of strings
  - `isAvailable`: boolean
  - `offersOnlineConsultation`: boolean (Indicates if the doctor provides video consulting)
  - `onlineConsultationFee`: number (Consulation pricing for online video sessions)

## 4. Doctor Slots Collection (`doctor_slots`)
- **Document ID**: format `"{doctorId}_{date}_{time}"` (e.g. `"doc_001_2026-07-10_09:00AM"`, with no spaces in the time).
- **Fields**:
  - `doctorId`: string (matching doctor document ID)
  - `date`: string (format: `"YYYY-MM-DD"`)
  - `time`: string (format: `"HH:MM AM/PM"`, matching appointmentTime)
  - `isAvailable`: boolean
  - `appointmentId`: string | null
  - `slotType`: string
