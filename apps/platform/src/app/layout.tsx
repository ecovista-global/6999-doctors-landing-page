import type { Metadata } from 'next';
import React from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dr. Maanvita Kumari | HealthConsult Family Clinic',
  description: 'Compassionate internal medicine, diabetes care, and family health consultations by Dr. Maanvita Kumari (MBBS, MD) in Sector 18, Noida.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
