import React from 'react';

interface GameHeaderProps {
    onOpenHowToPlay: () => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({
    onOpenHowToPlay
}) => {
    return (
        <header className="connect4-game-header mb-4 text-center w-full max-w-4xl mx-auto relative">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col items-center gap-1.5 text-center sm:items-start sm:text-left">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-secondary-500">
                        Free Connect 4 Solver
                    </h1>
                    <p className="hidden text-sm text-muted-foreground max-w-md leading-5 sm:block">
                        Analyze any position, find the best move instantly, and explore winning lines with automatic hints.
                    </p>
                </div>
                <div className="flex items-center justify-center gap-2 sm:justify-end">
                    <button
                        onClick={onOpenHowToPlay}
                        className="px-3 py-2 rounded-full border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition"
                        aria-label="How to play"
                        title="How to play"
                    >
                        <i className="fas fa-question-circle mr-1"></i>
                        Help
                    </button>
                </div>
            </div>

            <div className="mt-3 hidden md:flex justify-center text-sm text-muted-foreground">
                <div className="bg-card/50 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-sm border border-border flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
                    <span>Tap a column or press 1–7 to drop a disc</span>
                </div>
            </div>
        </header>
    );
};

export default GameHeader;
