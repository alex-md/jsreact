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
import Controls from './components/Controls';
import Board from './components/Board';
import HowToPlayModal from './components/HowToPlayModal';
import { CONNECT4_EVENTS, trackConnect4Event } from './utils/analytics';
import { DEFAULT_AI_STRENGTH } from './utils/aiStrength';
import type { AiStrength } from './utils/aiStrength';
import './App.css';

type HintTrigger = 'auto' | 'button' | 'keyboard';

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
    const [aiStrength, setAiStrength] = useLocalStorage<AiStrength>('connect4-aiStrength', DEFAULT_AI_STRENGTH);


    // UI State
    const [bestMove, setBestMove] = useState<{ column: number; score: number } | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
    const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
    const solverWorkerRef = useRef<Worker | null>(null);
    const solverRequestIdRef = useRef(0);
    const hintCacheRef = useRef(new Map<string, { column: number; score: number }>());
    const hintAnalyticsRef = useRef(new Map<number, {
        startedAt: number;
        trigger: HintTrigger;
        moveCount: number;
        targetPlayer: Player;
        aiStrength: AiStrength;
    }>());
    const firstMoveTrackedRef = useRef(false);
    const engagedGameTrackedRef = useRef(false);
    const gameNumberRef = useRef(1);

    const currentBoard = history[currentStep].board;
    const currentPlayer = history[currentStep].currentPlayer;
    const moveCount = currentStep;
    const canUndo = currentStep > 0;
    const canRedo = currentStep < history.length - 1;
    const checkWinner = useCallback((board: BoardType, player: Player) => {
        if (checkWin(board, player)) return player;
        return null;
    }, []);

    const handleColumnClick = useCallback((
        col: number,
        inputMethod: 'pointer' | 'keyboard' = 'pointer',
        keyboardMethod?: 'number' | 'arrow_enter'
    ) => {
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

        if (inputMethod === 'keyboard') {
            trackConnect4Event(CONNECT4_EVENTS.keyboardMove, {
                game_number: gameNumberRef.current,
                move_count: newHistory.length - 1,
                column: col + 1,
                navigation_method: keyboardMethod || 'number'
            });
        }

        if (!firstMoveTrackedRef.current) {
            trackConnect4Event(CONNECT4_EVENTS.firstMove, {
                game_number: gameNumberRef.current,
                column: col + 1,
                player: currentPlayer === PLAYER_1 ? 'red' : 'yellow',
                input_method: inputMethod,
                auto_hint_enabled: autoHint ? 1 : 0,
                ai_strength: aiStrength,
                jsreact_key_event: 1
            });
            firstMoveTrackedRef.current = true;
        }

        if (!engagedGameTrackedRef.current && newHistory.length - 1 >= 4) {
            trackConnect4Event(CONNECT4_EVENTS.engagedGame, {
                game_number: gameNumberRef.current,
                move_count: newHistory.length - 1,
                input_method: inputMethod,
                auto_hint_enabled: autoHint ? 1 : 0,
                ai_strength: aiStrength,
                jsreact_key_event: 1,
                value: 2
            });
            engagedGameTrackedRef.current = true;
        }

        const win = checkWinner(newBoard, currentPlayer);
        if (win) {
            setWinner(win);
            trackConnect4Event(CONNECT4_EVENTS.winnerReached, {
                game_number: gameNumberRef.current,
                winner: win === PLAYER_1 ? 'red' : 'yellow',
                move_count: newHistory.length - 1,
                winning_column: col + 1,
                input_method: inputMethod,
                jsreact_key_event: 1,
                value: 3
            });
        }
    }, [aiStrength, autoHint, checkWinner, currentBoard, currentPlayer, currentStep, history, winner]);

    const handleUndo = () => {
        if (currentStep > 0) {
            trackConnect4Event(CONNECT4_EVENTS.undo, {
                game_number: gameNumberRef.current,
                from_move_count: currentStep,
                to_move_count: currentStep - 1,
                had_winner: winner ? 1 : 0
            });
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
            trackConnect4Event(CONNECT4_EVENTS.redo, {
                game_number: gameNumberRef.current,
                from_move_count: currentStep,
                to_move_count: nextStep
            });
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
        if (winner) {
            trackConnect4Event(CONNECT4_EVENTS.newBoardAfterWin, {
                game_number: gameNumberRef.current,
                move_count: currentStep,
                winner: winner === PLAYER_1 ? 'red' : 'yellow',
                jsreact_key_event: 1,
                value: 2
            });
        }
        if (currentStep > 0) {
            trackConnect4Event(CONNECT4_EVENTS.reset, {
                game_number: gameNumberRef.current,
                move_count: currentStep,
                had_winner: winner ? 1 : 0
            });
        }
        setHistory([{ board: createBoard(), currentPlayer: PLAYER_1 }]);
        setCurrentStep(0);
        setWinner(null);
        solverRequestIdRef.current++;
        setIsCalculating(false);
        setHoveredColumn(null);
        setBestMove(null);
        firstMoveTrackedRef.current = false;
        engagedGameTrackedRef.current = false;
        gameNumberRef.current++;
    };

    useEffect(() => {
        const worker = new Worker(new URL('./solver.worker.ts', import.meta.url), { type: 'module' });
        solverWorkerRef.current = worker;

        worker.onmessage = (event: MessageEvent<{ id: number; move: { column: number; score: number }; cacheKey: string }>) => {
            hintCacheRef.current.set(event.data.cacheKey, event.data.move);
            const analytics = hintAnalyticsRef.current.get(event.data.id);
            hintAnalyticsRef.current.delete(event.data.id);
            if (event.data.id !== solverRequestIdRef.current) return;
            setBestMove(event.data.move);
            setIsCalculating(false);
            if (analytics) {
                trackConnect4Event(CONNECT4_EVENTS.hintCalculated, {
                    game_number: gameNumberRef.current,
                    trigger: analytics.trigger,
                    move_count: analytics.moveCount,
                    target_player: analytics.targetPlayer === PLAYER_1 ? 'red' : 'yellow',
                    ai_strength: analytics.aiStrength,
                    recommended_column: event.data.move.column + 1,
                    cache_hit: 0,
                    calculation_ms: Math.round(performance.now() - analytics.startedAt),
                    jsreact_key_event: analytics.trigger === 'button' || analytics.trigger === 'keyboard' ? 1 : 0
                });
            }
        };
        worker.onerror = () => {
            setIsCalculating(false);
            hintAnalyticsRef.current.clear();
        };

        return () => {
            worker.terminate();
            solverWorkerRef.current = null;
        };
    }, []);

    const calculateBestMove = useCallback((trigger: HintTrigger = 'button') => {
        if (winner || !solverWorkerRef.current) return;

        const targetPlayer = solverTarget === 'current' ? currentPlayer : solverTarget;
        const cacheKey = `${aiStrength}:${targetPlayer}:${currentBoard.flat().join('')}`;
        const useCache = aiStrength === 'expert' || aiStrength === 'master';
        const cachedMove = useCache ? hintCacheRef.current.get(cacheKey) : undefined;

        if (cachedMove) {
            setBestMove(cachedMove);
            setIsCalculating(false);
            if (trigger !== 'auto' || moveCount > 0) {
                trackConnect4Event(CONNECT4_EVENTS.hintCalculated, {
                    game_number: gameNumberRef.current,
                    trigger,
                    move_count: moveCount,
                    target_player: targetPlayer === PLAYER_1 ? 'red' : 'yellow',
                    ai_strength: aiStrength,
                    recommended_column: cachedMove.column + 1,
                    cache_hit: 1,
                    calculation_ms: 0,
                    jsreact_key_event: trigger === 'button' || trigger === 'keyboard' ? 1 : 0
                });
            }
            return;
        }

        const id = ++solverRequestIdRef.current;
        if (trigger !== 'auto' || moveCount > 0) {
            hintAnalyticsRef.current.set(id, {
                startedAt: performance.now(),
                trigger,
                moveCount,
                targetPlayer,
                aiStrength
            });
        }
        setIsCalculating(true);
        solverWorkerRef.current.postMessage({ id, board: currentBoard, player: targetPlayer, strength: aiStrength, cacheKey });
    }, [aiStrength, currentBoard, currentPlayer, moveCount, winner, solverTarget]);

    const handleAutoHintChange = (enabled: boolean) => {
        trackConnect4Event(CONNECT4_EVENTS.autoHintToggled, {
            game_number: gameNumberRef.current,
            enabled: enabled ? 1 : 0,
            move_count: moveCount,
            ai_strength: aiStrength
        });
        setAutoHint(enabled);
    };

    const handleSolverTargetChange = (target: 'current' | Player) => {
        if (target === solverTarget) return;
        trackConnect4Event(CONNECT4_EVENTS.solverTargetChanged, {
            game_number: gameNumberRef.current,
            move_count: moveCount,
            previous_target: solverTarget === 'current' ? 'current' : solverTarget === PLAYER_1 ? 'red' : 'yellow',
            target: target === 'current' ? 'current' : target === PLAYER_1 ? 'red' : 'yellow'
        });
        setSolverTarget(target);
    };

    const handleAiStrengthChange = (strength: AiStrength) => {
        if (strength === aiStrength) return;
        trackConnect4Event(CONNECT4_EVENTS.aiStrengthChanged, {
            game_number: gameNumberRef.current,
            move_count: moveCount,
            previous_strength: aiStrength,
            strength
        });
        solverRequestIdRef.current++;
        setIsCalculating(false);
        setBestMove(null);
        setAiStrength(strength);
    };

    const handleOpenHowToPlay = () => {
        trackConnect4Event(CONNECT4_EVENTS.helpOpened, {
            game_number: gameNumberRef.current,
            move_count: moveCount
        });
        setIsHowToPlayOpen(true);
    };

    const handleManualHint = () => {
        trackConnect4Event(CONNECT4_EVENTS.manualHintRequested, {
            game_number: gameNumberRef.current,
            move_count: moveCount,
            input_method: 'pointer',
            target: solverTarget === 'current' ? 'current' : solverTarget === PLAYER_1 ? 'red' : 'yellow',
            ai_strength: aiStrength,
            jsreact_key_event: 1
        });
        calculateBestMove('button');
    };

    // Auto Hint Effect
    useEffect(() => {
        if (autoHint && !winner) {
            calculateBestMove('auto');
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
                    trackConnect4Event(CONNECT4_EVENTS.manualHintRequested, {
                        game_number: gameNumberRef.current,
                        move_count: moveCount,
                        input_method: 'keyboard',
                        target: solverTarget === 'current' ? 'current' : solverTarget === PLAYER_1 ? 'red' : 'yellow',
                        ai_strength: aiStrength,
                        jsreact_key_event: 1
                    });
                    calculateBestMove('keyboard');
                }
                return;
            }

            if (/^[1-7]$/.test(event.key)) {
                event.preventDefault();
                handleColumnClick(Number(event.key) - 1, 'keyboard', 'number');
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
                handleColumnClick(hoveredColumn, 'keyboard', 'arrow_enter');
                return;
            }

            if (event.key === 'Escape') {
                setHoveredColumn(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [aiStrength, calculateBestMove, handleColumnClick, hoveredColumn, isCalculating, moveCount, solverTarget, winner, isHowToPlayOpen]);

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

    const trackStrategyLink = (destination: string, placement: string) => {
        trackConnect4Event(CONNECT4_EVENTS.strategyLinkOpened, {
            game_number: gameNumberRef.current,
            move_count: moveCount,
            destination,
            placement,
            jsreact_key_event: 1
        });
    };



    return (
        <div className="relative min-h-screen bg-background text-foreground font-sans selection:bg-primary-500 selection:text-white pb-6 overflow-hidden">
            <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-primary-500/10 blur-3xl"></div>
            <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-secondary-500/10 blur-3xl"></div>

            <div className="relative container mx-auto px-0 py-1 sm:px-2 sm:py-3 flex flex-col items-center max-w-7xl">

                <GameHeader
                    onOpenHowToPlay={handleOpenHowToPlay}
                />

                <div className="flex flex-col md:flex-row gap-4 lg:gap-8 items-start justify-center w-full max-w-6xl">
                    <div className="order-2 hidden w-full md:order-1 md:block md:w-auto">
                        <Controls
                            moveCount={moveCount}
                            solverTarget={solverTarget}
                            onSolverTargetChange={handleSolverTargetChange}
                            aiStrength={aiStrength}
                            onAiStrengthChange={handleAiStrengthChange}
                        />
                    </div>

                    <div className="order-1 w-full md:order-2 md:w-auto">
                        <Board
                            board={currentBoard}
                            currentPlayer={currentPlayer}
                            winner={winner}
                            hoveredColumn={hoveredColumn}
                            setHoveredColumn={setHoveredColumn}
                            onColumnClick={handleColumnClick}
                            bestMove={bestMove}
                            isCalculating={isCalculating}
                            onCalculateBestMove={handleManualHint}
                            onUndo={handleUndo}
                            onRedo={handleRedo}
                            onReset={handleReset}
                            canUndo={canUndo}
                            canRedo={canRedo}
                            canReset={currentStep > 0}
                            autoHint={autoHint}
                            setAutoHint={handleAutoHintChange}
                            solverTarget={solverTarget}
                            moveCount={moveCount}
                            onSolverTargetChange={handleSolverTargetChange}
                            aiStrength={aiStrength}
                            onAiStrengthChange={handleAiStrengthChange}
                        />
                    </div>
                </div>

                {(winner || bestMove) && (
                    <section aria-label="Next Connect 4 actions" className="mt-5 w-full max-w-4xl">
                        <div className="grid gap-3 rounded-2xl border border-border bg-card/85 p-4 shadow-sm sm:grid-cols-3">
                            <a
                                href="/connect4/strategy/"
                                onClick={() => trackStrategyLink('/connect4/strategy/', winner ? 'post_game' : 'hint_result')}
                                className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary-300 hover:text-primary-700"
                            >
                                <i className="fas fa-chess-board mr-2 text-primary-600"></i>
                                Study strategy
                            </a>
                            <a
                                href="/connect4/best-first-move/"
                                onClick={() => trackStrategyLink('/connect4/best-first-move/', winner ? 'post_game' : 'hint_result')}
                                className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary-300 hover:text-primary-700"
                            >
                                <i className="fas fa-bullseye mr-2 text-secondary-600"></i>
                                Best first move
                            </a>
                            <a
                                href="/connect4/solver-guide/"
                                onClick={() => trackStrategyLink('/connect4/solver-guide/', winner ? 'post_game' : 'hint_result')}
                                className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary-300 hover:text-primary-700"
                            >
                                <i className="fas fa-route mr-2 text-accent-600"></i>
                                Solver guide
                            </a>
                        </div>
                    </section>
                )}

                <section aria-labelledby="connect4-features-title" className="mt-10 w-full max-w-6xl">
                    <div className="mx-auto mb-5 max-w-3xl text-center">
                        <h1 id="connect4-features-title" className="connect4-seo-heading text-2xl font-heading font-bold sm:text-3xl">
                            Free Connect 4 Solver & Best Move Calculator
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Recreate any board, compare candidate moves, and see the strongest column for Red, Yellow, or whoever moves next.
                        </p>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-3">
                    <article className="rounded-2xl border border-border bg-card/90 p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary-500/10 text-primary-600 flex items-center justify-center">
                                <i className="fas fa-brain"></i>
                            </div>
                            <h2 className="text-lg font-bold text-foreground">Adjustable analysis engine</h2>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">
                            Choose Random, Casual, Human, Expert, or Master strength. Use quick hints for casual positions or deeper analysis when the board needs a longer lookahead.
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
                            Tap a column or press 1-7, then use Undo and Redo to compare alternative responses without rebuilding the position.
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
                            Practice center control, forced blocks, double threats, vertical setups, and diagonal traps with clear move feedback.
                        </p>
                    </article>
                    </div>
                </section>

                <section aria-labelledby="connect4-strategy-title" className="mt-8 w-full max-w-5xl">
                    <div className="grid gap-5 rounded-2xl border border-border bg-card/80 p-6 shadow-sm lg:grid-cols-[1.15fr_0.85fr]">
                        <div>
                            <h2 id="connect4-strategy-title" className="text-2xl font-heading font-bold text-foreground">
                                Turn solver traffic into stronger play
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                Most positions come down to center control, forced blocks, and avoiding moves that give the opponent an immediate fork. Use the calculator for the exact column, then compare the board against the strategy notes so the pattern is easier to recognize next time.
                            </p>
                        </div>
                        <div className="grid gap-2 text-sm">
                            <a href="/connect4/strategy/" onClick={() => trackStrategyLink('/connect4/strategy/', 'seo_section')} className="rounded-xl border border-border bg-background px-4 py-3 font-semibold text-foreground transition hover:border-primary-300 hover:text-primary-700">
                                Connect 4 strategy guide
                            </a>
                            <a href="/connect4/best-first-move/" onClick={() => trackStrategyLink('/connect4/best-first-move/', 'seo_section')} className="rounded-xl border border-border bg-background px-4 py-3 font-semibold text-foreground transition hover:border-primary-300 hover:text-primary-700">
                                Best first move in Connect 4
                            </a>
                            <a href="/connect4/solver-guide/" onClick={() => trackStrategyLink('/connect4/solver-guide/', 'seo_section')} className="rounded-xl border border-border bg-background px-4 py-3 font-semibold text-foreground transition hover:border-primary-300 hover:text-primary-700">
                                How the solver analyzes positions
                            </a>
                        </div>
                    </div>
                </section>

                <section aria-labelledby="connect4-faq-title" className="mt-8 w-full max-w-4xl rounded-2xl border border-border bg-card/80 p-6 shadow-sm">
                    <h2 id="connect4-faq-title" className="text-2xl font-heading font-bold text-foreground">
                        Connect 4 solver questions
                    </h2>
                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                        <article>
                            <h3 className="text-base font-bold text-foreground">How do I analyze a position?</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Enter the moves in order by selecting columns. Auto Hint highlights the best move after every turn so you can study the position as it changes.
                            </p>
                        </article>
                        <article>
                            <h3 className="text-base font-bold text-foreground">Can I solve for Red or Yellow?</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Yes. Choose Current, Red, or Yellow to analyze the board from the player you want to help.
                            </p>
                        </article>
                        <article>
                            <h3 className="text-base font-bold text-foreground">Can I adjust the AI difficulty?</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Yes. Pick Random, Casual, Human, Expert, or Master to control how far ahead the solver thinks and how consistently it chooses the top move.
                            </p>
                        </article>
                        <article>
                            <h3 className="text-base font-bold text-foreground">Is the Connect 4 solver free?</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Yes. It runs free in your browser and does not require an account.
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
