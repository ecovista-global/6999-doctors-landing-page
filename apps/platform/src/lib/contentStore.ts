import fs from 'fs';
import path from 'path';

export interface SlotItem {
  id: string;
  time: string;
  period: 'morning' | 'evening';
  available: boolean;
}

export interface DoctorAvailability {
  nextAvailableSlot: string; // e.g. "Today, 05:30 PM"
  isAcceptingToday: boolean;
  runningLateMinutes: number; // 0, 15, 20, 30
  runningLateReason: string;
  currentServingToken: number; // e.g. 4
  todaySlots: SlotItem[];
}

export interface MediaItem {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  url: string;
  diskUrl?: string;
  assignedTo: 'hero_doctor_portrait' | 'clinic_facade' | 'nav_logo' | 'gallery' | 'unassigned';
  uploadedAt: string;
  dimensions?: string;
}

export interface DoctorContent {
  theme: string;
  announcement: string;
  availability: DoctorAvailability;
  doctor: {
    name: string;
    degree: string;
    college: string;
    specialty: string;
    experienceYears: number;
    registrationNumber: string;
    medicalCouncil: string;
    languages: string;
    bio: string;
    consultationFee: number;
    phone: string;
    whatsappNumber: string;
    email: string;
    photoUrl?: string;
  };
  clinic: {
    name: string;
    tagline: string;
    taglineQuote: string;
    street: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
    schedule: {
      weekdayHours: string;
      saturdayHours: string;
      sundayHours: string;
    };
    morningHours?: string;
    eveningHours?: string;
    sundayHours?: string;
    feePolicy: string;
    amenities: string[];
    transitGuidance: string;
    mapLocationName: string;
    mapSubtitle: string;
    googleMapEmbedUrl: string;
    googleReviewUrl: string;
    photoUrl?: string;
    logoUrl?: string;
  };
  hero: {
    headline: string;
    subtitle: string;
    statConsultations: string;
    statRating: string;
    statExperience: string;
  };
  whyChooseUs: Array<{
    id: string;
    icon: string;
    title: string;
    description: string;
  }>;
  accreditations: Array<{
    id: string;
    icon: string;
    title: string;
    description: string;
  }>;
  services: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
  }>;
  reviews: Array<{
    id: string;
    patientName: string;
    location: string;
    treatment: string;
    rating: number;
    reviewText: string;
  }>;
  faqs: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
  media: MediaItem[];
}

export interface AppointmentRecord {
  id: string;
  tokenNumber: number;
  patientName: string;
  phone: string;
  doctor?: string;
  service: string;
  preferredDate: string;
  shift: 'Morning' | 'Afternoon' | 'Evening';
  status: 'new' | 'contacted' | 'confirmed' | 'completed' | 'cancelled' | 'waiting' | 'in_consultation';
  opdStage: 'waiting' | 'in_consultation' | 'done';
  notes: string;
  createdAt: string;
  whatsappConfirmationSent?: boolean;
  googleReviewSent?: boolean;
}

const STORAGE_FILE = path.join(process.cwd(), 'fixtures', 'live-store.json');

