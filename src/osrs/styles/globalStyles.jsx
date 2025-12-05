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
            '.text-gray-500': {
                '--tw-text-opacity': '1',
                color: 'rgb(22 166 69)',
            },
            // You can add more global styles here if needed
            body: {
                backgroundColor: theme.palette.background.default, // Ensure body bg matches theme
            }
        })}
    />
);
