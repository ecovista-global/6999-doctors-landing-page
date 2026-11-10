'use client';

import { useState, useEffect } from 'react';
import type { DoctorContent } from '@/lib/contentStore';

export const DEFAULT_PALETTE = {
  primary: '#0F766E',
  primaryDark: '#115E59',
  accent: '#047857',
  bg: '#F0FDF4',
  text: '#0F172A',
};

export const THEME_PALETTES: Record<
  string,
  { primary: string; primaryDark: string; accent: string; bg: string; text: string }
> = {
  'Green Trust': { primary: '#0F766E', primaryDark: '#115E59', accent: '#047857', bg: '#F0FDF4', text: '#0F172A' },
  'Teal Poster': { primary: '#0284C7', primaryDark: '#0369A1', accent: '#0EA5E9', bg: '#F0F9FF', text: '#0F172A' },
  'Navy Gold': { primary: '#1E3A8A', primaryDark: '#172554', accent: '#D97706', bg: '#F8FAFC', text: '#0F172A' },
  'Sand Warmth': { primary: '#78350F', primaryDark: '#451A03', accent: '#B45309', bg: '#FFFBEB', text: '#1C1917' },
  'Slate Clean': { primary: '#334155', primaryDark: '#0F172A', accent: '#475569', bg: '#F8FAFC', text: '#0F172A' },
  'Rose Clinic': { primary: '#BE123C', primaryDark: '#881337', accent: '#E11D48', bg: '#FFF1F2', text: '#1F2937' },
};

