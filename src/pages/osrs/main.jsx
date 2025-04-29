import React from 'react';
import { createRoot } from 'react-dom/client';
import OSRSFlipper from './osrs.jsx';

const root = createRoot(document.getElementById('osrs-root'));
root.render(<OSRSFlipper />);
