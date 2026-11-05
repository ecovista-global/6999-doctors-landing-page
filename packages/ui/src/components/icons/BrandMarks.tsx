import type { IconProps } from './types.js';

/**
 * EcoDigiTech Clinic Logo Mark
 * Clinical cross + shield vector mark representing digital healthcare platform.
 */
export const LogoMark = ({
  size = 28,
  color = 'currentColor',
  strokeWidth = 2,
  ...props
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    {...props}
  >
    <rect
      x="2"
      y="2"
      width="28"
      height="28"
      rx="8"
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
    />
    <path
      d="M16 8V24M8 16H24"
      stroke={color}
      strokeWidth={Number(strokeWidth) + 1}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="16" cy="16" r="3" fill={color} />
  </svg>
);

/**
 * Medical Stethoscope Brand Mark
 * Detailed clinical stethoscope mark for doctor profile and hero sections.
 */
export const StethoscopeMark = ({
  size = 24,
  color = 'currentColor',
  strokeWidth = 1.75,
  ...props
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    {...props}
  >
    <path
      d="M4.5 3v5a3.5 3.5 0 0 0 7 0V3"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 11.5v3.5a4 4 0 0 0 8 0V11"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="18"
      cy="10"
      r="2.5"
      stroke={color}
      strokeWidth={strokeWidth}
    />
    <path
      d="M2 3h5M9 3h5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Medical Council & Degree Verified Credential Badge
 * Medical accreditation seal with shield, verification tick, and ribbon.
 */
export const CredentialBadgeMark = ({
  size = 24,
  color = 'currentColor',
  strokeWidth = 1.75,
  ...props
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    {...props}
  >
    <path
      d="M12 2L4 5.5V11.5C4 16.5 7.4 21.2 12 22.5C16.6 21.2 20 16.5 20 11.5V5.5L12 2Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 12L11 14L15 10"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

