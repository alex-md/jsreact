import React from 'react';

interface GameHeaderProps {
    onOpenHowToPlay: () => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({
    onOpenHowToPlay
}) => {
    return (
        <header className="connect4-game-header mb-2 w-full max-w-4xl mx-auto relative sm:mb-3">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="truncate text-xl sm:text-3xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-secondary-500">
                        Free Connect 4 Solver & Best Move Calculator
                    </h1>
                    <p className="hidden text-sm text-muted-foreground max-w-md leading-5 md:block">
                        Analyze any position with automatic hints and adjustable AI strength, from human-like moves to deep master analysis.
                    </p>
                </div>
                <button
                    onClick={onOpenHowToPlay}
                    className="shrink-0 px-3 py-2 rounded-full border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition"
                    aria-label="How to play"
                    title="How to play"
                >
                    <i className="fas fa-question-circle mr-1"></i>
                    Help
                </button>
            </div>
        </header>
    );
};

export default GameHeader;
