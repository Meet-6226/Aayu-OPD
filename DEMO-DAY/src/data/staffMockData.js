// ─── Comprehensive Mock Data File for Apollo OPD Intelligence ───

// 1. PATIENTS ARRAY (15 patients)
export const PATIENTS = [
  {
    id: 'p-1',
    name: 'Priya Sharma',
    phone: '+91 98765 43210',
    age: 34,
    gender: 'F',
    email: 'priya.sharma@gmail.com',
    persona: 'working_professional',
    trustScore: 45,
    pastVisits: 6,
    pastNoShows: 2,
    distance: 38,
    abhaId: '4521-8965-0214-3658',
    address: 'Flat 402, Signature Towers, Gachibowli, Hyderabad'
  },
  {
    id: 'p-2',
    name: 'Rajesh Kumar',
    phone: '+91 87654 32109',
    age: 45,
    gender: 'M',
    email: 'rajesh.kumar@yahoo.com',
    persona: 'default',
    trustScore: 85,
    pastVisits: 12,
    pastNoShows: 0,
    distance: 15,
    abhaId: '8956-2354-1025-4785',
    address: 'H-56, Shanti Nagar, Secunderabad, Hyderabad'
  },
  {
    id: 'p-3',
    name: 'Ramesh Gupta',
    phone: '+91 76543 21098',
    age: 68,
    gender: 'M',
    email: 'ramesh.gupta@rediffmail.com',
    persona: 'elderly',
    familyContact: { name: 'Mrs. Gupta', phone: '+91 98765 43211', relation: 'Spouse' },
    trustScore: 38,
    pastVisits: 8,
    pastNoShows: 3,
    distance: 22,
    abhaId: '7845-9658-3214-1025',
    address: 'Plot 12, Jubilee Hills Road No. 4, Hyderabad'
  },
  {
    id: 'p-4',
    name: 'Sneha Patil',
    phone: '+91 65432 10987',
    age: 21,
    gender: 'F',
    email: 'sneha.patil@outlook.com',
    persona: 'student',
    trustScore: 92,
    pastVisits: 4,
    pastNoShows: 0,
    distance: 8,
    abhaId: '1025-7845-9658-3214',
    address: 'Room 304, Girls Hostel, IIIT Hyderabad, Gachibowli'
  },
  {
    id: 'p-5',
    name: 'Ankit Verma',
    phone: '+91 54321 09876',
    age: 29,
    gender: 'M',
    email: 'ankit.verma@gmail.com',
    persona: 'working_professional',
    trustScore: 65,
    pastVisits: 5,
    pastNoShows: 1,
    distance: 18,
    abhaId: '3214-1025-7845-9658',
    address: 'A-201, Maple Leaves, Kondapur, Hyderabad'
  },
  {
    id: 'p-6',
    name: 'Dr. Kavita Reddy',
    phone: '+91 43210 98765',
    age: 52,
    gender: 'F',
    email: 'kavita.reddy@apollo.com',
    persona: 'default',
    trustScore: 98,
    pastVisits: 15,
    pastNoShows: 0,
    distance: 4,
    abhaId: '9658-3214-1025-7845',
    address: 'Doctors Colony, Film Nagar, Hyderabad'
  },
  {
    id: 'p-7',
    name: 'Mohammed Irfan',
    phone: '+91 32109 87654',
    age: 41,
    gender: 'M',
    email: 'irfan.med@gmail.com',
    persona: 'working_professional',
    trustScore: 72,
    pastVisits: 7,
    pastNoShows: 1,
    distance: 12,
    abhaId: '1025-3214-7845-9658',
    address: 'Flat 102, Al-Safa Heights, Mehdipatnam, Hyderabad'
  },
  {
    id: 'p-8',
    name: 'Lakshmi Nair',
    phone: '+91 21098 76543',
    age: 58,
    gender: 'F',
    email: 'lakshmi.nair@gmail.com',
    persona: 'default',
    trustScore: 88,
    pastVisits: 9,
    pastNoShows: 0,
    distance: 14,
    abhaId: '9658-7845-3214-1025',
    address: 'B-44, Hill Ridge Springs, Gachibowli, Hyderabad'
  },
  {
    id: 'p-9',
    name: 'Arjun Desai',
    phone: '+91 99887 76655',
    age: 27,
    gender: 'M',
    email: 'arjun.desai@yahoo.com',
    persona: 'student',
    trustScore: 75,
    pastVisits: 3,
    pastNoShows: 0,
    distance: 9,
    abhaId: '3214-7845-9658-1025',
    address: 'Hostel 5, HCU Campus, Gachibowli, Hyderabad'
  },
  {
    id: 'p-10',
    name: 'Pooja Joshi',
    phone: '+91 88776 65544',
    age: 31,
    gender: 'F',
    email: 'pooja.joshi@gmail.com',
    persona: 'working_professional',
    trustScore: 50,
    pastVisits: 5,
    pastNoShows: 2,
    distance: 26,
    abhaId: '7845-3214-1025-9658',
    address: 'Flat 508, Pearl Court, Madhapur, Hyderabad'
  },
  {
    id: 'p-11',
    name: 'Suresh Rao',
    phone: '+91 77665 54433',
    age: 72,
    gender: 'M',
    email: 'suresh.rao@outlook.com',
    persona: 'elderly',
    familyContact: { name: 'Dr. Anand Rao', phone: '+91 99887 76650', relation: 'Son' },
    trustScore: 55,
    pastVisits: 10,
    pastNoShows: 2,
    distance: 16,
    abhaId: '1025-9658-7845-3214',
    address: 'Plot 88, Vayu Nagar, Sainikpuri, Secunderabad'
  },
  {
    id: 'p-12',
    name: 'Neha Kapoor',
    phone: '+91 66554 43322',
    age: 24,
    gender: 'F',
    email: 'neha.kapoor@gmail.com',
    persona: 'student',
    trustScore: 95,
    pastVisits: 6,
    pastNoShows: 0,
    distance: 6,
    abhaId: '9658-1025-3214-7845',
    address: 'Kavuri Hills, Madhapur, Hyderabad'
  },
  {
    id: 'p-13',
    name: 'Vikram Singh',
    phone: '+91 55443 32211',
    age: 39,
    gender: 'M',
    email: 'vikram.singh@gmail.com',
    persona: 'working_professional',
    trustScore: 78,
    pastVisits: 8,
    pastNoShows: 1,
    distance: 19,
    abhaId: '3214-9658-1025-7845',
    address: 'Road No 12, Banjara Hills, Hyderabad'
  },
  {
    id: 'p-14',
    name: 'Deepika Menon',
    phone: '+91 44332 21100',
    age: 46,
    gender: 'F',
    email: 'deepika.menon@gmail.com',
    persona: 'default',
    trustScore: 80,
    pastVisits: 7,
    pastNoShows: 0,
    distance: 13,
    abhaId: '7845-1025-9658-3214',
    address: 'Miyapur Main Road, Hyderabad'
  },
  {
    id: 'p-15',
    name: 'Ravi Teja',
    phone: '+91 33221 10099',
    age: 33,
    gender: 'M',
    email: 'ravi.teja@gmail.com',
    persona: 'working_professional',
    trustScore: 82,
    pastVisits: 9,
    pastNoShows: 1,
    distance: 11,
    abhaId: '1025-7845-3214-9658',
    address: 'Kukatpally Housing Board Colony, Hyderabad'
  }
];



