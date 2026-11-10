import { numberNotation, binaryNotation } from './notation.js';
import { rational, calculate, squareRoot, fractionText, fractionNotation } from './rational.js';

const POWER = 1;
const ROOT = 2;

// Keep the calculation tree: removing parentheses from its text changes its value.
export function solveExpression(numbers, target, config = {}, { timeLimitMs = 4000 } = {}) {
    if (!numbers.length || !numbers.every(Number.isSafeInteger) || !Number.isSafeInteger(target)) {
        return { success: false, error: 'Enter whole numbers and a whole-number target within the supported range.' };
    }
    const required = (config.useExponents ? POWER : 0) | (config.useSqrt ? ROOT : 0);
    const deadline = Date.now() + timeLimitMs;
    let timedOut = false;
    const visited = new Set();
    const initial = numbers.map(value => ({ value: rational(BigInt(value)), used: 0, ...numberNotation(value), steps: [] }));
    const powerLimit = Math.max(Math.abs(target) * 100, 500000);
    let allowFractions = false;

    function search(items) {
        if (Date.now() >= deadline) { timedOut = true; return null; }
        if (items.length === 1 && items[0].value.numerator === BigInt(target) && items[0].value.denominator === 1n && (items[0].used & required) === required) return items[0];
        const key = items.map(item => `${fractionText(item.value)}:${item.used}`).sort().join('|');
        if (visited.has(key)) return null;
        visited.add(key);

        if (config.useSqrt) {
            for (let index = 0; index < items.length; index++) {
                const item = items[index];
                if ((item.value.numerator === 0n || item.value.numerator === item.value.denominator) && (item.used & ROOT)) continue;
                const root = squareRoot(item.value);
                if (!root) continue;
                const next = [...items];
                next[index] = {
                    value: root, used: item.used | ROOT, precedence: 5,
                    expression: `sqrt(${item.expression})`,
                    steps: [...item.steps, `sqrt(${fractionText(item.value)}) = ${fractionText(root)}`],
                };
                const result = search(next);
                if (result || timedOut) return result;
            }
        }

        for (let i = 0; i < items.length; i++) {
            for (let j = 0; j < items.length; j++) {
                if (i === j) continue;
                const a = items[i], b = items[j];
                const operations = [];
                if (i < j) operations.push('+', '*');
                operations.push('-', '/');
                if (config.useExponents) operations.push('**');
                for (const operator of operations) {
                    const value = calculate(a.value, b.value, operator, powerLimit);
                    if (!value || (!allowFractions && value.denominator !== 1n)) continue;
                    const used = a.used | b.used | (operator === '**' ? POWER : 0);
                    const node = {
                        value, used,
                        ...binaryNotation(a, b, operator),
                        steps: [...a.steps, ...b.steps, `${binaryNotation(fractionNotation(a.value), fractionNotation(b.value), operator).expression.replace('**', '^')} = ${fractionText(value)}`],
                    };
                    const remaining = items.filter((_, index) => index !== i && index !== j);
                    const result = search([...remaining, node]);
                    if (result || timedOut) return result;
                }
            }
        }
        return null;
    }

    // Prefer simpler whole-number working, then include exact fractional intermediates.
    let solution = search(initial);
    if (!solution && !timedOut) {
        allowFractions = true;
        visited.clear();
        solution = search(initial);
    }
    if (!solution) return { success: false, error: timedOut ? 'Search timed out. Try fewer numbers or fewer requirements.' : 'No solution found with the selected requirements.' };
    return { success: true, result: { expr: solution.expression, steps: solution.steps, usedExponents: !!(solution.used & POWER), usedSqrt: !!(solution.used & ROOT), stepByStep: !!config.stepByStep } };
}
