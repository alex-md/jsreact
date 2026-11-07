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
        { value: 'current', label: 'Current', activeClass: 'text-primary' },
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
                    <label key={option.label} className={`connect4-target-option ${solverTarget === option.value ? 'is-selected' : ''}`}>
                        <input
                            type="radio"
                            name={compact ? 'solver-target-mobile' : 'solver-target-desktop'}
                            value={option.value}
                            checked={solverTarget === option.value}
                            onChange={() => onChange(option.value)}
                        />
                        <span className={solverTarget === option.value ? option.activeClass : ''}>{option.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

export default SolverTargetPicker;
