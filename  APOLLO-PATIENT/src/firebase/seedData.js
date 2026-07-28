import {
  writeBatch,
  doc,
  collection,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from './config.js';
import { COLLECTIONS } from './collections.js';
import { formatPatientId, formatPatientPhone } from '../utils/dataFormat.js';

const doctorsList = [
  {
    id: "doc_001",
    name: "Dr. Rajesh Mehta",
    initials: "RM",
    department: "Cardiology",
    qualifications: "MBBS, MD (Cardiology), FACC",
    experienceYears: 15,
    consultationFee: 800,
    phone: "+919876500001",
    email: "rajesh.mehta@nidaan-one.com",
    rating: 4.9,
    reviewCount: 124,
    hospital: "Nidaan One Clinic, Jubilee Hills",
    bio: "Senior cardiologist specializing in interventional cardiology and heart failure management with over 2000 successful procedures.",
    specializations: ["Interventional Cardiology", "Heart Failure", "Angioplasty", "ECG", "Echocardiography"],
    isAvailable: true,
    offersOnlineConsultation: false,
    onlineConsultationFee: 500
  },
  {
    id: "doc_002",
    name: "Dr. Priya Iyer",
    initials: "PI",
    department: "Orthopedics",
    qualifications: "MBBS, MS (Ortho)",
    experienceYears: 12,
    consultationFee: 1000,
    phone: "+919876500002",
    email: "priya.iyer@nidaan-one.com",
    rating: 4.7,
    reviewCount: 89,
    hospital: "Nidaan One Clinic, Jubilee Hills",
    bio: "Orthopedic surgeon known for minimally invasive joint replacements and sports injury rehabilitation.",
    specializations: ["Joint Replacement", "Sports Injuries", "Spine Surgery", "Fractures"],
    isAvailable: true,
    offersOnlineConsultation: false,
    onlineConsultationFee: 700
  },
  {
    id: "doc_003",
    name: "Dr. Sunil Nair",
    initials: "SN",
    department: "Dermatology",
    qualifications: "MBBS, MD (Derma)",
    experienceYears: 10,
    consultationFee: 600,
    phone: "+919876500003",
    email: "sunil.nair@nidaan-one.com",
    rating: 4.7,
    reviewCount: 156,
    hospital: "Nidaan One Clinic, Jubilee Hills",
    bio: "Dermatologist with expertise in both medical and cosmetic dermatology.",
    specializations: ["Acne", "Eczema", "Psoriasis", "Cosmetic Dermatology"],
    isAvailable: true,
    offersOnlineConsultation: true,
    onlineConsultationFee: 400
  },
  {
    id: "doc_004",
    name: "Dr. Kavita Reddy",
    initials: "KR",
    department: "General Medicine",
    qualifications: "MBBS, MD",
    experienceYears: 8,
    consultationFee: 500,
    phone: "+919876500004",
    email: "kavita.reddy@nidaan-one.com",
    rating: 4.8,
    reviewCount: 203,
    hospital: "Nidaan One Clinic, Jubilee Hills",
    bio: "General physician focused on diabetes management, hypertension control, and preventive health checkups.",
    specializations: ["Diabetes", "Hypertension", "Fever", "Preventive Care"],
    isAvailable: true,
    offersOnlineConsultation: true,
    onlineConsultationFee: 300
  },
  {
    id: "doc_005",
    name: "Dr. Arjun Deshmukh",
    initials: "AD",
    department: "Neurology",
    qualifications: "MBBS, DM (Neuro)",
    experienceYears: 18,
    consultationFee: 1200,
    phone: "+919876500005",
    email: "arjun.deshmukh@nidaan-one.com",
    rating: 4.9,
    reviewCount: 67,
    hospital: "Nidaan One Clinic, Jubilee Hills",
    bio: "Senior neurologist with 18 years of experience in stroke management and epilepsy treatment.",
    specializations: ["Stroke", "Epilepsy", "Migraine", "Movement Disorders"],
    isAvailable: true,
    offersOnlineConsultation: false,
    onlineConsultationFee: 800
  },
  {
    id: "doc_006",
    name: "Dr. Meena Nair",
    initials: "MN",
    department: "Gynecology",
    qualifications: "MBBS, MS (OBG)",
    experienceYears: 14,
    consultationFee: 700,
    phone: "+919876500006",
    email: "meena.nair@nidaan-one.com",
    rating: 4.8,
    reviewCount: 178,
    hospital: "Nidaan One Clinic, Jubilee Hills",
    bio: "Gynecologist specializing in high-risk pregnancies and advanced laparoscopic surgeries.",
    specializations: ["Obstetrics", "PCOS", "Infertility", "Laparoscopy"],
    isAvailable: true,
    offersOnlineConsultation: true,
    onlineConsultationFee: 450
  },
  {
    id: "doc_007",
    name: "Dr. Sanjay Joshi",
    initials: "SJ",
    department: "ENT",
    qualifications: "MBBS, MS (ENT)",
    experienceYears: 9,
    consultationFee: 600,
    phone: "+919876500007",
    email: "sanjay.joshi@nidaan-one.com",
    rating: 4.4,
    reviewCount: 94,
    hospital: "Nidaan One Clinic, Jubilee Hills",
    bio: "ENT specialist treating hearing disorders, chronic sinusitis, and sleep apnea conditions.",
    specializations: ["Sinusitis", "Hearing Loss", "Tonsillitis", "Sleep Apnea"],
    isAvailable: true,
    offersOnlineConsultation: false,
    onlineConsultationFee: 400
  },
  {
    id: "doc_008",
    name: "Dr. Ravi Shankar",
    initials: "RS",
    department: "Pediatrics",
    qualifications: "MBBS, MD (Peds)",
    experienceYears: 11,
    consultationFee: 700,
    phone: "+919876500008",
    email: "ravi.shankar@nidaan-one.com",
    rating: 4.9,
    reviewCount: 312,
    hospital: "Nidaan One Clinic, Jubilee Hills",
    bio: "Pediatrician with expertise in newborn intensive care, childhood vaccinations, and growth monitoring.",
    specializations: ["Newborn Care", "Vaccinations", "Growth Disorders", "Child Nutrition"],
    isAvailable: true,
    offersOnlineConsultation: true,
    onlineConsultationFee: 450
  },
  {
    id: "doc_009",
    name: "Dr. Anita Desai",
    initials: "AN",
    department: "Ophthalmology",
    qualifications: "MBBS, MS (Ophthal)",
    experienceYears: 13,
    consultationFee: 650,
    phone: "+919876500009",
    email: "anita.desai@nidaan-one.com",
    rating: 4.6,
    reviewCount: 142,
    hospital: "Nidaan One Clinic, Jubilee Hills",
    bio: "Ophthalmologist specializing in cataract surgery, glaucoma management, and retinal disorders.",
    specializations: ["Cataract Surgery", "Glaucoma", "Retinal Disorders", "LASIK"],
    isAvailable: true,
    offersOnlineConsultation: false,
    onlineConsultationFee: 450
  },
  {
    id: "doc_010",
    name: "Dr. Vikram Rao",
    initials: "VR",
    department: "Dental",
    qualifications: "BDS, MDS",
    experienceYears: 10,
    consultationFee: 500,
    phone: "+919876500010",
    email: "vikram.rao@nidaan-one.com",
    rating: 4.7,
    reviewCount: 187,
    hospital: "Nidaan One Clinic, Jubilee Hills",
    bio: "Dental surgeon with expertise in root canal treatment, dental implants, and cosmetic dentistry.",
    specializations: ["Root Canal", "Dental Implants", "Cosmetic Dentistry", "Orthodontics"],
    isAvailable: true,
    offersOnlineConsultation: true,
    onlineConsultationFee: 300
  }
];

const getOffsetDateStr = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
};