const DEFAULT_CONTENT: DoctorContent = {
  theme: 'Green Trust',
  announcement: 'Complimentary 7-day follow-up consultation included with every visit.',
  availability: {
    nextAvailableSlot: 'Today, 05:30 PM',
    isAcceptingToday: true,
    runningLateMinutes: 0,
    runningLateReason: 'Emergency acute case review',
    currentServingToken: 4,
    todaySlots: [
      { id: 'slot-1', time: '05:30 PM', period: 'evening', available: true },
      { id: 'slot-2', time: '06:00 PM', period: 'evening', available: true },
      { id: 'slot-3', time: '06:30 PM', period: 'evening', available: false },
      { id: 'slot-4', time: '07:00 PM', period: 'evening', available: true },
      { id: 'slot-5', time: '07:30 PM', period: 'evening', available: true },
      { id: 'slot-6', time: '10:00 AM', period: 'morning', available: true },
      { id: 'slot-7', time: '10:30 AM', period: 'morning', available: true },
      { id: 'slot-8', time: '11:15 AM', period: 'morning', available: true },
    ],
  },
  doctor: {
    name: 'Dr. Maanvita Kumari',
    degree: 'MBBS, MD (General Medicine)',
    college: 'Maulana Azad Medical College, New Delhi',
    specialty: 'Consultant Physician & Family Medicine Specialist',
    experienceYears: 14,
    registrationNumber: 'DMC/R/28491',
    medicalCouncil: 'Delhi Medical Council (Active & Verified)',
    languages: 'English & Hindi',
    bio: 'Trusted family physician with over 14 years of clinical experience from Maulana Azad Medical College. Committed to evidence-based, compassionate care for adults, seniors, and chronic lifestyle disorders.',
    consultationFee: 600,
    phone: '+91 98765 43210',
    whatsappNumber: '+91 98765 43210',
    email: 'contact@healthconsult.in',
    photoUrl: '/assets/dr_maanvita_portrait.svg',
  },
  clinic: {
    name: 'HealthConsult Family Clinic',
    tagline: 'Compassionate Clinical Care & Chronic Wellness',
    taglineQuote: '"We Nurture Your Health, Every Day"',
    street: 'Plot 14, Health Plaza, Central Market',
    area: 'Sector 18',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    schedule: {
      weekdayHours: 'Monday – Friday: 09:00 AM – 08:00 PM',
      saturdayHours: 'Saturday: 09:00 AM – 04:00 PM',
      sundayHours: 'Sunday: Closed (Emergency On-Call)',
    },
    morningHours: '09:00 AM – 01:30 PM',
    eveningHours: '04:30 PM – 08:00 PM',
    sundayHours: 'Closed (Emergency On-Call)',
    feePolicy: '₹600 regular consultation. Includes a 7-day complimentary follow-up visit for the same medical issue.',
    amenities: [
      'In-house Pharmacy Partner',
      'Home Sample Collection',
      'Wheelchair Accessible',
      'AC Waiting Lounge',
      'Digital Payments Accepted',
      'Dedicated Car Parking',
    ],
    transitGuidance: 'Located directly in Central Market Sector 18, just 200 meters from Noida Sector 18 Metro Station (Blue Line, Gate 2). Ample multi-level car parking available next to Health Plaza.',
    mapLocationName: 'HealthConsult Clinic Location',
    mapSubtitle: 'Sector 18 Central Market, Noida',
    googleMapEmbedUrl: 'https://maps.google.com/maps?q=Sector%2018%2C%20Noida&t=&z=15&ie=UTF8&iwloc=&output=embed',
    googleReviewUrl: 'https://g.page/r/healthconsult-noida/review',
    photoUrl: '/assets/noida_clinic_facade.svg',
    logoUrl: '/assets/stethoscope_branding.svg',
  },
  hero: {
    headline: 'Consult your health with our doctor anywhere, anytime',
    subtitle: 'We provide expert care with a personal touch. From preventive family wellness to chronic disease management, your health is our sacred commitment.',
    statConsultations: '25,000+',
    statRating: '4.9 / 5',
    statExperience: '14+ Yrs',
  },
  whyChooseUs: [
    {
      id: 'wcu-1',
      icon: 'clock',
      title: 'Minimal Waiting Time',
      description: 'WhatsApp slot coordination ensures you spend minimal time in the waiting area, receiving prompt doctor attention.',
    },
    {
      id: 'wcu-2',
      icon: 'stethoscope',
      title: 'Evidence-Based Medicine',
      description: 'Rational clinical diagnoses with zero unnecessary lab investigations or heavy over-prescription of antibiotics.',
    },
    {
      id: 'wcu-3',
      icon: 'message',
      title: 'Digital Health Records',
      description: 'Clear digital prescriptions delivered instantly to your WhatsApp, accessible whenever you need them.',
    },
    {
      id: 'wcu-4',
      icon: 'userCheck',
      title: 'Dedicated Consultation',
      description: 'Thorough 15+ minute consultation sessions allowing ample time to address your symptoms, queries, and lifestyle concerns.',
    },
  ],
  accreditations: [
    {
      id: 'acc-1',
      icon: 'shield',
      title: 'NABH Safety Standards',
      description: 'Sterilized clinic environment & protocols',
    },
    {
      id: 'acc-2',
      icon: 'pill',
      title: 'Transparent Consultation',
      description: 'Complimentary 7-day follow-up included',
    },
    {
      id: 'acc-3',
      icon: 'zap',
      title: 'Digital WhatsApp Reports',
      description: 'Instant prescription & diagnostic delivery',
    },
    {
      id: 'acc-4',
      icon: 'lock',
      title: 'DPDP Act 2023 Compliant',
      description: '100% encrypted & private health records',
    },
  ],
  services: [
    {
      id: 'srv-1',
      title: 'General Health Checkup',
      description: 'Complete physical examination, baseline vital assessments, blood pressure screening, and personalized preventive health roadmaps.',
      icon: 'stethoscope',
    },
    {
      id: 'srv-2',
      title: 'Diabetes & Hypertension',
      description: 'Careful blood sugar monitoring, HbA1c review, blood pressure stabilization, diet counseling, and long-term kidney & heart protection.',
      icon: 'heartPulse',
    },
    {
      id: 'srv-3',
      title: 'Fevers & Seasonal Illnesses',
      description: 'Rapid diagnostic assessment for dengue, malaria, typhoid, viral flu, bronchitis, seasonal allergies, and acute throat infections.',
      icon: 'thermometer',
    },
    {
      id: 'srv-4',
      title: 'Thyroid & Endocrine Care',
      description: 'Expert clinical evaluation of hypothyroidism, hyperthyroidism, metabolic shifts, chronic fatigue, and hormone stabilization.',
      icon: 'pill',
    },
    {
      id: 'srv-5',
      title: 'Geriatric & Elderly Care',
      description: 'Compassionate healthcare for senior citizens, routine medication interaction reviews, arthritis pain support, and mobility advice.',
      icon: 'userCheck',
    },
    {
      id: 'srv-6',
      title: 'Adult Vaccinations',
      description: 'Annual influenza shots, pneumococcal protection, hepatitis B boosters, tetanus prophylaxis, and adult immunization schedules.',
      icon: 'syringe',
    },
    {
      id: 'srv-7',
      title: 'Respiratory & Asthma Care',
      description: 'Management of chronic wheezing, asthma flare-ups, seasonal allergic rhinitis, smoker\'s cough, and post-viral lung recovery.',
      icon: 'activity',
    },
    {
      id: 'srv-8',
      title: 'Gastrointestinal & Acidity',
      description: 'Treatment of GERD, acid reflux, peptic ulcers, IBS, chronic constipation, liver sluggishness, and dietary intolerance.',
      icon: 'microscope',
    },
    {
      id: 'srv-9',
      title: 'Preventive Lifestyle Medicine',
      description: 'Evidence-based guidance on weight management, uric acid reduction, cholesterol balance, and cardiac risk factor reduction.',
      icon: 'shield',
    },
  ],
  reviews: [
    {
      id: 'rev-1',
      patientName: 'R. Sharma',
      location: 'Sector 19, Noida',
      treatment: 'Senior Citizen Diabetes Care',
      rating: 5,
      reviewText: 'Dr. Maanvita is exceptionally patient and thorough. She explained my mother\'s blood tests in simple Hindi and adjusted her medications smoothly without piling on unnecessary drugs.',
    },
    {
      id: 'rev-2',
      patientName: 'A. Verma',
      location: 'Sector 27, Noida',
      treatment: 'Dengue Fever Recovery',
      rating: 5,
      reviewText: 'Very clean clinic and minimal waiting time. When I had high viral fever, doctor monitored my platelet counts daily on WhatsApp. Highly empathetic and knowledgeable!',
    },
    {
      id: 'rev-3',
      patientName: 'P. Gupta',
      location: 'Sector 18, Noida',
      treatment: 'Hypertension Management',
      rating: 5,
      reviewText: 'Quick WhatsApp reply for consultation hours and excellent bedside manner. My blood pressure is now well controlled within 3 weeks with simple lifestyle tweaks.',
    },
    {
      id: 'rev-4',
      patientName: 'S. Nair',
      location: 'Sector 15, Noida',
      treatment: 'Thyroid Balance Treatment',
      rating: 5,
      reviewText: 'Diagnosed my chronic thyroid fatigue after multiple other clinics dismissed it as stress. Her dosage guidance was spot-on and my energy levels have bounced back.',
    },
    {
      id: 'rev-5',
      patientName: 'M. Chawla',
      location: 'Sector 30, Noida',
      treatment: 'Family Health & Allergy',
      rating: 5,
      reviewText: 'Our entire family consults Dr. Maanvita for any fever or seasonal illness. She listens carefully for 15+ minutes and never rushes the patient out of the room.',
    },
    {
      id: 'rev-6',
      patientName: 'V. Singhal',
      location: 'Sector 29, Noida',
      treatment: 'Preventive Executive Checkup',
      rating: 5,
      reviewText: 'Very sensible medical approach. She reviewed my annual lipid profile and gave practical diet guidance instead of prescribing statins straight away. Truly trustworthy.',
    },
  ],
  faqs: [
    {
      id: 'faq-1',
      question: 'Do I need a prior appointment before visiting?',
      answer: 'Walk-ins are welcomed during all clinic hours. However, messaging on WhatsApp or calling ahead helps assign an estimated consultation window, minimizing your waiting room time.',
    },
    {
      id: 'faq-2',
      question: 'What is the consultation fee and follow-up policy?',
      answer: 'The standard consultation fee is ₹600. All patients are eligible for one complimentary follow-up visit within 7 days of the initial consultation for review of lab reports or treatment progress.',
    },
    {
      id: 'faq-3',
      question: 'Is home blood sample collection available?',
      answer: 'Yes, our clinic partners with certified NABL diagnostic laboratory partners. You can schedule a phlebotomist visit for home sample collection by informing clinic reception.',
    },
    {
      id: 'faq-4',
      question: 'What payment modes are accepted at the clinic?',
      answer: 'We accept all digital payment options including UPI (Google Pay, PhonePe, Paytm, BHIM), debit/credit cards, and cash.',
    },
    {
      id: 'faq-5',
      question: 'How do I receive my prescription and reports?',
      answer: 'You receive both a printed hard copy and an official verified digital prescription delivered directly to your WhatsApp number immediately following the consultation.',
    },
    {
      id: 'faq-6',
      question: 'Can I consult Dr. Maanvita over WhatsApp for follow-ups?',
      answer: 'Yes! Existing patients can send their lab test reports and quick dosage follow-up queries to the clinic WhatsApp number during clinic working hours.',
    },
    {
      id: 'faq-7',
      question: 'Are medical fitness and sick leave certificates provided?',
      answer: 'Yes, official verified medical fitness certificates and sick leave verification are issued following physical clinical assessment, stamped with DMC registration credentials.',
    },
    {
      id: 'faq-8',
      question: 'What emergency facilities are available?',
      answer: 'The clinic provides primary acute emergency stabilization (oxygen, nebulization, primary wound dressing, glucose revival). Severe trauma or cardiac emergencies are stabilized and referred to partner tertiary hospitals.',
    },
  ],
  media: [
    {
      id: 'med-1',
      title: 'Dr. Maanvita Portrait (Hero)',
      fileName: 'dr_maanvita_portrait.svg',
      fileType: 'image/svg+xml',
      fileSize: '42 KB',
      url: '/assets/dr_maanvita_portrait.svg',
      diskUrl: '/assets/dr_maanvita_portrait.svg',
      assignedTo: 'hero_doctor_portrait',
      uploadedAt: 'Active Hero Asset',
    },
    {
      id: 'med-2',
      title: 'HealthConsult Noida Clinic Facade',
      fileName: 'noida_clinic_facade.svg',
      fileType: 'image/svg+xml',
      fileSize: '68 KB',
      url: '/assets/noida_clinic_facade.svg',
      diskUrl: '/assets/noida_clinic_facade.svg',
      assignedTo: 'clinic_facade',
      uploadedAt: 'Active Clinic Asset',
    },
    {
      id: 'med-3',
      title: 'Stethoscope Emerald Logo',
      fileName: 'stethoscope_branding.svg',
      fileType: 'image/svg+xml',
      fileSize: '14 KB',
      url: '/assets/stethoscope_branding.svg',
      diskUrl: '/assets/stethoscope_branding.svg',
      assignedTo: 'nav_logo',
      uploadedAt: 'Active Logo Asset',
    },
  ],
};

