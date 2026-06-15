import React from 'react';
import type { Player } from '../utils/solver';
import SolverTargetPicker from './SolverTargetPicker';
import AiStrengthControl from './AiStrengthControl';
import type { AiStrength } from '../utils/aiStrength';

interface ControlsProps {
    moveCount: number;
    solverTarget: 'current' | Player;
    onSolverTargetChange: (value: 'current' | Player) => void;
    aiStrength: AiStrength;
    onAiStrengthChange: (value: AiStrength) => void;
}

const Controls: React.FC<ControlsProps> = ({
    moveCount,
    solverTarget,
    onSolverTargetChange,
    aiStrength,
    onAiStrengthChange,
}) => {
    return (
        <div className="bg-card/50 backdrop-blur-md p-5 rounded-2xl shadow-lg border border-border flex flex-col gap-5 w-full md:w-56 lg:w-64 transition-all h-fit">
            <div className="flex justify-between items-center border-b border-border pb-4">
                <h2 className="text-base font-bold text-foreground">Solver Options</h2>
                <div className="text-sm font-medium text-muted-foreground">
                    Move <span className="text-primary-600 font-bold text-lg ml-1">{moveCount}</span>
                </div>
            </div>

            <SolverTargetPicker solverTarget={solverTarget} onChange={onSolverTargetChange} />
            <div className="border-t border-border pt-4">
                <AiStrengthControl value={aiStrength} onChange={onAiStrengthChange} />
            </div>
        </div>
    );
};

export default Controls;
