// ─── Apollo Patient App Comprehensive Mock Data ───

// 1. CURRENT_USER
export const CURRENT_USER = {
  id: "pat_001",
  name: "Priya Sharma",
  phone: "+91 98765 43210",
  email: "priya.sharma@gmail.com",
  age: 28,
  gender: "Female",
  city: "Hyderabad",
  bloodGroup: "B+",
  abhaId: "1234-5678-9012-3456",
  persona: "working_professional",
  trustScore: 72,
  totalVisits: 6,
  missedVisits: 2,
  avatar: null,
  familyContacts: [
    { id: "fc_1", name: "Mrs. Savita Gupta", relation: "Daughter", phone: "+91 87654 32109" }
  ],
  preferences: {
    whatsapp: true,
    sms: true,
    voiceCall: false,
    email: false,
    language: "english"
  }
};

import { getNext7DaysIST } from '../utils/appTime';

// Next 7 days utility for generating dates — IST-anchored via appTime.js
const generateDates = () => {
  return getNext7DaysIST(7).map(d => d.dateString);
};

const dateKeys = generateDates();

// 2. DOCTORS Array (8-10 doctors)
export const DOCTORS = [
  {
    id: "d-1",
    name: "Dr. Rajesh Mehta",
    department: "Cardiology",
    qualifications: "MBBS, MD, DM (Cardiology), FACC",
    experience: 18,
    rating: 4.8,
    reviewCount: 124,
    consultationFee: 800,
    hospital: "Apollo Hospital, Jubilee Hills",
    specializations: ["Interventional Cardiology", "Heart Failure", "Angioplasty", "ECG", "Echocardiography"],
    bio: "Dr. Rajesh Mehta is a board-certified interventional cardiologist with 18 years of experience. He specializes in coronary artery disease, heart failure, and minimally invasive cardiac procedures.",
    availableSlots: {
      [dateKeys[0]]: ["09:00 AM", "09:30 AM", "10:30 AM", "11:00 AM", "02:00 PM", "03:30 PM", "05:00 PM"],
      [dateKeys[1]]: ["10:00 AM", "10:30 AM", "11:00 AM", "02:00 PM", "02:30 PM", "04:00 PM"],
      [dateKeys[2]]: ["09:00 AM", "09:30 AM", "10:00 AM", "11:30 AM", "03:00 PM", "03:30 PM", "05:00 PM", "05:30 PM"],
      [dateKeys[3]]: ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"],
      [dateKeys[4]]: ["10:00 AM", "11:30 AM", "03:00 PM", "05:30 PM"],
      [dateKeys[5]]: ["09:30 AM", "10:30 AM", "02:30 PM", "04:30 PM"],
      [dateKeys[6]]: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"]
    },
    bookedSlots: {
      [dateKeys[0]]: ["10:00 AM", "11:30 AM", "02:30 PM", "04:00 PM", "04:30 PM"]
    }
  },
  {
    id: "d-2",
    name: "Dr. Priya Iyer",
    department: "Orthopedics",
    qualifications: "MBBS, MS (Orthopaedics), Fellowship in Joint Reconstruction",
    experience: 14,
    rating: 4.9,
    reviewCount: 218,
    consultationFee: 1000,
    hospital: "Apollo Hospital, Banjara Hills",
    specializations: ["Knee Replacement", "Hip Replacement", "Sports Medicine", "Arthroscopy"],
    bio: "Dr. Priya Iyer is a leading orthopedic surgeon specializing in knee and hip replacement surgery. She has performed over 2,000 joint replacement procedures with exceptional outcomes.",
    availableSlots: {
      [dateKeys[0]]: ["11:00 AM", "05:00 PM"],
      [dateKeys[1]]: ["10:00 AM", "11:30 AM", "04:00 PM"],
      [dateKeys[2]]: ["09:00 AM", "02:30 PM", "04:30 PM"],
      [dateKeys[3]]: ["10:00 AM", "02:00 PM"],
      [dateKeys[4]]: ["11:00 AM", "03:30 PM"],
      [dateKeys[5]]: ["09:00 AM", "04:00 PM"],
      [dateKeys[6]]: ["10:30 AM", "03:00 PM"]
    },
    bookedSlots: {
      [dateKeys[0]]: ["09:30 AM", "12:00 PM", "03:00 PM"]
    }
  },
  {
    id: "d-3",
    name: "Dr. Kavita Reddy",
    department: "General Medicine",
    qualifications: "MBBS, MD (Internal Medicine)",
    experience: 12,
    rating: 4.6,
    reviewCount: 507,
    consultationFee: 500,
    hospital: "Apollo Hospital, Jubilee Hills",
    specializations: ["Diabetology", "Hypertension", "Infectious Diseases", "Wellness & Prevention"],
    bio: "Dr. Kavita Reddy is a general physician with extensive experience in diagnosing and treating complex multi-system diseases. Known for her thorough diagnostic approach and patient-centric care.",
    availableSlots: {
      [dateKeys[0]]: ["09:00 AM", "10:30 AM", "11:30 AM", "03:00 PM"],
      [dateKeys[1]]: ["09:30 AM", "10:30 AM", "11:30 AM", "03:00 PM", "04:00 PM"],
      [dateKeys[2]]: ["08:30 AM", "10:00 AM", "02:00 PM", "05:00 PM"],
      [dateKeys[3]]: ["09:00 AM", "11:00 AM", "03:00 PM"],
      [dateKeys[4]]: ["10:00 AM", "02:00 PM", "04:00 PM"],
      [dateKeys[5]]: ["09:00 AM", "11:00 AM", "03:00 PM"],
      [dateKeys[6]]: ["09:30 AM", "10:30 AM", "02:00 PM"]
    },
    bookedSlots: {
      [dateKeys[0]]: ["09:30 AM", "10:00 AM", "03:30 PM"]
    }
  },
  {
    id: "d-4",
    name: "Dr. Arjun Deshmukh",
    department: "Neurology",
    qualifications: "MBBS, MD, DM (Neurology)",
    experience: 18,
    rating: 4.9,
    reviewCount: 189,
    consultationFee: 1200,
    hospital: "Apollo Hospital, Secunderabad",
    specializations: ["Epilepsy", "Stroke", "Movement Disorders", "Headache Management"],
    bio: "Dr. Arjun Deshmukh is a highly regarded neurologist with 18 years of experience in epilepsy, movement disorders, stroke management, and headache clinics.",
    availableSlots: {
      [dateKeys[0]]: ["03:30 PM"],
      [dateKeys[1]]: ["11:00 AM", "12:00 PM", "04:00 PM"],
      [dateKeys[2]]: ["10:30 AM", "11:30 AM", "03:00 PM"],
      [dateKeys[3]]: ["09:00 AM", "02:00 PM"],
      [dateKeys[4]]: ["11:00 AM", "04:00 PM"],
      [dateKeys[5]]: ["10:00 AM", "03:00 PM"],
      [dateKeys[6]]: ["09:30 AM", "02:30 PM"]
    },
    bookedSlots: {
      [dateKeys[0]]: ["10:00 AM", "11:00 AM", "02:00 PM"]
    }
  },
  {
    id: "d-5",
    name: "Dr. Sunita Patel",
    department: "Dermatology",
    qualifications: "MBBS, MD (Dermatology)",
    experience: 10,
    rating: 4.6,
    reviewCount: 412,
    consultationFee: 800,
    hospital: "Apollo Hospital, Jubilee Hills",
    specializations: ["Psoriasis", "Eczema", "Cosmetic Dermatology", "Acne Treatment", "Laser Therapy"],
    bio: "Dr. Sunita Patel is a consultant dermatologist specializing in clinical and cosmetic dermatology, experienced in psoriasis, eczema, hair disorders, and advanced cosmetic procedures.",
    availableSlots: {
      [dateKeys[0]]: ["04:00 PM", "05:00 PM"],
      [dateKeys[1]]: ["10:00 AM", "11:00 AM", "02:30 PM"],
      [dateKeys[2]]: ["09:30 AM", "11:30 AM", "04:00 PM"],
      [dateKeys[3]]: ["10:00 AM", "03:00 PM"],
      [dateKeys[4]]: ["09:00 AM", "02:00 PM"],
      [dateKeys[5]]: ["11:00 AM", "04:00 PM"],
      [dateKeys[6]]: ["10:00 AM", "03:30 PM"]
    },
    bookedSlots: {
      [dateKeys[0]]: ["11:30 AM", "02:00 PM"]
    }
  },
  {
    id: "d-6",
    name: "Dr. Meena Sharma",
    department: "Gynecology",
    qualifications: "MBBS, MD (Obstetrics & Gynaecology)",
    experience: 14,
    rating: 4.5,
    reviewCount: 276,
    consultationFee: 700,
    hospital: "Apollo Hospital, Banjara Hills",
    specializations: ["High-Risk Pregnancy", "Laparoscopic Gynaecology", "Menstrual Disorders", "PCOD Management"],
    bio: "Dr. Meena Sharma is a senior gynecologist with a special interest in high-risk pregnancies, laparoscopic surgery, and adolescent health issues.",
    availableSlots: {
      [dateKeys[0]]: ["02:00 PM", "03:00 PM"],
      [dateKeys[1]]: ["10:30 AM", "12:00 PM", "04:30 PM"],
      [dateKeys[2]]: ["09:00 AM", "11:00 AM", "03:00 PM"],
      [dateKeys[3]]: ["10:00 AM", "02:30 PM"],
      [dateKeys[4]]: ["11:30 AM", "03:30 PM"],
      [dateKeys[5]]: ["09:00 AM", "01:00 PM"],
      [dateKeys[6]]: ["10:00 AM", "02:00 PM"]
    },
    bookedSlots: {
      [dateKeys[0]]: ["10:00 AM", "11:00 AM"]
    }
  },
  {
    id: "d-7",
    name: "Dr. Sanjay Gupta",
    department: "ENT",
    qualifications: "MBBS, MS (ENT)",
    experience: 9,
    rating: 4.4,
    reviewCount: 143,
    consultationFee: 600,
    hospital: "Apollo Hospital, Jubilee Hills",
    specializations: ["Sinusitis Treatment", "Hearing Assessment", "Tonsillitis", "Voice Disorders"],
    bio: "Dr. Sanjay Gupta is a dedicated ENT specialist with 9 years of experience, expertise in sinus issues, microscopic ear surgery, and pediatric ENT consultations.",
    availableSlots: {
      [dateKeys[0]]: ["03:30 PM"],
      [dateKeys[1]]: ["10:00 AM", "11:00 AM", "03:00 PM"],
      [dateKeys[2]]: ["09:00 AM", "10:30 AM", "02:30 PM"],
      [dateKeys[3]]: ["11:00 AM", "04:00 PM"],
      [dateKeys[4]]: ["10:00 AM", "03:00 PM"],
      [dateKeys[5]]: ["09:30 AM", "02:00 PM"],
      [dateKeys[6]]: ["10:30 AM", "04:30 PM"]
    },
    bookedSlots: {
      [dateKeys[0]]: ["11:00 AM", "01:30 PM"]
    }
  },
  {
    id: "d-8",
    name: "Dr. Lakshmi Menon",
    department: "Pediatrics",
    qualifications: "MBBS, MD (Pediatrics), DCH",
    experience: 11,
    rating: 4.8,
    reviewCount: 631,
    consultationFee: 700,
    hospital: "Apollo Children Hospital, Hyderabad",
    specializations: ["Neonatal Care", "Immunization", "Childhood Asthma", "Developmental Pediatrics"],
    bio: "Dr. Lakshmi Menon is one of the city's most beloved pediatricians. She is specialized in neonatal care, infectious childhood diseases, and infant developmental tracking.",
    availableSlots: {
      [dateKeys[0]]: ["09:00 AM", "11:00 AM", "01:00 PM"],
      [dateKeys[1]]: ["10:00 AM", "11:30 AM", "02:00 PM"],
      [dateKeys[2]]: ["09:30 AM", "11:00 AM", "04:00 PM"],
      [dateKeys[3]]: ["10:00 AM", "03:00 PM"],
      [dateKeys[4]]: ["09:00 AM", "02:00 PM"],
      [dateKeys[5]]: ["11:00 AM", "04:00 PM"],
      [dateKeys[6]]: ["10:30 AM", "02:30 PM"]
    },
    bookedSlots: {
      [dateKeys[0]]: ["10:00 AM", "12:00 PM"]
    }
  }
];