const DEFAULT_APPOINTMENTS: AppointmentRecord[] = [
  {
    id: 'APT-1081',
    tokenNumber: 3,
    patientName: 'Ramesh Sharma',
    phone: '+91 98101 23456',
    doctor: 'Dr. Maanvita Kumari',
    service: 'Diabetes Management',
    preferredDate: '2026-11-04',
    shift: 'Morning',
    status: 'new',
    opdStage: 'waiting',
    notes: 'Fasting reports ready, prefers 10:30 AM slot',
    createdAt: '15 mins ago',
  },
  {
    id: 'APT-1080',
    tokenNumber: 2,
    patientName: 'Pooja Verma',
    phone: '+91 98712 34567',
    doctor: 'Dr. Maanvita Kumari',
    service: 'Thyroid Disorders',
    preferredDate: '2026-11-04',
    shift: 'Evening',
    status: 'in_consultation',
    opdStage: 'in_consultation',
    notes: 'WhatsApp confirmation sent by front desk',
    createdAt: '45 mins ago',
  },
  {
    id: 'APT-1079',
    tokenNumber: 1,
    patientName: 'Harish Chandra',
    phone: '+91 99110 56789',
    doctor: 'Dr. Maanvita Kumari',
    service: 'Hypertension Care',
    preferredDate: '2026-11-03',
    shift: 'Evening',
    status: 'completed',
    opdStage: 'done',
    notes: 'Confirmed 6:15 PM slot',
    createdAt: '2 hours ago',
    googleReviewSent: false,
  },
];

