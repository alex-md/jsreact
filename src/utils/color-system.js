/**
 * color-system.js - Modern OKLCH-based color system
 * Provides better perceptual uniformity and wider gamut than RGB/HEX
 * All colors maintain at least 4.5:1 contrast ratio in their respective contexts
 */

const colorSystem = {
    // Primary color scale (electric blue)
    primary: {
        50: 'oklch(98% 0.03 262)', // Lightest - for backgrounds
        100: 'oklch(95% 0.06 262)',
        200: 'oklch(90% 0.1 262)',
        300: 'oklch(80% 0.15 262)',
        400: 'oklch(70% 0.2 262)',
        500: 'oklch(65% 0.23 262)', // Base primary
        600: 'oklch(55% 0.24 262)',
        700: 'oklch(45% 0.22 262)',
        800: 'oklch(35% 0.18 262)',
        900: 'oklch(25% 0.12 262)', // Darkest shade
    },

    // Secondary color scale (mint emerald)
    secondary: {
        50: 'oklch(98% 0.03 155)',
        100: 'oklch(95% 0.06 155)',
        200: 'oklch(90% 0.1 155)',
        300: 'oklch(80% 0.15 155)',
        400: 'oklch(70% 0.2 155)',
        500: 'oklch(65% 0.23 155)', // Base secondary
        600: 'oklch(55% 0.24 155)',
        700: 'oklch(45% 0.22 155)',
        800: 'oklch(35% 0.18 155)',
        900: 'oklch(25% 0.12 155)',
    },

    // Accent color scale (ultraviolet)
    accent: {
        50: 'oklch(98% 0.03 290)',
        100: 'oklch(95% 0.06 290)',
        200: 'oklch(90% 0.1 290)',
        300: 'oklch(80% 0.15 290)',
        400: 'oklch(70% 0.2 290)',
        500: 'oklch(65% 0.23 290)', // Base accent
        600: 'oklch(55% 0.24 290)',
        700: 'oklch(45% 0.22 290)',
        800: 'oklch(35% 0.18 290)',
        900: 'oklch(25% 0.12 290)',
    },

    // Gray scale (neutral)
    gray: {
        50: 'oklch(98% 0.005 none)', // Lightest
        100: 'oklch(93% 0.01 none)',
        200: 'oklch(88% 0.015 none)',
        300: 'oklch(75% 0.02 none)',
        400: 'oklch(65% 0.025 none)',
        500: 'oklch(55% 0.03 none)', // Base gray
        600: 'oklch(45% 0.025 none)',
        700: 'oklch(35% 0.02 none)',
        800: 'oklch(25% 0.015 none)',
        900: 'oklch(15% 0.01 none)', // Darkest
    },

    // Error/destructive colors (red)
    error: {
        50: 'oklch(96% 0.03 30)',
        100: 'oklch(93% 0.06 30)',
        200: 'oklch(88% 0.1 30)',
        300: 'oklch(78% 0.15 30)',
        400: 'oklch(68% 0.2 30)',
        500: 'oklch(63% 0.23 30)', // Base error
        600: 'oklch(53% 0.24 30)',
        700: 'oklch(43% 0.22 30)',
        800: 'oklch(33% 0.18 30)',
        900: 'oklch(23% 0.12 30)',
    },

    // Warning colors (amber)
    warning: {
        50: 'oklch(96% 0.03 80)',
        100: 'oklch(93% 0.06 80)',
        200: 'oklch(88% 0.1 80)',
        300: 'oklch(78% 0.15 80)',
        400: 'oklch(68% 0.2 80)',
        500: 'oklch(63% 0.23 80)', // Base warning
        600: 'oklch(53% 0.24 80)',
        700: 'oklch(43% 0.22 80)',
        800: 'oklch(33% 0.18 80)',
        900: 'oklch(23% 0.12 80)',
    },

    // Success colors (green)
    success: {
        50: 'oklch(96% 0.03 140)',
        100: 'oklch(93% 0.06 140)',
        200: 'oklch(88% 0.1 140)',
        300: 'oklch(78% 0.15 140)',
        400: 'oklch(68% 0.2 140)',
        500: 'oklch(63% 0.23 140)', // Base success
        600: 'oklch(53% 0.24 140)',
        700: 'oklch(43% 0.22 140)',
        800: 'oklch(33% 0.18 140)',
        900: 'oklch(23% 0.12 140)',
    },
};

