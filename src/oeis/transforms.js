// Exact sequence and formal-series operations. Transform IDs refer to supertrans;
// historical indexing inconsistencies and repairs are documented separately.
import { rat, gcd, add, sub, mul, div, str } from './rational.js';
const Z = () => rat(0n), R = n => rat(BigInt(n));
const sum = a => a.reduce(add, Z());
const scale = (a, k) => a.map(v => mul(v, R(k)));
const factorials = n => { const f = [1n]; for (let i = 1; i <= n; i++) f.push(f[i - 1] * BigInt(i)); return f; };
export function binomial(a, sign = 1) {
    return a.map((_, n) => {
        let c = 1n, s = Z();
        for (let k = 0; k <= n; k++) {
            s = add(s, mul(rat(c * (sign < 0 && (n - k) % 2 ? -1n : 1n)), a[k]));
            c = c * BigInt(n - k) / BigInt(k + 1);
        }
        return s;
    });
}
function conv(a, b, n = a.length) {
    return Array.from({ length: n }, (_, i) => {
        let v = Z();
        for (let k = Math.max(0, i - b.length + 1); k <= Math.min(i, a.length - 1); k++) v = add(v, mul(a[k], b[i - k]));
        return v;
    });
}
function reciprocal(a) {
    const b = [div(R(1), a[0])];
    for (let i = 1; i < a.length; i++) b.push(div(sub(Z(), sum(a.slice(1, i + 1).map((v, k) => mul(v, b[i - 1 - k])))), a[0]));
    return b;
}
const padded = (a, n) => Array.from({ length: n }, (_, i) => a[i] || Z());
const divideBy = (a, denominator) => conv(a, reciprocal(padded(denominator.map(R), a.length)));
const differences = a => a.slice(1).map((v, i) => sub(v, a[i]));
const window = (a, weights) => a.slice(weights.length - 1).map((_, i) => sum(weights.map((w, k) => mul(R(w), a[i + k]))));
function normalize(a) {
    if (!a.every(v => v[1] === 1n)) return [];
    const g = a.reduce((s, v) => gcd(s, v[0]), 0n);
    return g ? a.map(v => div(v, rat(g))) : a;
}
function mobius(n) {
    let s = 1;
    for (let p = 2; p * p <= n; p++) {
        if (n % p) continue;
        n /= p; s = -s;
        if (n % p === 0) return 0;
    }
    return n > 1 ? -s : s;
}
function divisorTransform(a, inverse = false) {
    return a.map((_, k) => {
        const n = k + 1; let v = Z();
        for (let d = 1; d <= n; d++) if (n % d === 0) v = add(v, mul(R(inverse ? 1 : mobius(n / d)), a[d - 1]));
        return v;
    });
}
function euler(a, inverse = false) {
    const b = [];
    if (inverse) {
        const c = [];
        for (let n = 1; n <= a.length; n++) c.push(sub(mul(R(n), a[n - 1]), sum(c.map((v, k) => mul(v, a[n - k - 2])))));
        return divisorTransform(c).map((v, i) => div(v, R(i + 1)));
    }
    const c = divisorTransform(a.map((v, i) => mul(R(i + 1), v)), true);
    for (let n = 1; n <= a.length; n++) b.push(div(add(c[n - 1], sum(b.map((v, i) => mul(v, c[n - i - 2])))), R(n)));
    return b;
}
function stirling(a, inverse = false) {
    let row = [1n]; const out = [];
    for (let n = 1; n <= a.length; n++) {
        const next = [0n];
        for (let k = 1; k <= n; k++) next[k] = (row[k - 1] || 0n) + BigInt(inverse ? -(n - 1) : k) * (row[k] || 0n);
        out.push(sum(a.slice(0, n).map((v, k) => mul(rat(next[k + 1]), v))));
        row = next;
    }
    return out;
}
function boustrophedon(a, inverse = false) {
    const input = inverse ? a : [R(1), ...a];
    let previous = [], out = [];
    input.forEach((v, n) => {
        const row = [v];
        for (let k = 1; k <= n; k++) row.push(add(row[k - 1], mul(R(inverse ? -1 : 1), previous[n - k])));
        previous = row; out.push(row.at(-1));
    });
    return inverse ? out.slice(1) : out;
}
// exp/log of a series with zero/unit constant, using derivative identities.
function exponential(a) {
    const b = [R(1)];
    for (let n = 1; n < a.length; n++) b.push(div(sum(Array.from({ length: n }, (_, k) => mul(mul(R(k + 1), a[k + 1]), b[n - k - 1]))), R(n)));
    return b;
}
function logarithm(a) {
    if (a[0][0] !== a[0][1]) throw Error('Log requires constant 1');
    const derivative = a.slice(1).map((v, i) => mul(R(i + 1), v));
    return [Z(), ...conv(derivative, reciprocal(a), a.length - 1).map((v, i) => div(v, R(i + 1)))];
}
function diagonal(a, variant, egf) {
    const n = a.length, f = factorials(n);
    const series = [Z(), ...a.map((v, i) => egf ? div(v, rat(f[i + 1])) : v)];
    return a.map((_, i) => {
        const j = i + 1;
        let factor = padded([R(1)], n + 1);
        const base = padded([R(1), R(variant % 2 ? 1 : -1)], n + 1);
        const multiplier = variant < 2 ? base : reciprocal(base);
        for (let k = 0; k < j; k++) factor = conv(factor, multiplier, n + 1);
        const v = conv(series, factor, n + 1)[j];
        // Match seqtranslib GetSeriesCoeff's (j-1)! convention.
        return egf ? mul(v, rat(f[j - 1])) : v;
    });
}

