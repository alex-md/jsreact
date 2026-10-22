import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface HowToPlayModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!isOpen || !dialog) return;
        const previousFocus = document.activeElement as HTMLElement | null;
        dialog.showModal();
        dialog.querySelector<HTMLButtonElement>('button')?.focus();
        return () => {
            dialog.close();
            previousFocus?.focus();
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <dialog
            ref={dialogRef}
            className="m-auto w-[calc(100%-2rem)] max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-0 text-foreground shadow-2xl backdrop:bg-background/60 backdrop:backdrop-blur-sm"
            aria-labelledby="modal-title"
            onCancel={(event) => { event.preventDefault(); onClose(); }}
            onKeyDown={(event) => {
                if (event.key !== 'Tab') return;
                const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button');
                const first = buttons[0];
                const last = buttons[buttons.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }}
        >
            <div
                className="bg-card dark:bg-card rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-border animate-scale-in"
            >
                <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-card z-10">
                    <h2 id="modal-title" className="text-2xl font-heading font-bold text-foreground">How to Use</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors"
                        aria-label="Close modal"
                    >
                        <X aria-hidden="true" size={20} />
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
                            <li><strong>Show Best Move:</strong> Press Space or click the button to see a recommended move at the selected strength.</li>
                            <li><strong>Auto Hint:</strong> Toggle this to automatically see the best move after every turn.</li>
                            <li><strong>Solver Target:</strong> Choose who the solver should help. "Current" helps whoever's turn it is.</li>
                            <li><strong>Undo/Redo:</strong> Step back and forward through the move timeline to explore lines.</li>
                            <li><strong>Practice vs AI:</strong> You play Red. The AI plays Yellow automatically. Undo and Redo include the AI reply when available.</li>
                            <li><strong>Move labels:</strong> + or − marks a proven win or loss. ~ means the outcome is still a search estimate.</li>
                            <li><strong>Master:</strong> Attempts to prove the outcome within a time budget, then uses deeper search if needed.</li>
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
        </dialog>
    );
};

export default HowToPlayModal;