// 3. DEPARTMENTS Array
export const DEPARTMENTS = [
  "General Medicine",
  "Cardiology",
  "Orthopedics",
  "Dermatology",
  "Neurology",
  "ENT",
  "Gynecology",
  "Pediatrics",
  "Ophthalmology",
  "Dental"
];

// 4. MY_APPOINTMENTS Array
export const MY_APPOINTMENTS = [
  // 2 Upcoming
  {
    id: "apt_001",
    doctorId: "d-1",
    doctorName: "Dr. Rajesh Mehta",
    date: dateKeys[0], // Today
    dateDisplay: "Thursday, 3 July 2026",
    time: "10:00 AM",
    status: "confirmed",
    room: "OPD Room 204",
    bookingId: "APL-2026-0847",
    persona: "working_professional",
    remindersSent: 3,
    totalReminders: 5,
    hospital: "Apollo Hospital, Jubilee Hills",
    fee: 800
  },
  {
    id: "apt_002",
    doctorId: "d-2",
    doctorName: "Dr. Priya Iyer",
    date: dateKeys[4], // Next week
    dateDisplay: "Monday, 7 July 2026",
    time: "04:30 PM",
    status: "pending",
    room: "OPD Room 102",
    bookingId: "APL-2026-0912",
    persona: null,
    remindersSent: 1,
    totalReminders: 3,
    hospital: "Apollo Hospital, Banjara Hills",
    fee: 1000
  },
  // 5 Past
  {
    id: "apt_003",
    doctorId: "d-2",
    doctorName: "Dr. Priya Iyer",
    date: "2026-06-15",
    dateDisplay: "Monday, 15 June 2026",
    time: "11:00 AM",
    status: "completed",
    room: "OPD Room 102",
    bookingId: "APL-2026-0612",
    persona: "working_professional",
    hospital: "Apollo Hospital, Banjara Hills",
    fee: 1000
  },
  {
    id: "apt_004",
    doctorId: "d-3",
    doctorName: "Dr. Kavita Reddy",
    date: "2026-05-28",
    dateDisplay: "Thursday, 28 May 2026",
    time: "09:30 AM",
    status: "missed",
    room: "OPD Room 205",
    bookingId: "APL-2026-0551",
    persona: "student",
    hospital: "Apollo Hospital, Jubilee Hills",
    fee: 500
  },
  {
    id: "apt_005",
    doctorId: "d-6",
    doctorName: "Dr. Meena Sharma",
    date: "2026-05-10",
    dateDisplay: "Sunday, 10 May 2026",
    time: "02:00 PM",
    status: "completed",
    room: "OPD Room 311",
    bookingId: "APL-2026-0498",
    persona: "working_professional",
    hospital: "Apollo Hospital, Banjara Hills",
    fee: 700
  },
  {
    id: "apt_006",
    doctorId: "d-7",
    doctorName: "Dr. Sanjay Gupta",
    date: "2026-04-22",
    dateDisplay: "Wednesday, 22 April 2026",
    time: "11:30 AM",
    status: "cancelled",
    room: "OPD Room 114",
    bookingId: "APL-2026-0329",
    persona: "default",
    hospital: "Apollo Hospital, Jubilee Hills",
    fee: 600
  },
  {
    id: "apt_007",
    doctorId: "d-8",
    doctorName: "Dr. Lakshmi Menon",
    date: "2026-04-05",
    dateDisplay: "Sunday, 5 April 2026",
    time: "10:30 AM",
    status: "completed",
    room: "OPD Room 221",
    bookingId: "APL-2026-0211",
    persona: "default",
    hospital: "Apollo Children Hospital, Hyderabad",
    fee: 700
  }
];

