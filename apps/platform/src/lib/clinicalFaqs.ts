export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqCategory {
  category: string;
  items: FaqItem[];
}

export const CLINICAL_FAQS_CATEGORIZED: FaqCategory[] = [
  {
    category: 'Consultations & OPD Booking',
    items: [
      {
        q: 'What are the consultation hours at HealthConsult Clinic Sector 18?',
        a: 'The clinic conducts outpatient consultations Monday through Friday from 09:00 AM to 01:00 PM (Morning Session) and 05:00 PM to 08:00 PM (Evening Session). Saturday OPD operates continuously from 09:00 AM to 04:00 PM. The clinic is closed on Sunday except for pre-scheduled clinical emergencies.',
      },
      {
        q: 'What is the standard consultation fee and does it include a review visit?',
        a: 'The initial OPD consultation fee is ₹600. Every consultation includes a complimentary review visit within 7 calendar days to inspect laboratory reports, assess clinical improvement, and adjust ongoing prescriptions without any extra consultation charge.',
      },
      {
        q: 'How do I avoid waiting in the clinic lounge?',
        a: 'We operate an active token queue management system. When you book your appointment online or by phone, you receive an estimated token time slot. The average in-clinic wait time for pre-booked appointments is under 12 minutes.',
      },
    ],
  },
  {
    category: 'Diabetes & Chronic Disease Care',
    items: [
      {
        q: 'Do I need to come fasting for my first diabetes evaluation?',
        a: 'For initial comprehensive diabetes evaluations, a 10 to 12 hour overnight fast is recommended if you wish to have Fasting Blood Sugar (FBS) or Lipid Profile tested. However, Glycated Hemoglobin (HbA1c) and Random Blood Sugar (RBS) can be tested at any time without fasting.',
      },
      {
        q: 'How frequently will Dr. Maanvita review my diabetes medication?',
        a: 'For newly diagnosed or uncontrolled diabetes (HbA1c > 8.0%), consultations are typically scheduled every 3 to 4 weeks until glycemic control stabilizes. Once stable (HbA1c < 7.0%), comprehensive quarterly reviews every 3 months are recommended.',
      },
    ],
  },
  {
    category: 'Billing, Consent & DPDP Act Compliance',
    items: [
      {
        q: 'How is my medical data and personal phone number protected?',
        a: 'HealthConsult Family Clinic complies strictly with the Digital Personal Data Protection (DPDP) Act 2023. Patient contact details and health records are encrypted at rest with AES-256-GCM. We never disclose patient identities or sell health data to third-party telemarketers.',
      },
      {
        q: 'Which payment modes are accepted at the front desk?',
        a: 'We accept all major UPI apps (Google Pay, PhonePe, Paytm), debit and credit cards, and cash. Detailed GST-compliant digital invoices and receipts are issued instantly for tax or insurance claim purposes.',
      },
    ],
  },
];