const descriptions = {
1: 'Original sequence', 2: 'Complement (positive integers, up to 60)', 3: 'GCD normalization', 4: 'GCD normalization after dropping 1 term', 5: 'GCD normalization after dropping 2 terms',
6: 'Odd positions (1-based)', 7: 'Even positions (1-based)', 8: 'Divide a(n) by n! (n starts at 0)', 9: 'Multiply by position (1-based)', 10: 'Divide by position factorial', 11: 'Multiply by 2', 12: 'Multiply by 3',
13: 'OGF reciprocal squared', 14: 'OGF square', 15: 'OGF reciprocal', 16: 'OGF × (1+x)/(1−x)', 17: 'OGF × (1−x)/(1+x)',
18: 'First differences', 19: 'Second differences', 20: 'Third differences', 21: 'Partial sums', 22: 'Twice partial sums', 23: 'Three times partial sums', 24: 'Adjacent sums', 25: 'Lag-2 sums',
26: 'OGF / (1+x)', 27: 'OGF / (1+x²)', 28: 'Three-term sums', 29: 'OGF / (1+x+x²)', 30: 'Lag-2 differences', 31: 'OGF / (1−x²)', 32: 'a(n+2)−a(n+1)−a(n)', 33: 'OGF / (1−x−x²)',
34: 'Add position (1-based)', 35: 'Add 2', 36: 'Add 3', 37: 'Subtract position (1-based)', 38: 'Subtract 2', 39: 'Subtract 3', 40: 'Add 1', 41: 'Subtract 1', 42: 'OGF / (1−x+x²)', 43: 'a(n+2)−a(n+1)+a(n)', 44: 'OGF / (1+x−x²)', 45: 'a(n)+a(n+1)−a(n+2)', 46: 'Binomial adjacent sums, order 2', 47: 'Binomial adjacent sums, order 3', 48: 'OGF / (1+x)²', 49: 'OGF / (1+x)³',
50: 'OGF diagonal × (1−x)^j', 51: 'OGF diagonal × (1+x)^j', 52: 'OGF diagonal / (1−x)^j', 53: 'OGF diagonal / (1+x)^j',
81: 'Add position factorial', 82: 'Subtract position factorial', 99: 'Sort absolute values, remove duplicates', 100: 'Binomial transform', 101: 'Inverse binomial transform', 102: 'Boustrophedon transform (prepends 1)', 103: 'Inverse boustrophedon (drops constant)', 104: 'Euler transform', 105: 'Inverse Euler transform', 106: 'EGF exponential (zero constant)', 107: 'EGF square', 108: 'Invert transform', 109: 'Inverse invert transform', 110: 'EGF logarithm (unit constant)', 111: 'Möbius transform', 112: 'Divisor sum transform', 113: 'Double all terms after the first', 114: 'Stirling second kind (1-based)', 115: 'Signed Stirling first kind (1-based)',
};
const egfMap = {54:13,55:14,56:15,57:16,58:17,62:21,63:22,64:23,67:26,68:27,70:29,72:31,74:33,83:42,85:44,89:48,90:49};
const scaledMap = {59:18,60:19,61:20,65:24,66:25,69:28,71:30,73:32,75:34,76:35,77:36,78:37,79:38,80:39,84:43,86:45,87:46,88:47};
for (const [id, base] of Object.entries(egfMap)) descriptions[id] = descriptions[base].replace('OGF', 'EGF').replace('Partial sums', 'EGF / (1−x)').replace('Twice partial sums', 'EGF / (1−x)²').replace('Three times partial sums', 'EGF / (1−x)³');
for (const [id, base] of Object.entries(scaledMap)) descriptions[id] = `${descriptions[base]} of factorial-normalized terms`;
for (let id = 91; id <= 94; id++) descriptions[id] = descriptions[id - 41].replace('OGF', 'EGF');
export const TRANSFORM_CATALOG = Object.entries(descriptions).map(([id, name]) => ({ id: Number(id), code: `T${id.padStart(3, '0')}`, name }));