// 2. APPOINTMENTS ARRAY (24 appointments for today)
export const APPOINTMENTS = [
  {
    id: 'apt-1',
    patientId: 'p-1',
    doctorId: 'd-1',
    date: '2026-07-03',
    time: '10:00 AM',
    department: 'Cardiology',
    riskScore: 84,
    riskLevel: 'HIGH',
    status: 'pending',
    shapFactors: [
      { feature: 'Distance from hospital', impact: 32, direction: 'positive', detail: '38 km away' },
      { feature: 'Past no-shows', impact: 28, direction: 'positive', detail: '2 of 6 visits' },
      { feature: 'Lead time', impact: 18, direction: 'positive', detail: 'Booked 21 days ago' },
      { feature: 'Weather forecast', impact: 6, direction: 'positive', detail: 'Rain predicted' }
    ],
    reminderChain: [
      { type: 'booking_confirmation', status: 'sent', timestamp: '12 Jun, 2:30 PM', channel: 'whatsapp' },
      { type: 'persona_selection', status: 'replied', timestamp: '12 Jun, 2:35 PM', reply: '1' },
      { type: '48hr_reminder', status: 'sent', timestamp: '1 Jul, 10:00 AM' },
      { type: '24hr_reminder', status: 'sent', timestamp: '2 Jul, 10:00 AM' },
      { type: 'morning_reminder', status: 'scheduled', timestamp: '3 Jul, 8:00 AM' }
    ],
    consultationFee: 1500
  },
  {
    id: 'apt-2',
    patientId: 'p-2',
    doctorId: 'd-2',
    date: '2026-07-03',
    time: '10:30 AM',
    department: 'Orthopedics',
    riskScore: 32,
    riskLevel: 'LOW',
    status: 'confirmed',
    shapFactors: [
      { feature: 'Weekday', impact: 12, direction: 'positive', detail: 'Thursday' },
      { feature: 'Age factor', impact: -8, direction: 'negative', detail: '45 yrs old' }
    ],
    reminderChain: [
      { type: 'booking_confirmation', status: 'sent', timestamp: '20 Jun, 10:00 AM', channel: 'whatsapp' },
      { type: '48hr_reminder', status: 'sent', timestamp: '1 Jul, 10:30 AM' }
    ],
    consultationFee: 1200
  },
  {
    id: 'apt-3',
    patientId: 'p-3',
    doctorId: 'd-1',
    date: '2026-07-03',
    time: '11:00 AM',
    department: 'Cardiology',
    riskScore: 71,
    riskLevel: 'HIGH',
    status: 'pending',
    shapFactors: [
      { feature: 'Past no-shows', impact: 42, direction: 'positive', detail: '3 of 8 visits' },
      { feature: 'Age factor', impact: 24, direction: 'positive', detail: '68 yrs old' },
      { feature: 'Distance from hospital', impact: 15, direction: 'positive', detail: '22 km away' }
    ],
    reminderChain: [
      { type: 'booking_confirmation', status: 'sent', timestamp: '15 Jun, 11:00 AM', channel: 'whatsapp' },
      { type: 'family_notification', status: 'sent', timestamp: '15 Jun, 11:15 AM', familyMember: 'Mrs. Gupta' },
      { type: '48hr_reminder', status: 'sent', timestamp: '1 Jul, 11:00 AM' }
    ],
    consultationFee: 1500
  },
  {
    id: 'apt-4',
    patientId: 'p-4',
    doctorId: 'd-4',
    date: '2026-07-03',
    time: '11:30 AM',
    department: 'General Medicine',
    riskScore: 15,
    riskLevel: 'LOW',
    status: 'confirmed',
    shapFactors: [
      { feature: 'Distance', impact: -18, direction: 'negative', detail: '8 km away' },
      { feature: 'Med adherence', impact: -10, direction: 'negative', detail: 'High' }
    ],
    reminderChain: [
      { type: 'booking_confirmation', status: 'sent', timestamp: '2 Jul, 11:30 AM', channel: 'whatsapp' }
    ],
    consultationFee: 800
  },
  {
    id: 'apt-5',
    patientId: 'p-5',
    doctorId: 'd-5',
    date: '2026-07-03',
    time: '12:00 PM',
    department: 'Neurology',
    riskScore: 55,
    riskLevel: 'MEDIUM',
    status: 'pending',
    shapFactors: [
      { feature: 'Traffic load', impact: 18, direction: 'positive', detail: 'Kondapur route' },
      { feature: 'Past cancellations', impact: 15, direction: 'positive', detail: '1 cancellation' }
    ],
    reminderChain: [
      { type: 'booking_confirmation', status: 'sent', timestamp: '1 Jul, 12:00 PM', channel: 'whatsapp' }
    ],
    consultationFee: 1800
  },
  // Adding cancelled slots for slot recovery simulation
  {
    id: 'apt-6',
    patientId: 'p-10',
    doctorId: 'd-1',
    date: '2026-07-03',
    time: '11:00 AM',
    department: 'Cardiology',
    riskScore: 82,
    riskLevel: 'HIGH',
    status: 'cancelled',
    shapFactors: [],
    reminderChain: [],
    consultationFee: 2500
  },
  {
    id: 'apt-7',
    patientId: 'p-13',
    doctorId: 'd-1',
    date: '2026-07-03',
    time: '01:00 PM',
    department: 'Cardiology',
    riskScore: 48,
    riskLevel: 'MEDIUM',
    status: 'rescheduled',
    shapFactors: [],
    reminderChain: [],
    consultationFee: 1800
  },
  // Adding walk-ins
  {
    id: 'apt-8',
    patientId: 'p-12',
    doctorId: 'd-1',
    date: '2026-07-03',
    time: '09:45 AM',
    department: 'Cardiology',
    riskScore: 12,
    riskLevel: 'LOW',
    status: 'walk-in',
    shapFactors: [],
    reminderChain: [],
    consultationFee: 1500
  },
  {
    id: 'apt-9',
    patientId: 'p-6',
    doctorId: 'd-4',
    date: '2026-07-03',
    time: '10:15 AM',
    department: 'General Medicine',
    riskScore: 8,
    riskLevel: 'LOW',
    status: 'walk-in',
    shapFactors: [],
    reminderChain: [],
    consultationFee: 800
  },
  // Rest of 24 appointments populated to fill total list
  ...Array.from({ length: 15 }).map((_, idx) => {
    const patientIdx = (idx % 12) + 3; // avoid Priya, Rajesh, Ramesh
    const docIdx = idx % 5;
    const departments = ['Cardiology', 'Orthopedics', 'Dermatology', 'General Medicine', 'Neurology'];
    const p = PATIENTS[patientIdx];
    const riskScore = Math.floor(Math.random() * 50) + 15;
    const riskLevel = riskScore > 70 ? 'HIGH' : riskScore > 40 ? 'MEDIUM' : 'LOW';

    return {
      id: `apt-auto-${idx}`,
      patientId: p.id,
      doctorId: `d-${docIdx + 1}`,
      date: '2026-07-03',
      time: `${(idx % 4) + 2}:00 PM`,
      department: departments[docIdx],
      riskScore,
      riskLevel,
      status: 'confirmed',
      shapFactors: [
        { feature: 'Distance', impact: 10, direction: 'positive', detail: 'Local transit' }
      ],
      reminderChain: [],
      consultationFee: 1000 + (docIdx * 200)
    };
  })
];

