export interface ClinicalDoctor {
  id: string;
  name: string;
  role: string;
  degrees: string;
  college: string;
  registration: string;
  specialties: string[];
  experience: string;
  schedule: string;
  fee: string;
  bio: string;
}

export const CLINICAL_DOCTORS: ClinicalDoctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Maanvita Kumari',
    role: 'Lead Senior Consultant & Clinic Director',
    degrees: 'MBBS, MD (Internal Medicine)',
    college: "King George's Medical University, Lucknow",
    registration: 'DMC-48291 / UP-MCI-71822',
    specialties: ['Internal Medicine', 'Diabetes Mellitus', 'Cardiovascular Risk', 'Infectious Diseases'],
    experience: '14+ Years Experience',
    schedule: 'Mon - Fri: 09:00 AM - 01:00 PM, 05:00 PM - 08:00 PM | Sat: 09:00 AM - 04:00 PM',
    fee: '₹600',
    bio: 'Pioneering internal medicine physician dedicated to comprehensive chronic metabolic control, ethical treatment regimens, and preventive geriatrics.',
  },
  {
    id: 'doc-2',
    name: 'Dr. Rajiv Ranjan',
    role: 'Associate Consultant - Family Medicine',
    degrees: 'MBBS, DNB (Family Medicine)',
    college: 'Maulana Azad Medical College (MAMC), New Delhi',
    registration: 'DMC-52819',
    specialties: ['Pediatric Wellness', 'Adult Vaccinations', 'Hypertension', 'Seasonal Viral Fevers'],
    experience: '9+ Years Experience',
    schedule: 'Tue, Thu, Sat: 02:00 PM - 06:00 PM',
    fee: '₹500',
    bio: 'Family physician with deep focus on community health, pediatric immunizations, adolescent medicine, and acute primary infections.',
  },
  {
    id: 'doc-3',
    name: 'Dr. Sunita Mehra',
    role: 'Clinical Nutritionist & Certified Diabetes Educator',
    degrees: 'M.Sc. Clinical Nutrition, CDE (NDEP)',
    college: 'All India Institute of Medical Sciences (AIIMS) Allied Health',
    registration: 'IDA-Reg-1082',
    specialties: ['Diabetic Meal Planning', 'Renal Nutrition', 'Dyslipidemia Diets', 'Weight Optimization'],
    experience: '11+ Years Experience',
    schedule: 'Mon, Wed, Fri: 10:00 AM - 02:00 PM',
    fee: '₹400',
    bio: 'Collaborating closely with senior physicians to formulate individualized medical nutrition therapy for diabetics, hypertensives, and fatty liver patients.',
  },
];

