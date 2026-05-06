import React from 'react';
import { PLAYER_1, EMPTY, COLS, getNextOpenRow } from '../utils/solver';
import type { Board as BoardType, Player } from '../utils/solver';

interface BoardProps {
    board: BoardType;
    currentPlayer: Player;
    winner: Player | null;
    hoveredColumn: number | null;
    setHoveredColumn: (col: number | null) => void;
    onColumnClick: (col: number) => void;
    bestMove: { column: number; score: number } | null;
    isCalculating: boolean;
    onCalculateBestMove: () => void;
    autoHint: boolean;
    setAutoHint: (value: boolean) => void;
    solverTarget: 'current' | Player;
}

const Board: React.FC<BoardProps> = ({
    board,
    currentPlayer,
    winner,
    hoveredColumn,
    setHoveredColumn,
    onColumnClick,
    bestMove,
    isCalculating,
    onCalculateBestMove,
    autoHint,
    setAutoHint,
    solverTarget,
}) => {
    return (
        <div className="bg-card/30 backdrop-blur-md p-4 sm:p-6 rounded-[2rem] shadow-2xl border border-white/20 w-full lg:w-auto flex flex-col items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-secondary-500/5 -z-10"></div>

            <div className="relative bg-gradient-to-b from-primary-600 to-primary-800 p-3 sm:p-4 rounded-2xl shadow-[0_20px_50px_-12px_rgba(59,130,246,0.5)] inline-block border-4 border-primary-700">
                {/* Board Feet/Stand */}
                <div className="absolute -bottom-6 -left-4 w-6 h-20 bg-primary-900 rounded-b-xl transform rotate-12 -z-10 border-2 border-primary-800"></div>
                <div className="absolute -bottom-6 -right-4 w-6 h-20 bg-primary-900 rounded-b-xl transform -rotate-12 -z-10 border-2 border-primary-800"></div>

                {/* Column Hover Indicators */}
                <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-2">
                    {Array(COLS)
                        .fill(null)
                        .map((_, colIndex) => {
                            const nextRow = getNextOpenRow(board, colIndex);
                            const isPlayable = nextRow !== -1 && !winner;
                            const isBestMove = bestMove?.column === colIndex;

                            return (
                                <div
                                    key={`indicator-${colIndex}`}
                                    className={`h-8 w-8 mx-auto rounded-full flex items-center justify-center text-sm font-bold transition-all transform duration-200 ${isPlayable
                                        ? hoveredColumn === colIndex
                                            ? currentPlayer === PLAYER_1
                                                ? 'bg-red-500 text-white scale-110 shadow-lg ring-2 ring-red-300'
                                                : 'bg-yellow-400 text-white scale-110 shadow-lg ring-2 ring-yellow-200'
                                            : isBestMove
                                                ? 'bg-secondary-500 text-white animate-pulse-short scale-110 shadow-lg ring-2 ring-secondary-300'
                                                : 'bg-primary-100/20 text-transparent hover:bg-primary-100/40'
                                        : 'opacity-0 cursor-not-allowed'
                                        }`}
                                    data-analytics-click="connect4-column-indicator"
                                    data-analytics-label={`Connect4 column ${colIndex + 1}`}
                                    onMouseEnter={() => isPlayable && setHoveredColumn(colIndex)}
                                    onMouseLeave={() => setHoveredColumn(null)}
                                    onClick={() => isPlayable && onColumnClick(colIndex)}
                                >
                                    {colIndex + 1}
                                </div>
                            );
                        })}
                </div>

                {/* Game Board Grid */}
                <div className="grid grid-cols-7 gap-2 sm:gap-3 relative bg-primary-800/50 p-2 sm:p-3 rounded-xl shadow-inner border border-primary-700/50">
                    {/* Full-height Clickable Column Overlays */}
                    {Array(COLS)
                        .fill(null)
                        .map((_, colIndex) => {
                            const nextRow = getNextOpenRow(board, colIndex);
                            const isPlayable = nextRow !== -1 && !winner;

                            return (
                                <div
                                    key={`col-overlay-${colIndex}`}
                                    className={`absolute top-0 bottom-0 z-20 ${isPlayable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                    data-analytics-click="connect4-column"
                                    data-analytics-label={`Connect4 column ${colIndex + 1}`}
                                    style={{
                                        left: `calc(${colIndex} * (100% / 7))`,
                                        width: 'calc(100% / 7)',
                                    }}
                                    onMouseEnter={() => isPlayable && setHoveredColumn(colIndex)}
                                    onMouseLeave={() => setHoveredColumn(null)}
                                    onClick={() => isPlayable && onColumnClick(colIndex)}
                                />
                            );
                        })}

                    {/* Board Cells */}
                    {board.map((row, rowIndex) =>
                        row.map((cell, colIndex) => {
                            const nextRow = getNextOpenRow(board, colIndex);
                            const isHoverPreview = hoveredColumn === colIndex && rowIndex === nextRow && !winner;
                            const isBestMovePosition = bestMove?.column === colIndex && rowIndex === nextRow;

                            return (
                                <div
                                    key={`${rowIndex}-${colIndex}`}
                                    className="w-9 h-9 sm:w-12 sm:h-12 rounded-full relative flex items-center justify-center"
                                >
                                    {/* The Hole Background */}
                                    <div className="absolute inset-0 bg-primary-950/60 rounded-full shadow-[inset_0_3px_6px_rgba(0,0,0,0.4)] border border-primary-900/50"></div>

                                    {/* The Piece */}
                                    <div
                                        className={`w-full h-full rounded-full shadow-[inset_0_-4px_4px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.3)] transition-all duration-500 ${cell === EMPTY
                                            ? 'bg-transparent'
                                            : cell === PLAYER_1
                                                ? 'bg-gradient-to-br from-red-400 via-red-500 to-red-700 animate-drop'
                                                : 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 animate-drop'
                                            }`}
                                    >
                                        {/* Inner detail for realistic look */}
                                        {cell !== EMPTY && (
                                            <div className="absolute inset-2 rounded-full border-2 border-white/20"></div>
                                        )}
                                    </div>

                                    {/* Hover Preview */}
                                    {isHoverPreview && (
                                        <div
                                            className={`absolute inset-0 rounded-full opacity-40 ${currentPlayer === PLAYER_1 ? 'bg-red-500' : 'bg-yellow-400'
                                                }`}
                                        ></div>
                                    )}

                                    {/* Best Move Highlight */}
                                    {isBestMovePosition && !isHoverPreview && (
                                        <div className="absolute inset-[-6px] border-4 border-secondary-400 rounded-full animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.6)] z-10 pointer-events-none"></div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Action Button & Suggestion Box */}
            <div className="mt-4 w-full max-w-md flex flex-col items-center gap-3 min-h-[180px]">
                <div className="w-full flex flex-col gap-3">
                    {!autoHint && (
                        <button
                            onClick={onCalculateBestMove}
                            disabled={!!winner || isCalculating}
                            className={`w-full h-12 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-secondary-500/30 flex items-center justify-center ${winner
                                ? 'bg-muted text-muted-foreground cursor-not-allowed shadow-none'
                                : 'bg-gradient-to-r from-secondary-500 to-secondary-600 text-white hover:from-secondary-400 hover:to-secondary-500 hover:shadow-secondary-500/25'
                                }`}
                        >
                            {isCalculating ? (
                                <span className="flex items-center justify-center gap-2">
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Calculating...
                                </span>
                            ) : (
                                <span><i className="fas fa-brain mr-2"></i> Calculate Best Move</span>
                            )}
                        </button>
                    )}

                    {/* Auto Hint Toggle (Mobile/Quick Access) */}
                    <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={autoHint}
                                onChange={(e) => setAutoHint(e.target.checked)}
                                className="w-5 h-5 rounded border-input text-secondary-600 focus:ring-secondary-500"
                            />
                            <span>Auto Hint</span>
                        </label>
                    </div>
                </div>

                <div className="w-full min-h-[110px]">
                    {bestMove && (
                        <div
                            className={`w-full bg-secondary-50/50 backdrop-blur-sm px-6 py-4 rounded-xl border border-secondary-200 text-center animate-fade-in-up ${autoHint ? 'opacity-90' : ''
                                }`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-secondary-700 text-xs font-bold uppercase tracking-widest">
                                    {autoHint ? 'Auto Suggestion' : 'Recommendation'}
                                </p>
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-background/80 px-2 py-0.5 rounded-full border border-border">
                                    Target: {solverTarget === 'current' ? 'Current' : solverTarget === PLAYER_1 ? 'Red' : 'Yellow'}
                                </span>
                            </div>
                            <div className="flex items-baseline justify-center gap-2">
                                <span className="text-slate-600 dark:text-slate-300 text-sm">Play Column</span>
                                <span className="text-3xl font-extrabold text-secondary-600">{bestMove.column + 1}</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Score: <span className={bestMove.score > 0 ? 'text-secondary-600 font-bold' : bestMove.score < 0 ? 'text-red-500 font-bold' : 'text-muted-foreground'}>
                                    {bestMove.score > 0 ? '+' : ''}{bestMove.score}
                                </span>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Board;
