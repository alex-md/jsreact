import React from 'react';
import { PLAYER_1, PLAYER_2 } from '../utils/solver';
import type { Player } from '../utils/solver';

interface ControlsProps {
    moveCount: number;
    currentStep: number;
    historyLength: number;
    onUndo: () => void;
    onRedo: () => void;
    onReset: () => void;
    autoHint: boolean;
    setAutoHint: (value: boolean) => void;
    solverTarget: 'current' | Player;
    setSolverTarget: (value: 'current' | Player) => void;
}

const Controls: React.FC<ControlsProps> = ({
    moveCount,
    currentStep,
    historyLength,
    onUndo,
    onRedo,
    onReset,
    autoHint,
    setAutoHint,
    solverTarget,
    setSolverTarget,
}) => {
    return (
        <div className="bg-card/50 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-border flex flex-col gap-4 w-full lg:w-72 transition-all h-fit">
            {/* Move Counter */}
            <div className="flex justify-between items-center border-b border-border pb-4">
                <h2 className="text-lg font-bold text-foreground">Controls</h2>
                <div className="text-sm font-medium text-muted-foreground">
                    Move <span className="text-primary-600 font-bold text-lg ml-1">{moveCount}</span>
                </div>
            </div>

            {/* Game Actions */}
            <div className="flex gap-3">
                <button
                    onClick={onUndo}
                    disabled={currentStep === 0}
                    title="Undo"
                    className="flex-1 py-2.5 px-4 bg-secondary/10 hover:bg-secondary/20 disabled:opacity-40 disabled:cursor-not-allowed text-secondary-700 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <i className="fas fa-undo text-lg"></i> Undo
                </button>
                <button
                    onClick={onRedo}
                    disabled={currentStep === historyLength - 1}
                    title="Redo"
                    className="flex-1 py-2.5 px-4 bg-secondary/10 hover:bg-secondary/20 disabled:opacity-40 disabled:cursor-not-allowed text-secondary-700 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <i className="fas fa-redo text-lg"></i> Redo
                </button>
            </div>

            <button
                onClick={onReset}
                title="Reset Board"
                className="w-full py-3 px-4 rounded-xl border border-red-200 bg-red-50 text-red-700 font-medium transition-all active:scale-95 hover:bg-red-100 flex items-center justify-center gap-2"
            >
                <i className="fas fa-sync-alt"></i> Reset Board
            </button>

            {/* Solver Settings */}
            <div className="pt-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Solver Settings</h3>

                {/* Auto Hint Toggle */}
                <div className="flex items-center justify-between mb-3 bg-muted/50 p-3 rounded-xl">
                    <label htmlFor="auto-hint-toggle" className="text-foreground font-medium cursor-pointer text-sm">
                        Auto Hint
                    </label>
                    <button
                        id="auto-hint-toggle"
                        onClick={() => setAutoHint(!autoHint)}
                        role="switch"
                        aria-checked={autoHint}
                        className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${autoHint ? 'bg-primary-500' : 'bg-muted-foreground/30'
                            }`}
                    >
                        <div
                            className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${autoHint ? 'left-6' : 'left-1'
                                }`}
                        />
                    </button>
                </div>

                {/* Target Selector */}
                <div className="flex flex-col gap-2">
                    <label className="text-muted-foreground text-xs font-semibold">Solve for:</label>
                    <div className="flex bg-muted p-1.5 rounded-xl gap-1" role="radiogroup">
                        <button
                            onClick={() => setSolverTarget('current')}
                            role="radio"
                            aria-checked={solverTarget === 'current'}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${solverTarget === 'current'
                                ? 'bg-background shadow-sm text-primary-600'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Current
                        </button>
                        <button
                            onClick={() => setSolverTarget(PLAYER_1)}
                            role="radio"
                            aria-checked={solverTarget === PLAYER_1}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${solverTarget === PLAYER_1
                                ? 'bg-background shadow-sm text-red-600'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Red
                        </button>
                        <button
                            onClick={() => setSolverTarget(PLAYER_2)}
                            role="radio"
                            aria-checked={solverTarget === PLAYER_2}
                            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${solverTarget === PLAYER_2
                                ? 'bg-background shadow-sm text-yellow-600'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Yellow
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Controls;
