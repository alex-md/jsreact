import React from 'react';
import { Lightbulb, LoaderCircle, Redo2, RotateCcw, Undo2 } from 'lucide-react';
import { PLAYER_1, EMPTY, COLS, getNextOpenRow, getWinningCells } from '../utils/solver';
import type { Board as BoardType, MoveSuggestion, Player } from '../utils/solver';
import GameStatus from './GameStatus';
import SolverTargetPicker from './SolverTargetPicker';
import AiStrengthControl from './AiStrengthControl';
import type { AiStrength } from '../utils/aiStrength';
import type { Connect4Mode } from './SolverToolbar';

interface BoardProps {
    board: BoardType;
    lastMoveColumn: number | null;
    currentPlayer: Player;
    winner: Player | null;
    isDraw: boolean;
    hoveredColumn: number | null;
    setHoveredColumn: (col: number | null) => void;
    onColumnClick: (col: number, inputMethod?: 'pointer' | 'keyboard') => void;
    bestMove: { column: number; score: number } | null;
    moveEvaluations: MoveSuggestion[];
    canRequestNewSuggestion: boolean;
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
    moveCount: number;
    onSolverTargetChange: (value: 'current' | Player) => void;
    aiStrength: AiStrength;
    onAiStrengthChange: (value: AiStrength) => void;
    mode: Connect4Mode;
    isAiThinking: boolean;
}

const MATE_SCORE = 1_000_000;
const MATE_THRESHOLD = MATE_SCORE - 42;

function getMoveAnnotation(score: number) {
    if (Math.abs(score) >= MATE_THRESHOLD) {
        const result = score > 0 ? 'win' : 'loss';
        const turns = Math.max(1, MATE_SCORE - Math.abs(score) + 1);
        return { result, label: `${score > 0 ? '+' : '-'}${turns}`, exact: true };
    }
    return {
        result: 'estimate',
        label: '~',
        exact: false,
    };
}

