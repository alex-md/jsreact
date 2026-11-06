import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePuzzle, cluePackDefinitions, difficultySettings, validateSettings } from '../src/numigma/engine.js';
import { bellNumbersUpTo, isHappyNumber, carmichaelLambda, multiplicativeOrder, jacobiSymbol,
    quadraticFormValues, isPellSolutionX, isPrime, gcd } from '../src/numigma/math.js';

const packs = cluePackDefinitions.map(pack => pack.id);
const defaults = { min: 1, max: 999, seed: 'verified-puzzle', difficulty: 'easy', clueCount: 3, packs };

function certify(result, settings) {
    assert.equal(result.success, true, result.error);
    assert.equal(result.steps.length, settings.clueCount);
    const range = Array.from({ length: settings.max - settings.min + 1 }, (_, i) => settings.min + i);
    assert.deepEqual(range.filter(n => result.steps.every(step => step.clue.predicate(n))), [result.target]);
    let remaining = range;
    result.steps.forEach((step, index) => {
        assert.ok(step.clue.complexity >= difficultySettings[settings.difficulty].minComplexity);
        assert.ok(step.clue.complexity <= difficultySettings[settings.difficulty].maxComplexity);
        assert.ok(settings.packs.includes(step.clue.packId));
        const next = remaining.filter(step.clue.predicate);
        assert.equal(step.remaining, next.length);
        assert.ok(next.length < remaining.length, 'each clue reduces the candidates');
        if (index < settings.clueCount - 1) assert.ok(next.length > 1, 'no early singleton');
        remaining = next;
        const otherClues = result.steps.filter((_, j) => j !== index);
        const without = range.filter(n => otherClues.every(({ clue }) => clue.predicate(n)));
        assert.ok(without.length > 1, `clue ${index + 1} must be essential`);
        const witness = result.essentialWitnesses[index];
        assert.ok(without.includes(witness));
        assert.equal(step.clue.predicate(witness), false);
        assert.ok(range.filter(step.clue.predicate).length > 1, 'no single-clue giveaways');
    });
    assert.deepEqual(result.alternativesWithoutClue, result.steps.map((_, index) =>
        range.filter(n => result.steps.every(({ clue }, j) => j === index || clue.predicate(n))).length));
    if (['hard', 'extreme'].includes(settings.difficulty)) {
        assert.equal(new Set(result.steps.map(({ clue }) => clue.meta.family)).size, settings.clueCount);
        for (let mask = 1; mask < 2 ** settings.clueCount - 1; mask++) {
            const subset = result.steps.filter((_, i) => mask & (1 << i));
            const remaining = range.filter(n => subset.every(({ clue }) => clue.predicate(n)));
            assert.ok(remaining.length >= 2 ** (settings.clueCount - subset.length),
                `subset ${mask} must not provide a shortcut`);
        }
    }
    assert.ok(result.steps.filter(({ clue }) => clue.complexity >= difficultySettings[settings.difficulty].requiredComplexity).length >= Math.ceil(settings.clueCount / 2));
}

for (const difficulty of Object.keys(difficultySettings)) {
    for (let clueCount = 2; clueCount <= 6; clueCount++) {
        test(`${difficulty}, ${clueCount} clues: uniqueness and every leave-one-out check across seeds`, () => {
            for (let seed = 0; seed < 8; seed++) {
                const settings = { ...defaults, difficulty, clueCount, seed: `matrix-${seed}` };
                certify(generatePuzzle(settings), settings);
            }
        });
    }
}
test('offset ranges and restricted themes retain the exact-count guarantee', () => {
    for (const settings of [
        { ...defaults, min: 1500, max: 2499, clueCount: 4 },
        { ...defaults, min: 80, max: 200, packs: ['basic', 'digits', 'divisibility'] },
        { ...defaults, difficulty: 'extreme', packs: ['modular', 'diophantine', 'advanced'], clueCount: 3 },
        { ...defaults, max: 49999, clueCount: 5, packs: ['basic', 'digits', 'divisibility'] }
    ]) certify(generatePuzzle(settings), settings);
});

test('same puzzle settings reproduce both clue text and truth tables', () => {
    const a = generatePuzzle({ ...defaults, difficulty: 'extreme', clueCount: 5 });
    const b = generatePuzzle({ ...defaults, difficulty: 'extreme', clueCount: 5 });
    assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
    for (let n = 1; n <= defaults.max; n++) {
        assert.deepEqual(a.steps.map(s => s.clue.predicate(n)), b.steps.map(s => s.clue.predicate(n)));
    }
});

test('unbuildable requests fail explicitly without publishing partial or padded puzzles', () => {
    for (const settings of [
        { ...defaults, min: 1, max: 3, clueCount: 6 },
        { ...defaults, packs: ['basic'], difficulty: 'extreme' },
        { ...defaults, packs: ['figurate'], min: 50, max: 60, clueCount: 4 }
    ]) {
        const result = generatePuzzle(settings);
        assert.equal(result.success, false);
        assert.ok(result.error);
        assert.deepEqual(result.steps, []);
        assert.equal(result.target, undefined);
    }
});

test('invalid ranges, counts, themes, and tokens are rejected before searching', () => {
    for (const patch of [{ min: 0 }, { min: NaN }, { max: Infinity }, { min: 3.5 }, { min: 999 },
        { max: 50001 }, { min: 999999, max: 1000001 }, { clueCount: 1 }, { clueCount: 7 }, { clueCount: 2.5 },
        { packs: [] }, { packs: ['missing'] }, { difficulty: 'missing' }, { difficulty: 'toString' }, { difficulty: '__proto__' }, { seed: '' }, { seed: 'x'.repeat(101) }]) {
        assert.ok(validateSettings({ ...defaults, ...patch }), JSON.stringify(patch));
        assert.equal(generatePuzzle({ ...defaults, ...patch }).success, false);
    }
});

