import React from 'react';
import type { Player } from '../utils/solver';
import SolverTargetPicker from './SolverTargetPicker';
import AiStrengthControl from './AiStrengthControl';
import type { AiStrength } from '../utils/aiStrength';

interface ControlsProps {
    solverTarget: 'current' | Player;
    onSolverTargetChange: (value: 'current' | Player) => void;
    aiStrength: AiStrength;
    onAiStrengthChange: (value: AiStrength) => void;
}

const Controls: React.FC<ControlsProps> = ({
    solverTarget,
    onSolverTargetChange,
    aiStrength,
    onAiStrengthChange,
}) => {
    return (
        <div className="connect4-settings-panel">
            <div className="flex justify-between items-center border-b border-border pb-4">
                <h2 className="text-base font-bold text-foreground">Analysis settings</h2>
            </div>

            <SolverTargetPicker solverTarget={solverTarget} onChange={onSolverTargetChange} />
            <div className="border-t border-border pt-4">
                <AiStrengthControl value={aiStrength} onChange={onAiStrengthChange} />
            </div>
            <div className="connect4-reading-guide">
                <h3>Read the move labels</h3>
                <dl>
                    <div><dt>+N</dt><dd>Proven win in N turns</dd></div>
                    <div><dt>−N</dt><dd>Proven loss in N turns</dd></div>
                    <div><dt>~</dt><dd>Search estimate</dd></div>
                </dl>
                <p>Outlined column = recommended move. A ring marks the last disc played.</p>
            </div>
            <p className="connect4-keyboard-note"><kbd>1</kbd>–<kbd>7</kbd> drop a disc <span>·</span> <kbd>Space</kbd> get a hint</p>
        </div>
    );
};

export default Controls;
