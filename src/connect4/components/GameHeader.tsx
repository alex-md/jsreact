import React from 'react';

interface GameHeaderProps {
    onOpenHowToPlay: () => void;
    onReset: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    canReset: boolean;
    isAutoHintOn: boolean;
    onToggleAutoHint: () => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({
    onOpenHowToPlay,
    onReset,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    canReset,
    isAutoHintOn,
    onToggleAutoHint
}) => {
    return (
        <header className="mb-4 sm:mb-6 text-center w-full max-w-4xl mx-auto relative">
            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        <span className="hidden rounded-full border border-border bg-card/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Online Solver
                        </span>
                        <span className="hidden rounded-full border border-border bg-card/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            1 or 2 Players
                        </span>
                        <span className="hidden rounded-full border border-border bg-card/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Customizable Board
                        </span>
                        <span className="hidden rounded-full border border-border bg-card/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            AI Hints
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-secondary-500">
                        Connect 4 Solver
                    </h1>
                    <p className="text-sm text-muted-foreground max-w-md leading-5">
                        Analyze any Connect 4 board, get instant AI hints, and test winning lines for online or unblocked browser matches.
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

            <div className="mt-3 hidden sm:flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
                <div className="bg-card/50 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-sm border border-border flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
                    <span>Tap a column to drop a disc</span>
                </div>
                {isAutoHintOn ? (
                    <div 
                        onClick={onToggleAutoHint}
                        className="bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 text-primary-500 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-[0_0_15px_rgba(var(--primary),0.15)] flex items-center gap-2 cursor-pointer transition-all duration-300 transform hover:scale-105"
                        title="Turn Auto Hint Off"
                    >
                        <i className="fas fa-lightbulb text-primary-500 animate-pulse"></i>
                        <span className="font-semibold">Auto hint: ON</span>
                    </div>
                ) : (
                    <div 
                        onClick={onToggleAutoHint}
                        className="bg-card/50 hover:bg-card border border-border hover:border-primary-500/30 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-sm flex items-center gap-2 cursor-pointer transition-all duration-300"
                        title="Turn Auto Hint On"
                    >
                        <i className="fas fa-keyboard text-muted-foreground"></i>
                        <span className="transition-colors group-hover:text-foreground">Press Space for best move</span>
                    </div>
                )}
            </div>
        </header>
    );
};

export default GameHeader;
