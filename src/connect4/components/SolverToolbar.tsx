import React from 'react';
import { Check, Clipboard, RotateCcw, Share2, Sparkles } from 'lucide-react';

export type Connect4Mode = 'solver' | 'practice';
export type PracticeDifficulty = 'easy' | 'standard' | 'optimal';

interface SolverToolbarProps {
    mode: Connect4Mode;
    onModeChange: (mode: Connect4Mode) => void;
    practiceDifficulty: PracticeDifficulty;
    onPracticeDifficultyChange: (difficulty: PracticeDifficulty) => void;
    onPreset: (sequence: string) => void;
    onReset: () => void;
    onShare: () => void;
    shareCopied: boolean;
}

const DIFFICULTIES: Array<{
    id: PracticeDifficulty;
    label: string;
    detail: string;
}> = [
    { id: 'easy', label: 'Easy', detail: 'depth 3' },
    { id: 'standard', label: 'Standard', detail: 'depth 4–5' },
    { id: 'optimal', label: 'Optimal', detail: 'max depth' },
];

const SolverToolbar: React.FC<SolverToolbarProps> = ({
    mode,
    onModeChange,
    practiceDifficulty,
    onPracticeDifficultyChange,
    onPreset,
    onReset,
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
                Solver / Analysis
            </button>
            <button
                type="button"
                className={mode === 'practice' ? 'is-active' : ''}
                aria-pressed={mode === 'practice'}
                onClick={() => onModeChange('practice')}
            >
                Practice vs AI
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
                <span className="connect4-rail-label">
                    <Sparkles aria-hidden="true" size={14} />
                    Quick start
                </span>
                <button type="button" onClick={() => onPreset('4')}>Middle Column Opening</button>
                <button type="button" onClick={() => onPreset('443454')}>Trap Scenario</button>
                <button type="button" onClick={onReset}>
                    <RotateCcw aria-hidden="true" size={14} />
                    Reset Board
                </button>
            </div>
        )}

        <button type="button" className="connect4-share-button" onClick={onShare}>
            {shareCopied ? <Check aria-hidden="true" size={16} /> : <Share2 aria-hidden="true" size={16} />}
            <span className="hidden sm:inline">{shareCopied ? 'Link copied' : 'Share Board Position'}</span>
            <span className="sm:hidden">{shareCopied ? 'Copied' : 'Share'}</span>
            <Clipboard aria-hidden="true" className="connect4-share-clipboard" size={12} />
        </button>
    </section>
);

export default SolverToolbar;
