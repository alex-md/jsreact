import React from 'react';
import { Paper, Typography, TextField, Button, Divider, Box, CircularProgress } from '@mui/material';

const SearchForms = ({
    sellSearchQuery,
    onSellSearchQueryChange,
    onSellSearchSubmit,
    buySearchQuery,
    onBuySearchQueryChange,
    onBuySearchSubmit,
    loading,
    sellResults, // Pass results to potentially show count or status
    buyResults
}) => {

    const handleSellKeyPress = (e) => {
        if (e.key === 'Enter') {
            onSellSearchSubmit();
        }
    };

    const handleBuyKeyPress = (e) => {
        if (e.key === 'Enter') {
            onBuySearchSubmit();
        }
    };

    return (
        <Paper elevation={0} className="p-5 space-y-5">
            {/* Sell Search Section */}
            <div>
                <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
                    Recommended Sell Price
                </Typography>
                <div className="space-y-3">
                    <TextField
                        fullWidth
                        label="Search item to sell"
                        variant="outlined"
                        value={sellSearchQuery}
                        onChange={onSellSearchQueryChange}
                        onKeyPress={handleSellKeyPress}
                        size="small"
                        disabled={loading}
                    />
                    <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        onClick={onSellSearchSubmit}
                        disabled={!sellSearchQuery.trim() || loading}
                    >
                        Search Sell Price
                    </Button>
                </div>
            </div>

            <Divider />

            {/* Buy Search Section */}
            <div>
                <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
                    Recommended Buy Price
                </Typography>
                <div className="space-y-3">
                    <TextField
                        fullWidth
                        label="Search item to buy"
                        variant="outlined"
                        value={buySearchQuery}
                        onChange={onBuySearchQueryChange}
                        onKeyPress={handleBuyKeyPress}
                        size="small"
                        disabled={loading}
                    />
                    <Button
                        fullWidth
                        variant="contained"
                        color="secondary"
                        onClick={onBuySearchSubmit}
                        disabled={!buySearchQuery.trim() || loading}
                    >
                        Search Buy Price
                    </Button>
                </div>
            </div>
        </Paper>
    );
};

export default SearchForms;
