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
    darkMode: 'class',
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
                    500: '#3b82f6', // electric blue
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                },

                /** Secondary / support */
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                    50: '#ecfdf5',
                    100: '#d1fae5',
                    200: '#a7f3d0',
                    300: '#6ee7b7',
                    400: '#34d399',
                    500: '#10b981', // mint‑emerald
                    600: '#059669',
                    700: '#047857',
                    800: '#065f46',
                    900: '#064e3b',
                },

                /** Accent / highlight */
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                    50: '#f5f3ff',
                    100: '#ede9fe',
                    200: '#ddd6fe',
                    300: '#c4b5fd',
                    400: '#a78bfa',
                    500: '#8b5cf6', // ultraviolet
                    600: '#7c3aed',
                    700: '#6d28d9',
                    800: '#5b21b6',
                    900: '#4c1d95',
                },

                /** Neutral surface / text variants */
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                    50: '#f9fafb',
                    100: '#f3f4f6',
                    200: '#e5e7eb',
                    300: '#d1d5db',
                    400: '#9ca3af',
                    500: '#6b7280',
                    600: '#4b5563',
                    700: '#374151',
                    800: '#1f2937',
                    900: '#111827',
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

            /** Rounded corners tuned for softer, touch‑friendly aesthetic */
            borderRadius: {
                lg: '1.5rem',  // 24px
                md: '1rem',    // 16px
                sm: '0.5rem',  // 8px
            },

            /** Typography — use variable font if available */
            fontFamily: {
                sans: [
                    'Inter',
                    'Plus Jakarta Sans',
                    'Segoe UI',
                    'Roboto',
                    'system-ui',
                    'sans-serif',
                ],
                heading: [
                    'Poppins',
                    'Plus Jakarta Sans',
                    'Inter',
                    'Segoe UI',
                    'Roboto',
                    'system-ui',
                    'sans-serif',
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
            },
            animation: {
                'accordion-down': 'accordion-down 0.22s ease-out',
                'accordion-up': 'accordion-up 0.22s ease-out',
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
};