export const appointments = APPOINTMENTS;

// 3. DOCTORS ARRAY (5 doctors)
export const DOCTORS = [
  { id: 'd-1', name: 'Dr. Rajesh Mehta', department: 'Cardiology', avatar: 'RM', totalSlots: 12, filledSlots: 10, specialization: 'Heart Failure & Valvular Diseases', color: '#1b504c', available: true },
  { id: 'd-2', name: 'Dr. Priya Iyer', department: 'Orthopedics', avatar: 'PI', totalSlots: 12, filledSlots: 8, specialization: 'Joint Replacement & Spine Surgery', color: '#7c3aed', available: true },
  { id: 'd-3', name: 'Dr. Sunil Nair', department: 'Dermatology', avatar: 'SN', totalSlots: 12, filledSlots: 6, specialization: 'Clinical & Cosmetic Dermatology', color: '#ea580c', available: false },
  { id: 'd-4', name: 'Dr. Kavita Reddy', department: 'General Medicine', avatar: 'KR', totalSlots: 12, filledSlots: 11, specialization: 'Internal Medicine & Diabetology', color: '#0284c7', available: true },
  { id: 'd-5', name: 'Dr. Arjun Deshmukh', department: 'Neurology', avatar: 'AD', totalSlots: 12, filledSlots: 9, specialization: 'Stroke & Neuro-rehabilitation', color: '#be185d', available: true }
];

