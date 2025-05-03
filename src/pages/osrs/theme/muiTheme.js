// /osrs/theme/muiTheme.js
import { createTheme } from '@mui/material/styles';

export const muiTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#16a34a', // green-600
            dark: '#15803d', // green-700
            light: '#4ade80', // green-400
            contrastText: '#fff',
        },
        secondary: {
            main: '#2563eb', // blue-600
            dark: '#1d4ed8', // blue-700
            light: '#60a5fa', // blue-400
            contrastText: '#fff',
        },
        background: {
            default: '#f3f4f6', // gray-100
            paper: '#ffffff', // white
        },
        text: {
            primary: '#1f2937', // gray-800
            secondary: '#4b5563', // gray-600
        }
    },
    typography: {
        fontFamily: '"Inter", sans-serif',
        h6: {
            fontWeight: 600,
            fontSize: '1.15rem', // Slightly larger than default
        },
        subtitle1: {
            fontWeight: 500,
            fontSize: '1rem',
        },
        body1: {
            fontSize: '0.95rem', // Slightly smaller for better density
        },
        body2: {
            fontSize: '0.85rem',
        },
        caption: {
            fontSize: '0.75rem',
            color: '#6b7280', // gray-500
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontWeight: 600,
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        backgroundColor: '#fff', // Ensure white background
                    },
                    '& .MuiInputLabel-root': {
                        fontWeight: 500,
                    },
                },
            },
        },
        MuiSelect: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                    fontWeight: 500,
                    backgroundColor: '#fff', // Ensure white background
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb', // gray-200
                    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)', // Softer shadow
                },
            },
        },
        MuiCircularProgress: {
            styleOverrides: {
                root: {
                    color: '#16a34a', // Primary green
                },
            },
        },
    },
});
