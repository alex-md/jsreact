// Independent, bounded implementations of methods described in OEIS Superseeker.
// Algorithm/source map and differences from the legacy service: docs/superseeker.md.
import { rat, add, sub, mul, div, eq, str } from './rational.js';
import { binomial, transform } from './transforms.js';
const zero = () => rat(0n);
const diff = a => a.slice(1).map((v, i) => sub(v, a[i]));
const polynomial = (p, n) => p.reduceRight((s, c) => add(mul(s, rat(BigInt(n))), c), zero());

// A unique projective null vector; underdetermined guesses are rejected.
function relation(matrix, columns) {
    const rows = matrix.map(r => r.slice());
    const pivots = [];
    for (let col = 0; col < columns; col++) {
        const k = rows.findIndex((r, i) => i >= pivots.length && r[col][0] !== 0n);
        if (k < 0) continue;
        const pos = pivots.length;
        [rows[pos], rows[k]] = [rows[k], rows[pos]];
        const d = rows[pos][col];
        rows[pos] = rows[pos].map(v => div(v, d));
        for (let i = 0; i < rows.length; i++) {
            if (i === pos || !rows[i][col][0]) continue;
            const f = rows[i][col];
            rows[i] = rows[i].map((v, j) => sub(v, mul(f, rows[pos][j])));
        }
        pivots.push(col);
    }
    if (pivots.length !== columns - 1) return null;
    const free = Array.from({ length: columns }, (_, i) => i).find(i => !pivots.includes(i));
    const vector = Array.from({ length: columns }, zero);
    vector[free] = rat(1n);
    pivots.forEach((col, i) => { vector[col] = sub(zero(), rows[i][free]); });
    return vector;
}
const dot = (a, b) => a.reduce((s, v, i) => add(s, mul(v, b[i])), zero());

function periodicDifferences(values) {
    const layers = [values];
    for (let depth = 1; depth <= Math.min(8, values.length - 4); depth++) {
        const row = diff(layers.at(-1));
        layers.push(row);
        for (let period = 2; period <= Math.min(12, Math.floor(row.length / 2)); period++) {
            if (!row.every((v, i) => eq(v, row[i % period]))) continue;
            const ends = layers.map(l => l.at(-1));
            let index = row.length;
            return { key: 'periodic-differences', name: `Periodic differences (order ${depth}, period ${period})`,
                complexity: depth + period + 1, params: { order: depth, period, cycle: row.slice(0, period).map(str).join(', ') },
                predict() {
                    ends[depth] = row[index++ % period];
                    for (let j = depth - 1; j >= 0; j--) ends[j] = add(ends[j], ends[j + 1]);
                    return ends[0];
                } };
        }
    }
    return null;
}

function fanCandidates(values, basic) {
    const out = [];
    let row = values;
    for (let width = 1; width <= 4; width++) {
        row = binomial(row, -1);
        const matches = basic(row).filter(c => c.key === 'polynomial' || c.key === 'periodic');
        if (!matches.length) continue;
        const candidate = matches[0], history = row.slice();
        out.push({ key: `difference-fan-${width}`, name: `Inverse-binomial fan (${width} ${width === 1 ? 'layer' : 'layers'})`,
            complexity: candidate.complexity + width * 2 + 2,
            params: { layers: width, transformedRule: candidate.name },
            predict() {
                history.push(candidate.predict());
                let original = history;
                for (let j = 0; j < width; j++) original = binomial(original);
                return original.at(-1);
            } });
        break;
    }
    return out;
}

// Rate-style rational interpolation, including successive quotient layers.
function rateCandidates(values) {
    const out = [], layers = [values];
    for (let level = 0; level <= 2; level++) {
        const row = layers[level];
        for (let total = 1; total <= 4; total++) {
            let found = false;
            for (let denDegree = 0; denDegree <= Math.min(2, total); denDegree++) {
                const numDegree = total - denDegree, columns = total + 2;
                if (row.length - 2 < columns - 1) continue;
                const equation = (v, i) => [
                    ...Array.from({ length: numDegree + 1 }, (_, k) => rat(BigInt(i) ** BigInt(k))),
                    ...Array.from({ length: denDegree + 1 }, (_, k) => mul(sub(zero(), v), rat(BigInt(i) ** BigInt(k))))];
                const coefficients = relation(row.slice(0, Math.min(32, row.length - 2)).map(equation), columns);
                if (!coefficients) continue;
                const p = coefficients.slice(0, numDegree + 1), q = coefficients.slice(numDegree + 1);
                const at = i => div(polynomial(p, i), polynomial(q, i));
                if (!row.every((v, i) => polynomial(q, i)[0] && eq(v, at(i)))) continue;
                const ends = layers.map(l => l.at(-1));
                let index = row.length;
                out.push({ key: `rate-${level}`, name: level ? `Rational ${level === 1 ? 'ratio' : 'second-ratio'} rule` : 'Rational function of index',
                    complexity: total + level + 3,
                    params: { index: 'n starts at 0', quotientLayers: level, numerator: p.map(str).join(', '), denominator: q.map(str).join(', '), coefficients: 'ascending powers of n' },
                    predict() {
                        ends[level] = at(index++);
                        for (let j = level - 1; j >= 0; j--) ends[j] = mul(ends[j], ends[j + 1]);
                        return ends[0];
                    } });
                found = true; break;
            }
            if (found) break;
        }
        if (row.some(v => v[0] === 0n)) break;
        layers.push(row.slice(1).map((v, i) => div(v, row[i])));
    }
    return out;
}