const todayStr = getOffsetDateStr(0);
const tomorrowStr = getOffsetDateStr(1);
const twoDaysLaterStr = getOffsetDateStr(2);
const yesterdayStr = getOffsetDateStr(-1);
const threeDaysAgoStr = getOffsetDateStr(-3);

const patientsList = [
  {
    id: "919876543210",
    uid: "919876543210",
    name: "Priya Sharma",
    phone: "+919876543210",
    email: "priya.sharma@example.com",
    age: 28,
    gender: "Female",
    city: "Hyderabad",
    bloodGroup: "B+",
    abhaId: "91-8274-1293-8472",
    persona: "working_professional",
    trustScore: 70,
    totalVisits: 6,
    totalNoShows: 2,
    preferences: { whatsapp: true, sms: true, voiceCall: false, email: true }
  },
  {
    id: "919876500021",
    uid: "919876500021",
    name: "Ramesh Gupta",
    phone: "+919876500021",
    email: "ramesh.gupta@example.com",
    age: 68,
    gender: "Male",
    city: "Hyderabad",
    bloodGroup: "A+",
    abhaId: "91-3829-1928-3729",
    persona: "elderly",
    familyContactName: "Aarav Gupta",
    familyContactPhone: "+919876500022",
    familyContactRelation: "Son",
    trustScore: 95,
    totalVisits: 4,
    totalNoShows: 0,
    preferences: { whatsapp: true, sms: true, voiceCall: true, email: false }
  },
  {
    id: "919876500031",
    uid: "919876500031",
    name: "Rahul Sen",
    phone: "+919876500031",
    email: "rahul.sen@example.com",
    age: 21,
    gender: "Male",
    city: "Hyderabad",
    bloodGroup: "O+",
    abhaId: "91-2391-2381-8293",
    persona: "student",
    trustScore: 90,
    totalVisits: 2,
    totalNoShows: 0,
    preferences: { whatsapp: true, sms: false, voiceCall: false, email: true }
  },
  {
    id: "919876500041",
    uid: "919876500041",
    name: "Karan Malhotra",
    phone: "+919876500041",
    email: "karan.malhotra@example.com",
    age: 35,
    gender: "Male",
    city: "Hyderabad",
    bloodGroup: "AB+",
    abhaId: "91-1029-3948-2831",
    persona: "working_professional",
    trustScore: 85,
    totalVisits: 10,
    totalNoShows: 1,
    preferences: { whatsapp: true, sms: true, voiceCall: false, email: true }
  },
  {
    id: "919876500051",
    uid: "919876500051",
    name: "Meera Deshmukh",
    phone: "+919876500051",
    email: "meera.deshmukh@example.com",
    age: 72,
    gender: "Female",
    city: "Hyderabad",
    bloodGroup: "O-",
    abhaId: "91-4829-1029-3849",
    persona: "elderly",
    familyContactName: "Sanjay Deshmukh",
    familyContactPhone: "+919876500052",
    familyContactRelation: "Son",
    trustScore: 60,
    totalVisits: 8,
    totalNoShows: 3,
    preferences: { whatsapp: true, sms: true, voiceCall: true, email: true }
  },
  {
    id: "919876543212",
    uid: "919876543212",
    name: "sahil pandey",
    phone: "+919876543212",
    email: "sahil.pandey@example.com",
    age: 20,
    gender: "Male",
    city: "Hyderabad",
    bloodGroup: "B-",
    abhaId: "91-2309-1293-8472",
    persona: "student",
    trustScore: 85,
    totalVisits: 1,
    totalNoShows: 0,
    preferences: { whatsapp: true, sms: false, voiceCall: false, email: false }
  },
  {
    id: "919876500061",
    uid: "919876500061",
    name: "Rohan Verma",
    phone: "+919876500061",
    email: "rohan.verma@example.com",
    age: 32,
    gender: "Male",
    city: "Hyderabad",
    bloodGroup: "A-",
    abhaId: "91-3829-1029-2384",
    persona: "working_professional",
    trustScore: 95,
    totalVisits: 3,
    totalNoShows: 0,
    preferences: { whatsapp: true, sms: true, voiceCall: false, email: false }
  },
  {
    id: "919876500071",
    uid: "919876500071",
    name: "Shreya Ghoshal",
    phone: "+919876500071",
    email: "shreya.ghoshal@example.com",
    age: 22,
    gender: "Female",
    city: "Hyderabad",
    bloodGroup: "AB-",
    abhaId: "91-1029-2039-3829",
    persona: "student",
    trustScore: 80,
    totalVisits: 5,
    totalNoShows: 1,
    preferences: { whatsapp: true, sms: false, voiceCall: false, email: true }
  },
  {
    id: "919876500081",
    uid: "919876500081",
    name: "Amit Patel",
    phone: "+919876500081",
    email: "amit.patel@example.com",
    age: 29,
    gender: "Male",
    city: "Hyderabad",
    bloodGroup: "O+",
    abhaId: "91-4920-1928-3829",
    persona: "working_professional",
    trustScore: 90,
    totalVisits: 1,
    totalNoShows: 0,
    preferences: { whatsapp: true, sms: true, voiceCall: false, email: true }
  },
  {
    id: "919876500091",
    uid: "919876500091",
    name: "Deepa Sen",
    phone: "+919876500091",
    email: "deepa.sen@example.com",
    age: 70,
    gender: "Female",
    city: "Hyderabad",
    bloodGroup: "B+",
    abhaId: "91-2394-1928-3928",
    persona: "elderly",
    familyContactName: "Raj Sen",
    familyContactPhone: "+919876500092",
    familyContactRelation: "Son",
    trustScore: 95,
    totalVisits: 4,
    totalNoShows: 0,
    preferences: { whatsapp: true, sms: true, voiceCall: true, email: false }
  }
];

