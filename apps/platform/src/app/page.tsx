import React from 'react';

export default function PlatformHomePage() {
  return (
    <main style={{ padding: '48px 24px', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: '24px', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', color: '#111827', margin: '0 0 8px 0' }}>EcoDigiTech Control Plane</h1>
        <p style={{ color: '#4B5563', fontSize: '16px', margin: 0 }}>
          Operator Admin &amp; Doctor Self-Serve Presence Platform (P1/P2)
        </p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px', background: '#F9FAFB' }}>
          <h2 style={{ fontSize: '18px', color: '#15803D', marginTop: 0 }}>P1 Agency Factory</h2>
          <p style={{ fontSize: '14px', color: '#4B5563', lineHeight: 1.5 }}>
            Automated intake, Zod validation, static rendering, and Cloudflare custom hostname deployments.
          </p>
        </div>

        <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px', background: '#F9FAFB' }}>
          <h2 style={{ fontSize: '18px', color: '#0F6B63', marginTop: 0 }}>P2 Doctor Self-Serve</h2>
          <p style={{ fontSize: '14px', color: '#4B5563', lineHeight: 1.5 }}>
            Guided 7-step onboarding wizard, live preview generation, and Razorpay UPI checkout.
          </p>
        </div>

        <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px', background: '#F9FAFB' }}>
          <h2 style={{ fontSize: '18px', color: '#1D4ED8', marginTop: 0 }}>Lead Processing</h2>
          <p style={{ fontSize: '14px', color: '#4B5563', lineHeight: 1.5 }}>
            AES-256-GCM encrypted patient enquiries, Resend email dispatches, and WhatsApp Cloud API outbox.
          </p>
        </div>
      </section>
    </main>
  );
}