// 5. NOTIFICATIONS Array
export const NOTIFICATIONS = [
  {
    id: "n-1",
    type: "reminder",
    title: "Final Reminder",
    body: "Your appointment is tomorrow at 10 AM. Don't forget!",
    timestamp: "Today, 8:00 AM",
    read: false,
    appointmentId: "apt_001",
    channel: "whatsapp"
  },
  {
    id: "n-2",
    type: "alert",
    title: "Doctor Running Late",
    body: "Dr. Mehta is running 15 minutes late. We'll keep you updated.",
    timestamp: "Today, 9:30 AM",
    read: false,
    appointmentId: "apt_001",
    channel: "sms"
  },
  {
    id: "n-3",
    type: "reminder",
    title: "24-hour Reminder",
    body: "Reminder: appointment tomorrow with Dr. Mehta at 10 AM.",
    timestamp: "Yesterday, 10:00 AM",
    read: true,
    appointmentId: "apt_001",
    channel: "whatsapp"
  },
  {
    id: "n-4",
    type: "reminder",
    title: "48-hour Reminder",
    body: "Plan ahead: your appointment is in 2 days.",
    timestamp: "1 Jul, 10:00 AM",
    read: true,
    appointmentId: "apt_001",
    channel: "whatsapp"
  },
  {
    id: "n-5",
    type: "update",
    title: "Persona Confirmed",
    body: "You've been set up for Working Professional reminders.",
    timestamp: "12 Jun, 2:35 PM",
    read: true,
    appointmentId: "apt_001",
    channel: "sms"
  },
  {
    id: "n-6",
    type: "confirmation",
    title: "Booking Confirmed",
    body: "Your appointment with Dr. Mehta on 3 Jul at 10 AM is confirmed.",
    timestamp: "12 Jun, 2:30 PM",
    read: true,
    appointmentId: "apt_001",
    channel: "whatsapp"
  },
  {
    id: "n-7",
    type: "update",
    title: "Slot Available",
    body: "Good news! A slot opened up with Dr. Iyer on 28 Jun at 3 PM. Book now?",
    timestamp: "10 Jun",
    read: true,
    appointmentId: null,
    channel: "whatsapp",
    actionType: "book"
  },
  {
    id: "n-8",
    type: "update",
    title: "Appointment Completed",
    body: "Your visit with Dr. Nair on 15 May is marked complete. Rate your experience?",
    timestamp: "15 May",
    read: true,
    appointmentId: "apt_003",
    channel: "whatsapp",
    actionType: "rate"
  }
];