// Polynomial-coefficient linear recurrences: sum_j p_j(n) a(n-j) = 0.
function holonomic(values) {
    for (let order = 1; order <= 3; order++) for (let degree = 1; degree <= 2; degree++) {
        const columns = (order + 1) * (degree + 1);
        if (values.length - order - 2 < columns - 1) continue;
        const equation = n => Array.from({ length: columns }, (_, k) =>
            mul(values[n - Math.floor(k / (degree + 1))], rat(BigInt(n) ** BigInt(k % (degree + 1)))));
        const coefficients = relation(Array.from({ length: Math.min(32, values.length - order - 2) }, (_, i) => equation(i + order)), columns);
        if (!coefficients || !Array.from({ length: values.length - order }, (_, i) => dot(equation(i + order), coefficients)).every(v => v[0] === 0n)) continue;
        const polys = Array.from({ length: order + 1 }, (_, j) => coefficients.slice(j * (degree + 1), (j + 1) * (degree + 1)));
        if (!polys[0].some(v => v[0])) continue;
        const history = values.slice();
        return { key: 'holonomic', name: `Polynomial-coefficient recurrence (order ${order}, degree ${degree})`,
            complexity: columns + 1,
            params: { equation: 'Σ p_j(n) a(n−j) = 0; n starts at 0', ...Object.fromEntries(polys.map((p, i) => [`p_${i} (ascending powers)`, p.map(str).join(', ')])) },
            predict() {
                const n = history.length;
                let sum = zero();
                for (let j = 1; j <= order; j++) sum = add(sum, mul(polynomial(polys[j], n), history[n - j]));
                const v = div(sub(zero(), sum), polynomial(polys[0], n));
                history.push(v); return v;
            } };
    }
    return null;
}

export function convolution(a, b, length = a.length) {
    return Array.from({ length }, (_, n) => {
        let s = zero();
        for (let k = Math.max(0, n - b.length + 1); k <= Math.min(n, a.length - 1); k++) s = add(s, mul(a[k], b[n - k]));
        return s;
    });
}

// Bounded algebraic OGF guessing. The nonzero derivative at x=0 fixes a unique
// formal-series branch, so each next coefficient is a linear solve.
function algebraic(values) {
    const n = Math.min(values.length, 32), sample = values.slice(0, n);
    for (let yDegree = 2; yDegree <= 3; yDegree++) for (let xDegree = 1; xDegree <= 2; xDegree++) {
        const terms = Array.from({ length: (yDegree + 1) * (xDegree + 1) }, (_, i) => [i % (xDegree + 1), Math.floor(i / (xDegree + 1))]);
        if (n - 2 < terms.length - 1) continue;
        const powers = [Array.from({ length: n }, (_, i) => rat(i === 0 ? 1n : 0n)), sample];
        for (let j = 2; j <= yDegree; j++) powers.push(convolution(powers[j - 1], sample));
        const row = k => terms.map(([x, y]) => k < x ? zero() : powers[y][k - x]);
        const c = relation(Array.from({ length: n - 2 }, (_, k) => row(k)), terms.length);
        if (!c || !terms.some(([, y], i) => y >= 2 && c[i][0])) continue;
        // Evaluate P_y(0,a_0), without floating-point powers.
        let slope = zero();
        terms.forEach(([x, y], i) => {
            if (x || !y) return;
            let power = rat(1n);
            for (let j = 1; j < y; j++) power = mul(power, values[0]);
            slope = add(slope, mul(c[i], mul(rat(BigInt(y)), power)));
        });
        if (!slope[0]) continue;
        const coefficient = (history, k) => {
            const ps = [Array.from({ length: k + 1 }, (_, i) => rat(i === 0 ? 1n : 0n)), [...history, zero()]];
            for (let j = 2; j <= yDegree; j++) ps.push(convolution(ps[j - 1], ps[1], k + 1));
            return terms.reduce((s, [x, y], i) => k < x ? s : add(s, mul(c[i], ps[y][k - x])), zero());
        };
        const next = history => div(sub(zero(), coefficient(history, history.length)), slope);
        if (!values.slice(1).every((v, i) => eq(v, next(values.slice(0, i + 1))))) continue;
        const history = values.slice();
        return { key: 'algebraic-gf', name: 'Algebraic ordinary generating function', complexity: terms.length,
            params: { definition: 'F(x) = Σ a(n)x^n; n starts at 0', equation: terms.filter((_, i) => c[i][0]).map(([x, y]) => {
                const i = terms.findIndex(t => t[0] === x && t[1] === y);
                return `(${str(c[i])}) x^${x} F^${y}`;
            }).join(' + ') + ' = 0' },
            predict() { const v = next(history); history.push(v); return v; } };
    }
    return null;
}