export const doctors = DOCTORS;

// 4. WAITLIST ARRAY (8 patients waiting)
export const WAITLIST = [
  { id: 'w-1', name: 'Rahul Verma', phone: '+91 98989 89898', condition: 'Chest Discomfort', waitingSince: '2 days', priority: 'high', doctorId: 'd-1', risk: 12, riskLevel: 'LOW' },
  { id: 'w-2', name: 'Meera Singh', phone: '+91 87878 78787', condition: 'Severe Joint Pain', waitingSince: '5 days', priority: 'high', doctorId: 'd-2', risk: 25, riskLevel: 'LOW' },
  { id: 'w-3', name: 'Amit Patel', phone: '+91 76767 67676', condition: 'Hypertension Review', waitingSince: '1 day', priority: 'medium', doctorId: 'd-1', risk: 45, riskLevel: 'MEDIUM' },
  { id: 'w-4', name: 'Sonal Sen', phone: '+91 65656 56565', condition: 'Dermatitis flare-up', waitingSince: '4 days', priority: 'medium', doctorId: 'd-3', risk: 18, riskLevel: 'LOW' },
  { id: 'w-5', name: 'Lalit Narayan', phone: '+91 54545 45454', condition: 'Post-stroke Check', waitingSince: '3 days', priority: 'high', doctorId: 'd-5', risk: 38, riskLevel: 'MEDIUM' },
  { id: 'w-6', name: 'Preeti Deshmukh', phone: '+91 43434 34343', condition: 'Chronic Headaches', waitingSince: '1 day', priority: 'low', doctorId: 'd-5', risk: 22, riskLevel: 'LOW' },
  { id: 'w-7', name: 'Aman Deep', phone: '+91 32323 23232', condition: 'Diabetic Foot Ulcer', waitingSince: '6 days', priority: 'high', doctorId: 'd-4', risk: 52, riskLevel: 'MEDIUM' },
  { id: 'w-8', name: 'Kunal Kapoor', phone: '+91 21212 12121', condition: 'Acute Asthma', waitingSince: '2 days', priority: 'medium', doctorId: 'd-4', risk: 15, riskLevel: 'LOW' }
];