// 6. REMINDER_TIMELINE for active appointment
export const REMINDER_TIMELINE = [
  { type: "booking_confirmed", status: "sent", timestamp: "12 Jun, 2:30 PM", channel: "whatsapp", messagePreview: "Booking confirmed for Dr. Rajesh Mehta." },
  { type: "persona_set", status: "replied", timestamp: "12 Jun, 2:35 PM", channel: "whatsapp", messagePreview: "Persona set: Working Professional alerts." },
  { type: "reminder_48h", status: "sent", timestamp: "1 Jul, 10:00 AM", channel: "whatsapp", messagePreview: "Your appointment with Dr. Mehta is in 48 hours." },
  { type: "reminder_24h", status: "sent", timestamp: "2 Jul, 10:00 AM", channel: "whatsapp", messagePreview: "Your appointment with Dr. Mehta is in 24 hours." },
  { type: "reminder_morning", status: "scheduled", timestamp: "3 Jul, 8:00 AM", channel: "whatsapp", messagePreview: "Appointment reminder: Today at 10:00 AM." },
  { type: "reminder_final", status: "scheduled", timestamp: "3 Jul, 9:00 AM", channel: "whatsapp", messagePreview: "Final check-in: Dr. Mehta is on time. Commute Alert active." }
];

// 7. REVIEWS Object (keyed by doctorId)
export const REVIEWS = {
  "d-1": [
    { patientName: "Rohit S.", rating: 5, text: "Dr. Mehta explained everything clearly and made me feel comfortable. Highly recommended for heart issues.", date: "2 months ago" },
    { patientName: "Amrita V.", rating: 4, text: "Very friendly and took the time to answer all questions. Satisfied with the consultation.", date: "3 weeks ago" },
    { patientName: "Jayesh K.", rating: 5, text: "Top-notch diagnostic ability. He guided me very well on lifestyle modifications.", date: "1 month ago" }
  ],
  "d-2": [
    { patientName: "Sumit T.", rating: 5, text: "Excellent orthopedic doctor. Replaced my father's hip successfully.", date: "1 month ago" },
    { patientName: "Pooja D.", rating: 4, text: "Very professional and friendly. Prescribed simple exercises that helped.", date: "2 weeks ago" }
  ],
  "d-3": [
    { patientName: "Tarun B.", rating: 5, text: "Very logical diagnosis, doesn't suggest unnecessary tests.", date: "2 months ago" },
    { patientName: "Megha S.", rating: 4, text: "Good general physician. The queue was long but the checkup was thorough.", date: "3 weeks ago" }
  ]
};

