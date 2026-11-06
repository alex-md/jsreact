import { clearMathCache } from './math.js';
import { createRng, deriveSeed, randomInt, shuffle } from './random.js';
import { cluePackDefinitions, cluePackMap } from './cluePacks.js';

// Difficulty describes the mathematics, never a race to the fewest clues.
const difficultySettings = {
    easy: { label: 'Easy', minComplexity: 1, maxComplexity: 2, requiredComplexity: 1, description: 'Everyday arithmetic, remainders, and digit sums.' },
    medium: { label: 'Medium', minComplexity: 1, maxComplexity: 3, requiredComplexity: 3, description: 'Combine arithmetic with factors and number patterns.' },
    hard: { label: 'Hard', minComplexity: 2, maxComplexity: 4, requiredComplexity: 4, description: 'Distinct deductions with bases and number theory; every subset leaves room to reason.' },
    extreme: { label: 'Extreme', minComplexity: 3, maxComplexity: 6, requiredComplexity: 6, description: 'Combine distinct number-theory deductions, with every subset checked for shortcuts.' }
};
const GENERATOR_VERSION = '3';
const limits = { maxValue: 1000000, maxRange: 50000, minClues: 2, maxClues: 6 };

function validateSettings(settings) {
    if (!settings || !Number.isSafeInteger(settings.min) || !Number.isSafeInteger(settings.max)
        || settings.min < 1 || settings.max > limits.maxValue || settings.min >= settings.max) {
        return 'Use whole numbers between 1 and 1,000,000, with the minimum below the maximum.';
    }
    if (settings.max - settings.min + 1 > limits.maxRange) return 'Use a range of at most 50,000 numbers.';
    if (!Number.isInteger(settings.clueCount) || settings.clueCount < limits.minClues || settings.clueCount > limits.maxClues) {
        return 'Choose between 2 and 6 clues.';
    }
    if (!Object.hasOwn(difficultySettings, settings.difficulty)) return 'Choose a difficulty level.';
    if (!Array.isArray(settings.packs) || !settings.packs.length || settings.packs.some(id => !cluePackMap.has(id))) {
        return 'Enable at least one valid clue theme.';
    }
    if (typeof settings.seed !== 'string' || !settings.seed.length || settings.seed.length > 100) return 'This puzzle link has an invalid token. Create a new puzzle.';
    return null;
}

function buildClueLibrary(settings, target, rng, profile) {
    const clues = new Map();
    const context = { min: settings.min, max: settings.max, target, rng, randomInt: (min, max) => randomInt(rng, min, max) };
    // Vary anchors, moduli, and bounds rather than repeatedly searching one tiny library.
    for (let variant = 0; variant < 10; variant++) {
        for (const id of settings.packs) {
            for (const [family, factory] of cluePackMap.get(id).factories.entries()) {
                const result = factory(context);
                for (const clue of (Array.isArray(result) ? result : [result])) {
                    if (clue && clue.complexity >= profile.minComplexity && clue.complexity <= profile.maxComplexity
                        && clue.predicate(target)) {
                        clue.meta.family = `${id}:${family}`;
                        clues.set(clue.id, clue);
                    }
                }
            }
        }
    }
    return shuffle([...clues.values()], rng);
}

// Search for an irredundant intersection. Each selected clue retains a private
// witness: a number that passes every OTHER clue but fails this one. If a new
// clue removes all of those witnesses, that branch can never be irredundant.
function searchExact(library, universe, count, profile, rng) {
    const truthTables = new Set();
    const pool = [];
    for (const clue of [...library].sort((a, b) => b.complexity - a.complexity)) {
        const matches = Uint8Array.from(universe, n => Number(clue.predicate(n)));
        const size = matches.reduce((a, b) => a + b, 0);
        if (size <= 1 || size === universe.length) continue; // No giveaway or vacuous clues.
        const signature = matches.join('');
        if (truthTables.has(signature)) continue;
        truthTables.add(signature);
        pool.push({ clue, matches });
    }
    const strongSubsets = profile.requiredComplexity >= 4;
    const requiredAdvanced = profile.requiredComplexity <= 2 ? 0 : Math.ceil(count / 2);
    let nodes = 0;
    const visit = (survivors, selected, witnesses, available) => {
        if (++nodes > 4500) return null;
        const slots = count - selected.length;
        const advancedNeeded = requiredAdvanced - selected.filter(entry => entry.clue.complexity >= profile.requiredComplexity).length;
        if (slots === 0) {
            return survivors.length === 1 && advancedNeeded <= 0
                ? { selected, witnesses, survivor: survivors[0] } : null;
        }
        if (survivors.length <= slots || available.length < slots) return null;
        const desiredSize = Math.pow(survivors.length, (slots - 1) / slots);
        const choices = [];
        for (const entry of available) {
            if (advancedNeeded >= slots && entry.clue.complexity < profile.requiredComplexity) continue;
            if (strongSubsets && selected.some(item => item.clue.meta.family === entry.clue.meta.family)) continue;
            const kept = survivors.filter(i => entry.matches[i]);
            if (!kept.length || kept.length === survivors.length || (slots > 1 && kept.length <= slots - 1)
                || (slots === 1 && kept.length !== 1)) continue;
            if (strongSubsets && !hasSubsetRoom([...selected, entry], universe.length, count)) continue;
            const nextWitnesses = witnesses.map(list => list.filter(i => entry.matches[i]));
            if (nextWitnesses.some(list => !list.length)) continue;
            nextWitnesses.push(survivors.filter(i => !entry.matches[i]));
            const score = Math.abs(Math.log(kept.length / desiredSize)) + rng() * 0.2;
            choices.push({ entry, kept, nextWitnesses, score });
        }
        choices.sort((a, b) => a.score - b.score);
        // Bounded search; failure is reported, never padded with redundant clues.
        for (const { entry, kept, nextWitnesses } of choices.slice(0, 18)) {
            const result = visit(kept, [...selected, entry], nextWitnesses, available.filter(item => item !== entry));
            if (result) return result;
        }
        return null;
    };
    const result = visit(universe.map((_, i) => i), [], [], pool);
    return { result, librarySize: pool.length, nodes };
}

