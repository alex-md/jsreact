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
    onUndo: () => void;
    onRedo: () => void;
    onReset: () => void;
    canUndo: boolean;
    canRedo: boolean;
    canReset: boolean;
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
    onUndo,
    onRedo,
    onReset,
    canUndo,
    canRedo,
    canReset,
    autoHint,
    setAutoHint,
    solverTarget,
}) => {
    return (
        <div className="connect4-board-card bg-card/30 backdrop-blur-md p-4 sm:p-5 rounded-[2rem] shadow-2xl border border-white/20 w-full lg:w-auto flex flex-col items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-secondary-500/5 -z-10"></div>

            <div className="relative bg-gradient-to-b from-primary-600 to-primary-800 p-3 rounded-2xl shadow-[0_20px_50px_-12px_rgba(59,130,246,0.5)] inline-block border-4 border-primary-700">
                {/* Board Feet/Stand */}
                <div className="absolute -bottom-6 -left-4 w-6 h-20 bg-primary-900 rounded-b-xl transform rotate-12 -z-10 border-2 border-primary-800"></div>
                <div className="absolute -bottom-6 -right-4 w-6 h-20 bg-primary-900 rounded-b-xl transform -rotate-12 -z-10 border-2 border-primary-800"></div>

                {/* Column Hover Indicators */}
                <div className="grid grid-cols-7 gap-2 sm:gap-2.5 mb-2" aria-hidden="true">
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
                                >
                                    {colIndex + 1}
                                </div>
                            );
                        })}
                </div>

                {/* Game Board Grid */}
                <div className="connect4-grid grid grid-cols-7 gap-2 sm:gap-2.5 relative bg-primary-800/50 p-2 sm:p-2.5 rounded-xl shadow-inner border border-primary-700/50">
                    {/* Full-height Clickable Column Overlays */}
                    {Array(COLS)
                        .fill(null)
                        .map((_, colIndex) => {
                            const nextRow = getNextOpenRow(board, colIndex);
                            const isPlayable = nextRow !== -1 && !winner;
                            const isBestMove = bestMove?.column === colIndex;

                            return (
                                <button
                                    type="button"
                                    key={`col-overlay-${colIndex}`}
                                    className={`connect4-column absolute top-0 bottom-0 z-20 rounded-lg transition-colors ${
                                        isBestMove
                                            ? 'connect4-column-recommended'
                                            : hoveredColumn === colIndex
                                                ? currentPlayer === PLAYER_1
                                                    ? 'connect4-column-red'
                                                    : 'connect4-column-yellow'
                                                : ''
                                    } ${isPlayable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                    data-analytics-click="connect4-column"
                                    data-analytics-label={`Connect4 column ${colIndex + 1}`}
                                    aria-label={`Drop ${currentPlayer === PLAYER_1 ? 'red' : 'yellow'} disc in column ${colIndex + 1}${isBestMove ? ', recommended' : ''}`}
                                    disabled={!isPlayable}
                                    style={{
                                        left: `calc(${colIndex} * (100% / 7))`,
                                        width: 'calc(100% / 7)',
                                    }}
                                    onMouseEnter={() => isPlayable && setHoveredColumn(colIndex)}
                                    onMouseLeave={() => setHoveredColumn(null)}
                                    onFocus={() => isPlayable && setHoveredColumn(colIndex)}
                                    onBlur={() => setHoveredColumn(null)}
                                    onClick={() => isPlayable && onColumnClick(colIndex)}
                                />
                            );
                        })}

                    {/* Board Cells */}
                    {board.map((row, rowIndex) =>
                        row.map((cell, colIndex) => {
                            const nextRow = getNextOpenRow(board, colIndex);
                            const isHoverPreview = hoveredColumn === colIndex && rowIndex === nextRow && !winner;
                            return (
                                <div
                                    key={`${rowIndex}-${colIndex}`}
                                    className="connect4-cell rounded-full relative flex items-center justify-center"
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

                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="mt-4 w-full max-w-md flex flex-col gap-2 sm:mt-5 sm:gap-3">
                <div className="grid grid-cols-[auto_auto_1fr_auto] gap-2 sm:gap-3">
                    <button onClick={onUndo} disabled={!canUndo} className="connect4-action-button" title="Undo move" aria-label="Undo move">
                        <i className="fas fa-undo"></i>
                    </button>
                    <button onClick={onRedo} disabled={!canRedo} className="connect4-action-button" title="Redo move" aria-label="Redo move">
                        <i className="fas fa-redo"></i>
                    </button>
                    <button
                        onClick={onCalculateBestMove}
                        disabled={!!winner || isCalculating}
                        className="h-11 rounded-xl bg-gradient-to-r from-secondary-600 to-secondary-700 px-3 font-bold text-white shadow-md transition hover:from-secondary-500 hover:to-secondary-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                            {isCalculating ? (
                                <span className="flex items-center justify-center gap-2">
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Thinking...
                                </span>
                            ) : (
                                <span><i className="fas fa-lightbulb mr-2"></i>{bestMove ? 'Refresh Hint' : 'Show Best Move'}</span>
                            )}
                    </button>
                    <button onClick={onReset} disabled={!canReset} className="connect4-action-button" title="Start a new board" aria-label="Start a new board">
                        <i className="fas fa-rotate-left"></i>
                    </button>
                </div>

                <div className="flex min-h-14 items-center justify-between gap-4 rounded-xl border border-border bg-card/80 px-4 py-3 text-sm shadow-sm" aria-live="polite">
                    <div className="min-w-0">
                        {bestMove ? (
                            <p className="truncate text-foreground">
                                <span className="font-semibold text-secondary-700">Recommended:</span> column <strong>{bestMove.column + 1}</strong>
                                <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">
                                    for {solverTarget === 'current' ? 'current player' : solverTarget === PLAYER_1 ? 'Red' : 'Yellow'}
                                </span>
                            </p>
                        ) : (
                            <p className="truncate text-muted-foreground">Choose a column, or press 1–7 on your keyboard.</p>
                        )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <span className="hidden text-xs font-semibold text-muted-foreground sm:inline">Auto hints</span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={autoHint}
                            aria-label={`Auto hints ${autoHint ? 'on' : 'off'}`}
                            onClick={() => setAutoHint(!autoHint)}
                            className={`connect4-auto-switch ${autoHint ? 'is-on' : 'is-off'}`}
                        >
                            <span className="connect4-switch-label connect4-switch-off">OFF</span>
                            <span className="connect4-switch-label connect4-switch-on">ON</span>
                            <span className="connect4-switch-thumb" aria-hidden="true"></span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Board;
