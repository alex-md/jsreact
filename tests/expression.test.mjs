import assert from 'node:assert/strict';
import { test } from 'node:test';
import { expressionToTex, renderEquation } from '../src/expression/equation.js';

test('groups the nested root exponent from the reported expression', () => {
    assert.equal(expressionToTex('sqrt(77 ^ sqrt(sqrt(sqrt(87 + 45 + 34 + 90)))) - 72'),
        '\\sqrt{{77}^{\\sqrt{\\sqrt{\\sqrt{87 + 45 + 34 + 90}}}}} - 72');
});
test('preserves grouping and arithmetic in the second reported expression', () => {
    assert.equal(expressionToTex('39 + 15 * (15 - 83 + (52 + 41))'),
        '39 + 15 \\times \\left(15 - 83 + \\left(52 + 41\\right)\\right)');
});
test('handles powers of roots, chained powers, and signed powers', () => {
    assert.equal(expressionToTex('sqrt(16)^2'), '{\\sqrt{16}}^{2}');
    assert.equal(expressionToTex('2^3^2'), '{2}^{{3}^{2}}');
    assert.equal(expressionToTex('2**(-3)'), '{2}^{\\left(-3\\right)}');
    assert.equal(expressionToTex('sqrt(2^-4)'), '\\sqrt{{2}^{-4}}');
    assert.equal(expressionToTex('(2^3)^2'), '{\\left({2}^{3}\\right)}^{2}');
});
test('handles division, negative numbers, and scientific notation', () => {
    assert.equal(expressionToTex('-3 / 2 + 1e-7'), '-3 \\div 2 + 1 \\times 10^{-7}');
});
test('rejects incomplete expressions and arbitrary commands', () => {
    for (const expression of ['sqrt(4', '2^', 'sqrt()', '2 +', '2 3', '\\htmlClass{x}{4}']) {
        assert.throws(() => expressionToTex(expression), SyntaxError);
    }
});
test('renders with strict parsing so malformed TeX cannot become red error output', () => {
    const element = { dataset: {} };
    renderEquation(element, 'sqrt(4)^2', 4, { render(tex, target, options) {
        assert.equal(tex, '{\\sqrt{4}}^{2} = 4');
        assert.equal(target, element);
        assert.equal(options.throwOnError, true);
        assert.equal(options.trust, false);
    } });
    assert.equal(element.dataset.rendering, 'math');
});
test('falls back to the original readable equation when rendering is unavailable or fails', () => {
    for (const renderer of [null, { render() { throw new Error('parse error'); } }]) {
        const element = { dataset: {}, textContent: '' };
        renderEquation(element, 'sqrt(4)^2', 4, renderer);
        assert.equal(element.textContent, 'sqrt(4)^2 = 4');
        assert.equal(element.dataset.rendering, 'plain');
    }
});

// Independently evaluate the worker's exported expression using JavaScript's
// actual operator precedence, rather than trusting the solver's stored value.
import { solveExpression } from '../src/expression/solver.js';
const evaluate = expression => Function(`"use strict"; return (${expression.replace(/sqrt\(/g, 'Math.sqrt(').replace(/\^/g, '**')});`)();
const verify = (numbers, target, config) => {
    const response = solveExpression(numbers, target, config);
    assert.equal(response.success, true, response.error);
    assert.ok(Math.abs(evaluate(response.result.expr) - target) < 1e-10, response.result.expr);
    const available = [...numbers];
    const take = value => {
        const index = available.indexOf(value);
        assert.notEqual(index, -1, `Unavailable operand ${value}: ${available}`);
        available.splice(index, 1);
    };
    for (const step of response.result.steps) {
        const [expression, value] = step.split(' = ');
        const result = evaluate(value);
        assert.ok(Math.abs(evaluate(expression) - result) < 1e-10, step);
        if (expression.startsWith('sqrt(')) {
            take(evaluate(expression.slice(5, -1)));
        } else {
            const operands = expression.match(/^\(?(-?\d+(?: \/ \d+)?)\)? [^ ]+ \(?(-?\d+(?: \/ \d+)?)\)?$/);
            assert.ok(operands, expression);
            take(evaluate(operands[1]));
            take(evaluate(operands[2]));
        }
        available.push(result);
    }
    assert.deepEqual(available, [target], 'Every input is used exactly once');
    if (config.useExponents) assert.equal(response.result.usedExponents, true);
    if (config.useSqrt) assert.equal(response.result.usedSqrt, true);
    return response.result;
};