const appointmentsList = [
  {
    id: "appt_1",
    patientId: "919876543210",
    doctorId: "doc_001",
    doctorName: "Dr. Rajesh Mehta",
    department: "Cardiology",
    appointmentDate: todayStr,
    appointmentTime: "10:30 AM",
    leadTimeDays: 20,
    status: "confirmed",
    consultationFee: 800,
    riskScore: 84,
    riskLevel: "HIGH",
    persona: "working_professional",
    familyNotified: false,
    reminderSent48h: true,
    reminderSent24h: true,
    reminderSentMorning: true,
    reminderSentFinal: false,
    patientConfirmed: false,
    bookingId: "APL-2026-1049",
    hospital: "Nidaan One Clinic, Jubilee Hills",
    room: "Cabin 104, First Floor",
    notes: "Follow up checkup for high pulse rate logs.",
    cancelledReason: "",
    weatherRainUsed: true,
    trafficScore: 0.85
  },
  {
    id: "appt_2",
    patientId: "919876500021",
    doctorId: "doc_004",
    doctorName: "Dr. Kavita Reddy",
    department: "General Medicine",
    appointmentDate: todayStr,
    appointmentTime: "11:30 AM",
    leadTimeDays: 2,
    status: "confirmed",
    consultationFee: 500,
    riskScore: 18,
    riskLevel: "LOW",
    persona: "elderly",
    familyNotified: true,
    reminderSent48h: true,
    reminderSent24h: true,
    reminderSentMorning: true,
    reminderSentFinal: false,
    patientConfirmed: true,
    bookingId: "APL-2026-8839",
    hospital: "Nidaan One Clinic, Jubilee Hills",
    room: "Cabin 112, First Floor",
    notes: "Elderly health monitoring check.",
    cancelledReason: "",
    weatherRainUsed: false,
    trafficScore: 0.25
  },
  {
    id: "appt_3",
    patientId: "919876500031",
    doctorId: "doc_003",
    doctorName: "Dr. Sunil Nair",
    department: "Dermatology",
    appointmentDate: todayStr,
    appointmentTime: "02:30 PM",
    leadTimeDays: 1,
    status: "confirmed",
    consultationFee: 600,
    riskScore: 12,
    riskLevel: "LOW",
    persona: "student",
    familyNotified: false,
    reminderSent48h: false,
    reminderSent24h: true,
    reminderSentMorning: true,
    reminderSentFinal: false,
    patientConfirmed: true,
    bookingId: "APL-2026-0392",
    hospital: "Nidaan One Clinic, Jubilee Hills",
    room: "Cabin 209, Second Floor",
    notes: "Allergy follow up.",
    cancelledReason: ""
  },
  {
    id: "appt_4",
    patientId: "919876543212",
    doctorId: "doc_005",
    doctorName: "Dr. Arjun Deshmukh",
    department: "Neurology",
    appointmentDate: todayStr,
    appointmentTime: "10:00 AM",
    leadTimeDays: 3,
    status: "confirmed",
    consultationFee: 1200,
    riskScore: 50,
    riskLevel: "MEDIUM",
    persona: "student",
    familyNotified: false,
    reminderSent48h: false,
    reminderSent24h: true,
    reminderSentMorning: true,
    reminderSentFinal: false,
    patientConfirmed: true,
    bookingId: "APL-2026-9284",
    hospital: "Nidaan One Clinic, Jubilee Hills",
    room: "Cabin 328, Third Floor",
    notes: "Migraine consult.",
    cancelledReason: ""
  },
  {
    id: "appt_open_1",
    patientId: "919876500061",
    doctorId: "doc_001",
    doctorName: "Dr. Rajesh Mehta",
    department: "Cardiology",
    appointmentDate: todayStr,
    appointmentTime: "09:00 AM",
    leadTimeDays: 15,
    status: "rescheduled",
    consultationFee: 800,
    riskScore: 78,
    riskLevel: "HIGH",
    persona: "working_professional",
    familyNotified: false,
    reminderSent48h: true,
    reminderSent24h: true,
    reminderSentMorning: false,
    reminderSentFinal: false,
    patientConfirmed: false,
    bookingId: "APL-2026-0921",
    hospital: "Nidaan One Clinic, Jubilee Hills",
    room: "Cabin 104, First Floor",
    notes: "Regular cardiology check.",
    cancelledReason: "Cancelled via WhatsApp reply '2'"
  },
  {
    id: "appt_open_2",
    patientId: "919876500051",
    doctorId: "doc_002",
    doctorName: "Dr. Priya Iyer",
    department: "Orthopedics",
    appointmentDate: todayStr,
    appointmentTime: "02:00 PM",
    leadTimeDays: 5,
    status: "cancelled",
    consultationFee: 1000,
    riskScore: 82,
    riskLevel: "HIGH",
    persona: "elderly",
    familyNotified: false,
    reminderSent48h: true,
    reminderSent24h: true,
    reminderSentMorning: false,
    reminderSentFinal: false,
    patientConfirmed: false,
    bookingId: "APL-2026-3829",
    hospital: "Nidaan One Clinic, Jubilee Hills",
    room: "Cabin 305, Third Floor",
    notes: "Joint recovery consult.",
    cancelledReason: "Rescheduled due to traffic congestion"
  },
  {
    id: "appt_upcoming_1",
    patientId: "919876500041",
    doctorId: "doc_002",
    doctorName: "Dr. Priya Iyer",
    department: "Orthopedics",
    appointmentDate: tomorrowStr,
    appointmentTime: "09:30 AM",
    leadTimeDays: 5,
    status: "confirmed",
    consultationFee: 1000,
    riskScore: 45,
    riskLevel: "MEDIUM",
    persona: "working_professional",
    familyNotified: false,
    reminderSent48h: true,
    reminderSent24h: false,
    reminderSentMorning: false,
    reminderSentFinal: false,
    patientConfirmed: false,
    bookingId: "APL-2026-2819",
    hospital: "Nidaan One Clinic, Jubilee Hills",
    room: "Cabin 305, Third Floor",
    notes: "Post fracture checkup.",
    cancelledReason: ""
  },
  {
    id: "appt_upcoming_2",
    patientId: "919876500051",
    doctorId: "doc_005",
    doctorName: "Dr. Arjun Deshmukh",
    department: "Neurology",
    appointmentDate: tomorrowStr,
    appointmentTime: "04:00 PM",
    leadTimeDays: 14,
    status: "confirmed",
    consultationFee: 1200,
    riskScore: 78,
    riskLevel: "HIGH",
    persona: "elderly",
    familyNotified: false,
    reminderSent48h: true,
    reminderSent24h: false,
    reminderSentMorning: false,
    reminderSentFinal: false,
    patientConfirmed: false,
    bookingId: "APL-2026-4829",
    hospital: "Nidaan One Clinic, Jubilee Hills",
    room: "Cabin 328, Third Floor",
    notes: "Parkinsons routine consulting.",
    cancelledReason: ""
  },
  {
    id: "appt_upcoming_3",
    patientId: "919876500091",
    doctorId: "doc_004",
    doctorName: "Dr. Kavita Reddy",
    department: "General Medicine",
    appointmentDate: twoDaysLaterStr,
    appointmentTime: "11:00 AM",
    leadTimeDays: 3,
    status: "confirmed",
    consultationFee: 500,
    riskScore: 15,
    riskLevel: "LOW",
    persona: "elderly",
    familyNotified: true,
    reminderSent48h: true,
    reminderSent24h: false,
    reminderSentMorning: false,
    reminderSentFinal: false,
    patientConfirmed: true,
    bookingId: "APL-2026-1029",
    hospital: "Nidaan One Clinic, Jubilee Hills",
    room: "Cabin 112, First Floor",
    notes: "Diabetes tracker panel.",
    cancelledReason: ""
  },
  {
    id: "appt_past_1",
    patientId: "919876543210",
    doctorId: "doc_001",
    doctorName: "Dr. Rajesh Mehta",
    department: "Cardiology",
    appointmentDate: yesterdayStr,
    appointmentTime: "10:00 AM",
    leadTimeDays: 3,
    status: "completed",
    consultationFee: 800,
    riskScore: 12,
    riskLevel: "LOW",
    persona: "working_professional",
    familyNotified: false,
    reminderSent48h: true,
    reminderSent24h: true,
    reminderSentMorning: true,
    reminderSentFinal: true,
    patientConfirmed: true,
    bookingId: "APL-2026-0182",
    hospital: "Nidaan One Clinic, Jubilee Hills",
    room: "Cabin 104, First Floor",
    notes: "Routine ECG screening.",
    cancelledReason: ""
  },
  {
    id: "appt_past_2",
    patientId: "919876500041",
    doctorId: "doc_002",
    doctorName: "Dr. Priya Iyer",
    department: "Orthopedics",
    appointmentDate: threeDaysAgoStr,
    appointmentTime: "10:30 AM",
    leadTimeDays: 1,
    status: "completed",
    consultationFee: 1000,
    riskScore: 22,
    riskLevel: "LOW",
    persona: "working_professional",
    familyNotified: false,
    reminderSent48h: true,
    reminderSent24h: true,
    reminderSentMorning: true,
    reminderSentFinal: true,
    patientConfirmed: true,
    bookingId: "APL-2026-0391",
    hospital: "Nidaan One Clinic, Jubilee Hills",
    room: "Cabin 305, Third Floor",
    notes: "Plaster cast check.",
    cancelledReason: ""
  },
  {
    id: "appt_past_3",
    patientId: "919876500051",
    doctorId: "doc_005",
    doctorName: "Dr. Arjun Deshmukh",
    department: "Neurology",
    appointmentDate: yesterdayStr,
    appointmentTime: "03:30 PM",
    leadTimeDays: 5,
    status: "no_show",
    consultationFee: 1200,
    riskScore: 82,
    riskLevel: "HIGH",
    persona: "elderly",
    familyNotified: false,
    reminderSent48h: true,
    reminderSent24h: true,
    reminderSentMorning: true,
    reminderSentFinal: true,
    patientConfirmed: false,
    bookingId: "APL-2026-9281",
    hospital: "Nidaan One Clinic, Jubilee Hills",
    room: "Cabin 328, Third Floor",
    notes: "Tremors consult.",
    cancelledReason: ""
  }
];