export const waitlistPatients = WAITLIST;

// 5. NOTIFICATIONS ARRAY (recent activity feed items)
export const NOTIFICATIONS = [
  { id: 'n-1', text: 'Rahul Sharma confirmed via WhatsApp', time: '2 min ago', type: 'success' },
  { id: 'n-2', text: 'Priya Sharma — High risk flagged by AI', time: '15 min ago', type: 'warning' },
  { id: 'n-3', text: 'Slot 11:00 AM recovered — Dr. Mehta', time: '1 hr ago', type: 'success' },
  { id: 'n-4', text: 'Family notified for Mr. Ramesh Gupta', time: '2 hrs ago', type: 'info' }
];

const noShow30Days = [
  { date: '1 Jun', rate: 26.5, weekend: false },
  { date: '2 Jun', rate: 25.1, weekend: false },
  { date: '3 Jun', rate: 24.8, weekend: false },
  { date: '4 Jun', rate: 26.0, weekend: false },
  { date: '5 Jun', rate: 28.2, weekend: true },
  { date: '6 Jun', rate: 29.5, weekend: true },
  { date: '7 Jun', rate: 24.0, weekend: false },
  { date: '8 Jun', rate: 23.5, weekend: false },
  { date: '9 Jun', rate: 22.8, weekend: false },
  { date: '10 Jun', rate: 23.1, weekend: false },
  { date: '11 Jun', rate: 25.0, weekend: false },
  { date: '12 Jun', rate: 27.5, weekend: true },
  { date: '13 Jun', rate: 28.1, weekend: true },
  { date: '14 Jun', rate: 23.9, weekend: false },
  { date: '15 Jun', rate: 24.2, weekend: false },
  { date: '16 Jun', rate: 23.8, weekend: false },
  { date: '17 Jun', rate: 22.9, weekend: false },
  { date: '18 Jun', rate: 24.5, weekend: false },
  { date: '19 Jun', rate: 26.8, weekend: true },
  { date: '20 Jun', rate: 27.2, weekend: true },
  { date: '21 Jun', rate: 24.1, weekend: false },
  { date: '22 Jun', rate: 23.0, weekend: false },
  { date: '23 Jun', rate: 22.4, weekend: false },
  { date: '24 Jun', rate: 22.8, weekend: false },
  { date: '25 Jun', rate: 23.5, weekend: false },
  { date: '26 Jun', rate: 25.8, weekend: true },
  { date: '27 Jun', rate: 26.4, weekend: true },
  { date: '28 Jun', rate: 23.2, weekend: false },
  { date: '29 Jun', rate: 24.0, weekend: false },
  { date: '30 Jun', rate: 24.3, weekend: false }
];