test('required exponents cannot be bypassed by a basic-arithmetic solution', () => {
    const result = verify([2, 3], 8, { useExponents: true });
    assert.match(result.expr, /\*\*/);
    assert.equal(solveExpression([2, 3], 5, { useExponents: true }).success, false);
});
test('required roots can apply to the final combined value or a single input', () => {
    verify([7, 2], 3, { useSqrt: true });
    verify([16], 2, { useSqrt: true });
    assert.equal(solveExpression([2, 3], 5, { useSqrt: true }).success, false);
});
test('both checked requirements must occur in the returned solution', () => {
    verify([2, 4], 4, { useExponents: true, useSqrt: true });
});
test('unchecked special operations are excluded', () => {
    const result = verify([2, 3, 4], 20, {});
    assert.equal(result.usedExponents, false);
    assert.equal(result.usedSqrt, false);
});
test('grouped output remains correct for precedence and nested-power cases', () => {
    for (const [numbers, target] of [[[2, 3, 4], 19], [[5, 2, 3], 1], [[2, 3, 2], 64], [[-2, 3], -8]]) {
        verify(numbers, target, { useExponents: true });
    }
});
test('invalid inputs and exhausted time budget never produce a claimed solution', () => {
    for (const numbers of [[], [NaN], [Infinity], [1.5]]) assert.equal(solveExpression(numbers, 1).success, false);
    assert.equal(solveExpression([2, 3], 5, {}, { timeLimitMs: 0 }).success, false);
});

test('24-style working supports separate intermediate results and ordinary precedence', () => {
    const result = verify([1, 2, 3, 4], 21, { stepByStep: true });
    assert.equal(result.stepByStep, true);
    assert.equal(result.steps.length, 3);
    verify([2, 3, 4], 20, { stepByStep: true });
    verify([87, 45, 77, 72, 34, 90], 5, { stepByStep: true, useExponents: true, useSqrt: true });
});
test('finds 24 using fractional intermediates in both display modes', () => {
    for (const stepByStep of [false, true]) {
        const result = verify([1, 3, 4, 6], 24, { stepByStep });
        assert.equal(result.expr, '6 / (1 - 3 / 4)');
        assert.deepEqual(result.steps, ['3 / 4 = 3 / 4', '1 - 3 / 4 = 1 / 4', '6 / (1 / 4) = 24']);
        for (const step of result.steps) {
            const [expression, value] = step.split(' = ');
            assert.doesNotThrow(() => expressionToTex(expression));
            assert.doesNotThrow(() => expressionToTex(value));
        }
    }
    verify([3, 3, 8, 8], 24, {});
});

import { rational, calculate, squareRoot } from '../src/expression/rational.js';
test('fraction arithmetic stays exact and rejects undefined or oversized values', () => {
    assert.deepEqual(calculate(rational(1n, 3n), rational(2n, 3n), '+'), rational(1n));
    assert.equal(calculate(rational(1n), rational(0n), '/'), null);
    assert.equal(calculate(rational(0n), rational(0n), '**', 500000), null);
    assert.deepEqual(calculate(rational(2n, 3n), rational(-2n), '**', 500000), rational(9n, 4n));
    assert.deepEqual(squareRoot(rational(9n, 16n)), rational(3n, 4n));
    assert.equal(squareRoot(rational(2n, 3n)), null);
    assert.equal(rational(BigInt(Number.MAX_SAFE_INTEGER) + 1n), null);
    // Close fractions must not round to a false match for an integer target.
    assert.equal(solveExpression([Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER - 1], 1).success, true);
    assert.equal(solveExpression([Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER - 2], 1).success, false);
});
test('required-operation tracking survives equivalent numeric intermediate states', () => {
    verify([1, 2, 3, 4], 10, { useSqrt: true });
    verify([1, 2, 3, 4], 10, { useExponents: true, useSqrt: true });
    assert.equal(solveExpression([0, 0], 1, { useExponents: true }).success, false);
});

import { numberNotation, binaryNotation } from '../src/expression/notation.js';
const n = numberNotation;
const op = binaryNotation;
test('uses only necessary grouping for the reported equation', () => {
    const numerator = op(op(n(14), n(20), '*'), op(n(71), n(69), '-'), '+');
    const equation = op(numerator, op(n(74), n(27), '-'), '/').expression;
    assert.equal(equation, '(14 * 20 + 71 - 69) / (74 - 27)');
    assert.equal(evaluate(equation), 6);
    const result = verify([74, 27, 14, 20, 71, 69], 6, {});
    assert.doesNotMatch(result.expr, /\(\d+\)/);
});
test('retains grouping for subtraction, division, negative bases, and nested powers', () => {
    const examples = [
        [op(n(10), op(n(6), n(2), '-'), '-'), '10 - (6 - 2)', 6],
        [op(n(24), op(n(6), n(2), '/'), '/'), '24 / (6 / 2)', 8],
        [op(op(n(2), n(3), '**'), n(2), '**'), '(2 ** 3) ** 2', 64],
        [op(n(2), op(n(3), n(2), '**'), '**'), '2 ** 3 ** 2', 512],
        [op(n(-2), n(2), '**'), '(-2) ** 2', 4],
        [op(n(2), n(-3), '**'), '2 ** (-3)', .125],
        [op(op(n(2), n(3), '+'), n(4), '*'), '(2 + 3) * 4', 20],
    ];
    for (const [node, expected, value] of examples) {
        assert.equal(node.expression, expected);
        assert.equal(evaluate(node.expression), value);
    }
});