interface StoreData {
  content: DoctorContent;
  appointments: AppointmentRecord[];
}

function loadStore(): StoreData {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      // Merge with DEFAULT_CONTENT in case any new fields are missing
      const mergedContent: DoctorContent = {
        ...DEFAULT_CONTENT,
        ...parsed.content,
        availability: {
          ...DEFAULT_CONTENT.availability,
          ...(parsed.content?.availability || {}),
        },
        doctor: { ...DEFAULT_CONTENT.doctor, ...(parsed.content?.doctor || {}) },
        clinic: {
          ...DEFAULT_CONTENT.clinic,
          ...(parsed.content?.clinic || {}),
          schedule: {
            ...DEFAULT_CONTENT.clinic.schedule,
            ...(parsed.content?.clinic?.schedule || {}),
          },
        },
        hero: { ...DEFAULT_CONTENT.hero, ...(parsed.content?.hero || {}) },
        whyChooseUs: parsed.content?.whyChooseUs || DEFAULT_CONTENT.whyChooseUs,
        accreditations: parsed.content?.accreditations || DEFAULT_CONTENT.accreditations,
        services: parsed.content?.services || DEFAULT_CONTENT.services,
        reviews: parsed.content?.reviews || DEFAULT_CONTENT.reviews,
        faqs: parsed.content?.faqs || DEFAULT_CONTENT.faqs,
        media: parsed.content?.media || DEFAULT_CONTENT.media,
      };

      const rawApts: any[] = parsed.appointments || DEFAULT_APPOINTMENTS;
      const normalizedApts: AppointmentRecord[] = rawApts.map((a, idx) => ({
        id: a.id || `APT-${1080 + idx}`,
        tokenNumber: a.tokenNumber || (idx + 1),
        patientName: a.patientName || 'Anonymous Patient',
        phone: a.phone || '+91 98000 00000',
        doctor: a.doctor || 'Dr. Maanvita Kumari',
        service: a.service || 'General Consultation',
        preferredDate: a.preferredDate || '2026-11-04',
        shift: a.shift || 'Morning',
        status: a.status || 'new',
        opdStage: a.opdStage || (a.status === 'completed' ? 'done' : a.status === 'in_consultation' ? 'in_consultation' : 'waiting'),
        notes: a.notes || '',
        createdAt: a.createdAt || 'Recent',
        whatsappConfirmationSent: a.whatsappConfirmationSent || false,
        googleReviewSent: a.googleReviewSent || false,
      }));

      return {
        content: mergedContent,
        appointments: normalizedApts,
      };
    }
  } catch (err) {
    console.error('Error reading storage file, falling back to defaults:', err);
  }
  return { content: DEFAULT_CONTENT, appointments: DEFAULT_APPOINTMENTS };
}

