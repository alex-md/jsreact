// Rational arithmetic avoids accepting approximate fits as exact patterns.
export const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
export function rat(n, d = 1n) {
    if (!d) throw new Error('Zero denominator');
    if (d < 0n) { n = -n; d = -d; }
    if (n.toString(2).length > 16384 || d.toString(2).length > 16384) throw new Error('Exact arithmetic size limit reached');
    const g = gcd(n, d);
    return [n / g, d / g];
}
export const add = (a, b) => rat(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
export const neg = a => [-a[0], a[1]];
export const sub = (a, b) => add(a, neg(b));
export const mul = (a, b) => rat(a[0] * b[0], a[1] * b[1]);
export const div = (a, b) => rat(a[0] * b[1], a[1] * b[0]);
export const eq = (a, b) => a[0] === b[0] && a[1] === b[1];
export const str = a => a[1] === 1n ? String(a[0]) : `${a[0]}/${a[1]}`;

// Solve all available training equations. Require full rank, then verify separately
// on held-out terms; a polynomial through every supplied point proves nothing.
export function solve(rows, order) {
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

