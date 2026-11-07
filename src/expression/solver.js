import { numberNotation, binaryNotation } from './notation.js';

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
    const initial = numbers.map(value => ({ value, used: 0, ...numberNotation(value), steps: [] }));
    const powerLimit = Math.max(Math.abs(target) * 100, 500000);

    function search(items) {
        if (Date.now() >= deadline) { timedOut = true; return null; }
        if (items.length === 1 && items[0].value === target && (items[0].used & required) === required) return items[0];
        const key = items.map(item => `${item.value}:${item.used}`).sort().join('|');
        if (visited.has(key)) return null;
        visited.add(key);

        if (config.useSqrt) {
            for (let index = 0; index < items.length; index++) {
                const item = items[index];
                if (item.value < 0 || (item.value <= 1 && (item.used & ROOT))) continue;
                const root = Math.sqrt(item.value);
                if (!Number.isSafeInteger(root)) continue;
                const next = [...items];
                next[index] = {
                    value: root, used: item.used | ROOT, precedence: 5,
                    expression: `sqrt(${item.expression})`,
                    steps: [...item.steps, `sqrt(${item.value}) = ${root}`],
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
                if (i < j) operations.push(['+', a.value + b.value], ['*', a.value * b.value]);
                operations.push(['-', a.value - b.value]);
                if (b.value !== 0) operations.push(['/', a.value / b.value]);
                if (config.useExponents && !(a.value === 0 && b.value === 0)) {
                    const power = Math.pow(a.value, b.value);
                    if (Math.abs(power) <= powerLimit) operations.push(['**', power]);
                }
                for (const [operator, value] of operations) {
                    if (!Number.isSafeInteger(value)) continue;
                    const used = a.used | b.used | (operator === '**' ? POWER : 0);
                    const node = {
                        value, used,
                        ...binaryNotation(a, b, operator),
                        steps: [...a.steps, ...b.steps, `${binaryNotation(numberNotation(a.value), numberNotation(b.value), operator).expression.replace('**', '^')} = ${value}`],
                    };
                    const remaining = items.filter((_, index) => index !== i && index !== j);
                    const result = search([...remaining, node]);
                    if (result || timedOut) return result;
                }
            }
        }
        return null;
    }

    const solution = search(initial);
    if (!solution) return { success: false, error: timedOut ? 'Search timed out. Try fewer numbers or fewer requirements.' : 'No solution found with the selected requirements.' };
    return { success: true, result: { expr: solution.expression, steps: solution.steps, usedExponents: !!(solution.used & POWER), usedSqrt: !!(solution.used & ROOT), stepByStep: !!config.stepByStep } };
}
