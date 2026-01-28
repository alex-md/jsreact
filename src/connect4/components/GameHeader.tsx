import React from 'react';

interface GameHeaderProps {
    onOpenHowToPlay: () => void;
    onReset: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    canReset: boolean;
}

const GameHeader: React.FC<GameHeaderProps> = ({
    onOpenHowToPlay,
    onReset,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    canReset
}) => {
    return (
        <header className="mb-6 text-center w-full max-w-4xl mx-auto relative">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
                    <h1 className="text-3xl md:text-4xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-secondary-500">
                        Connect 4
                    </h1>
                    <p className="text-sm text-muted-foreground max-w-md">
                        Analyze any position, get instant solver hints, and practice perfect-play lines.
                    </p>
                </div>
                <div className="flex items-center justify-center gap-2 sm:justify-end">
                    <button
                        onClick={onUndo}
                        disabled={!canUndo}
                        className="px-3 py-2 rounded-full border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Undo move"
                    >
                        <i className="fas fa-undo mr-1"></i>
                        Undo
                    </button>
                    <button
                        onClick={onRedo}
                        disabled={!canRedo}
                        className="px-3 py-2 rounded-full border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Redo move"
                    >
                        <i className="fas fa-redo mr-1"></i>
                        Redo
                    </button>
                    <button
                        onClick={onReset}
                        disabled={!canReset}
                        className="px-3 py-2 rounded-full border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-destructive/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Reset board"
                    >
                        <i className="fas fa-rotate-left mr-1"></i>
                        New
                    </button>
                    <button
                        onClick={onOpenHowToPlay}
                        className="p-2 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground"
                        aria-label="How to play"
                        title="How to play"
                    >
                        <i className="fas fa-question-circle text-xl"></i>
                    </button>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
                <div className="bg-card/50 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-sm border border-border flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
                    <span>Tap a column to drop a disc</span>
                </div>
                <div className="bg-card/50 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-sm border border-border flex items-center gap-2">
                    <i className="fas fa-keyboard text-primary-500"></i>
                    <span>Press Space for best move</span>
                </div>
            </div>
        </header>
    );
};

export default GameHeader;
