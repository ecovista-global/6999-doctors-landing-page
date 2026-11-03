// Error taxonomy & E-code registry per brain/09_ERROR_HANDLING.md § 1

export type ErrorCode =
  | 'E-1101'
  | 'E-1201'
  | 'E-1301'
  | 'E-1302'
  | 'E-1303'
  | 'E-1304'
  | 'E-1401'
  | 'E-1501'
  | 'E-2101'
  | 'E-2201'
  | 'E-2301'
  | 'E-2401'
  | 'E-3101'
  | 'E-3201'
  | 'E-3202'
  | 'E-3301'
  | 'E-4001'
  | 'E-4101'
  | 'E-4201';

export interface ErrorDefinition {
  code: ErrorCode;
  status: number;
  title: string;
  userMessage: {
    en: string;
    hi: string;
  };
  operatorAction: string;
}

export const ERROR_REGISTRY: Record<ErrorCode, ErrorDefinition> = {
  'E-1101': {
    code: 'E-1101',
    status: 422,
    title: 'Invalid phone or input field',
    userMessage: {
      en: 'Please check your phone number.',
      hi: 'कृपया अपना फ़ोन नंबर जाँचें।',
    },
    operatorAction: 'None',
  },
  'E-1201': {
    code: 'E-1201',
    status: 422,
    title: 'Asset rejected (type or size exceeds limit)',
    userMessage: {
      en: 'This image is not allowed (max 5 MB).',
      hi: 'यह छवि स्वीकार्य नहीं है (अधिकतम 5 MB)।',
    },
    operatorAction: 'None',
  },
  'E-1301': {
    code: 'E-1301',
    status: 409,
    title: 'Content version conflict',
    userMessage: {
      en: 'Page changed elsewhere.',
      hi: 'पेज कहीं और बदला गया है।',
    },
    operatorAction: 'None',
  },
  'E-1302': {
    code: 'E-1302',
    status: 422,
    title: 'Idempotency key reused with different body',
    userMessage: {
      en: 'Please retry the form.',
      hi: 'कृपया फ़ॉर्म दोबारा भेजें।',
    },
    operatorAction: 'Check client bug',
  },
  'E-1303': {
    code: 'E-1303',
    status: 409,
    title: 'Duplicate request in flight',
    userMessage: {
      en: 'Already sending, please wait.',
      hi: 'भेजा जा रहा है, कृपया प्रतीक्षा करें।',
    },
    operatorAction: 'None',
  },
  'E-1304': {
    code: 'E-1304',
    status: 400,
    title: 'Missing Idempotency-Key header',
    userMessage: {
      en: 'Something went wrong, please retry.',
      hi: 'कुछ गलत हुआ, कृपया पुनः प्रयास करें।',
    },
    operatorAction: 'Fix client',
  },
  'E-1401': {
    code: 'E-1401',
    status: 401,
    title: 'Webhook signature or replay invalid',
    userMessage: {
      en: 'Authentication failed.',
      hi: 'प्रमाणीकरण विफल।',
    },
    operatorAction: 'Investigate if sustained',
  },
  'E-1501': {
    code: 'E-1501',
    status: 429,
    title: 'Rate limited',
    userMessage: {
      en: 'Too many attempts, try later.',
      hi: 'बहुत अधिक प्रयास, बाद में कोशिश करें।',
    },
    operatorAction: 'None',
  },
  'E-2101': {
    code: 'E-2101',
    status: 422,
    title: 'Content sheet failed validation',
    userMessage: {
      en: 'We could not build your page.',
      hi: 'हम आपका पेज नहीं बना सके।',
    },
    operatorAction: 'Fix sheet, replay',
  },
  'E-2201': {
    code: 'E-2201',
    status: 500,
    title: 'Build failed',
    userMessage: {
      en: 'Build failed, team notified.',
      hi: 'बिल्ड विफल, टीम को सूचित किया गया।',
    },
    operatorAction: 'Check renderer logs',
  },
  'E-2301': {
    code: 'E-2301',
    status: 500,
    title: 'Asset processing failed',
    userMessage: {
      en: 'Image processing failed.',
      hi: 'छवि प्रोसेस नहीं हुई।',
    },
    operatorAction: 'Re-upload/replay',
  },
  'E-2401': {
    code: 'E-2401',
    status: 503,
    title: 'Backpressure shed',
    userMessage: {
      en: 'Busy, retry shortly.',
      hi: 'व्यस्त है, कुछ देर बाद प्रयास करें।',
    },
    operatorAction: 'Check queue depth',
  },
  'E-3101': {
    code: 'E-3101',
    status: 502,
    title: 'Razorpay upstream error',
    userMessage: {
      en: 'Payment service is slow.',
      hi: 'भुगतान सेवा धीमी है।',
    },
    operatorAction: 'Reconcile',
  },
  'E-3201': {
    code: 'E-3201',
    status: 502,
    title: 'WhatsApp Cloud API upstream error',
    userMessage: {
      en: 'Message will be delayed.',
      hi: 'संदेश में देरी होगी।',
    },
    operatorAction: 'Email fallback',
  },
  'E-3202': {
    code: 'E-3202',
    status: 502,
    title: 'Resend email upstream error',
    userMessage: {
      en: 'Email will be delayed.',
      hi: 'ईमेल में देरी होगी।',
    },
    operatorAction: 'Check Resend status',
  },
  'E-3301': {
    code: 'E-3301',
    status: 502,
    title: 'Cloudflare API upstream error',
    userMessage: {
      en: 'Domain update pending.',
      hi: 'डोमेन अपडेट लंबित है।',
    },
    operatorAction: 'Retry/reconcile',
  },
  'E-4001': {
    code: 'E-4001',
    status: 503,
    title: 'Database unavailable or pool exhausted',
    userMessage: {
      en: 'Service temporarily unavailable.',
      hi: 'सेवा अस्थायी रूप से अनुपलब्ध है।',
    },
    operatorAction: 'Page on-call',
  },
  'E-4101': {
    code: 'E-4101',
    status: 503,
    title: 'Redis cache/limiter unavailable',
    userMessage: {
      en: 'Please try again.',
      hi: 'कृपया पुनः प्रयास करें।',
    },
    operatorAction: 'Check Upstash',
  },
  'E-4201': {
    code: 'E-4201',
    status: 503,
    title: 'Circuit breaker open',
    userMessage: {
      en: 'Try again in a minute.',
      hi: 'एक मिनट बाद प्रयास करें।',
    },
    operatorAction: 'Check dependency',
  },
};

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly title: string;
  public readonly detail: string;
  public readonly invalidParams?: Array<{ name: string; reason: string }> | undefined;

  constructor(
    code: ErrorCode,
    detail?: string,
    invalidParams?: Array<{ name: string; reason: string }> | undefined
  ) {
    const def = ERROR_REGISTRY[code] || {
      code,
      status: 500,
      title: 'Internal Server Error',
      userMessage: { en: 'Internal Server Error', hi: 'आंतरिक त्रुटि' },
      operatorAction: 'Investigate',
    };

    super(detail || def.title);
    this.name = 'AppError';
    this.code = code;
    this.status = def.status;
    this.title = def.title;
    this.detail = detail || def.userMessage.en;
    this.invalidParams = invalidParams;
  }
}
