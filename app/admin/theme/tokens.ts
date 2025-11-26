/**
 * Gothic Admin Theme Tokens
 *
 * Design system foundation for Obsidian Rite Records admin panel.
 * All colors use CSS custom properties for runtime flexibility.
 */

// Color palette - Gothic dark theme with blood/teal accents
export const colors = {
  // Base backgrounds (layered darkness)
  bg: {
    base: '#080a0e',      // Deepest black
    elevated0: '#0c0f14', // Card background
    elevated1: '#10141b', // Hover/selected states
    elevated2: '#151a23', // Popovers, modals
    elevated3: '#1a202c', // Tooltips
  },

  // Text hierarchy
  text: {
    high: '#f0f4f8',      // Primary text (bone white)
    medium: '#94a3b8',    // Secondary text
    low: '#64748b',       // Tertiary/disabled
    inverse: '#0f172a',   // Text on light backgrounds
  },

  // Brand accents
  primary: {
    DEFAULT: '#8b0000',   // Blood red
    hover: '#a10000',
    active: '#6b0000',
    ghost: 'rgba(139, 0, 0, 0.12)',
  },

  accent: {
    DEFAULT: '#2dd4bf',   // Teal
    hover: '#14b8a6',
    active: '#0d9488',
    ghost: 'rgba(45, 212, 191, 0.12)',
  },

  // Semantic colors
  success: {
    bg: '#052e1c',
    text: '#4ade80',
    border: '#166534',
  },
  warning: {
    bg: '#2d1f05',
    text: '#fbbf24',
    border: '#a16207',
  },
  danger: {
    bg: '#2d0a0a',
    text: '#f87171',
    border: '#991b1b',
  },
  info: {
    bg: '#0a1929',
    text: '#60a5fa',
    border: '#1e40af',
  },

  // UI elements
  border: {
    DEFAULT: '#1e293b',
    subtle: '#141c28',
    focus: '#8b0000',
  },

  // Gradient overlays
  gradient: {
    gothic: 'linear-gradient(180deg, rgba(8,10,14,0) 0%, rgba(8,10,14,0.8) 100%)',
    blood: 'linear-gradient(135deg, #8b0000 0%, #4a0000 100%)',
    metal: 'linear-gradient(180deg, #1a202c 0%, #0c0f14 100%)',
    shimmer: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
  },
} as const;

// Spacing scale
export const spacing = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const;

// Border radius
export const radius = {
  none: '0',
  sm: '4px',
  DEFAULT: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const;

// Shadows (deep, gothic feel)
export const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.2)',
  DEFAULT: '0 2px 4px rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.25)',
  md: '0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)',
  lg: '0 8px 24px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.4)',
  xl: '0 16px 48px rgba(0,0,0,0.7), 0 8px 16px rgba(0,0,0,0.5)',
  glow: {
    blood: '0 0 20px rgba(139, 0, 0, 0.4)',
    teal: '0 0 20px rgba(45, 212, 191, 0.3)',
  },
  inner: 'inset 0 1px 3px rgba(0,0,0,0.5)',
} as const;

// Typography
export const typography = {
  fontFamily: {
    heading: "var(--font-gothic), 'Cinzel', 'Times New Roman', serif",
    body: "var(--font-body), 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
  },
  fontSize: {
    xs: '11px',
    sm: '13px',
    base: '14px',
    md: '15px',
    lg: '18px',
    xl: '22px',
    '2xl': '28px',
    '3xl': '36px',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.2',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const;

// Animation durations and easing
export const animation = {
  duration: {
    fast: '100ms',
    normal: '200ms',
    slow: '300ms',
    slower: '400ms',
  },
  easing: {
    DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

// Z-index scale
export const zIndex = {
  dropdown: 1000,
  sticky: 1100,
  modal: 1200,
  popover: 1300,
  tooltip: 1400,
  toast: 1500,
} as const;

// Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// CSS custom properties (for runtime theming)
export const cssVariables = `
  :root {
    /* Backgrounds */
    --admin-bg-base: ${colors.bg.base};
    --admin-bg-elevated-0: ${colors.bg.elevated0};
    --admin-bg-elevated-1: ${colors.bg.elevated1};
    --admin-bg-elevated-2: ${colors.bg.elevated2};
    --admin-bg-elevated-3: ${colors.bg.elevated3};

    /* Text */
    --admin-text-high: ${colors.text.high};
    --admin-text-medium: ${colors.text.medium};
    --admin-text-low: ${colors.text.low};

    /* Primary (blood red) */
    --admin-primary: ${colors.primary.DEFAULT};
    --admin-primary-hover: ${colors.primary.hover};
    --admin-primary-active: ${colors.primary.active};
    --admin-primary-ghost: ${colors.primary.ghost};

    /* Accent (teal) */
    --admin-accent: ${colors.accent.DEFAULT};
    --admin-accent-hover: ${colors.accent.hover};
    --admin-accent-active: ${colors.accent.active};
    --admin-accent-ghost: ${colors.accent.ghost};

    /* Semantic */
    --admin-success-bg: ${colors.success.bg};
    --admin-success-text: ${colors.success.text};
    --admin-success-border: ${colors.success.border};

    --admin-warning-bg: ${colors.warning.bg};
    --admin-warning-text: ${colors.warning.text};
    --admin-warning-border: ${colors.warning.border};

    --admin-danger-bg: ${colors.danger.bg};
    --admin-danger-text: ${colors.danger.text};
    --admin-danger-border: ${colors.danger.border};

    --admin-info-bg: ${colors.info.bg};
    --admin-info-text: ${colors.info.text};
    --admin-info-border: ${colors.info.border};

    /* Borders */
    --admin-border: ${colors.border.DEFAULT};
    --admin-border-subtle: ${colors.border.subtle};
    --admin-border-focus: ${colors.border.focus};

    /* Shadows */
    --admin-shadow-sm: ${shadows.sm};
    --admin-shadow: ${shadows.DEFAULT};
    --admin-shadow-md: ${shadows.md};
    --admin-shadow-lg: ${shadows.lg};

    /* Radius */
    --admin-radius-sm: ${radius.sm};
    --admin-radius: ${radius.DEFAULT};
    --admin-radius-md: ${radius.md};
    --admin-radius-lg: ${radius.lg};

    /* Typography */
    --admin-font-heading: ${typography.fontFamily.heading};
    --admin-font-body: ${typography.fontFamily.body};
    --admin-font-mono: ${typography.fontFamily.mono};

    /* Animation */
    --admin-duration-fast: ${animation.duration.fast};
    --admin-duration-normal: ${animation.duration.normal};
    --admin-duration-slow: ${animation.duration.slow};
    --admin-ease: ${animation.easing.DEFAULT};
  }
`;