test('Bell numbers use the Bell triangle; happy numbers sum squared digits', () => {
    assert.deepEqual([...bellNumbersUpTo(5000)], [1, 2, 5, 15, 52, 203, 877, 4140]);
    for (const n of [1, 7, 10, 13, 19, 23, 28, 31, 32, 44, 100]) assert.equal(isHappyNumber(n), true, String(n));
    for (const n of [2, 3, 4, 5, 6, 8, 9, 11, 12, 20]) assert.equal(isHappyNumber(n), false, String(n));
});

test('Carmichael exponents match the definition by brute force on small integers', () => {
    for (let n = 2; n <= 100; n++) {
        const units = Array.from({ length: n - 1 }, (_, i) => i + 1).filter(a => gcd(a, n) === 1);
        let expected = 1;
        const powerMod = (a, exponent) => { let value = 1; for (let i = 0; i < exponent; i++) value = value * a % n; return value; };
        while (!units.every(a => powerMod(a, expected) === 1)) expected++;
        assert.equal(carmichaelLambda(n), expected, String(n));
    }
});

test('multiplicative order and Jacobi symbols agree with independently enumerated residues', () => {
    assert.equal(multiplicativeOrder(2, 7), 3);
    assert.equal(multiplicativeOrder(3, 7), 6);
    assert.equal(multiplicativeOrder(7, 7), null);
    for (let p = 3; p < 50; p += 2) {
        if (!isPrime(p)) continue;
        const squares = new Set(Array.from({ length: p - 1 }, (_, i) => (i + 1) ** 2 % p));
        for (let n = 0; n < 100; n++) assert.equal(jacobiSymbol(n, p), n % p === 0 ? 0 : squares.has(n % p) ? 1 : -1);
    }
    for (let n = 0; n < 100; n++) {
        assert.equal(jacobiSymbol(n, 45), (jacobiSymbol(n, 3) ** 2 * jacobiSymbol(n, 5)) || 0);
        assert.equal(jacobiSymbol(n, 77), (jacobiSymbol(n, 7) * jacobiSymbol(n, 11)) || 0);
    }
});

test('quadratic forms require positive integer variables; Pell clues match known solutions', () => {
    assert.deepEqual([...quadraticFormValues(30, 2)].sort((a, b) => a - b), [3, 6, 9, 11, 12, 17, 18, 19, 22, 24, 27]);
    for (const n of [3, 17, 99, 577]) assert.equal(isPellSolutionX(n, 2), true);
    for (const n of [1, 2, 4, 18, 100]) assert.equal(isPellSolutionX(n, 2), false);
});

test('clue text does not print hidden roots or reversed target numbers; 1 is not composite', () => {
    for (const pack of cluePackDefinitions) {
        for (const target of [1, 4, 8, 16, 121, 144]) {
            const ctx = { target, min: 1, max: 999, rng: () => 0.5, randomInt: () => 7 };
            for (const factory of pack.factories) {
                const result = factory(ctx);
                for (const clue of (Array.isArray(result) ? result : [result]).filter(Boolean)) {
                    assert.ok(clue.predicate(target), `${clue.text} is true of ${target}`);
                    assert.doesNotMatch(clue.text, /perfect (square|cube|fourth power) \(\d/);
                    assert.doesNotMatch(clue.text, /yields the prime \d/);
                    if (clue.text === 'The number is composite.') assert.equal(clue.predicate(1), false);
                }
            }
        }
    }
});


test('835 feedback: check the full range rather than only the first prime offsets', () => {
    const clues = [n => multiplicativeOrder(n, 17) === 8, n => n % 6 === 1,
        n => jacobiSymbol(n, 55) === 0, n => jacobiSymbol(n, 77) === -1,
        n => n > 816 && isPrime(n - 816)];
    const range = Array.from({ length: 999 }, (_, i) => i + 1);
    assert.deepEqual(range.filter(n => clues.every(f => f(n))), [835]);
    assert.deepEqual(clues.map((_, index) => range.filter(n => clues.every((f, j) => j === index || f(n)))),
        [[835, 895, 955], [835], [835, 859, 967], [835], [355, 655, 835, 865]]);
});

test('difficulty reflects simplified operations rather than advanced terminology', () => {
    const ctx = { target: 835, min: 1, max: 999, rng: () => 0.7 };
    const jacobi = cluePackDefinitions.find(pack => pack.id === 'modular').factories[2](ctx);
    assert.equal(jacobi.complexity, 3);
    assert.match(jacobi.meta.deduction, /gcd/);
    const lastDigit = cluePackDefinitions.find(pack => pack.id === 'bases').factories[2](ctx);
    assert.equal(lastDigit.complexity, 2);
    for (let n = 1; n <= 999; n++) assert.equal(lastDigit.predicate(n), n % 6 === 1);
    const orderOne = cluePackDefinitions.find(pack => pack.id === 'modular').factories[0]({ ...ctx, target: 18, rng: () => 0 });
    assert.equal(orderOne.complexity, 2);
});


test('shifted-property anchors can sit well beyond twenty below the answer', () => {
    const clue = cluePackDefinitions.find(pack => pack.id === 'polynomial').factories[2](
        { target: 835, min: 1, max: 999, rng: () => 0.5 });
    const anchor = Number(clue.text.match(/exceeds (\d+)/)[1]);
    assert.ok(835 - anchor > 20);
    assert.equal(clue.predicate(835), true);
    assert.equal(clue.predicate(anchor), false);
});
