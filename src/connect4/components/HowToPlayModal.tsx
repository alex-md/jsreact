import React from 'react';

interface HowToPlayModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm animate-fade-in">
            <div
                className="bg-card dark:bg-card rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-border animate-scale-in"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
            >
                <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-card z-10">
                    <h2 id="modal-title" className="text-2xl font-heading font-bold text-foreground">How to Use</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors"
                        aria-label="Close modal"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="p-6 space-y-6 text-muted-foreground">
                    <section>
                        <h3 className="text-lg font-semibold text-primary-600 mb-2">Game Rules</h3>
                        <p>Connect 4 is a two-player strategy game. Players take turns dropping colored discs into a seven-column, six-row vertically suspended grid. The pieces fall straight down, occupying the lowest available space within the column.</p>
                        <p className="mt-2 font-medium">The objective is to be the first to form a horizontal, vertical, or diagonal line of four of one's own discs.</p>
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold text-primary-600 mb-2">Using the Solver</h3>
                        <p>This app includes a powerful solver to help you analyze positions and find the best moves.</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>Calculate Best Move:</strong> Press Space or click the button to see the optimal move for the current player.</li>
                            <li><strong>Auto Hint:</strong> Toggle this to automatically see the best move after every turn.</li>
                            <li><strong>Solver Target:</strong> Choose who the solver should help. "Current" helps whoever's turn it is.</li>
                            <li><strong>Undo/Redo:</strong> Step back and forward through the move timeline to explore lines.</li>
                            <li><strong>Quick exit:</strong> Press Escape to close this panel.</li>
                        </ul>
                    </section>


                </div>

                <div className="p-6 border-t border-border bg-muted/30 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-colors"
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HowToPlayModal;
