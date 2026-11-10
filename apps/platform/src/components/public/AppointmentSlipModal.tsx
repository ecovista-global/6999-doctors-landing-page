'use client';

import React from 'react';
import type { DoctorContent } from '@/lib/contentStore';
import {
  StethoscopeIcon,
  PrinterIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
  XIcon,
} from '@/components/Icons';
import { getGoogleCalendarUrl, downloadIcsFile } from '@/lib/calendarExport';

export interface AppointmentSlipData {
  tokenNumber: number;
  patientName: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  shift: string;
  id?: string;
}

export interface AppointmentSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: AppointmentSlipData;
  content: DoctorContent;
}

export function AppointmentSlipModal({
  isOpen,
  onClose,
  appointment,
  content,
}: AppointmentSlipModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const calendarDetails = {
    patientName: appointment.patientName,
    doctorName: content.doctor.name,
    clinicName: content.clinic.name,
    service: appointment.service,
    date: appointment.date,
    time: appointment.time,
    tokenNumber: appointment.tokenNumber,
    clinicAddress: `${content.clinic.street}, ${content.clinic.area}, ${content.clinic.city} ${content.clinic.pincode}`,
    phone: content.doctor.phone,
  };

  return (
    <div
      className="slip-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '16px',
        backdropFilter: 'blur(3px)',
      }}
    >
      {/* Styles for clean isolated printing */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .printable-slip,
          .printable-slip * {
            visibility: visible !important;
          }
          .printable-slip {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 500px !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: 1px solid #000 !important;
            padding: 24px !important;
            background: #fff !important;
            color: #000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top Control Bar (Hidden on print) */}
        <div
          className="no-print"
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#F8FAFC',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PrinterIcon size={16} color="#0D5C46" />
            <span>Official Clinic Appointment Slip</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close appointment slip"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748B',
              padding: '4px',
              borderRadius: '6px',
            }}
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Printable Slip Body */}
        <div
          className="printable-slip"
          style={{
            padding: '28px',
            background: '#FFFFFF',
            color: '#0F172A',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {/* Clinic Header */}
          <div
            style={{
              borderBottom: '2px solid #0D5C46',
              paddingBottom: '16px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: '18px', color: '#0D5C46', letterSpacing: '-0.3px' }}>
                {content.clinic.name}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginTop: '2px' }}>
                {content.doctor.name} &bull; {content.doctor.degree}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                Reg: {content.doctor.registrationNumber} ({content.doctor.medicalCouncil})
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                {content.clinic.street}, {content.clinic.area}, {content.clinic.city} - {content.clinic.pincode}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#64748B' }}>Helpdesk Phone</div>
              <div style={{ fontWeight: 700, fontSize: '12px', color: '#0F172A' }}>{content.doctor.phone}</div>
            </div>
          </div>

          {/* Token Callout Badge */}
          <div
            style={{
              background: '#F0FDF4',
              border: '2px dashed #059669',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#065F46', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              OPD Queue Token Number
            </div>
            <div style={{ fontSize: '42px', fontWeight: 900, color: '#047857', lineHeight: '1.1', margin: '4px 0' }}>
              #{appointment.tokenNumber}
            </div>
            <div style={{ fontSize: '12px', color: '#065F46', fontWeight: 600 }}>
              Estimated Slot: {appointment.time} ({appointment.shift} Shift)
            </div>
          </div>

          {/* Appointment Data Table */}
          <div
            style={{
              background: '#F8FAFC',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '20px',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>Patient Name</span>
                <strong style={{ color: '#0F172A', fontSize: '13px' }}>{appointment.patientName}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>Contact Phone</span>
                <strong style={{ color: '#0F172A', fontSize: '13px' }}>{appointment.phone}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>Clinical Service</span>
                <strong style={{ color: '#0F172A' }}>{appointment.service}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>Appointment Date</span>
                <strong style={{ color: '#0F172A' }}>{appointment.date || 'Today / Next Working Day'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>Consultation Fee</span>
                <strong style={{ color: '#0D5C46' }}>INR {content.doctor.consultationFee}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>Follow-Up Policy</span>
                <span style={{ color: '#065F46', fontWeight: 600 }}>Complimentary 7 Days</span>
              </div>
            </div>
          </div>

          {/* Clinical Instructions */}
          <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.6', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
            <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Important Patient Instructions:</div>
            <ul style={{ margin: '0 0 0 16px', padding: 0 }}>
              <li>Please carry this slip (or show digital copy on mobile) to the clinic reception.</li>
              <li>Bring your previous medical prescriptions, lab reports, and current medication list.</li>
              <li>Please arrive 10 minutes before your scheduled slot to complete registration.</li>
              <li>Complimentary 7-day follow-up consultation is valid from the date of initial visit.</li>
            </ul>
          </div>
        </div>

        {/* Modal Action Buttons (Hidden on print) */}
        <div
          className="no-print"
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #E2E8F0',
            background: '#F8FAFC',
            borderBottomLeftRadius: '16px',
            borderBottomRightRadius: '16px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            justifyContent: 'flex-end',
          }}
        >
          <a
            href={getGoogleCalendarUrl(calendarDetails)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '9px 14px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: '12px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CalendarIcon size={14} color="#0284C7" />
            <span>Google Calendar</span>
          </a>

          <button
            onClick={() => downloadIcsFile(calendarDetails)}
            style={{
              padding: '9px 14px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ClockIcon size={14} color="#D97706" />
            <span>Apple / .ics</span>
          </button>

          <button
            onClick={handlePrint}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              background: '#0D5C46',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(13,92,70,0.3)',
            }}
          >
            <PrinterIcon size={14} color="#FFFFFF" />
            <span>Print Appointment Slip</span>
          </button>
        </div>
      </div>
    </div>
  );
}
