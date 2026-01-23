/**
 * Modern UI Tailwind config – refreshed April 2025
 * Palette leans on contemporary "calm‑neon" tones: electric blue primary, mint‑emerald secondary,
 * ultraviolet accent, and soft slate neutrals.  
 * All functional tokens (--border, --background …) still respected for runtime theming.
 */

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './src/**/*.{html,js,jsx,ts,tsx}',
        './src/components/**/*.{js,jsx,ts,tsx}',
        './src/pages/**/*.{html,js,jsx,ts,tsx}',
    ],
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px',
            },
        },
        extend: {
            /** ----------------------------------------------------------------------
             * Color system – each scale goes 50‑900 (light→dark) for design flexibility
             * -------------------------------------------------------------------- */
            colors: {
                /** Semantic tokens keep working for CSS‑variable driven theming */
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',

                /** Brand / action */
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                },

                /** Secondary / support */
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                },

                /** Accent / highlight */
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                    50: '#fef2f2',
                    100: '#fee2e2',
                    200: '#fecaca',
                    300: '#fca5a5',
                    400: '#f87171',
                    500: '#ef4444',
                    600: '#dc2626',
                    700: '#b91c1c',
                    800: '#991b1b',
                    900: '#7f1d1d',
                },

                /** Neutral surface / text variants */
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                    50: '#fafaf9',
                    100: '#f5f5f4',
                    200: '#e7e5e4',
                    300: '#d6d3d1',
                    400: '#a8a29e',
                    500: '#78716c',
                    600: '#57534e',
                    700: '#44403c',
                    800: '#292524',
                    900: '#1c1917',
                },

                /** Destructive / danger */
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                    50: '#fef2f2',
                    100: '#fee2e2',
                    200: '#fecaca',
                    300: '#fca5a5',
                    400: '#f87171',
                    500: '#ef4444', // vivid red
                    600: '#dc2626',
                    700: '#b91c1c',
                    800: '#991b1b',
                    900: '#7f1d1d',
                },

                /** Component surfaces */
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
            },

            /** Rounded corners tuned for crisp, editorial UI */
            borderRadius: {
                lg: '0.75rem',  // 12px
                md: '0.5rem',   // 8px
                sm: '0.375rem', // 6px
            },

            /** Typography - editorial sans + serif pairing */
            fontFamily: {
                sans: [
                    'Libre Franklin',
                    'Source Sans 3',
                    'Segoe UI',
                    'system-ui',
                    'sans-serif',
                ],
                heading: [
                    'Source Serif 4',
                    'Libre Franklin',
                    'Iowan Old Style',
                    'serif',
                ],
                mono: [
                    'IBM Plex Mono',
                    'ui-monospace',
                    'SFMono-Regular',
                    'Menlo',
                    'Monaco',
                    'Consolas',
                    'monospace',
                ],
            },

            /** Small util animations (e.g., shadcn accordion) */
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' },
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' },
                },
                'pulse-short': {
                    '0%, 100%': {
                        transform: 'scale(1)',
                        opacity: '1',
                    },
                    '50%': {
                        transform: 'scale(1.15)',
                        opacity: '0.9',
                    },
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.22s ease-out',
                'accordion-up': 'accordion-up 0.22s ease-out',
                'pulse-short': 'pulse-short 1.5s ease-in-out 2 forwards',
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
};
