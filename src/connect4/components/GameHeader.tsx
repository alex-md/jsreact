import React from 'react';

interface GameHeaderProps {
    onOpenHowToPlay: () => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({
    onOpenHowToPlay
}) => {
    return (
        <header className="connect4-game-header mb-2 w-full max-w-4xl mx-auto relative sm:mb-3">
            <div className="flex w-full items-center justify-end">
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