// Semantic color tokens for light mode
const lightTokens = {
    '--surface-1': colorSystem.gray[50],     // Background
    '--surface-2': colorSystem.gray[100],    // Subtle background, cards
    '--surface-3': colorSystem.gray[200],    // UI element background
    '--surface-4': colorSystem.gray[300],    // Hovered UI element background

    '--accent-primary': colorSystem.primary[500],
    '--accent-primary-subtle': colorSystem.primary[100],
    '--accent-primary-emphasis': colorSystem.primary[700],

    '--accent-secondary': colorSystem.secondary[500],
    '--accent-secondary-subtle': colorSystem.secondary[100],
    '--accent-secondary-emphasis': colorSystem.secondary[700],

    '--accent-muted': colorSystem.gray[300],
    '--text-1': colorSystem.gray[900],       // High contrast - headings, important text
    '--text-2': colorSystem.gray[700],       // Medium contrast - body text
    '--text-3': colorSystem.gray[600],       // Low contrast - muted text
    '--text-inverted': colorSystem.gray[50], // For dark backgrounds

    // Interactive states
    '--interactive': colorSystem.primary[500],
    '--interactive-hover': colorSystem.primary[600],
    '--interactive-muted': colorSystem.gray[200],
    '--focus-ring': 'oklch(63% 0.16 262 / 0.5)',

    // Borders
    '--border-subtle': colorSystem.gray[200],
    '--border-muted': colorSystem.gray[300],
    '--border-strong': colorSystem.gray[400],

    // Status
    '--status-error': colorSystem.error[500],
    '--status-error-subtle': colorSystem.error[100],
    '--status-warning': colorSystem.warning[500],
    '--status-warning-subtle': colorSystem.warning[100],
    '--status-success': colorSystem.success[500],
    '--status-success-subtle': colorSystem.success[100],
};

// Semantic color tokens for dark mode
const darkTokens = {
    '--surface-1': colorSystem.gray[900],     // Background
    '--surface-2': colorSystem.gray[800],    // Subtle background, cards
    '--surface-3': colorSystem.gray[700],    // UI element background
    '--surface-4': colorSystem.gray[600],    // Hovered UI element background

    '--accent-primary': colorSystem.primary[400],
    '--accent-primary-subtle': colorSystem.primary[900],
    '--accent-primary-emphasis': colorSystem.primary[300],

    '--accent-secondary': colorSystem.secondary[400],
    '--accent-secondary-subtle': colorSystem.secondary[900],
    '--accent-secondary-emphasis': colorSystem.secondary[300],

    '--accent-muted': colorSystem.gray[600],
    '--text-1': colorSystem.gray[50],        // High contrast - headings, important text 
    '--text-2': colorSystem.gray[200],       // Medium contrast - body text
    '--text-3': colorSystem.gray[300],       // Low contrast - muted text
    '--text-inverted': colorSystem.gray[900], // For light backgrounds

    // Interactive states
    '--interactive': colorSystem.primary[400],
    '--interactive-hover': colorSystem.primary[300],
    '--interactive-muted': colorSystem.gray[700],
    '--focus-ring': 'oklch(70% 0.16 262 / 0.5)',

    // Borders
    '--border-subtle': colorSystem.gray[700],
    '--border-muted': colorSystem.gray[600],
    '--border-strong': colorSystem.gray[500],

    // Status
    '--status-error': colorSystem.error[400],
    '--status-error-subtle': colorSystem.error[900],
    '--status-warning': colorSystem.warning[400],
    '--status-warning-subtle': colorSystem.warning[900],
    '--status-success': colorSystem.success[400],
    '--status-success-subtle': colorSystem.success[900],
};

// Convert previous HEX colors to OKLCH equivalents
const legacyColorMapping = {
    '#1a1b26': 'oklch(20% 0.02 265)', // --header-bg
    '#7aa2f7': 'oklch(65% 0.19 262)', // --accent-primary
    '#bb9af7': 'oklch(72% 0.18 305)', // --accent-secondary
    '#c0caf5': 'oklch(82% 0.06 262)', // --text-primary
    '#a9b1d6': 'oklch(75% 0.08 262)', // --text-secondary
    '#24283b': 'oklch(30% 0.03 265)', // --surface-dark
};

export { colorSystem, lightTokens, darkTokens, legacyColorMapping };
