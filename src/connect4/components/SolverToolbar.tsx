import React from 'react';
import { Check, Share2, Crosshair, Swords } from 'lucide-react';

export type Connect4Mode = 'solver' | 'practice';
export type PracticeDifficulty = 'easy' | 'standard' | 'optimal';

interface SolverToolbarProps {
    mode: Connect4Mode;
    onModeChange: (mode: Connect4Mode) => void;
    practiceDifficulty: PracticeDifficulty;
    onPracticeDifficultyChange: (difficulty: PracticeDifficulty) => void;
    onPreset: (sequence: string) => void;
    onShare: () => void;
    shareCopied: boolean;
}

const DIFFICULTIES: Array<{
    id: PracticeDifficulty;
    label: string;
    detail: string;
}> = [
    { id: 'easy', label: 'Easy', detail: 'Learn the basics' },
    { id: 'standard', label: 'Standard', detail: 'A balanced game' },
    { id: 'optimal', label: 'Master', detail: 'deep analysis' },
];

const SolverToolbar: React.FC<SolverToolbarProps> = ({
    mode,
    onModeChange,
    practiceDifficulty,
    onPracticeDifficultyChange,
    onPreset,
    onShare,
    shareCopied,
}) => (
    <section className="connect4-tool-rail" aria-label="Solver setup">
        <div className="connect4-mode-toggle" role="group" aria-label="Connect 4 mode">
            <button
                type="button"
                className={mode === 'solver' ? 'is-active' : ''}
                aria-pressed={mode === 'solver'}
                onClick={() => onModeChange('solver')}
            >
                <Crosshair aria-hidden="true" size={16} /> Analyze a board
            </button>
            <button
                type="button"
                className={mode === 'practice' ? 'is-active' : ''}
                aria-pressed={mode === 'practice'}
                onClick={() => onModeChange('practice')}
            >
                <Swords aria-hidden="true" size={16} /> Play against AI
            </button>
        </div>

        {mode === 'practice' ? (
            <div className="connect4-difficulty-picker" role="group" aria-label="Practice difficulty">
                {DIFFICULTIES.map((difficulty) => (
                    <button
                        type="button"
                        key={difficulty.id}
                        className={practiceDifficulty === difficulty.id ? 'is-active' : ''}
                        aria-pressed={practiceDifficulty === difficulty.id}
                        onClick={() => onPracticeDifficultyChange(difficulty.id)}
                    >
                        <strong>{difficulty.label}</strong>
                        <span>{difficulty.detail}</span>
                    </button>
                ))}
            </div>
        ) : (
            <div className="connect4-presets" aria-label="Quick-start board positions">
                <span className="connect4-rail-label">Try a position</span>
                <button type="button" onClick={() => onPreset('4')}>Center opening <span aria-hidden="true">↗</span></button>
                <button type="button" onClick={() => onPreset('443454')}>Practice a trap <span aria-hidden="true">↗</span></button>
            </div>
        )}

        <button type="button" className="connect4-share-button" onClick={onShare}>
            {shareCopied ? <Check aria-hidden="true" size={16} /> : <Share2 aria-hidden="true" size={16} />}
            <span className="hidden sm:inline">{shareCopied ? 'Link copied' : 'Share board'}</span>
            <span className="sm:hidden">{shareCopied ? 'Copied' : 'Share'}</span>
        </button>
    </section>
);

export default SolverToolbar;