const recoveryRateByDay = [
  { day: 'Mon', rate: 68 },
  { day: 'Tue', rate: 72 },
  { day: 'Wed', rate: 58 },
  { day: 'Thu', rate: 65 },
  { day: 'Fri', rate: 48 },
  { day: 'Sat', rate: 35 },
  { day: 'Sun', rate: 20 }
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_SLOTS = ['9 AM', '10 AM', '11 AM', '12 PM', '2 PM', '3 PM', '4 PM', '5 PM'];

const heatmapData = {
  'All Doctors': [
    { day: 'Mon', time: '9 AM', rate: 8, skipped: 1, total: 12 },
    { day: 'Mon', time: '10 AM', rate: 15, skipped: 3, total: 20 },
    { day: 'Mon', time: '11 AM', rate: 24, skipped: 5, total: 21 },
    { day: 'Mon', time: '12 PM', rate: 12, skipped: 2, total: 17 },
    { day: 'Mon', time: '2 PM', rate: 28, skipped: 4, total: 14 },
    { day: 'Mon', time: '3 PM', rate: 19, skipped: 3, total: 16 },
    { day: 'Mon', time: '4 PM', rate: 35, skipped: 7, total: 20 },
    { day: 'Mon', time: '5 PM', rate: 45, skipped: 9, total: 20 },

    { day: 'Tue', time: '9 AM', rate: 12, skipped: 2, total: 16 },
    { day: 'Tue', time: '10 AM', rate: 8, skipped: 1, total: 12 },
    { day: 'Tue', time: '11 AM', rate: 18, skipped: 3, total: 17 },
    { day: 'Tue', time: '12 PM', rate: 15, skipped: 3, total: 20 },
    { day: 'Tue', time: '2 PM', rate: 22, skipped: 4, total: 18 },
    { day: 'Tue', time: '3 PM', rate: 27, skipped: 5, total: 18 },
    { day: 'Tue', time: '4 PM', rate: 31, skipped: 6, total: 19 },
    { day: 'Tue', time: '5 PM', rate: 38, skipped: 7, total: 18 },

    { day: 'Wed', time: '9 AM', rate: 14, skipped: 2, total: 14 },
    { day: 'Wed', time: '10 AM', rate: 19, skipped: 3, total: 16 },
    { day: 'Wed', time: '11 AM', rate: 25, skipped: 5, total: 20 },
    { day: 'Wed', time: '12 PM', rate: 9, skipped: 1, total: 11 },
    { day: 'Wed', time: '2 PM', rate: 35, skipped: 6, total: 17 },
    { day: 'Wed', time: '3 PM', rate: 42, skipped: 8, total: 19 },
    { day: 'Wed', time: '4 PM', rate: 38, skipped: 8, total: 21 },
    { day: 'Wed', time: '5 PM', rate: 48, skipped: 10, total: 21 },

    { day: 'Thu', time: '9 AM', rate: 6, skipped: 1, total: 16 },
    { day: 'Thu', time: '10 AM', rate: 12, skipped: 2, total: 17 },
    { day: 'Thu', time: '11 AM', rate: 22, skipped: 4, total: 18 },
    { day: 'Thu', time: '12 PM', rate: 14, skipped: 2, total: 14 },
    { day: 'Thu', time: '2 PM', rate: 26, skipped: 5, total: 19 },
    { day: 'Thu', time: '3 PM', rate: 18, skipped: 3, total: 17 },
    { day: 'Thu', time: '4 PM', rate: 29, skipped: 5, total: 17 },
    { day: 'Thu', time: '5 PM', rate: 32, skipped: 6, total: 19 },

    { day: 'Fri', time: '9 AM', rate: 18, skipped: 3, total: 17 },
    { day: 'Fri', time: '10 AM', rate: 25, skipped: 5, total: 20 },
    { day: 'Fri', time: '11 AM', rate: 33, skipped: 6, total: 18 },
    { day: 'Fri', time: '12 PM', rate: 15, skipped: 3, total: 20 },
    { day: 'Fri', time: '2 PM', rate: 41, skipped: 7, total: 17 },
    { day: 'Fri', time: '3 PM', rate: 39, skipped: 7, total: 18 },
    { day: 'Fri', time: '4 PM', rate: 44, skipped: 8, total: 18 },
    { day: 'Fri', time: '5 PM', rate: 52, skipped: 11, total: 21 },

    { day: 'Sat', time: '9 AM', rate: 22, skipped: 3, total: 14 },
    { day: 'Sat', time: '10 AM', rate: 29, skipped: 5, total: 17 },
    { day: 'Sat', time: '11 AM', rate: 42, skipped: 8, total: 19 },
    { day: 'Sat', time: '12 PM', rate: 35, skipped: 6, total: 17 },
    { day: 'Sat', time: '2 PM', rate: 55, skipped: 11, total: 20 },
    { day: 'Sat', time: '3 PM', rate: 62, skipped: 13, total: 21 },
    { day: 'Sat', time: '4 PM', rate: 58, skipped: 11, total: 19 },
    { day: 'Sat', time: '5 PM', rate: 68, skipped: 15, total: 22 },
  ]
};

const deptData = [
  { name: 'Cardiology', rate: 32 },
  { name: 'Orthopedics', rate: 28 },
  { name: 'Neurology', rate: 35 },
  { name: 'General Medicine', rate: 22 },
  { name: 'Dermatology', rate: 15 }
];

const personaData = [
  { name: 'Working Professional', value: 42, color: '#2563eb' },
  { name: 'Elderly', value: 23, color: '#7c3aed' },
  { name: 'Student', value: 18, color: '#ea580c' },
  { name: 'Default', value: 17, color: '#94a3b8' }
];

const revenueData = [
  { date: '1 Jun', atRisk: 80, recovered: 20, loss: 60 },
  { date: '5 Jun', atRisk: 75, recovered: 28, loss: 47 },
  { date: '10 Jun', atRisk: 72, recovered: 35, loss: 37 },
  { date: '15 Jun', atRisk: 68, recovered: 42, loss: 26 },
  { date: '20 Jun', atRisk: 55, recovered: 48, loss: 7 },
  { date: '25 Jun', atRisk: 42, recovered: 55, loss: 0 },
  { date: '30 Jun', atRisk: 30, recovered: 68, loss: 0 }
];

const mlMetrics = [
  { metric: 'Accuracy', value: '78%' },
  { metric: 'Precision', value: '82%' },
  { metric: 'Recall', value: '75%' },
  { metric: 'F1 Score', value: '78%' },
  { metric: 'AUC-ROC', value: '0.81' }
];

// 6. ANALYTICS DATA
export const ANALYTICS_DATA = {
  noShow30Days: noShow30Days,
  recoveryRateByDay: recoveryRateByDay,
  deptData: deptData,
  personaData: personaData,
  revenueData: revenueData,
  mlMetrics: mlMetrics,
  heatmapData: heatmapData['All Doctors'],
  morningBriefingStats: {
    totalPatients: 24,
    highRisk: 3,
    mediumRisk: 5,
    lowRisk: 16,
    cancelledSlots: 2,
    waitlistCount: 8,
    avgWaitTime: 14,
    onTimeRate: 83,
    remindersSent: 18,
    remindersDelivered: 15
  },
  hourlyLoad: [
    { hour: '8 AM', patients: 2 },
    { hour: '9 AM', patients: 5 },
    { hour: '10 AM', patients: 8 },
    { hour: '11 AM', patients: 9 },
    { hour: '12 PM', patients: 4 },
    { hour: '2 PM', patients: 6 },
    { hour: '3 PM', patients: 7 },
    { hour: '4 PM', patients: 5 },
    { hour: '5 PM', patients: 3 }
  ]
};

// Aliases for layout compatibility
export const morningBriefingStats = ANALYTICS_DATA.morningBriefingStats;
export const hourlyLoad = ANALYTICS_DATA.hourlyLoad;
export const riskDistribution = [
  { name: 'Low Risk', value: 67, color: '#22c55e' },
  { name: 'Medium Risk', value: 21, color: '#f59e0b' },
  { name: 'High Risk', value: 12, color: '#ef4444' }
];
export const appointmentTrends = [
  { day: 'Mon', attended: 22, cancelled: 2 },
  { day: 'Tue', attended: 24, cancelled: 1 },
  { day: 'Wed', attended: 20, cancelled: 3 },
  { day: 'Thu', attended: 26, cancelled: 1 },
  { day: 'Fri', attended: 21, cancelled: 2 },
  { day: 'Sat', attended: 15, cancelled: 4 }
];
export const specialtyLoad = [
  { specialty: 'Cardiology', load: 83, patients: 10 },
  { specialty: 'Orthopedics', load: 66, patients: 8 },
  { specialty: 'General Medicine', load: 91, patients: 11 },
  { specialty: 'Neurology', load: 75, patients: 9 }
];

// 7. WHATSAPP_MESSAGES
export const WHATSAPP_MESSAGES = {
  'p-1': [
    { id: 'm1', type: 'system', text: 'Appointment booked: Thursday 3 July, 10:00 AM', time: '12 Jun, 2:30 PM' },
    { id: 'm2', type: 'outgoing', text: 'Apollo Hospital: Hi Priya 👋 Your appointment with Dr. Mehta is confirmed for 3 July at 10:00 AM.', time: '12 Jun, 2:30 PM', channel: 'WhatsApp', status: 'read' },
    { id: 'm3', type: 'outgoing', text: 'To help personalize your visit, reply:\n1 - Working Professional 💼\n2 - Elderly 👴\n3 - Student 🎓', time: '12 Jun, 2:31 PM', channel: 'WhatsApp', status: 'read' },
    { id: 'm4', type: 'incoming', text: '1', time: '12 Jun, 2:35 PM' },
    { id: 'm5', type: 'system', text: 'Persona set: Working Professional 💼', time: '12 Jun, 2:35 PM' }
  ],
  'p-3': [
    { id: 'm21', type: 'system', text: 'Appointment booked: Thursday 3 July, 11:00 AM', time: '15 Jun, 11:00 AM' },
    { id: 'm22', type: 'outgoing', text: 'Apollo Hospital: Hi Ramesh, your appointment is confirmed for 3 July at 11:00 AM.', time: '15 Jun, 11:00 AM', channel: 'WhatsApp', status: 'read' },
    { id: 'm23', type: 'outgoing', text: 'Please reply with caregiver / family contact number.', time: '15 Jun, 11:02 AM', channel: 'WhatsApp', status: 'read' },
    { id: 'm24', type: 'incoming', text: '9876543211 Mrs. Gupta', time: '15 Jun, 11:15 AM' },
    { id: 'm25', type: 'system', text: 'Family Coordinator set: Mrs. Gupta (9876543211)', time: '15 Jun, 11:15 AM' }
  ]
};

// Naming aliases to maintain compatibility with legacy screens
export const patients = APPOINTMENTS.map(apt => {
  const pat = PATIENTS.find(p => p.id === apt.patientId) || {};
  const doc = DOCTORS.find(d => d.id === apt.doctorId) || {};
  return {
    ...pat,
    ...apt,
    id: apt.id,
    appointmentTime: apt.time,
    riskLevel: apt.riskLevel.toLowerCase(),
    personaTag: pat.persona ? pat.persona.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Default',
    persona: pat.persona === 'working_professional' ? 'Lifestyle Juggler' :
             pat.persona === 'elderly' ? 'Senior Dependent' :
             pat.persona === 'student' ? 'Chronic Worrier' : 'Health Conscious',
    status: apt.status === 'confirmed' ? 'Scheduled' :
            apt.status === 'pending' ? 'Waiting' :
            apt.status === 'walk-in' ? 'Checked In' :
            apt.status === 'cancelled' ? 'Completed' : 'Scheduled',
    waitTime: apt.status === 'pending' ? 15 : 0,
    conditions: apt.department === 'Cardiology' ? ['Hypertension', 'Ischemic Heart Disease'] : ['General fatigue'],
    vitals: { bp: '130/80', hr: 78, spo2: 98, temp: '98.6', weight: 70 },
    notes: 'Patient reported mild chest pressure during exercise. Advised to avoid heavy lifting.',
    doctor: doc.name || 'Dr. Rajesh Mehta',
    specialty: doc.department || 'Cardiology',
    shapFactors: apt.shapFactors.map(f => ({
      factor: f.feature,
      value: f.impact / 100,
      direction: f.direction === 'positive' ? 'up' : 'down'
    }))
  };
});

// 8. HELPER FUNCTIONS
export function getPatientById(id) {
  return PATIENTS.find(p => p.id === id);
}

export function getAppointmentsByDoctor(doctorId) {
  return APPOINTMENTS.filter(a => a.doctorId === doctorId);
}

export function getHighRiskAppointments() {
  return APPOINTMENTS.filter(a => a.riskLevel === 'HIGH');
}

export function getOpenSlots() {
  return APPOINTMENTS.filter(a => a.status === 'cancelled' || a.status === 'rescheduled');
}

export function getTodayStats() {
  return ANALYTICS_DATA.morningBriefingStats;
}
