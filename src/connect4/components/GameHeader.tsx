import React from 'react';

interface GameHeaderProps {
    onOpenHowToPlay: () => void;

}

const GameHeader: React.FC<GameHeaderProps> = ({ onOpenHowToPlay }) => {
    return (
        <header className="mb-4 text-center w-full max-w-4xl mx-auto relative">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-3xl md:text-4xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-secondary-500">
                    Connect 4
                </h1>
                <button
                    onClick={onOpenHowToPlay}
                    className="p-2 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground"
                    aria-label="How to play"
                    title="How to play"
                >
                    <i className="fas fa-question-circle text-xl"></i>
                </button>
            </div>

            <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
                <div className="bg-card/50 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-sm border border-border flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
                    <span>Tap column to drop</span>
                </div>
            </div>
        </header>
    );
};

export default GameHeader;
