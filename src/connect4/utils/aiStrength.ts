export const AI_STRENGTHS = [
    {
        id: 'random',
        label: 'Random',
        shortLabel: 'Random',
        description: 'Picks any open column.',
    },
    {
        id: 'casual',
        label: 'Casual',
        shortLabel: 'Casual',
        description: 'Looks 2 moves ahead and makes occasional mistakes.',
    },
    {
        id: 'human',
        label: 'Plays like a human',
        shortLabel: 'Human',
        description: 'Uses selective tactical search with a consistent game-by-game style.',
    },
    {
        id: 'expert',
        label: 'Expert',
        shortLabel: 'Expert',
        description: 'Searches deeply and always chooses its top move.',
    },
    {
        id: 'master',
        label: 'Master',
        shortLabel: 'Master',
        description: 'Attempts a full game-theory proof before using deep iterative analysis.',
    },
] as const;

export type AiStrength = typeof AI_STRENGTHS[number]['id'];

export const DEFAULT_AI_STRENGTH: AiStrength = 'human';

export function getAiStrengthIndex(strength: AiStrength): number {
    const index = AI_STRENGTHS.findIndex((option) => option.id === strength);
    return index === -1 ? AI_STRENGTHS.findIndex((option) => option.id === DEFAULT_AI_STRENGTH) : index;
}

export function getAiStrengthOption(strength: AiStrength) {
    return AI_STRENGTHS[getAiStrengthIndex(strength)];
}
