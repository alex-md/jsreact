import { createRng, deriveSeed, randomInt, shuffle } from './random.js';
import { cluePackDefinitions, cluePackMap } from './cluePacks.js';

const difficultySettings = {
    easy: {
        label: 'Easy',
        maxClues: 6,
        maxComplexity: 2,
        searchIterations: 6,
        reductionWeight: 1.5,
        complexityBias: -0.25,
        minReductionRatio: 0.15,
        allowStalls: false
    },
    medium: {
        label: 'Medium',
        maxClues: 7,
        maxComplexity: 3,
        searchIterations: 10,
        reductionWeight: 1.75,
        complexityBias: 0.1,
        minReductionRatio: 0.05,
        allowStalls: false
    },
    hard: {
        label: 'Hard',
        maxClues: 9,
        maxComplexity: 4,
        searchIterations: 16,
        reductionWeight: 2.1,
        complexityBias: 0.35,
        minReductionRatio: 0,
        allowStalls: true
    },
    extreme: {
        label: 'Extreme',
        maxClues: 11,
        maxComplexity: 5,
        searchIterations: 24,
        reductionWeight: 2.35,
        complexityBias: 0.55,
        minReductionRatio: 0,
        allowStalls: true,
        aggressive: true
    }
};
function generateCandidateRange(min, max) {
    const range = [];
    for (let i = min; i <= max; i += 1) {
        range.push(i);
    }
    return range;
}
const MAX_DEEPENING_LEVEL = 3;
function getDifficultyProfile(difficultyKey, depthLevel = 0) {
    const base = difficultySettings[difficultyKey] || difficultySettings.medium;
    if (!depthLevel) {
        return base;
    }
    const profile = {
        ...base
    };
    profile.depthLevel = depthLevel;
    profile.maxClues = base.maxClues + depthLevel * 2;
    profile.searchIterations = Math.round(base.searchIterations * (1 + 0.75 * depthLevel));
    profile.maxComplexity = Math.min(6, base.maxComplexity + depthLevel);
    return profile;
}
function buildClueLibrary(settings, target) {
    const librarySeed = deriveSeed(settings.seed, 'library');
    const rng = createRng(librarySeed);
    const context = {
        min: settings.min,
        max: settings.max,
        target,
        rng,
        randomInt: (min, max) => randomInt(rng, min, max)
    };
    const clues = [];
    settings.packs.forEach((packId) => {
        const pack = cluePackMap.get(packId);
        if (!pack) return;
        pack.factories.forEach((factory) => {
            try {
                const result = factory(context);
                const factoryClues = Array.isArray(result) ? result : [result];
                clues.push(...factoryClues.filter(Boolean));
            } catch (error) {
                console.warn(`Failed to build clue from pack ${packId}`, error);
            }
        });
    });
    return clues;
}
function scoreClueApplication(clue, currentCandidates, filteredCandidates, difficulty) {
    const reduction = currentCandidates.length - filteredCandidates.length;
    const ratio = filteredCandidates.length / currentCandidates.length;
    const complexityBias = clue.complexity * difficulty.complexityBias;
    const reductionScore = reduction * difficulty.reductionWeight;
    const coverageScore = (1 - ratio) * 1.6;
    return reductionScore + coverageScore + complexityBias;
}
function applyClue(clue, candidates) {
    return candidates.filter(value => clue.predicate(value));
}
function attemptPuzzle(settings, target, library, attemptIndex, difficulty) {
    const attemptSeed = deriveSeed(settings.seed, `attempt:${attemptIndex}`);
    const rng = createRng(attemptSeed);
    let candidates = generateCandidateRange(settings.min, settings.max);
    let available = shuffle(library.filter((clue) => clue.complexity <= difficulty.maxComplexity), rng);
    const steps = [];
    let stagnation = 0;
    while (candidates.length > 1 && steps.length < difficulty.maxClues && available.length) {
        let bestChoice = null;
        let bestFiltered = null;
        let bestIndex = -1;
        let bestScore = -Infinity;
        for (let i = 0; i < available.length; i += 1) {
            const clue = available[i];
            const filtered = applyClue(clue, candidates);
            if (!filtered.includes(target)) {
                continue;
            }
            const reduction = candidates.length - filtered.length;
            if (reduction === 0 && !difficulty.allowStalls) {
                continue;
            }
            const reductionRatio = reduction / candidates.length;
            if (reductionRatio < difficulty.minReductionRatio && reduction > 0 && candidates.length > 8) {
                continue;
            }
            const score = scoreClueApplication(clue, candidates, filtered, difficulty) + (rng() - 0.5) * 0.08;
            if (score > bestScore) {
                bestScore = score;
                bestChoice = clue;
                bestFiltered = filtered;
                bestIndex = i;
            }
        }
        if (!bestChoice) {
            stagnation += 1;
            if (stagnation > 2) {
                break;
            }
            available = shuffle(available, rng);
            continue;
        }
        stagnation = 0;
        const previousSize = candidates.length;
        candidates = bestFiltered;
        const reduction = previousSize - candidates.length;
        const coverage = candidates.length / previousSize;
        const preview = candidates.slice(0, Math.min(6, candidates.length));
        steps.push({
            clue: bestChoice,
            remaining: candidates.length,
            reduction,
            coverage,
            preview
        });
        available.splice(bestIndex, 1);
    }
    if (difficulty.aggressive && candidates.length > 1 && steps.length < difficulty.maxClues) {
        const remaining = available.slice(0, 6);
        for (let i = 0; i < remaining.length && steps.length < difficulty.maxClues; i += 1) {
            const clue = remaining[i];
            const filtered = applyClue(clue, candidates);
            if (!filtered.includes(target) || filtered.length === candidates.length) continue;
            const reduction = candidates.length - filtered.length;
            candidates = filtered;
            steps.push({
                clue,
                remaining: candidates.length,
                reduction,
                coverage: candidates.length / (candidates.length + reduction),
                preview: candidates.slice(0, Math.min(6, candidates.length))
            });
        }
    }
    return {
        success: candidates.length === 1 && candidates[0] === target,
        target,
        steps,
        finalCandidates: candidates,
        remainingCount: candidates.length,
        totalCandidates: settings.max - settings.min + 1,
        librarySize: library.length,
        usedClues: steps.length
    };
}
function chooseBestAttempt(currentBest, candidate) {
    if (!currentBest) return candidate;
    if (candidate.success !== currentBest.success) {
        return candidate.success ? candidate : currentBest;
    }
    if (candidate.success && candidate.usedClues !== currentBest.usedClues) {
        return candidate.usedClues < currentBest.usedClues ? candidate : currentBest;
    }
    return candidate.remainingCount < currentBest.remainingCount ? candidate : currentBest;
}
function generatePuzzle(settings, options = {}) {
    const depthLevel = options.depthLevel ? Math.min(MAX_DEEPENING_LEVEL, Math.max(0, Math.floor(options.depthLevel))) : 0;
    const difficultyProfile = getDifficultyProfile(settings.difficulty, depthLevel);
    const targetSeed = deriveSeed(settings.seed, 'target');
    const rng = createRng(targetSeed);
    const target = randomInt(rng, settings.min, settings.max);
    const library = buildClueLibrary(settings, target);
    if (!library.length) {
        return {
            error: 'No valid clues available for the chosen packs and range. Try enabling more packs or changing the range.',
            target,
            steps: [],
            finalCandidates: [
                target
            ],
            remainingCount: settings.max - settings.min + 1,
            librarySize: 0,
            usedClues: 0,
            totalCandidates: settings.max - settings.min + 1,
            success: false,
            settings,
            difficultyProfile,
            depthLevel
        };
    }
    let bestAttempt = null;
    let attempts = 0;
    for (let attempt = 0; attempt < difficultyProfile.searchIterations; attempt += 1) {
        attempts += 1;
        const result = attemptPuzzle(settings, target, library, attempt, difficultyProfile);
        bestAttempt = chooseBestAttempt(bestAttempt, result);
        if (bestAttempt && bestAttempt.success) {
            break;
        }
    }
    return {
        ...bestAttempt,
        target,
        attempts,
        librarySize: library.length,
        settings,
        difficultyProfile,
        depthLevel
    };
}

export { difficultySettings, cluePackDefinitions, cluePackMap, generatePuzzle };
