import React from 'react';
import { PLAYER_1, PLAYER_2 } from '../utils/solver';
import type { Player } from '../utils/solver';

interface ControlsProps {
    moveCount: number;
    solverTarget: 'current' | Player;
    setSolverTarget: (value: 'current' | Player) => void;
}

const Controls: React.FC<ControlsProps> = ({
    moveCount,
    solverTarget,
    setSolverTarget,
}) => {
    return (
        <div className="bg-card/50 backdrop-blur-md p-5 rounded-2xl shadow-lg border border-border flex flex-col gap-5 w-full lg:w-64 transition-all h-fit">
            <div className="flex justify-between items-center border-b border-border pb-4">
                <h2 className="text-base font-bold text-foreground">Solver Options</h2>
                <div className="text-sm font-medium text-muted-foreground">
                    Move <span className="text-primary-600 font-bold text-lg ml-1">{moveCount}</span>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <label className="text-muted-foreground text-xs font-semibold">Recommend a move for:</label>
                <div className="flex bg-muted p-1.5 rounded-xl gap-1" role="radiogroup" aria-label="Solver target">
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
    );
};

export default Controls;
