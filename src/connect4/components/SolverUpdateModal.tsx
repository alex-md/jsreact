import { useEffect, useRef } from 'react';
import { CheckCircle2, FileText, X } from 'lucide-react';

interface SolverUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SolverUpdateModal: React.FC<SolverUpdateModalProps> = ({ isOpen, onClose }) => {
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        closeButtonRef.current?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm animate-fade-in">
            <div
                className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-xl animate-scale-in"
                role="dialog"
                aria-modal="true"
                aria-labelledby="solver-update-title"
                aria-describedby="solver-update-description"
            >
                <div className="flex items-start gap-3 border-b border-border px-5 py-4">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-600">
                        <FileText aria-hidden="true" size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
                            <span>Update log</span>
                            <span aria-hidden="true">·</span>
                            <span>July 2026</span>
                        </div>
                        <h2 id="solver-update-title" className="text-xl font-heading font-bold text-foreground">
                            Connect 4 solver update
                        </h2>
                    </div>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        aria-label="Close solver update"
                    >
                        <X aria-hidden="true" size={20} />
                    </button>
                </div>

                <div className="px-5 py-5">
                    <p id="solver-update-description" className="text-sm leading-6 text-muted-foreground">
                        The analysis engine has been updated.
                    </p>

                    <h3 className="mt-4 text-sm font-bold text-foreground">What changed</h3>
                    <ul className="mt-3 space-y-2.5 text-sm leading-5 text-muted-foreground">
                        <li className="flex gap-2.5">
                            <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-primary-600" size={16} />
                            <span><strong className="text-foreground">Stronger analysis:</strong> improved threat detection, move ordering, and deeper Expert searches.</span>
                        </li>
                        <li className="flex gap-2.5">
                            <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-primary-600" size={16} />
                            <span><strong className="text-foreground">More natural Human mode:</strong> a consistent playing style throughout each game, without missing immediate wins or blocks.</span>
                        </li>
                        <li className="flex gap-2.5">
                            <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-primary-600" size={16} />
                            <span><strong className="text-foreground">More capable Master mode:</strong> attempts to prove the position before using deep time-limited analysis.</span>
                        </li>
                    </ul>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-border bg-muted/30 px-5 py-3.5">
                    <span className="text-xs font-semibold text-muted-foreground">Shown once</span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary-300 hover:text-primary-700"
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SolverUpdateModal;