export function seekerCandidates(values, basic) {
    const candidates = [];
    const attempt = fn => { try { const c = fn(); if (c) candidates.push(...(Array.isArray(c) ? c : [c])); } catch { /* Bound an individual method. */ } };
    attempt(() => periodicDifferences(values));
    for (const period of [2, 3]) attempt(() => {
        const branches = Array.from({ length: period }, (_, offset) => {
            const row = values.filter((_, i) => i % period === offset);
            if (row.length < 5) return null;
            return basic(row).sort((a, b) => a.complexity - b.complexity)[0];
        });
        if (branches.some(b => !b)) return null;
        let index = values.length;
        return { key: `interleaved-${period}`, name: `Interleaved rules (${period} subsequences)`,
            complexity: period + branches.reduce((s, b) => s + b.complexity, 0),
            params: Object.fromEntries(branches.map((b, i) => [`Position ${i + 1} mod ${period}`, b.name])),
            predict() { return branches[index++ % period].predict(); } };
    });
    attempt(() => rateCandidates(values));
    attempt(() => holonomic(values));
    // Cubic formal series are expensive for long prefixes; recurrence methods
    // above cover many of the same families at much lower cost.
    if (values.length <= 40) attempt(() => algebraic(values));
    attempt(() => fanCandidates(values, basic));
    // Recognize simple rules after invertible transforms; forecasting reverses
    // the transform. Discovery and its held-out checks run in exact arithmetic.
    for (const [id, inverse, label] of [[15, 15, 'Reciprocal OGF'], [101, 100, 'Inverse binomial'], [105, 104, 'Inverse Euler'], [115, 114, 'Inverse Stirling'], [111, 112, 'Möbius']]) {
        attempt(() => {
            const row = transform(id, values), matches = basic(row);
            if (!matches.length) return null;
            const best = matches.sort((a, b) => a.complexity - b.complexity)[0];
            const history = row.slice();
            if (!transform(inverse, row).every((v, i) => eq(v, values[i]))) return null;
            return { key: `transform-${id}`, name: `${label} transform → ${best.name.toLowerCase()}`,
                complexity: best.complexity + 5, params: { transform: `T${String(id).padStart(3, '0')}`, transformedRule: best.name },
                predict() { history.push(best.predict()); return transform(inverse, history).at(-1); } };
        });
    }
    attempt(() => {
        const row = transform(8, values), matches = basic(row);
        if (!matches.length) return null;
        const best = matches.sort((a, b) => a.complexity - b.complexity)[0];
        let n = values.length, factorial = 1n;
        for (let k = 2; k < n; k++) factorial *= BigInt(k);
        return { key: 'factorial-normalization', name: `Factorial normalization → ${best.name.toLowerCase()}`,
            complexity: best.complexity + 5, params: { transform: 'T008: a(n)/n!, n starts at 0', transformedRule: best.name },
            predict() { factorial *= BigInt(n++); return mul(best.predict(), rat(factorial)); } };
    });
    return candidates;
}

export function beattyTest(values) {
    let lo = null, hi = null;
    values.forEach((v, i) => {
        const a = div(v, rat(BigInt(i + 1))), b = div(add(v, rat(1n)), rat(BigInt(i + 1)));
        if (!lo || sub(a, lo)[0] > 0n) lo = a;
        if (!hi || sub(b, hi)[0] < 0n) hi = b;
    });
    if (sub(hi, lo)[0] <= 0n) return null;
    return { lower: str(lo), upper: str(hi), example: str(div(add(lo, hi), rat(2n))),
        note: 'a(n) = floor(n α), n starts at 1. The prefix permits every α in [lower, upper); it does not determine α or a unique continuation.' };
}
