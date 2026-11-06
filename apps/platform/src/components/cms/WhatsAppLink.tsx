'use client';

import React from 'react';
import { MessageCircleIcon, ExternalLinkIcon } from '@/components/Icons';

export interface WhatsAppConfirmationParams {
  phone: string;
  patientName: string;
  clinicName?: string | undefined;
  date: string;
  timeSlot: string;
}

/**
 * Normalizes phone number into international format for WhatsApp (MT-118 per 18 § 3)
 * India format: 10 digits prefixed with country code 91
 */
export function normalizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }
  return digits;
}

/**
 * Generates prefilled wa.me confirmation link (18 § 3 / MT-118)
 * Format: https://wa.me/{phone}?text=Dear%20{PatientName},%20your%20appointment%20at%20{ClinicName}%20is%20Confirmed%20for%20{Date}%20at%20{Time}.
 */
export function generateWhatsAppConfirmationUrl(params: WhatsAppConfirmationParams): string {
  const cleanPhone = normalizePhoneForWhatsApp(params.phone);
  const clinicName = params.clinicName || 'HealthConsult Clinic';
  const text = `Dear ${params.patientName}, your appointment at ${clinicName} is Confirmed for ${params.date} at ${params.timeSlot}.`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export interface WhatsAppLinkProps extends WhatsAppConfirmationParams {
  label?: string;
  className?: string;
}

export function WhatsAppLink({
  phone,
  patientName,
  clinicName,
  date,
  timeSlot,
  label = 'Confirm via WhatsApp',
}: WhatsAppLinkProps) {
  const url = generateWhatsAppConfirmationUrl({
    phone,
    patientName,
    clinicName,
    date,
    timeSlot,
  });

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="whatsapp-confirm-link"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 600,
        background: '#DCFCE7',
        color: '#15803D',
        textDecoration: 'none',
        border: '1px solid #86EFAC',
        transition: 'all 150ms ease',
      }}
    >
      <MessageCircleIcon size={14} color="#15803D" />
      <span>{label}</span>
      <ExternalLinkIcon size={11} color="#15803D" />
    </a>
  );
}
