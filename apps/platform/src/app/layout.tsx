import type { Metadata } from 'next';
import React from 'react';
import './globals.css';
import { ClinicJsonLd } from '@/components/public/ClinicJsonLd';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Dr. Maanvita Kumari | HealthConsult Multi-Specialty Clinic',
    template: '%s | HealthConsult Multi-Specialty Clinic',
  },
  description:
    'Multi-doctor outpatient consultations in Internal Medicine, Diabetes & Metabolic Care, Family Pediatrics, and Clinical Nutrition in Sector 18, Noida.',
  keywords: [
    'Multi-specialty clinic Noida',
    'Dr. Maanvita Kumari',
    'Internal medicine doctor Sector 18 Noida',
    'Diabetes specialist clinic',
    'Health checkup packages Noida',
    'Book doctor appointment online',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: 'HealthConsult Multi-Specialty Clinic',
    title: 'HealthConsult Multi-Specialty Clinic | Sector 18, Noida',
    description:
      'Consult senior specialists across Internal Medicine, Family Pediatrics, and Clinical Nutrition with real-time slot selection.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HealthConsult Multi-Specialty Clinic | Sector 18, Noida',
    description:
      'Multi-doctor OPD consultations, preventive health packages, and diagnostics in Sector 18, Noida.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClinicJsonLd />
        {children}
      </body>
    </html>
  );
}
