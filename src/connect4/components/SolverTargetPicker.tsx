import React from 'react';
import { PLAYER_1, PLAYER_2 } from '../utils/solver';
import type { Player } from '../utils/solver';

interface SolverTargetPickerProps {
    solverTarget: 'current' | Player;
    onChange: (value: 'current' | Player) => void;
    compact?: boolean;
}

const SolverTargetPicker: React.FC<SolverTargetPickerProps> = ({
    solverTarget,
    onChange,
    compact = false,
}) => {
    const options: { value: 'current' | Player; label: string; activeClass: string }[] = [
        { value: 'current', label: 'Current', activeClass: 'text-primary-600' },
        { value: PLAYER_1, label: 'Red', activeClass: 'text-red-600' },
        { value: PLAYER_2, label: 'Yellow', activeClass: 'text-yellow-600' },
    ];

    return (
        <div className={`flex items-center ${compact ? 'gap-2' : 'flex-col gap-3 items-stretch'}`}>
            <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                {compact ? 'Solve for' : 'Recommend a move for:'}
            </span>
            <div
                className={`flex flex-1 gap-1 rounded-xl bg-muted ${compact ? 'p-1' : 'p-1.5'}`}
                role="radiogroup"
                aria-label="Solver target"
            >
                {options.map((option) => (
                    <button
                        type="button"
                        key={option.label}
                        onClick={() => onChange(option.value)}
                        role="radio"
                        aria-checked={solverTarget === option.value}
                        className={`flex-1 rounded-lg px-2 text-xs font-medium transition-all ${
                            compact ? 'py-1' : 'py-1.5'
                        } ${
                            solverTarget === option.value
                                ? `bg-background shadow-sm ${option.activeClass}`
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SolverTargetPicker;
