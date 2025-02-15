import React from 'react';
import { createRoot } from 'react-dom/client';
import KeywordAnalyzer from '../../components/KeywordAnalyzer';

// Mount app
const root = document.getElementById('root');
createRoot(root).render(
    <React.StrictMode>
        <KeywordAnalyzer />
    </React.StrictMode>
);