const notificationsList = [
  {
    id: "notif_1",
    patientId: "919876543210",
    type: "results",
    title: "Lab results uploaded",
    body: "Your blood panel results from June 28 are now available for review.",
    unread: true,
    appointmentId: null,
    channel: "system",
    actionType: "view"
  },
  {
    id: "notif_2",
    patientId: "919876543210",
    type: "confirmed",
    title: "Appointment Confirmed",
    body: "Dr. Rajesh Mehta has confirmed your appointment for today at 10:30 AM.",
    unread: true,
    appointmentId: "appt_1",
    channel: "whatsapp",
    actionType: "confirm"
  }
];

const waitlistList = [
  {
    id: "wl_1",
    patientId: "919876500061",
    doctorId: "doc_001",
    preferredDate: todayStr,
    preferredTimeMorning: true,
    preferredTimeAfternoon: false,
    preferredTimeEvening: true,
    status: "waiting",
    notifiedAt: null
  },
  {
    id: "wl_2",
    patientId: "919876500071",
    doctorId: "doc_001",
    preferredDate: todayStr,
    preferredTimeMorning: true,
    preferredTimeAfternoon: true,
    preferredTimeEvening: false,
    status: "waiting",
    notifiedAt: null
  },
  {
    id: "wl_3",
    patientId: "919876500081",
    doctorId: "doc_002",
    preferredDate: todayStr,
    preferredTimeMorning: true,
    preferredTimeAfternoon: true,
    preferredTimeEvening: true,
    status: "waiting",
    notifiedAt: null
  },
  {
    id: "wl_4",
    patientId: "919876500091",
    doctorId: "doc_002",
    preferredDate: todayStr,
    preferredTimeMorning: true,
    preferredTimeAfternoon: true,
    preferredTimeEvening: true,
    status: "notified",
    notifiedAt: yesterdayStr
  }
];

