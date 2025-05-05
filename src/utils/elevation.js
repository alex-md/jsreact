/**
 * elevation.js - Systematic elevation tokens for consistent UI depth
 * Maps to a 0-5 scale with corresponding shadow values and usage guidelines
 */

const elevationTokens = {
    // Level 0 - Flat (no elevation)
    0: {
        boxShadow: 'none',
        zIndex: 0,
        usage: 'Flat elements, backgrounds, disabled components',
        components: [
            'background',
            'disabled-buttons',
            'footer',
            'inline-text'
        ]
    },

    // Level 1 - Subtle
    1: {
        boxShadow: '0px 1px 2px rgba(15, 23, 42, 0.04), 0px 1px 3px rgba(15, 23, 42, 0.08)',
        filter: 'drop-shadow(0px 1px 1px rgba(15, 23, 42, 0.04))',
        zIndex: 1,
        usage: 'Subtle elevation, cards at rest, static components',
        components: [
            'cards-at-rest',
            'form-inputs',
            'static-buttons',
            'tag',
            'checkbox',
            'radio'
        ]
    },

    // Level 2 - Raised
    2: {
        boxShadow: '0px 3px 5px -1px rgba(15, 23, 42, 0.05), 0px 2px 10px -1px rgba(15, 23, 42, 0.1)',
        filter: 'drop-shadow(0px 2px 3px rgba(15, 23, 42, 0.1))',
        zIndex: 2,
        usage: 'Slightly raised elements, interactive cards, buttons',
        components: [
            'buttons',
            'active-cards',
            'hoverable-elements',
            'tool-card',
            'hover-states'
        ]
    },

    // Level 3 - Prominent
    3: {
        boxShadow: '0px 8px 16px -3px rgba(15, 23, 42, 0.12), 0px 4px 8px -2px rgba(15, 23, 42, 0.07)',
        filter: 'drop-shadow(0px 4px 6px rgba(15, 23, 42, 0.12))',
        zIndex: 3,
        usage: 'Prominent UI elements, floating action buttons, active states',
        components: [
            'active-buttons',
            'header',
            'navigation',
            'selected-items',
            'card-modern'
        ]
    },

    // Level 4 - Floating
    4: {
        boxShadow: '0px 16px 24px -6px rgba(15, 23, 42, 0.15), 0px 8px 16px -4px rgba(15, 23, 42, 0.1)',
        filter: 'drop-shadow(0px 8px 12px rgba(15, 23, 42, 0.15))',
        zIndex: 4,
        usage: 'Floating elements, dropdowns, popovers, tooltips',
        components: [
            'dropdowns',
            'popovers',
            'tooltips',
            'modals',
            'result-card-hover'
        ]
    },

    // Level 5 - Highest
    5: {
        boxShadow: '0px 25px 40px -12px rgba(15, 23, 42, 0.25), 0px 18px 30px -10px rgba(15, 23, 42, 0.2)',
        filter: 'drop-shadow(0px 20px 25px rgba(15, 23, 42, 0.2))',
        zIndex: 5,
        usage: 'Highest elevation, dialogs, full-screen modals',
        components: [
            'dialogs',
            'full-screen-modals',
            'spotlight-elements',
            'critical-notifications'
        ]
    }
};

// CSS variables version for theming
const elevationCSSVariables = {
    light: {
        '--shadow-elevation-0': elevationTokens[0].boxShadow,
        '--shadow-elevation-1': elevationTokens[1].boxShadow,
        '--shadow-elevation-2': elevationTokens[2].boxShadow,
        '--shadow-elevation-3': elevationTokens[3].boxShadow,
        '--shadow-elevation-4': elevationTokens[4].boxShadow,
        '--shadow-elevation-5': elevationTokens[5].boxShadow,

        '--filter-elevation-1': elevationTokens[1].filter,
        '--filter-elevation-2': elevationTokens[2].filter,
        '--filter-elevation-3': elevationTokens[3].filter,
        '--filter-elevation-4': elevationTokens[4].filter,
        '--filter-elevation-5': elevationTokens[5].filter,
    },
    dark: {
        '--shadow-elevation-0': 'none',
        '--shadow-elevation-1': '0px 1px 3px rgba(0, 0, 0, 0.25), 0px 1px 2px rgba(0, 0, 0, 0.35)',
        '--shadow-elevation-2': '0px 3px 6px rgba(0, 0, 0, 0.3), 0px 2px 4px rgba(0, 0, 0, 0.4)',
        '--shadow-elevation-3': '0px 8px 16px rgba(0, 0, 0, 0.35), 0px 4px 8px rgba(0, 0, 0, 0.45)',
        '--shadow-elevation-4': '0px 16px 24px rgba(0, 0, 0, 0.4), 0px 8px 16px rgba(0, 0, 0, 0.5)',
        '--shadow-elevation-5': '0px 25px 40px rgba(0, 0, 0, 0.5), 0px 18px 30px rgba(0, 0, 0, 0.6)',

        '--filter-elevation-1': 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.35))',
        '--filter-elevation-2': 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.4))',
        '--filter-elevation-3': 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.45))',
        '--filter-elevation-4': 'drop-shadow(0px 8px 16px rgba(0, 0, 0, 0.5))',
        '--filter-elevation-5': 'drop-shadow(0px 15px 25px rgba(0, 0, 0, 0.6))',
    }
};

export { elevationTokens, elevationCSSVariables };
