import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { generatePuzzle, cluePackDefinitions } from '../src/numigma/engine.js';

// Captured before the engine was separated into modules. Include each clue's
// truth table because JSON serialization alone omits predicate functions.
const digests = JSON.parse(readFileSync(new URL('./fixtures/numigma-digests.json', import.meta.url)));
const packIds = ['basic', 'divisibility', 'digits', 'primes', 'figurate', 'binary', 'gcd',
    'polynomial', 'bases', 'transformations', 'combinatorial', 'rarities', 'advanced'];

test('Numigma retains its public clue packs and their order', () => {
    assert.deepEqual(cluePackDefinitions.map(pack => pack.id), packIds);
});

for (const difficulty of Object.keys(digests)) {
    test(`${difficulty}: seeded puzzles and clue predicates match the original engine`, t => {
        const warnings = t.mock.method(console, 'warn', () => {});
        let index = 0;
        for (const packs of [packIds, ...packIds.map(id => [id]), []]) {
            for (const depthLevel of [0, 3]) {
                const settings = { min: 1, max: 120, seed: `regression-${difficulty}-${packs.join('-')}`, difficulty, packs };
                const result = generatePuzzle(settings, { depthLevel });
                const predicates = result.steps.map(step => Array.from({ length: 120 }, (_, i) => step.clue.predicate(i + 1)));
                const digest = createHash('sha256').update(JSON.stringify({ result, predicates })).digest('hex');
                assert.equal(digest, digests[difficulty][index++], `packs=${packs}, depth=${depthLevel}`);
                if (result.success) assert.deepEqual(result.finalCandidates, [result.target]);
            }
        }
        assert.equal(index, digests[difficulty].length);
        assert.equal(warnings.mock.callCount(), 0, 'all clue factories execute without errors');
    });
}
