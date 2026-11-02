import { fitAndForecast } from './engine.js';
self.onmessage = ({ data: { sequence, horizon } }) => {
    try { self.postMessage(fitAndForecast(sequence, horizon)); }
    catch (error) { self.postMessage({ error: error.message }); }
};
