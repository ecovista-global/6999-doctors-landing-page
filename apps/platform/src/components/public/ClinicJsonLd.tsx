import React from 'react';
import { CLINICAL_DOCTORS } from '@/lib/doctorsRoster';
import { CLINICAL_FAQS_CATEGORIZED } from '@/lib/clinicalFaqs';

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');

export function ClinicJsonLd() {
  const clinicSchema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalClinic',
    '@id': `${BASE_URL}#medicalclinic`,
    name: 'HealthConsult Multi-Specialty Clinic',
    description:
      'Multi-specialty outpatient medical clinic led by Dr. Maanvita Kumari (MBBS, MD) offering internal medicine, family & pediatric care, clinical nutrition, and preventive health packages in Sector 18, Noida.',
    url: BASE_URL,
    telephone: '+91-98100-55555',
    email: 'appointments@healthconsultclinic.in',
    priceRange: '₹400 - ₹3,500',
    medicalSpecialty: [
      'InternalMedicine',
      'Endocrinology',
      'Cardiovascular',
      'Pediatrics',
      'Nutrition',
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Suite 204, MedSphere Clinical Tower, Sector 18',
      addressLocality: 'Noida',
      addressRegion: 'UP',
      postalCode: '201301',
      addressCountry: 'IN',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '20:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday'],
        opens: '09:00',
        closes: '16:00',
      },
    ],
  };

  const physiciansSchema = {
    '@context': 'https://schema.org',
    '@graph': CLINICAL_DOCTORS.map((doc) => ({
      '@type': 'Physician',
      name: doc.name,
      jobTitle: doc.role,
      medicalSpecialty: doc.specialties,
      description: doc.bio,
      identifier: doc.registration,
      worksFor: { '@id': `${BASE_URL}#medicalclinic` },
      url: `${BASE_URL}/doctors`,
    })),
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: CLINICAL_FAQS_CATEGORIZED.flatMap((cat) =>
      cat.items.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      }))
    ),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(clinicSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(physiciansSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}

