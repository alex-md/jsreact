import { rat, add, sub, mul, neg, eq, str, solve } from './rational.js';
import { seekerCandidates } from './superseeker.js';

export function basicCandidates(values) {
    const n = values.length;
    const candidates = [];
    let layer = values;
    const differences = [];
    for (let degree = 0; degree <= Math.min(8, n - 2); degree++) {
        differences.push(layer.at(-1));
        if (layer.length >= (degree === 0 ? 3 : 2) && layer.every(v => eq(v, layer[0]))) {
            const ends = differences.slice();
            candidates.push({ key: 'polynomial', name: `Exact polynomial (degree ${degree})`,
                params: { degree }, complexity: degree + 1,
                predict: () => {
                    for (let j = ends.length - 2; j >= 0; j--) ends[j] = add(ends[j], ends[j + 1]);
                    return ends[0];
                } });
            break;
        }
        layer = layer.slice(1).map((v, i) => sub(v, layer[i]));
    }
    for (let period = 2; period <= Math.floor(n / 2); period++) {
        if (!values.every((v, i) => eq(v, values[i % period]))) continue;
        let index = n;
        candidates.push({ key: 'periodic', name: `Exact repeating pattern (period ${period})`,
            params: { period }, complexity: period,
            predict: () => values[index++ % period] });
        break;
    }
    const holdout = n === 3 ? 1 : 2;
    for (let order = 1; order <= Math.min(8, Math.floor((n - holdout) / 2)); order++) {
        // Reserve two terms (one for three-term inputs) from coefficient solving.
        const rows = [];
        for (let i = order; i < n - holdout; i++) rows.push([...Array.from({ length: order }, (_, j) => values[i - j - 1]), values[i]]);
        const weights = solve(rows, order);
        if (!weights) continue;
        const next = history => weights.reduce((sum, w, j) => add(sum, mul(w, history[history.length - 1 - j])), rat(0n));
        if (!values.slice(order).every((v, j) => eq(v, next(values.slice(0, j + order))))) continue;
        const history = values.slice();
        candidates.push({ key: 'recurrence', name: `Exact linear recurrence (order ${order})`, complexity: order,
            params: {
                ...Object.fromEntries(weights.map((v, j) => [`a(n−${j + 1}) coefficient`, str(v)])),
                'OGF denominator (ascending powers)': [rat(1n), ...weights.map(neg)].map(str).join(', '),
                'OGF numerator (ascending powers)': values.slice(0, order).map((v, i) =>
                    weights.slice(0, i).reduce((s, w, j) => sub(s, mul(w, values[i - j - 1])), v)).map(str).join(', '),
                'OGF definition': 'F(x) = Σ a(n)x^n = numerator/denominator; n starts at 0',
            },
            predict: () => { const v = next(history); history.push(v); return v; } });
        break;
    }
    return candidates;
}

export function findExactPattern(sequence, horizon) {
    if (!sequence.every(Number.isSafeInteger)) return null;
    const values = sequence.map(v => rat(BigInt(v)));
    const candidates = [...basicCandidates(values), ...seekerCandidates(values, basicCandidates)];
    if (!candidates.length) return null;
    candidates.sort((a, b) => a.complexity - b.complexity);
    // Singularities and explosive rational growth invalidate a candidate, not the run.
    const viable = [];
    for (const candidate of candidates) {
        try {
            const forecast = Array.from({ length: horizon }, () => ({ value: str(candidate.predict()), lo: null, hi: null }));
            viable.push({ ...candidate, forecast });
        } catch { /* Bounded exact search: try the next rule. */ }
    }
    if (!viable.length) return null;
    const best = viable[0];
    const forecast = best.forecast;
    return {
        sequence, exact: true,
        fits: viable.map(({ predict, complexity, forecast, ...c }) => ({ ...c, continuation: forecast.map(f => f.value), yhat: sequence, score: null })),
        bestFit: { key: best.key, name: best.name, params: best.params, yhat: sequence, score: null },
        weights: viable.map((_, i) => i === 0 ? 1 : 0), ensembleForecast: forecast,
    };
}