export const FALLBACK_CONTENT: DoctorContent = {
  theme: 'Green Trust',
  announcement: 'Complimentary 7-day follow-up consultation included with every visit.',
  availability: {
    nextAvailableSlot: 'Today, 05:30 PM',
    isAcceptingToday: true,
    runningLateMinutes: 0,
    runningLateReason: '',
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
    degree: 'MBBS, MD (Internal Medicine)',
    college: "King George's Medical University, Lucknow",
    specialty: 'Internal Medicine & Diabetology',
    experienceYears: 14,
    registrationNumber: 'DMC-48291 / UP-MCI-71822',
    medicalCouncil: 'Delhi Medical Council & Uttar Pradesh Medical Council',
    languages: 'English, Hindi',
    bio: 'Compassionate senior consultant in Internal Medicine with 14+ years of clinical excellence managing adult chronic diseases, uncontrolled diabetes, hypertension, infectious diseases, and preventive healthcare.',
    consultationFee: 600,
    phone: '+91 98765 43210',
    whatsappNumber: '+919876543210',
    email: 'contact@healthconsult.in',
  },
  clinic: {
    name: 'HealthConsult Family Clinic',
    tagline: 'Compassionate Care, Evidence-Based Medicine',
    taglineQuote: 'Empowering families with preventive healthcare and precision clinical treatments.',
    street: 'Plot 14, Health Plaza, Central Market',
    area: 'Sector 18',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    schedule: {
      weekdayHours: '09:00 AM - 01:00 PM, 05:00 PM - 08:00 PM',
      saturdayHours: '09:00 AM - 04:00 PM',
      sundayHours: 'Closed (Emergency On-Call Only)',
    },
    morningHours: '09:00 AM - 01:00 PM',
    eveningHours: '05:00 PM - 08:00 PM',
    sundayHours: 'Closed',
    feePolicy: 'Standard OPD consultation fee is ₹600. Includes complimentary follow-up within 7 days.',
    amenities: [
      'Air Conditioned OPD Waiting Lounge',
      'Wheelchair Accessible Entrance & Lift',
      'In-Clinic Point-of-Care Blood Glucose & ECG',
      'Digital E-Prescriptions with QR Verification',
      'Cashless UPI & Debit/Credit Card Accepted',
      'Direct WhatsApp Token Confirmation',
    ],
    transitGuidance: 'Located 250 meters from Noida Sector 18 Metro Station (Blue Line, Gate No. 2). Dedicated patient parking available.',
    mapLocationName: 'HealthConsult Family Clinic, Sector 18 Noida',
    mapSubtitle: 'Opposite Centerstage Mall, Above Apollo Pharmacy, 1st Floor',
    googleMapEmbedUrl: 'https://maps.google.com/maps?q=Sector%2018%2C%20Noida%2C%20Uttar%20Pradesh&t=&z=14&ie=UTF8&iwloc=&output=embed',
    googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ-3e4',
  },
  hero: {
    headline: 'Trusted Family Medicine & Diabetes Care in Sector 18, Noida',
    subtitle: 'Consult Senior Physician Dr. Maanvita Kumari (MBBS, MD) for evidence-based chronic disease management, seasonal infection diagnosis, and comprehensive family health.',
    statConsultations: '18,500+',
    statRating: '4.9/5',
    statExperience: '14+ Yrs',
  },
  whyChooseUs: [
    {
      id: 'why-1',
      icon: 'clock',
      title: 'Minimal OPD Wait Times',
      description: 'Scheduled appointments with live token tracking ensure an average wait time under 15 minutes.',
    },
    {
      id: 'why-2',
      icon: 'shield',
      title: 'Zero Over-Prescription Policy',
      description: 'Strict adherence to ICMR & WHO clinical protocols with transparent diagnostic recommendations.',
    },
    {
      id: 'why-3',
      icon: 'heartPulse',
      title: 'Continuity of Family Care',
      description: 'Comprehensive digital records ensuring personalized treatment history for elderly and pediatric patients.',
    },
    {
      id: 'why-4',
      icon: 'message',
      title: 'WhatsApp Follow-Up Support',
      description: 'Direct clinic coordination for report reviews and medication reminders between scheduled consultations.',
    },
  ],
  accreditations: [
    {
      id: 'acc-1',
      icon: 'shield',
      title: 'Verified Medical Council Registration',
      description: 'DMC Registration No. 48291 & UP Medical Council No. 71822 verified annually.',
    },
    {
      id: 'acc-2',
      icon: 'award',
      title: "King George's Medical University Alumni",
      description: 'Postgraduate MD training at prestigious state medical university with honors in Internal Medicine.',
    },
    {
      id: 'acc-3',
      icon: 'userCheck',
      title: 'Senior Hospital Attachments',
      description: 'Visiting consultant at Fortis Hospital Noida & Max Healthcare Patparganj.',
    },
  ],
  services: [
    {
      id: 'srv-1',
      title: 'General Internal Medicine & OPD Consultation',
      description: 'Comprehensive evaluation of acute and chronic adult ailments, seasonal viral fevers, fatigue, headaches, and systemic wellness.',
      icon: 'stethoscope',
    },
    {
      id: 'srv-2',
      title: 'Diabetes Mellitus & Metabolic Management',
      description: 'Individualized glycemic profiling, HbA1c control, dietary guidance, insulin titration, and diabetic neuropathy screening.',
      icon: 'heartPulse',
    },
    {
      id: 'srv-3',
      title: 'Hypertension & Cardiovascular Risk Profiling',
      description: 'Ambulatory blood pressure monitoring, dyslipidemia management, ECG assessment, and cardiovascular disease prevention.',
      icon: 'activity',
    },
    {
      id: 'srv-4',
      title: 'Seasonal Fevers, Dengue & Infectious Diseases',
      description: 'Rapid NS1 dengue antigen testing, typhoid evaluation, malaria smears, platelet monitoring, and hydration protocols.',
      icon: 'thermometer',
    },
    {
      id: 'srv-5',
      title: 'Thyroid Disorders & Endocrine Evaluation',
      description: 'Precise management of Hypothyroidism, Hashimoto thyroiditis, Hyperthyroidism, and hormone replacement titration.',
      icon: 'pill',
    },
    {
      id: 'srv-6',
      title: 'Preventive Annual Health Checkups & Geriatric Care',
      description: 'Comprehensive organ screening packages, bone mineral density assessment, polypharmacy review, and lifestyle counseling.',
      icon: 'userCheck',
    },
    {
      id: 'srv-7',
      title: 'Respiratory Infections, Asthma & Allergy Care',
      description: 'Treatment for acute bronchitis, allergic rhinitis, COPD exacerbation, nebulization therapy, and peak flow spirometry.',
      icon: 'syringe',
    },
    {
      id: 'srv-8',
      title: 'Gastrointestinal & Digestive Disorders',
      description: 'Evidence-based management of acid reflux (GERD), IBS, H. pylori gastritis, fatty liver disease, and abdominal discomfort.',
      icon: 'microscope',
    },
    {
      id: 'srv-9',
      title: 'In-Clinic Rapid Diagnostics & ECG',
      description: 'Point-of-care 12-lead ECG, instantaneous capillary blood glucose, urine dipstick, and rapid influenza testing.',
      icon: 'shield',
    },
  ],
  reviews: [
    {
      id: 'rev-1',
      patientName: 'R. Sharma',
      location: 'Sector 29, Noida',
      treatment: 'Type 2 Diabetes Management',
      rating: 5,
      reviewText: 'Dr. Maanvita brought my HbA1c down from 9.4% to 6.8% over 5 months without overmedicating. Her dietary counseling was realistic and sustainable. The clinic wait time is consistently under 10 minutes.',
    },
    {
      id: 'rev-2',
      patientName: 'P. Kulshreshtha',
      location: 'Sector 50, Noida',
      treatment: 'Hypertension & Routine Health Check',
      rating: 5,
      reviewText: 'Extremely polite, listens patiently without rushing, and explains lab reports in plain Hindi and English. Best internal medicine doctor in Noida.',
    },
    {
      id: 'rev-3',
      patientName: 'M. Ansari',
      location: 'Indirapuram, Ghaziabad',
      treatment: 'Dengue Fever Recovery',
      rating: 5,
      reviewText: 'Managed my severe dengue fever when platelets dropped to 45,000. Daily telephone follow-ups by the clinic team avoided unnecessary hospitalization. Forever grateful.',
    },
  ],
  faqs: [
    {
      id: 'faq-1',
      question: 'What are the OPD consultation hours at HealthConsult Clinic?',
      answer: 'The clinic is open Monday through Friday from 09:00 AM to 01:00 PM (Morning OPD) and 05:00 PM to 08:00 PM (Evening OPD). On Saturday, consultations run from 09:00 AM to 04:00 PM continuously. The clinic is closed on Sunday except for emergency triages.',
    },
    {
      id: 'faq-2',
      question: 'What is the consultation fee and does it include a follow-up?',
      answer: 'The initial OPD consultation fee is ₹600. Every consultation includes a complimentary follow-up within 7 calendar days to review lab investigation reports and monitor clinical recovery.',
    },
    {
      id: 'faq-3',
      question: 'Do I need to fast before my appointment for diabetes screening?',
      answer: 'If you plan to have a Fasting Blood Sugar (FBS) or Lipid Profile test during your visit, please observe 8 to 10 hours of overnight fasting (water is permitted). HbA1c and random blood glucose do not require fasting.',
    },
    {
      id: 'faq-4',
      question: 'Can I book an appointment via WhatsApp or telephone?',
      answer: 'Yes! You can book instantly using the website booking form, message us on WhatsApp at +91 98765 43210, or call the front desk directly during OPD operating hours.',
    },
    {
      id: 'faq-5',
      question: 'Is parking available at the Sector 18 clinic location?',
      answer: 'Yes, multi-level and surface patient parking is available at Central Market Sector 18, within 50 meters of Health Plaza. The clinic building has elevator and wheelchair access.',
    },
  ],
  media: [],
};

export function useClinicContent() {
  const [content, setContent] = useState<DoctorContent>(FALLBACK_CONTENT);
  const [loading, setLoading] = useState(true);

  const fetchContent = async () => {
    try {
      const res = await fetch('/api/content', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setContent(data);
      }
    } catch {
      // Keep fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
    const interval = setInterval(fetchContent, 5000);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'doctorsite_sync_event') {
        fetchContent();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const themeKey = content?.theme || 'Green Trust';
  const theme = THEME_PALETTES[themeKey] || DEFAULT_PALETTE;

  return {
    content,
    theme,
    loading,
    fetchContent,
  };
}
