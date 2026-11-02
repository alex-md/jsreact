// Rational arithmetic avoids accepting approximate fits as exact patterns.
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
function rat(n, d = 1n) {
    if (!d) throw new Error('Zero denominator');
    if (d < 0n) { n = -n; d = -d; }
    const g = gcd(n, d);
    return [n / g, d / g];
}
const add = (a, b) => rat(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
const neg = a => [-a[0], a[1]];
const sub = (a, b) => add(a, neg(b));
const mul = (a, b) => rat(a[0] * b[0], a[1] * b[1]);
const div = (a, b) => rat(a[0] * b[1], a[1] * b[0]);
const eq = (a, b) => a[0] === b[0] && a[1] === b[1];
const str = a => a[1] === 1n ? String(a[0]) : `${a[0]}/${a[1]}`;

// Solve all available training equations. Require full rank, then verify separately
// on held-out terms; a polynomial through every supplied point proves nothing.
function solve(rows, order) {
    let pivot = 0;
    for (let col = 0; col < order; col++) {
        const k = rows.findIndex((row, i) => i >= pivot && row[col][0] !== 0n);
        if (k < 0) return null;
        [rows[k], rows[pivot]] = [rows[pivot], rows[k]];
        const divisor = rows[pivot][col];
        rows[pivot] = rows[pivot].map(v => div(v, divisor));
        for (let i = 0; i < rows.length; i++) {
            if (i === pivot) continue;
            const factor = rows[i][col];
            rows[i] = rows[i].map((v, j) => sub(v, mul(factor, rows[pivot][j])));
        }
        pivot++;
    }
    if (rows.slice(order).some(row => row[order][0] !== 0n)) return null;
    return rows.slice(0, order).map(row => row[order]);
}

export function findExactPattern(sequence, horizon) {
    if (!sequence.every(Number.isSafeInteger)) return null;
    const values = sequence.map(v => rat(BigInt(v)));
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
            params: Object.fromEntries(weights.map((v, j) => [`a(n−${j + 1}) coefficient`, str(v)])),
            predict: () => { const v = next(history); history.push(v); return v; } });
        break;
    }
    if (!candidates.length) return null;
    candidates.sort((a, b) => a.complexity - b.complexity);
    const best = candidates[0];
    const forecast = Array.from({ length: horizon }, () => ({ value: str(best.predict()), lo: null, hi: null }));
    return {
        sequence, exact: true,
        fits: candidates.map(({ predict, complexity, ...c }) => ({ ...c, yhat: sequence, score: null })),
        bestFit: { key: best.key, name: best.name, params: best.params, yhat: sequence, score: null },
        weights: candidates.map((_, i) => i === 0 ? 1 : 0), ensembleForecast: forecast,
    };
}
