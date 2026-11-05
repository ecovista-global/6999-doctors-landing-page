import React from 'react';
import { PhoneIcon, MessageCircleIcon, CalendarIcon } from '@ecodigitech/ui/icons';

export interface MobileCtaBarProps {
  phone?: string | undefined;
  doctorName?: string | undefined;
  whatsappNumber?: string | undefined;
  appointmentHref?: string | undefined;
}

export const MobileCtaBar: React.FC<MobileCtaBarProps> = ({
  phone = '+919876543210',
  doctorName = 'Dr. Maanvita Kumari',
  whatsappNumber = '919876543210',
  appointmentHref = '/contact',
}) => {
  return (
    <aside className="sticky-mobile-bar" aria-label="Quick Actions">
      <a
        href={`tel:${phone}`}
        className="mobile-cta-btn cta-call"
        aria-label={`Call ${doctorName}`}
      >
        <PhoneIcon size={20} className="mobile-cta-icon" />
        <span>Call</span>
      </a>

      <a
        href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hello ${doctorName}, I would like to book a clinical consultation.`)}`}
        className="mobile-cta-btn cta-wa"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`WhatsApp ${doctorName}`}
      >
        <MessageCircleIcon size={20} className="mobile-cta-icon" />
        <span>WhatsApp</span>
      </a>

      <a
        href={appointmentHref}
        className="mobile-cta-btn cta-form"
        aria-label="Book Visit with Clinic"
      >
        <CalendarIcon size={20} className="mobile-cta-icon" />
        <span>Book Visit</span>
      </a>
    </aside>
  );
};

export default MobileCtaBar;
