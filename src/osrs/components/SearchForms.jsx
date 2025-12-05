import React from 'react';
import { Paper, Typography, TextField, InputAdornment, IconButton } from '@mui/material';

const SearchForms = ({
    searchQuery,
    onSearchQueryChange,
    onSearchSubmit,
    loading
}) => {

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            onSearchSubmit();
        }
    };

    return (
        <Paper elevation={0} className="p-5 border border-gray-200 rounded-2xl">
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700, color: 'text.primary' }}>
                Instant Buy/Sell Price search
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                GE Tracker data is limited to active items. The provided buy/sell prices reflect only items with recent trading volume on the API.
            </Typography>
            <div className="relative">
                <TextField
                    fullWidth
                    placeholder="Search item (e.g. Abyssal whip)"
                    variant="outlined"
                    value={searchQuery}
                    onChange={onSearchQueryChange}
                    onKeyPress={handleKeyPress}
                    size="medium"
                    disabled={loading}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <i className="fas fa-search text-gray-400"></i>
                            </InputAdornment>
                        ),
                        endAdornment: searchQuery && (
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="clear search"
                                    onClick={() => {
                                        onSearchQueryChange({ target: { value: '' } });
                                    }}
                                    edge="end"
                                    size="small"
                                >
                                    <i className="fas fa-times text-gray-400 text-xs"></i>
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />
            </div>
        </Paper>
    );
};

export default SearchForms;