function saveStore(data: StoreData) {
  try {
    const dir = path.dirname(STORAGE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing storage file:', err);
  }
}

let memoryStore = loadStore();

export function getContent(): DoctorContent {
  memoryStore = loadStore();
  return memoryStore.content;
}

export function updateContent(newContent: Partial<DoctorContent>): DoctorContent {
  memoryStore = loadStore();
  memoryStore.content = {
    ...memoryStore.content,
    ...newContent,
    availability: {
      ...memoryStore.content.availability,
      ...(newContent.availability || {}),
    },
    doctor: { ...memoryStore.content.doctor, ...(newContent.doctor || {}) },
    clinic: {
      ...memoryStore.content.clinic,
      ...(newContent.clinic || {}),
      schedule: {
        ...memoryStore.content.clinic.schedule,
        ...(newContent.clinic?.schedule || {}),
      },
    },
    hero: { ...memoryStore.content.hero, ...(newContent.hero || {}) },
    whyChooseUs: newContent.whyChooseUs || memoryStore.content.whyChooseUs,
    accreditations: newContent.accreditations || memoryStore.content.accreditations,
    services: newContent.services || memoryStore.content.services,
    reviews: newContent.reviews || memoryStore.content.reviews,
    faqs: newContent.faqs || memoryStore.content.faqs,
  };
  saveStore(memoryStore);
  return memoryStore.content;
}

export function getAppointments(): AppointmentRecord[] {
  memoryStore = loadStore();
  return memoryStore.appointments;
}

export function addAppointment(
  apt: Omit<AppointmentRecord, 'id' | 'createdAt' | 'status' | 'tokenNumber' | 'opdStage'> & {
    tokenNumber?: number;
    opdStage?: 'waiting' | 'in_consultation' | 'done';
    status?: AppointmentRecord['status'];
  }
): AppointmentRecord {
  memoryStore = loadStore();
  const nextToken = apt.tokenNumber || (memoryStore.appointments.length + 1);
  const newRecord: AppointmentRecord = {
    ...apt,
    id: `APT-${1082 + memoryStore.appointments.length}`,
    tokenNumber: nextToken,
    status: apt.status || (apt.opdStage === 'in_consultation' ? 'in_consultation' : apt.opdStage === 'done' ? 'completed' : 'new'),
    opdStage: apt.opdStage || 'waiting',
    createdAt: 'Just now',
    whatsappConfirmationSent: false,
    googleReviewSent: false,
  };
  memoryStore.appointments = [newRecord, ...memoryStore.appointments];
  saveStore(memoryStore);
  return newRecord;
}

export function updateAppointmentStatus(
  id: string,
  status: AppointmentRecord['status'],
  notes?: string,
  extra?: Partial<AppointmentRecord>
): AppointmentRecord | null {
  memoryStore = loadStore();
  const apt = memoryStore.appointments.find((a) => a.id === id);
  if (!apt) return null;
  apt.status = status;
  if (notes !== undefined) apt.notes = notes;
  if (extra) {
    Object.assign(apt, extra);
  }
  saveStore(memoryStore);
  return apt;
}
