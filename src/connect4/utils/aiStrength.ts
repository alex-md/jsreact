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
        description: 'Looks 5 moves ahead with natural variation.',
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
        description: 'Uses the deepest practical search and solves late endgames completely.',
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