// 8. PERSONA_OPTIONS
export const PERSONA_OPTIONS = [
  {
    id: "working_professional",
    label: "Working Professional",
    icon: "Briefcase",
    description: "I need 48 hours notice to plan leave",
    color: "blue",
    reminderSchedule: "48h + 24h + morning"
  },
  {
    id: "elderly",
    label: "Elderly / Need family help",
    icon: "HeartHandshake",
    description: "Notify my family member",
    color: "purple",
    reminderSchedule: "48h (patient+family) + 24h (family) + 3h (family+cab)"
  },
  {
    id: "student",
    label: "Student",
    icon: "GraduationCap",
    description: "Day before + 1 hour before",
    color: "orange",
    reminderSchedule: "24h + 1h"
  },
  {
    id: "default",
    label: "Other / Custom",
    icon: "Clock",
    description: "Basic reminders only",
    color: "gray",
    reminderSchedule: "24h + 2h"
  }
];

// Helper Functions
export const getDoctorById = (id) => {
  return DOCTORS.find(doc => doc.id === id) || null;
};

export const getDoctorsByDepartment = (dept) => {
  if (!dept || dept.toLowerCase() === 'all') return DOCTORS;
  return DOCTORS.filter(doc => doc.department.toLowerCase() === dept.toLowerCase());
};

export const getAvailableSlots = (doctorId, date) => {
  const doctor = getDoctorById(doctorId);
  if (!doctor || !doctor.availableSlots[date]) return [];
  const booked = doctor.bookedSlots[date] || [];
  return doctor.availableSlots[date].filter(slot => !booked.includes(slot));
};

export const getUpcomingAppointments = () => {
  return MY_APPOINTMENTS.filter(apt => apt.status === 'confirmed' || apt.status === 'pending');
};

export const getPastAppointments = () => {
  return MY_APPOINTMENTS.filter(apt => apt.status === 'completed' || apt.status === 'missed' || apt.status === 'cancelled');
};

export const getUnreadNotificationCount = () => {
  return NOTIFICATIONS.filter(n => !n.read).length;
};
