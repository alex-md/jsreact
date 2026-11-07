import { solveExpression } from '../expression/solver.js';

self.onmessage = ({ data }) => {
    self.postMessage(solveExpression(data.numbers, data.target, data.config));
};
