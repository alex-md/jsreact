import { numberNotation, binaryNotation } from './notation.js';

const LIMIT = BigInt(Number.MAX_SAFE_INTEGER);

// Reduce exact fractions before applying the solver's supported-size limit.
export function rational(numerator, denominator = 1n) {
    if (denominator === 0n) return null;
    if (denominator < 0n) { numerator = -numerator; denominator = -denominator; }
    let a = numerator < 0n ? -numerator : numerator, b = denominator;
    while (b) [a, b] = [b, a % b];
    numerator /= a;
    denominator /= a;
    if (numerator > LIMIT || numerator < -LIMIT || denominator > LIMIT) return null;
    return { numerator, denominator };
}

export const fractionText = value => value.denominator === 1n
    ? String(value.numerator) : `${value.numerator} / ${value.denominator}`;

export const fractionNotation = value => value.denominator === 1n
    ? numberNotation(Number(value.numerator))
    : binaryNotation(numberNotation(Number(value.numerator)), numberNotation(Number(value.denominator)), '/');

export function calculate(a, b, operator, powerLimit) {
    const n = a.numerator, d = a.denominator, m = b.numerator, e = b.denominator;
    switch (operator) {
        case '+': return rational(n * e + m * d, d * e);
        case '-': return rational(n * e - m * d, d * e);
        case '*': return rational(n * m, d * e);
        case '/': return rational(n * e, d * m);
        case '**': {
            if (e !== 1n || (n === 0n && m <= 0n)) return null;
            const approximation = Math.pow(Number(n) / Number(d), Number(m));
            if (!Number.isFinite(approximation) || Math.abs(approximation) > powerLimit) return null;
            if (d === 1n && (n === 1n || n === -1n)) return rational(n === -1n && m % 2n !== 0n ? -1n : 1n);
            // Larger powers cannot fit the bounded numerator and denominator.
            if (m > 1024n || m < -1024n) return null;
            return m < 0n ? rational(d ** -m, n ** -m) : rational(n ** m, d ** m);
        }
    }
}

export function squareRoot(value) {
    if (value.numerator < 0n) return null;
    const n = BigInt(Math.floor(Math.sqrt(Number(value.numerator))));
    const d = BigInt(Math.floor(Math.sqrt(Number(value.denominator))));
    return n * n === value.numerator && d * d === value.denominator ? rational(n, d) : null;
}