// Check every order of attack, not just the displayed order. With r clues still
// missing, retain at least 2^r candidates on Hard/Extreme. This is a measurable
// anti-shortcut rule, not a claim to model human solving time.
function hasSubsetRoom(entries, size, clueCount) {
    // Older subsets were certified before this entry was added.
    for (let mask = 1 << (entries.length - 1); mask < 2 ** entries.length; mask++) {
        const subset = entries.filter((_, i) => mask & (1 << i));
        const missing = clueCount - subset.length;
        if (!missing) continue;
        const minimum = 2 ** missing;
        let matches = 0;
        for (let i = 0; i < size && matches < minimum; i++) {
            if (subset.every(entry => entry.matches[i])) matches++;
        }
        if (matches < minimum) return false;
    }
    return true;
}

function generatePuzzle(input) {
    const settings = { ...input, clueCount: input?.clueCount ?? 3 };
    const error = validateSettings(settings);
    if (error) return { success: false, error, steps: [], settings };
    clearMathCache();
    const profile = difficultySettings[settings.difficulty];
    const universe = Array.from({ length: settings.max - settings.min + 1 }, (_, i) => settings.min + i);
    const rng = createRng(deriveSeed(settings.seed, `numigma:${GENERATOR_VERSION}`));
    let searchedNodes = 0;
    for (let attempt = 0; attempt < 64; attempt++) {
        const target = randomInt(rng, settings.min, settings.max);
        const library = buildClueLibrary(settings, target, rng, profile);
        const { result, librarySize, nodes } = searchExact(library, universe, settings.clueCount, profile, rng);
        searchedNodes += nodes;
        if (!result) continue;
        // Present a usable starting point before the advanced verification.
        // Essentiality guarantees every order still needs the final clue.
        const ordered = result.selected.map((entry, i) => ({ ...entry, witnesses: result.witnesses[i] }))
            .sort((a, b) => {
                const rank = ({ clue }) => clue.meta.key?.startsWith('affine-') ? 0 : clue.complexity;
                return rank(a) - rank(b);
            });
        let candidates = universe;
        const steps = ordered.map(({ clue }) => {
            const previous = candidates.length;
            candidates = candidates.filter(clue.predicate);
            return { clue, remaining: candidates.length, reduction: previous - candidates.length,
                coverage: candidates.length / previous };
        });
        return { success: true, version: GENERATOR_VERSION, target, steps, finalCandidates: candidates,
            remainingCount: 1, totalCandidates: universe.length, usedClues: steps.length, librarySize,
            attempts: attempt + 1, searchedNodes, settings, difficultyProfile: profile,
            // A concrete certificate for every leave-one-out check, also used by tests.
            essentialWitnesses: ordered.map(({ witnesses }) => universe[witnesses[0]]),
            alternativesWithoutClue: ordered.map(({ witnesses }) => witnesses.length + 1) };
    }
    return { success: false, steps: [], settings,
        error: `Could not build ${settings.clueCount} essential clues with these settings within the search limit. Try fewer clues, a wider range, or more themes. Hard and Extreme also require distinct clue types and stronger subsets.` };
}

export { difficultySettings, cluePackDefinitions, cluePackMap, generatePuzzle, validateSettings, limits, GENERATOR_VERSION };