const Board: React.FC<BoardProps> = ({
    board,
    lastMoveColumn,
    currentPlayer,
    winner,
    isDraw,
    hoveredColumn,
    setHoveredColumn,
    onColumnClick,
    bestMove,
    moveEvaluations,
    canRequestNewSuggestion,
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
    moveCount,
    onSolverTargetChange,
    aiStrength,
    onAiStrengthChange,
    mode,
    isAiThinking,
}) => {
    const canPlay = !winner && !isDraw && !(mode === 'practice' && (currentPlayer !== PLAYER_1 || isAiThinking));
    const winningCells = winner ? new Set(getWinningCells(board, winner).map(([row, col]) => `${row}-${col}`)) : new Set<string>();
    const evaluationsByColumn = new Map(moveEvaluations.map((evaluation) => [evaluation.column, evaluation]));
    const lastMoveRow = lastMoveColumn === null ? -1 : getNextOpenRow(board, lastMoveColumn) + 1;

    return (
        <div className="connect4-board-card bg-card/30 backdrop-blur-md p-4 sm:p-5 rounded-[2rem] shadow-2xl border border-border/20 w-full md:w-auto flex flex-col items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-secondary-500/5 -z-10"></div>

            <div className="connect4-inline-status mb-2 flex w-full max-w-md items-center justify-between gap-3 sm:mb-3">
                <GameStatus currentPlayer={currentPlayer} winner={winner} isDraw={isDraw} compact />
                <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                    Move <strong className="text-base text-primary">{moveCount}</strong>
                </span>
            </div>

            <div className="connect4-board-stage relative bg-gradient-to-b from-primary-600 to-primary-800 p-3 rounded-2xl shadow-[0_20px_50px_-12px_rgba(59,130,246,0.5)] inline-block border-4 border-primary-700">
                {/* Board Feet/Stand */}
                <div className="connect4-board-foot absolute -bottom-6 -left-4 w-6 h-20 bg-primary-900 rounded-b-xl transform rotate-12 -z-10 border-2 border-primary-800"></div>
                <div className="connect4-board-foot absolute -bottom-6 -right-4 w-6 h-20 bg-primary-900 rounded-b-xl transform -rotate-12 -z-10 border-2 border-primary-800"></div>

                {/* Solver results sit directly above their playable drop targets. */}
                <div className="connect4-evaluation-row grid grid-cols-7 gap-2 sm:gap-2.5 mb-2">
                    {Array(COLS)
                        .fill(null)
                        .map((_, colIndex) => {
                            const nextRow = getNextOpenRow(board, colIndex);
                            const isPlayable = nextRow !== -1 && canPlay;
                            const isBestMove = bestMove?.column === colIndex;
                            const evaluation = evaluationsByColumn.get(colIndex);
                            const annotation = evaluation ? getMoveAnnotation(evaluation.score) : null;

                            return (
                                <div
                                    key={`indicator-${colIndex}`}
                                    className={`connect4-evaluation ${annotation ? `is-${annotation.result}` : ''} ${isBestMove ? 'is-best' : ''} ${isPlayable ? '' : 'is-disabled'}`}
                                    title={annotation
                                        ? annotation.exact
                                            ? `${annotation.result === 'win' ? 'Win' : 'Loss'} in ${annotation.label.slice(1)} turns`
                                            : `Search estimate: ${evaluation!.score}; outcome unproven`
                                        : `Column ${colIndex + 1}`}
                                    aria-label={annotation
                                        ? `Column ${colIndex + 1}: ${annotation.result}, ${annotation.exact ? annotation.label : 'estimate'}`
                                        : `Column ${colIndex + 1}${isCalculating ? ": calculating" : ""}`}
                                >
                                    <span className="connect4-evaluation-score">
                                        {isCalculating && !annotation ? '··' : annotation?.label ?? colIndex + 1}
                                    </span>
                                    <span className="connect4-evaluation-column">{colIndex + 1}</span>
                                </div>
                            );
                        })}
                </div>

                {/* Game Board Grid */}
                <div role="group" aria-label="Connect 4 board, 7 columns and 6 rows" aria-describedby="connect4-board-instructions" className="connect4-grid grid grid-cols-7 gap-2 sm:gap-2.5 relative bg-primary-800/50 p-2 sm:p-2.5 rounded-xl shadow-inner border border-primary-700/50">
                    {/* Full-height Clickable Column Overlays */}
                    {Array(COLS)
                        .fill(null)
                        .map((_, colIndex) => {
                            const nextRow = getNextOpenRow(board, colIndex);
                            const isPlayable = nextRow !== -1 && canPlay;
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
                                    aria-describedby={`connect4-column-description-${colIndex}`}
                                    disabled={!isPlayable}
                                    style={{
                                        left: `calc(${colIndex} * (100% / 7))`,
                                        width: 'calc(100% / 7)',
                                    }}
                                    onMouseEnter={() => isPlayable && setHoveredColumn(colIndex)}
                                    onMouseLeave={() => setHoveredColumn(null)}
                                    onFocus={() => isPlayable && setHoveredColumn(colIndex)}
                                    onBlur={() => setHoveredColumn(null)}
                                    onClick={(event) => isPlayable && onColumnClick(colIndex, event.detail === 0 ? 'keyboard' : 'pointer')}
                                    onKeyDown={(event) => {
                                        if (event.repeat && (event.key === 'Enter' || event.code === 'Space')) {
                                            event.preventDefault();
                                        }
                                    }}
                                />
                            );
                        })}

                    {/* Board Cells */}
                    {board.map((row, rowIndex) =>
                        row.map((cell, colIndex) => {
                            const nextRow = getNextOpenRow(board, colIndex);
                            const isHoverPreview = hoveredColumn === colIndex && rowIndex === nextRow && canPlay;
                            const isWinningCell = winningCells.has(`${rowIndex}-${colIndex}`);
                            const isLastMove = colIndex === lastMoveColumn && rowIndex === lastMoveRow;
                            return (
                                <div
                                    key={`${rowIndex}-${colIndex}`}
                                    aria-hidden="true"
                                    className={`connect4-cell rounded-full relative flex items-center justify-center ${isWinningCell ? 'connect4-winning-cell' : ''}`}
                                >
                                    {/* The Hole Background */}
                                    <div className="connect4-hole absolute inset-0 bg-primary-950/60 rounded-full shadow-[inset_0_3px_6px_rgba(0,0,0,0.4)] border border-primary-900/50"></div>

                                    {/* The Piece */}
                                    <div
                                        className={`connect4-disc ${cell === EMPTY ? 'is-empty' : cell === PLAYER_1 ? 'is-red' : 'is-yellow'} w-full h-full rounded-full shadow-[inset_0_-4px_4px_rgba(0,0,0,0.2),0_4px_8px_rgba(0,0,0,0.3)] transition-transform duration-200 ${cell === EMPTY
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
                                    {isLastMove && <span className="connect4-last-move" />}
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

            <p id="connect4-board-instructions" className="sr-only">Choose a column to drop a disc. Column contents are described from bottom to top. Use keys 1 through 7, or Tab to a column and press Enter.</p>
            {Array.from({ length: COLS }, (_, col) => {
                const discs = board.map((row) => row[col]).reverse().filter((cell) => cell !== EMPTY);
                return <span key={col} id={`connect4-column-description-${col}`} className="sr-only">
                    {discs.length ? `Bottom to top: ${discs.map((cell) => cell === PLAYER_1 ? 'Red' : 'Yellow').join(', ')}. ${6 - discs.length} spaces available.` : 'Empty column. 6 spaces available.'}
                    {col === lastMoveColumn ? ' Last move was in this column.' : ''}
                </span>;
            })}

            <p className="connect4-move-caption text-xs text-muted-foreground mt-6" role="status">
                {lastMoveColumn === null ? 'Tap a column to start. Red plays first.' : `Move ${moveCount}: ${currentPlayer === PLAYER_1 ? 'Yellow' : 'Red'} played column ${lastMoveColumn + 1}.`}
            </p>

            <div className="connect4-board-controls mt-3 w-full max-w-md flex flex-col gap-2 sm:mt-4 sm:gap-3">
                <div className="connect4-action-row grid grid-cols-[auto_auto_1fr_auto] gap-2 sm:gap-3">
                    <button onClick={onUndo} disabled={!canUndo} className="connect4-action-button" title="Undo move" aria-label="Undo move">
                        <Undo2 aria-hidden="true" size={20} strokeWidth={2.5} />
                    </button>
                    <button onClick={onRedo} disabled={!canRedo} className="connect4-action-button" title="Redo move" aria-label="Redo move">
                        <Redo2 aria-hidden="true" size={20} strokeWidth={2.5} />
                    </button>
                    {mode === 'solver' ? (
                        <button
                            onClick={() => onCalculateBestMove()}
                            disabled={!!winner || isDraw || isCalculating || !canRequestNewSuggestion}
                            className="connect4-primary-action"
                        >
                            {isCalculating ? (
                                <span className="flex items-center justify-center gap-2">
                                    <LoaderCircle aria-hidden="true" className="animate-spin" size={18} />
                                    Thinking…
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <Lightbulb aria-hidden="true" size={18} />
                                    {bestMove ? (canRequestNewSuggestion ? 'New hint' : 'Best move found') : 'Find best move'}
                                </span>
                            )}
                        </button>
                    ) : (
                        <div className="connect4-ai-status" role="status" aria-live="polite">
                            {winner || isDraw
                                ? 'Game complete'
                                : isAiThinking
                                    ? <><LoaderCircle aria-hidden="true" className="animate-spin" size={17} /> AI is choosing…</>
                                    : currentPlayer === PLAYER_1
                                        ? 'Your move — play Red'
                                        : 'AI turn'}
                        </div>
                    )}
                    <button onClick={onReset} disabled={!canReset} className="connect4-action-button" title="Start a new board" aria-label="Start a new board">
                        <RotateCcw aria-hidden="true" size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {mode === 'solver' && (
                <div className="connect4-mobile-target rounded-xl border border-border bg-card/80 px-3 py-2 shadow-sm md:hidden">
                    <SolverTargetPicker
                        solverTarget={solverTarget}
                        onChange={onSolverTargetChange}
                        compact
                    />
                    <div className="mt-2 border-t border-border pt-2">
                        <AiStrengthControl
                            value={aiStrength}
                            onChange={onAiStrengthChange}
                            compact
                        />
                    </div>
                    <details className="connect4-mobile-guide">
                        <summary>What do the move labels mean?</summary>
                        <p><strong>+N</strong> is a proven win in N turns. <strong>−N</strong> is a proven loss. <strong>~</strong> is a search estimate. The outlined column is the recommended move.</p>
                    </details>
                </div>
                )}

                <div className="connect4-result-strip flex min-h-14 items-center justify-between gap-4 rounded-xl border border-border bg-card/80 px-4 py-3 text-sm shadow-sm">
                    <div className="connect4-result-copy min-w-0" role="status" aria-live="polite" aria-atomic="true">
                        {winner || isDraw ? (
                            <p className="text-foreground"><strong>{isDraw ? 'Draw.' : `${winner === PLAYER_1 ? 'Red' : 'Yellow'} wins.`}</strong> Start a new board to play again.</p>
                        ) : mode === 'practice' ? (
                            <p className="text-muted-foreground">
                                You are <strong className="text-red-600">Red</strong>. The AI replies automatically.
                            </p>
                        ) : bestMove ? (
                            <p className="text-foreground">
                                <span className="connect4-result-label">Recommended move</span><strong className="connect4-result-column">Column {bestMove.column + 1}</strong>
                                <span className="connect4-result-player">
                                    for {(solverTarget === 'current' ? currentPlayer : solverTarget) === PLAYER_1 ? 'Red' : 'Yellow'}
                                </span>
                            </p>
                        ) : (
                            <p className="truncate text-muted-foreground">Choose a column, or press 1–7 on your keyboard.</p>
                        )}
                    </div>
                    {mode === 'solver' && <div className="flex shrink-0 items-center gap-2">
                        <span className="connect4-auto-label text-xs font-semibold text-muted-foreground">Auto hints</span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={autoHint}
                            aria-label={`Auto hints ${autoHint ? 'on' : 'off'}`}
                            onClick={() => setAutoHint(!autoHint)}
                            className={`connect4-auto-switch ${autoHint ? 'is-on' : 'is-off'}`}
                        >
                            <span aria-hidden="true" className="connect4-switch-label connect4-switch-off">OFF</span>
                            <span aria-hidden="true" className="connect4-switch-label connect4-switch-on">ON</span>
                            <span className="connect4-switch-thumb" aria-hidden="true"></span>
                        </button>
                    </div>}
                </div>
            </div>
        </div>
    );
};

export default Board;
