import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'EcoDigiTech Platform | Control Plane',
  description: 'Digital presence automation factory for doctors and clinics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
