export interface ThemeColors {
  brand: string;
  brandHover: string;
  brandContrast: string;
  mint: string;
  mintLight: string;
  ink: string;
  muted: string;
  border: string;
}

export const THEMES: Record<'green' | 'teal', ThemeColors> = {
  green: {
    brand: '#15803D',
    brandHover: '#166534',
    brandContrast: '#FFFFFF',
    mint: '#E6F4EC',
    mintLight: '#F4FAF6',
    ink: '#0B1F17',
    muted: '#4B5F57',
    border: '#D1E7DD',
  },
  teal: {
    brand: '#0F6B63',
    brandHover: '#0B534D',
    brandContrast: '#FFFFFF',
    mint: '#D5F0EB',
    mintLight: '#EFF9F7',
    ink: '#0B2A27',
    muted: '#44625E',
    border: '#BFE3DC',
  },
};

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  section: '64px',
} as const;

export const RADIUS = {
  button: '12px',
  photoShape: '24px',
  card: '16px',
  full: '9999px',
} as const;
