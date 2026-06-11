import { useState, useEffect, useCallback, useRef } from 'react';
import {
    createBoard,
    dropPiece,
    getNextOpenRow,
    checkWin,
    PLAYER_1,
    PLAYER_2,
    copyBoard,
} from './utils/solver';
import type { Board as BoardType, Player } from './utils/solver';
import useLocalStorage from './hooks/useLocalStorage';
import GameHeader from './components/GameHeader';
import GameStatus from './components/GameStatus';
import Controls from './components/Controls';
import Board from './components/Board';
import HowToPlayModal from './components/HowToPlayModal';
import './App.css';

function App() {
    // Game State
    const [history, setHistory] = useState<{ board: BoardType; currentPlayer: Player }[]>([
        { board: createBoard(), currentPlayer: PLAYER_1 },
    ]);
    const [currentStep, setCurrentStep] = useState(0);
    const [winner, setWinner] = useState<Player | null>(null);

    // Settings (Persisted)
    const [autoHint, setAutoHint] = useLocalStorage<boolean>('connect4-autoHint', true);
    const [solverTarget, setSolverTarget] = useLocalStorage<'current' | Player>('connect4-solverTarget', 'current');


    // UI State
    const [bestMove, setBestMove] = useState<{ column: number; score: number } | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
    const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
    const solverWorkerRef = useRef<Worker | null>(null);
    const solverRequestIdRef = useRef(0);
    const hintCacheRef = useRef(new Map<string, { column: number; score: number }>());

    const currentBoard = history[currentStep].board;
    const currentPlayer = history[currentStep].currentPlayer;
    const moveCount = currentStep;
    const canUndo = currentStep > 0;
    const canRedo = currentStep < history.length - 1;
    const checkWinner = useCallback((board: BoardType, player: Player) => {
        if (checkWin(board, player)) return player;
        return null;
    }, []);

    const handleColumnClick = useCallback((col: number) => {
        if (winner) return;

        const row = getNextOpenRow(currentBoard, col);
        if (row === -1) return; // Column full

        const newBoard = copyBoard(currentBoard);
        dropPiece(newBoard, row, col, currentPlayer);

        const nextPlayer = currentPlayer === PLAYER_1 ? PLAYER_2 : PLAYER_1;
        const newHistory = history.slice(0, currentStep + 1);

        newHistory.push({ board: newBoard, currentPlayer: nextPlayer });

        setHistory(newHistory);
        setCurrentStep(newHistory.length - 1);
        solverRequestIdRef.current++;
        setIsCalculating(false);
        setBestMove(null);

        const win = checkWinner(newBoard, currentPlayer);
        if (win) {
            setWinner(win);
        }
    }, [checkWinner, currentBoard, currentPlayer, currentStep, history, winner]);

    const handleUndo = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            setWinner(null);
            solverRequestIdRef.current++;
            setIsCalculating(false);
            setBestMove(null);
        }
    };

    const handleRedo = () => {
        if (currentStep < history.length - 1) {
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
            solverRequestIdRef.current++;
            setIsCalculating(false);
            setBestMove(null);

            const nextState = history[nextStep];
            const prevPlayer = nextState.currentPlayer === PLAYER_1 ? PLAYER_2 : PLAYER_1;
            const win = checkWinner(nextState.board, prevPlayer);
            if (win) setWinner(win);
        }
    };

    const handleReset = () => {
        setHistory([{ board: createBoard(), currentPlayer: PLAYER_1 }]);
        setCurrentStep(0);
        setWinner(null);
        solverRequestIdRef.current++;
        setIsCalculating(false);
        setHoveredColumn(null);
        setBestMove(null);
    };

    useEffect(() => {
        const worker = new Worker(new URL('./solver.worker.ts', import.meta.url), { type: 'module' });
        solverWorkerRef.current = worker;

        worker.onmessage = (event: MessageEvent<{ id: number; move: { column: number; score: number }; cacheKey: string }>) => {
            hintCacheRef.current.set(event.data.cacheKey, event.data.move);
            if (event.data.id !== solverRequestIdRef.current) return;
            setBestMove(event.data.move);
            setIsCalculating(false);
        };
        worker.onerror = () => {
            setIsCalculating(false);
        };

        return () => {
            worker.terminate();
            solverWorkerRef.current = null;
        };
    }, []);

    const calculateBestMove = useCallback(() => {
        if (winner || !solverWorkerRef.current) return;

        const targetPlayer = solverTarget === 'current' ? currentPlayer : solverTarget;
        const cacheKey = `${targetPlayer}:${currentBoard.flat().join('')}`;
        const cachedMove = hintCacheRef.current.get(cacheKey);

        if (cachedMove) {
            setBestMove(cachedMove);
            setIsCalculating(false);
            return;
        }

        const id = ++solverRequestIdRef.current;
        setIsCalculating(true);
        solverWorkerRef.current.postMessage({ id, board: currentBoard, player: targetPlayer, cacheKey });
    }, [currentBoard, currentPlayer, winner, solverTarget]);

    // Auto Hint Effect
    useEffect(() => {
        if (autoHint && !winner) {
            calculateBestMove();
        } else if (!autoHint) {
            solverRequestIdRef.current++;
            setIsCalculating(false);
        }
    }, [autoHint, calculateBestMove, winner]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isHowToPlayOpen) return;
            const target = event.target as HTMLElement | null;
            if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;

            if (event.code === 'Space') {
                event.preventDefault();
                if (!winner && !isCalculating) {
                    calculateBestMove();
                }
                return;
            }

            if (/^[1-7]$/.test(event.key)) {
                event.preventDefault();
                handleColumnClick(Number(event.key) - 1);
                return;
            }

            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault();
                const direction = event.key === 'ArrowLeft' ? -1 : 1;
                setHoveredColumn((column) => {
                    const start = column ?? 3;
                    return Math.min(6, Math.max(0, start + direction));
                });
                return;
            }

            if (event.key === 'Enter' && hoveredColumn !== null) {
                event.preventDefault();
                handleColumnClick(hoveredColumn);
                return;
            }

            if (event.key === 'Escape') {
                setHoveredColumn(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [calculateBestMove, handleColumnClick, hoveredColumn, isCalculating, winner, isHowToPlayOpen]);

    useEffect(() => {
        if (!isHowToPlayOpen) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsHowToPlayOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isHowToPlayOpen]);



    return (
        <div className="relative min-h-screen bg-background text-foreground font-sans selection:bg-primary-500 selection:text-white pb-6 overflow-hidden">
            <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-primary-500/10 blur-3xl"></div>
            <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-secondary-500/10 blur-3xl"></div>

            <div className="relative container mx-auto px-1 py-2 sm:px-2 sm:py-3 flex flex-col items-center max-w-7xl">

                <GameHeader
                    onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
                />

                <div className="mb-3 flex w-full justify-center sm:mb-4">
                    <GameStatus currentPlayer={currentPlayer} winner={winner} />
                </div>

                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start justify-center w-full max-w-6xl">
                    <div className="order-2 w-full lg:order-1 lg:w-auto">
                        <Controls
                            moveCount={moveCount}
                            solverTarget={solverTarget}
                            setSolverTarget={setSolverTarget}
                        />
                    </div>

                    <div className="order-1 w-full lg:order-2 lg:w-auto">
                        <Board
                            board={currentBoard}
                            currentPlayer={currentPlayer}
                            winner={winner}
                            hoveredColumn={hoveredColumn}
                            setHoveredColumn={setHoveredColumn}
                            onColumnClick={handleColumnClick}
                            bestMove={bestMove}
                            isCalculating={isCalculating}
                            onCalculateBestMove={calculateBestMove}
                            onUndo={handleUndo}
                            onRedo={handleRedo}
                            onReset={handleReset}
                            canUndo={canUndo}
                            canRedo={canRedo}
                            canReset={currentStep > 0}
                            autoHint={autoHint}
                            setAutoHint={setAutoHint}
                            solverTarget={solverTarget}
                        />
                    </div>
                </div>

                <section aria-labelledby="connect4-features-title" className="mt-10 w-full max-w-6xl">
                    <div className="mx-auto mb-5 max-w-3xl text-center">
                        <h2 id="connect4-features-title" className="text-2xl font-heading font-bold text-foreground">
                            Analyze Connect 4 positions in seconds
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Build the board one move at a time, compare ideas, and use the highlighted recommendation to find stronger tactical and strategic moves.
                        </p>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-3">
                    <article className="rounded-2xl border border-border bg-card/90 p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary-500/10 text-primary-600 flex items-center justify-center">
                                <i className="fas fa-brain"></i>
                            </div>
                            <h2 className="text-lg font-bold text-foreground">Perfect-play engine</h2>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">
                            The engine evaluates legal moves, immediate wins, forced blocks, center control, and future threats before recommending a column.
                        </p>
                    </article>
                    <article className="rounded-2xl border border-border bg-card/90 p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-secondary-500/10 text-secondary-600 flex items-center justify-center">
                                <i className="fas fa-bolt"></i>
                            </div>
                            <h2 className="text-lg font-bold text-foreground">Fast tactical checks</h2>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">
                            Tap a column or press 1–7, then use Undo and Redo to compare alternative responses without rebuilding the position.
                        </p>
                    </article>
                    <article className="rounded-2xl border border-border bg-card/90 p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-accent-500/10 text-accent-600 flex items-center justify-center">
                                <i className="fas fa-lightbulb"></i>
                            </div>
                            <h2 className="text-lg font-bold text-foreground">Strategy refresher</h2>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">
                            Use the solver to practice center control, forced blocks, double threats, vertical setups, and diagonal traps.
                        </p>
                    </article>
                    </div>
                </section>

                <section aria-labelledby="connect4-faq-title" className="mt-8 w-full max-w-4xl rounded-2xl border border-border bg-card/80 p-6 shadow-sm">
                    <h2 id="connect4-faq-title" className="text-2xl font-heading font-bold text-foreground">
                        Connect 4 solver questions
                    </h2>
                    <div className="mt-5 grid gap-5 md:grid-cols-3">
                        <article>
                            <h3 className="text-base font-bold text-foreground">How do I analyze a position?</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Enter the moves in order by selecting columns. Auto Hint highlights the recommended column after every turn.
                            </p>
                        </article>
                        <article>
                            <h3 className="text-base font-bold text-foreground">Can I solve for Red or Yellow?</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Yes. Choose Current, Red, or Yellow to analyze the board from the player you want to help.
                            </p>
                        </article>
                        <article>
                            <h3 className="text-base font-bold text-foreground">Is it free to use?</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Yes. The Connect 4 solver is free, works in your browser, and does not require an account.
                            </p>
                        </article>
                    </div>
                </section>
            </div>

            <HowToPlayModal
                isOpen={isHowToPlayOpen}
                onClose={() => setIsHowToPlayOpen(false)}
            />
        </div>
    );
}

export default App;
