import { useState, useEffect, useCallback } from 'react';
import {
    createBoard,
    dropPiece,
    getNextOpenRow,
    checkWin,
    getBestMove,
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
    const [autoHint, setAutoHint] = useLocalStorage<boolean>('connect4-autoHint', false);
    const [solverTarget, setSolverTarget] = useLocalStorage<'current' | Player>('connect4-solverTarget', 'current');


    // UI State
    const [bestMove, setBestMove] = useState<{ column: number; score: number } | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
    const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);

    const currentBoard = history[currentStep].board;
    const currentPlayer = history[currentStep].currentPlayer;
    const moveCount = currentStep;



    const checkWinner = useCallback((board: BoardType, player: Player) => {
        if (checkWin(board, player)) return player;
        return null;
    }, []);

    const handleColumnClick = (col: number) => {
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
        setBestMove(null);

        const win = checkWinner(newBoard, currentPlayer);
        if (win) {
            setWinner(win);
        }
    };

    const handleUndo = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            setWinner(null);
            setBestMove(null);
        }
    };

    const handleRedo = () => {
        if (currentStep < history.length - 1) {
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
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
        setBestMove(null);
    };

    const calculateBestMove = useCallback(() => {
        if (winner) return;
        setIsCalculating(true);

        let targetPlayer = currentPlayer;
        if (solverTarget !== 'current') {
            targetPlayer = solverTarget;
        }

        setTimeout(() => {
            const move = getBestMove(currentBoard, targetPlayer);
            setBestMove(move);
            setIsCalculating(false);
        }, 50);
    }, [currentBoard, currentPlayer, winner, solverTarget]);

    // Auto Hint Effect
    useEffect(() => {
        if (autoHint && !winner && !isCalculating) {
            calculateBestMove();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentBoard, autoHint, solverTarget]);



    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary-500 selection:text-white pb-10">
            <div className="container mx-auto px-4 py-4 sm:py-6 flex flex-col items-center max-w-7xl">

                <GameHeader
                    onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
                />

                <GameStatus currentPlayer={currentPlayer} winner={winner} />

                <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full max-w-6xl">
                    {/* Left Control Panel (Desktop) */}
                    <div className="hidden lg:block">
                        <Controls
                            moveCount={moveCount}
                            currentStep={currentStep}
                            historyLength={history.length}
                            onUndo={handleUndo}
                            onRedo={handleRedo}
                            onReset={handleReset}
                            autoHint={autoHint}
                            setAutoHint={setAutoHint}
                            solverTarget={solverTarget}
                            setSolverTarget={setSolverTarget}
                        />
                    </div>

                    {/* Main Board Area */}
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
                        autoHint={autoHint}
                        setAutoHint={setAutoHint}
                        solverTarget={solverTarget}
                    />

                    {/* Mobile Controls (Below Board) */}
                    <div className="lg:hidden w-full">
                        <Controls
                            moveCount={moveCount}
                            currentStep={currentStep}
                            historyLength={history.length}
                            onUndo={handleUndo}
                            onRedo={handleRedo}
                            onReset={handleReset}
                            autoHint={autoHint}
                            setAutoHint={setAutoHint}
                            solverTarget={solverTarget}
                            setSolverTarget={setSolverTarget}
                        />
                    </div>
                </div>
            </div>

            <HowToPlayModal
                isOpen={isHowToPlayOpen}
                onClose={() => setIsHowToPlayOpen(false)}
            />
        </div>
    );
}

export default App;
