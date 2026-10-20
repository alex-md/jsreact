import { generatePuzzle } from './engine.js';
self.onmessage = ({ data: { settings, options } }) => {
    try {
        const result = generatePuzzle(settings, options);
        // Predicates belong to the solver; the UI needs only clue descriptions.
        self.postMessage(JSON.parse(JSON.stringify(result)));
    } catch {
        self.postMessage({ error: 'Generation failed. Try a smaller range or different clue packs.' });
    }
};