// Helper to chunk arrays and write to Firestore using Batches (avoiding 500 limit)
async function writeInChunks(collectionName, items) {
  const CHUNK_SIZE = 400;
  let count = 0;
  
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    
    chunk.forEach((item) => {
      const docId = item.id;
      const dataToSave = { ...item };
      
      if (!dataToSave.createdAt) {
        dataToSave.createdAt = Timestamp.now();
      }
      if (!dataToSave.updatedAt) {
        dataToSave.updatedAt = Timestamp.now();
      }
      
      const docRef = docId 
        ? doc(db, collectionName, docId) 
        : doc(collection(db, collectionName));
      
      if (dataToSave.id) {
        delete dataToSave.id;
      }
      
      batch.set(docRef, dataToSave);
      count++;
    });
    
    await batch.commit();
  }
  
  return count;
}

// Clear a collection
async function clearCollection(collectionName) {
  const querySnapshot = await getDocs(collection(db, collectionName));
  const batch = writeBatch(db);
  
  querySnapshot.forEach((document) => {
    batch.delete(doc(db, collectionName, document.id));
  });
  
  await batch.commit();
  return querySnapshot.size;
}

// Main seeder function
export async function seedDatabase() {
  const logs = {};

  try {
    console.log("Clearing existing collections...");
    await clearCollection(COLLECTIONS.DOCTORS);
    await clearCollection(COLLECTIONS.DOCTOR_SLOTS);
    await clearCollection(COLLECTIONS.PATIENTS);
    await clearCollection(COLLECTIONS.APPOINTMENTS);
    await clearCollection(COLLECTIONS.NOTIFICATIONS);
    await clearCollection(COLLECTIONS.WAITLIST);

    console.log("Seeding doctors...");
    logs.doctors = await writeInChunks(COLLECTIONS.DOCTORS, doctorsList);

    console.log("Generating doctor slots...");
    const slots = [];
    const timeSlots = [
      "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
      "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "05:00 PM", "05:30 PM"
    ];

    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const d = new Date();
      d.setDate(d.getDate() + dayOffset);
      const dateString = d.toISOString().split('T')[0]; // YYYY-MM-DD

      doctorsList.forEach((doctor) => {
        timeSlots.forEach((time) => {
          // 25% slots randomly marked unavailable
          const isAvailable = Math.random() >= 0.25;
          const slotId = `${doctor.id}_${dateString}_${time.replace(' ', '')}`;
          slots.push({
            id: slotId,
            doctorId: doctor.id,
            date: dateString,
            time: time,
            isAvailable: isAvailable,
            appointmentId: null,
            slotType: "regular"
          });
        });
      });
    }

    console.log(`Writing ${slots.length} doctor slots...`);
    logs.doctor_slots = await writeInChunks(COLLECTIONS.DOCTOR_SLOTS, slots);

    console.log("Seeding patients...");
    logs.patients = await writeInChunks(COLLECTIONS.PATIENTS, patientsList);

    console.log("Seeding appointments...");
    logs.appointments = await writeInChunks(COLLECTIONS.APPOINTMENTS, appointmentsList);

    console.log("Seeding notifications...");
    logs.notifications = await writeInChunks(COLLECTIONS.NOTIFICATIONS, notificationsList);

    console.log("Seeding waitlist...");
    logs.waitlist = await writeInChunks(COLLECTIONS.WAITLIST, waitlistList);

    console.log("Database seeding completed successfully!", logs);
    return { success: true, logs };
  } catch (error) {
    console.error("Seeding failed: ", error);
    throw error;
  }
}