export function transform(id, a) {
    if (!a.length) return [];
    const n = a.length;
    if (egfMap[id]) {
        const f = factorials(n);
        return transform(egfMap[id], a.map((v, i) => div(v, rat(f[i])))).map((v, i) => mul(v, rat(f[i])));
    }
    if (scaledMap[id]) {
        const f = factorials(n);
        return transform(scaledMap[id], a.map((v, i) => div(v, rat(f[i]))));
    }
    if (id >= 50 && id <= 53) return diagonal(a, id - 50, false);
    if (id >= 91 && id <= 94) return diagonal(a, id - 91, true);
    if (id >= 18 && id <= 20) { let b = a; for (let i = 17; i < id; i++) b = differences(b); return b; }
    if (id >= 21 && id <= 23) { let b = a; for (let i = 20; i < id; i++) { let s = Z(); b = b.map(v => (s = add(s, v))); } return b; }
    const denominators = {26:[1,1],27:[1,0,1],29:[1,1,1],31:[1,0,-1],33:[1,-1,-1],42:[1,-1,1],44:[1,1,-1],48:[1,2,1],49:[1,3,3,1]};
    if (denominators[id]) return divideBy(a, denominators[id]);
    switch (id) {
        case 1: return a.slice();
        case 2: { const set = new Set(a.filter(v => v[1] === 1n).map(v => String(v[0] < 0n ? -v[0] : v[0]))); const max = Math.min(60, Math.max(...a.map(v => Math.abs(Number(v[0]) / Number(v[1]))))); return Array.from({ length: max }, (_, i) => i + 1).filter(i => !set.has(String(i))).map(R); }
        case 3: return normalize(a);
        case 4: return normalize(a.slice(1));
        case 5: return normalize(a.slice(2));
        case 6: case 7: return a.filter((_, i) => i % 2 === id - 6);
        case 8: case 10: { const f = factorials(n); return a.map((v, i) => div(v, rat(f[i + (id === 10 ? 1 : 0)]))); }
        case 9: return a.map((v, i) => mul(v, R(i + 1)));
        case 11: case 12: return scale(a, id - 9);
        case 13: { const b = reciprocal(a); return conv(b, b); }
        case 14: return conv(a, a);
        case 15: return reciprocal(a);
        case 16: return divideBy(conv(a, [R(1), R(1)]), [1,-1]);
        case 17: return divideBy(conv(a, [R(1), R(-1)]), [1,1]);
        case 24: return window(a, [1,1]);
        case 25: return window(a, [1,0,1]);
        case 28: return window(a, [1,1,1]);
        case 30: return window(a, [-1,0,1]);
        case 32: return window(a, [-1,-1,1]);
        case 34: case 37: return a.map((v, i) => add(v, R((i + 1) * (id === 34 ? 1 : -1))));
        case 35: case 36: case 38: case 39: case 40: case 41: return a.map(v => add(v, R(({35:2,36:3,38:-2,39:-3,40:1,41:-1})[id])));
        case 43: return window(a, [1,-1,1]);
        case 45: return window(a, [1,1,-1]);
        case 46: return window(a, [1,2,1]);
        case 47: return window(a, [1,3,3,1]);
        case 81: case 82: { const f = factorials(n); return a.map((v, i) => add(v, rat(f[i + 1] * (id === 81 ? 1n : -1n)))); }
        case 99: { const b = a.map(v => v[0] < 0n ? sub(Z(), v) : v).sort((v, w) => sub(v, w)[0] < 0n ? -1 : 1); return b.filter((v, i) => !i || str(v) !== str(b[i - 1])); }
        case 100: return binomial(a);
        case 101: return binomial(a, -1);
        case 102: return boustrophedon(a);
        case 103: return boustrophedon(a, true);
        case 104: return euler(a);
        case 105: return euler(a, true);
        case 106: case 110: { const f = factorials(n), b = [R(id === 110 ? 1 : 0), ...a.map((v, i) => div(v, rat(f[i + 1])))]; return (id === 106 ? exponential(b) : logarithm(b)).slice(1).map((v, i) => mul(v, rat(f[i + 1]))); }
        case 107: return transform(55, a);
        case 108: case 109: { const b = [R(1), ...scale(a, id === 108 ? -1 : 1)]; return reciprocal(b).slice(1).map(v => id === 108 ? v : sub(Z(), v)); }
        case 111: return divisorTransform(a);
        case 112: return divisorTransform(a, true);
        case 113: return a.map((v, i) => i ? mul(v, R(2)) : v);
        case 114: return stirling(a);
        case 115: return stirling(a, true);
        default: throw Error('Unsupported transform');
    }
}

