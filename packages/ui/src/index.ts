export interface ThemeColors {
  brand: string;
  brandHover: string;
  brandContrast: string;
  mint: string;
  mintLight: string;
  ink: string;
  muted: string;
  border: string;
  surface: string;
  cardBg: string;
  statusPending: string;
  statusConfirmed: string;
  statusCompleted: string;
  statusCancelled: string;
}

export const THEMES: Record<'green' | 'teal' | 'dark', ThemeColors> = {
  green: {
    brand: '#0D5C46',
    brandHover: '#083D2E',
    brandContrast: '#FFFFFF',
    mint: '#E6F4F1',
    mintLight: '#F4FAF6',
    ink: '#0F172A',
    muted: '#64748B',
    border: '#E2E8F0',
    surface: '#F8FAFC',
    cardBg: '#FFFFFF',
    statusPending: '#D97706',
    statusConfirmed: '#059669',
    statusCompleted: '#2563EB',
    statusCancelled: '#DC2626',
  },
  teal: {
    brand: '#0E7490',
    brandHover: '#155E75',
    brandContrast: '#FFFFFF',
    mint: '#D5F0EB',
    mintLight: '#EFF9F7',
    ink: '#0B2A27',
    muted: '#44625E',
    border: '#BFE3DC',
    surface: '#F4F9F8',
    cardBg: '#FFFFFF',
    statusPending: '#D97706',
    statusConfirmed: '#059669',
    statusCompleted: '#2563EB',
    statusCancelled: '#DC2626',
  },
  dark: {
    brand: '#14B8A6',
    brandHover: '#2DD4BF',
    brandContrast: '#090D0B',
    mint: '#132E27',
    mintLight: '#18221E',
    ink: '#F1F5F9',
    muted: '#94A3B8',
    border: '#22332C',
    surface: '#111815',
    cardBg: '#18221E',
    statusPending: '#FBBF24',
    statusConfirmed: '#34D399',
    statusCompleted: '#60A5FA',
    statusCancelled: '#F87171',
  },
};

export const STATUS_COLORS = {
  pending: {
    text: '#D97706',
    bg: '#FEF3C7',
    darkText: '#FBBF24',
    darkBg: '#3B2B0A',
  },
  confirmed: {
    text: '#059669',
    bg: '#D1FAE5',
    darkText: '#34D399',
    darkBg: '#0A3728',
  },
  completed: {
    text: '#2563EB',
    bg: '#DBEAFE',
    darkText: '#60A5FA',
    darkBg: '#0F2D59',
  },
  cancelled: {
    text: '#DC2626',
    bg: '#FEE2E2',
    darkText: '#F87171',
    darkBg: '#451212',
  },
} as const;

export const SPACING = {
  space0: '0px',
  space1: '4px',
  space2: '8px',
  space3: '12px',
  space4: '16px',
  space5: '20px',
  space6: '24px',
  space8: '32px',
  space10: '40px',
  space12: '48px',
  space16: '64px',
  space20: '80px',
  /* Legacy aliases */
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  section: '64px',
} as const;

export const RADIUS = {
  xs: '4px',
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '20px',
  full: '9999px',
  /* Legacy aliases */
  button: '10px',
  photoShape: '20px',
  card: '14px',
} as const;

export const TYPOGRAPHY = {
  fontSans: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans Devanagari', Roboto, sans-serif",
  fontDisplay: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans Devanagari', sans-serif",
  fontHindi: "'Noto Sans Devanagari', var(--font-sans)",
  scale: {
    caption: '12px',
    bodySm: '14px',
    bodyBase: '16px',
    headingSm: '18px',
    headingMd: '22px',
    headingLg: '28px',
    displayXl: '36px',
    display2Xl: '44px',
  },
} as const;
