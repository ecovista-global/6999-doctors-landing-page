import fs from 'fs';
import path from 'path';

export interface DoctorContent {
  theme: string;
  announcement: string;
  doctor: {
    name: string;
    degree: string;
    specialty: string;
    experienceYears: number;
    registrationNumber: string;
    medicalCouncil: string;
    bio: string;
    consultationFee: number;
    phone: string;
    whatsappNumber: string;
    email: string;
  };
  clinic: {
    name: string;
    tagline: string;
    street: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
    morningHours: string;
    eveningHours: string;
    sundayHours: string;
    amenities: string[];
  };
  hero: {
    headline: string;
    subtitle: string;
    statConsultations: string;
    statRating: string;
    statExperience: string;
  };
  services: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
  }>;
}

export interface AppointmentRecord {
  id: string;
  patientName: string;
  phone: string;
  doctor?: string;
  service: string;
  preferredDate: string;
  shift: 'Morning' | 'Afternoon' | 'Evening';
  status: 'new' | 'contacted' | 'confirmed' | 'completed' | 'cancelled';
  notes: string;
  createdAt: string;
}

const STORAGE_FILE = path.join(process.cwd(), 'fixtures', 'live-store.json');

const DEFAULT_CONTENT: DoctorContent = {
  theme: 'Green Trust',
  announcement: 'Complimentary 7-day follow-up consultation included with every visit.',
  doctor: {
    name: 'Dr. Maanvita Kumari',
    degree: 'MBBS, MD (General Medicine)',
    specialty: 'Consultant Physician & Family Medicine Specialist',
    experienceYears: 14,
    registrationNumber: 'DMC/R/28491',
    medicalCouncil: 'Delhi Medical Council',
    bio: 'Trusted family physician with over 14 years of clinical experience from Maulana Azad Medical College. Committed to evidence-based, compassionate care for adults, seniors, and chronic lifestyle disorders.',
    consultationFee: 600,
    phone: '+91 98765 43210',
    whatsappNumber: '+91 98765 43210',
    email: 'contact@healthconsult.in',
  },
  clinic: {
    name: 'HealthConsult Clinic',
    tagline: 'Compassionate Clinical Care & Chronic Wellness',
    street: 'Plot 14, Health Plaza, Central Market',
    area: 'Sector 18',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    morningHours: '10:00 AM – 01:30 PM',
    eveningHours: '05:30 PM – 08:30 PM',
    sundayHours: 'Closed (Emergency Hotline Active)',
    amenities: ['NABH Hygiene Standards', 'In-House Pharmacy', 'Digital WhatsApp Reports', 'Wheelchair Accessible'],
  },
  hero: {
    headline: 'Trusted Family Medicine & Chronic Care in Noida',
    subtitle: 'Dedicated consultations with zero rushed queues. Focused on diabetes, hypertension, seasonal fevers, and personalized adult healthcare.',
    statConsultations: '25,000+',
    statRating: '4.9 / 5',
    statExperience: '14+ Yrs',
  },
  services: [
    { id: 'srv-1', title: 'Diabetes Management', description: 'Comprehensive blood glucose monitoring, HbA1c review, insulin adjustment, and lifestyle plan.', icon: '🩺' },
    { id: 'srv-2', title: 'Hypertension Care', description: 'BP titration, ECG evaluation, cardiovascular risk assessment, and medication reviews.', icon: '❤️' },
    { id: 'srv-3', title: 'Seasonal Fevers & Infections', description: 'Rapid diagnosis and evidence-based protocols for Dengue, Typhoid, Viral flu, and malaria.', icon: '🌡️' },
    { id: 'srv-4', title: 'Thyroid Disorders', description: 'Evaluation and management of Hypo/Hyperthyroidism, TSH balancing, and dietary guidance.', icon: '⚖️' },
    { id: 'srv-5', title: 'Geriatric Health Care', description: 'Specialized healthcare for senior citizens focusing on multi-morbidity and mobility wellness.', icon: '👴' },
    { id: 'srv-6', title: 'Preventive Executive Health', description: 'Comprehensive annual physical examinations, lipid profiles, and early detection screens.', icon: '🛡️' },
  ],
};

const DEFAULT_APPOINTMENTS: AppointmentRecord[] = [
  {
    id: 'APT-1081',
    patientName: 'Ramesh Sharma',
    phone: '+91 98101 23456',
    doctor: 'Dr. Maanvita Kumari',
    service: 'Diabetes Management',
    preferredDate: '2026-11-04',
    shift: 'Morning',
    status: 'new',
    notes: 'Fasting reports ready, prefers 10:30 AM slot',
    createdAt: '15 mins ago',
  },
  {
    id: 'APT-1080',
    patientName: 'Pooja Verma',
    phone: '+91 98712 34567',
    doctor: 'Dr. Maanvita Kumari',
    service: 'Thyroid Disorders',
    preferredDate: '2026-11-04',
    shift: 'Evening',
    status: 'contacted',
    notes: 'WhatsApp confirmation sent by front desk',
    createdAt: '45 mins ago',
  },
  {
    id: 'APT-1079',
    patientName: 'Harish Chandra',
    phone: '+91 99110 56789',
    doctor: 'Dr. Maanvita Kumari',
    service: 'Hypertension Care',
    preferredDate: '2026-11-03',
    shift: 'Evening',
    status: 'confirmed',
    notes: 'Confirmed 6:15 PM slot',
    createdAt: '2 hours ago',
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
      return JSON.parse(raw);
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
  return memoryStore.content;
}

export function updateContent(newContent: Partial<DoctorContent>): DoctorContent {
  memoryStore.content = {
    ...memoryStore.content,
    ...newContent,
    doctor: { ...memoryStore.content.doctor, ...(newContent.doctor || {}) },
    clinic: { ...memoryStore.content.clinic, ...(newContent.clinic || {}) },
    hero: { ...memoryStore.content.hero, ...(newContent.hero || {}) },
  };
  saveStore(memoryStore);
  return memoryStore.content;
}

export function getAppointments(): AppointmentRecord[] {
  return memoryStore.appointments;
}

export function addAppointment(apt: Omit<AppointmentRecord, 'id' | 'createdAt' | 'status'>): AppointmentRecord {
  const newRecord: AppointmentRecord = {
    ...apt,
    id: `APT-${1082 + memoryStore.appointments.length}`,
    status: 'new',
    createdAt: 'Just now',
  };
  memoryStore.appointments = [newRecord, ...memoryStore.appointments];
  saveStore(memoryStore);
  return newRecord;
}

export function updateAppointmentStatus(id: string, status: AppointmentRecord['status'], notes?: string): AppointmentRecord | null {
  const apt = memoryStore.appointments.find((a) => a.id === id);
  if (!apt) return null;
  apt.status = status;
  if (notes !== undefined) apt.notes = notes;
  saveStore(memoryStore);
  return apt;
}
