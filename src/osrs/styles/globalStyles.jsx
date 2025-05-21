// filepath: c:\Users\alexr\Documents\Github\jsreact\src\pages\osrs\styles\globalStyles.js

// Using MUI's GlobalStyles component is often preferred over <style jsx> for theme integration
import GlobalStyles from '@mui/material/GlobalStyles';

export const OsrsGlobalStyles = () => (
    <GlobalStyles
        styles={(theme) => ({
            '.custom-scrollbar': {
                scrollbarWidth: 'thin',
                scrollbarColor: `${theme.palette.grey[400]} ${theme.palette.grey[200]}`, // Use theme colors
                '&::-webkit-scrollbar': {
                    width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                    background: theme.palette.grey[200], // Use theme colors
                    borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb': {
                    background: theme.palette.grey[400], // Use theme colors
                    borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                    background: theme.palette.grey[500], // Use theme colors
                },
            },
            // You can add more global styles here if needed
            body: {
                backgroundColor: theme.palette.background.default, // Ensure body bg matches theme
            }
        })}
    />
);

// If you MUST use <style jsx>, you can export it as a component:
/*
export const OsrsGlobalStylesJsx = () => (
     <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #f3f4f6; // gray-100
            border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #d1d5db; // gray-300
            border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #9ca3af; // gray-400
        }
        // For Firefox
        .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #d1d5db #f3f4f6;
        }
        body {
             background-color: #f3f4f6; // Ensure body bg matches theme default
        }
    `}</style>
);
*/

