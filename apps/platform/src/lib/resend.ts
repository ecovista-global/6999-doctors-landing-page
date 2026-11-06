/**
 * Resend Email Client (MT-112 per 03 § 2, 09 § SD-010, SD-011)
 * Handles transaction alert emails to clinic doctors and staff.
 */

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

// In-memory record of sent emails for automated testing and auditing
const sentEmailsBuffer: Array<SendEmailOptions & { sentAt: number; id: string }> = [];

export function getSentEmails() {
  return [...sentEmailsBuffer];
}

export function clearSentEmails() {
  sentEmailsBuffer.length = 0;
}

/**
 * Dispatches an email through Resend API.
 * Timeout budget: 5 s (09 § SD-010).
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const from = options.from || process.env.EMAIL_FROM || 'DoctorSite Alerts <alerts@mail.doctorsite.in>';
  const to = Array.isArray(options.to) ? options.to : [options.to];
  const apiKey = process.env.RESEND_API_KEY;

  // In test / development without real API key, record into hermetic buffer
  if (!apiKey || apiKey === 're_test_mock_key' || process.env.NODE_ENV === 'test') {
    const mockId = `email_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    sentEmailsBuffer.push({
      ...options,
      to,
      from,
      sentAt: Date.now(),
      id: mockId,
    });
    return { success: true, id: mockId };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
      signal: AbortSignal.timeout(5000), // 5s timeout budget
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        error: `Resend HTTP ${res.status}: ${errText}`,
      };
    }

    const data = (await res.json()) as { id?: string };
    const emailId = data.id || `re_${Date.now()}`;
    sentEmailsBuffer.push({
      ...options,
      from,
      sentAt: Date.now(),
      id: emailId,
    });

    return { success: true, id: emailId };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Unknown network error communicating with Resend',
    };
  }
}
