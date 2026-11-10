import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getGoogleCalendarUrl } from '../src/lib/calendarExport';
import { TRANSLATIONS, getTranslation } from '../src/lib/translations';

describe('Feature Pack: Live OPD Queue, Calendar Export & Bilingual Translation', () => {
  describe('Calendar Export Engine', () => {
    it('generates valid Google Calendar URL with encoded parameters', () => {
      const url = getGoogleCalendarUrl({
        patientName: 'Ramesh Sharma',
        doctorName: 'Dr. Maanvita Kumari',
        clinicName: 'HealthConsult Family Clinic',
        service: 'Comprehensive Diabetes Evaluation',
        date: '2026-11-15',
        time: '05:30 PM',
        tokenNumber: 8,
        clinicAddress: 'Plot 14, Health Plaza, Sector 18, Noida 201301',
        phone: '+919876543210',
      });

      assert.ok(url.startsWith('https://calendar.google.com/calendar/render?action=TEMPLATE'));
      assert.ok(url.includes('text=Clinic%20Appointment%3A%20Dr.%20Maanvita%20Kumari'));
      assert.ok(url.includes('Ramesh%20Sharma'));
      assert.ok(url.includes('Token%20Number%3A%20%238'));
      assert.ok(url.includes('Sector%2018%2C%20Noida'));
    });

    it('handles fallback date parsing gracefully when date is empty', () => {
      const url = getGoogleCalendarUrl({
        patientName: 'A. Gupta',
        doctorName: 'Dr. Maanvita Kumari',
        clinicName: 'HealthConsult Clinic',
        service: 'General Consultation',
        date: '',
        time: '10:00 AM',
        tokenNumber: 12,
        clinicAddress: 'Noida',
        phone: '+919876543210',
      });

      assert.ok(url.includes('https://calendar.google.com/calendar/render'));
      assert.ok(url.includes('dates='));
    });
  });

  describe('Bilingual Localization Engine (EN / HI)', () => {
    it('contains all 7 page navigation translations in Hindi', () => {
      const hi = TRANSLATIONS.hi;
      assert.equal(hi.home, 'होम');
      assert.equal(hi.aboutDoctor, 'चिकित्सक परिचय');
      assert.equal(hi.services, 'उपचार एवं सेवाएं');
      assert.equal(hi.specialists, 'विशेषज्ञ चिकित्सक');
      assert.equal(hi.reviewsFaq, 'मरीज अनुभव एवं प्रश्न');
      assert.equal(hi.healthBlog, 'स्वास्थ्य ब्लॉग');
      assert.equal(hi.contactBooking, 'संपर्क एवं बुकिंग');
    });

    it('contains live OPD queue and clinical action terms', () => {
      assert.equal(getTranslation('hi', 'liveOpdQueue'), 'लाइव ओपीडी कतार');
      assert.equal(getTranslation('hi', 'currentlyServing'), 'वर्तमान टोकन क्रमांक');
      assert.equal(getTranslation('hi', 'onTime'), 'समय पर');
      assert.equal(getTranslation('hi', 'callClinic'), 'क्लीनिक फोन करें');
      assert.equal(getTranslation('hi', 'printSlip'), 'अपॉइंटमेंट पर्ची प्रिंट करें');
    });

    it('falls back cleanly to English key if translation is missing', () => {
      const fallback = getTranslation('hi', 'nonExistentKey', 'Default Fallback');
      assert.equal(fallback, 'Default Fallback');
    });
  });
});