export function binaryAssociates(a) {
    const levels = [...new Set(a.map(str))];
    if (levels.length !== 2) return [];
    const [first, second] = levels, names = ['Binary labels 1,2', 'Binary labels 2,1', `Positions of ${first} (1-based)`, `Positions of ${second} (1-based)`, 'Completed run lengths', 'Change positions (boundary after position)'];
    const rows = [a.map(v => str(v) === first ? '1' : '2'), a.map(v => str(v) === first ? '2' : '1'), [], [], [], []];
    let run = 1;
    a.forEach((v, i) => {
        rows[str(v) === first ? 2 : 3].push(String(i + 1));
        if (!i) return;
        if (str(v) === str(a[i - 1])) run++;
        else { rows[4].push(String(run)); rows[5].push(String(i)); run = 1; }
    });
    return rows.map((values, i) => ({ code: `B${i + 1}`, name: names[i], values, searchable: values.length >= 3 }));
}

export function exploreTransforms(sequence) {
    if (!sequence.every(Number.isSafeInteger)) return { transforms: [], binary: [], termsUsed: 0, skipped: [] };
    const a = sequence.slice(0, 32).map(v => rat(BigInt(v))), skipped = [], transforms = [];
    for (const entry of TRANSFORM_CATALOG) {
        try {
            const values = transform(entry.id, a).map(str);
            if (values.length) transforms.push({ ...entry, values, searchable: values.length >= 3 && values.every(v => /^-?\d+$/.test(v)) });
            else skipped.push(entry.code);
        } catch { skipped.push(entry.code); }
    }
    return { transforms, binary: binaryAssociates(sequence.map(v => rat(BigInt(v)))), termsUsed: a.length, skipped };
}
