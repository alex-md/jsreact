import type { AiStrength } from './aiStrength';

export type Player = 1 | 2;
export type Board = number[][];
export interface MoveSuggestion {
    column: number;
    score: number;
}

export interface MoveSuggestionResult {
    move: MoveSuggestion;
    suggestions: MoveSuggestion[];
}

export const ROWS = 6;
export const COLS = 7;
export const EMPTY = 0;
export const PLAYER_1 = 1; // Red
export const PLAYER_2 = 2; // Yellow

// --- Standard Game Logic (Kept for API Compatibility) ---

export function createBoard(): Board {
    return Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));
}

export function copyBoard(board: Board): Board {
    return board.map(row => [...row]);
}

export function isValidLocation(board: Board, col: number): boolean {
    return col >= 0 && col < COLS && board[0][col] === EMPTY;
}

export function getNextOpenRow(board: Board, col: number): number {
    for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r][col] === EMPTY) return r;
    }
    return -1;
}

export function dropPiece(board: Board, row: number, col: number, piece: Player): void {
    board[row][col] = piece;
}

export function checkWin(board: Board, piece: Player): boolean {
    // Horizontal
    for (let c = 0; c < COLS - 3; c++) {
        for (let r = 0; r < ROWS; r++) {
            if (
                board[r][c] === piece &&
                board[r][c + 1] === piece &&
                board[r][c + 2] === piece &&
                board[r][c + 3] === piece
            ) return true;
        }
    }

    // Vertical
    for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS - 3; r++) {
            if (
                board[r][c] === piece &&
                board[r + 1][c] === piece &&
                board[r + 2][c] === piece &&
                board[r + 3][c] === piece
            ) return true;
        }
    }

    // Positive diagonal
    for (let c = 0; c < COLS - 3; c++) {
        for (let r = 0; r < ROWS - 3; r++) {
            if (
                board[r][c] === piece &&
                board[r + 1][c + 1] === piece &&
                board[r + 2][c + 2] === piece &&
                board[r + 3][c + 3] === piece
            ) return true;
        }
    }

    // Negative diagonal
    for (let c = 0; c < COLS - 3; c++) {
        for (let r = 3; r < ROWS; r++) {
            if (
                board[r][c] === piece &&
                board[r - 1][c + 1] === piece &&
                board[r - 2][c + 2] === piece &&
                board[r - 3][c + 3] === piece
            ) return true;
        }
    }

    return false;
}

export function getWinningCells(board: Board, piece: Player): Array<[number, number]> {
    const directions: Array<[number, number]> = [[0, 1], [1, 0], [1, 1], [-1, 1]];

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col] !== piece) continue;

            for (const [rowStep, colStep] of directions) {
                const cells = Array.from({ length: 4 }, (_, index) => [
                    row + rowStep * index,
                    col + colStep * index,
                ] as [number, number]);
                if (cells.every(([r, c]) => r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === piece)) {
                    return cells;
                }
            }
        }
    }

    return [];
}

// --- OPTIMIZED ENGINE ---

interface TTEntry {
    depth: number;
    score: number;
    bestMove: number;
    flag: 0 | 1 | 2; // EXACT=0, LOWER=1, UPPER=2
}

interface DifficultyConfig {
    depth: number;
    nearBestWindow: number;
    candidateLimit?: number;
}

const DIFFICULTY_CONFIG: Partial<Record<AiStrength, DifficultyConfig>> = {
    casual: { depth: 3, nearBestWindow: 110, candidateLimit: 3 },
    human: { depth: 4, nearBestWindow: 28, candidateLimit: 4 },
    expert: { depth: 9, nearBestWindow: 0 },
};

export interface SolverOptions {
    /** Stable identity supplied by the UI so Human keeps one profile per game. */
    variationSeed?: number;
    /** Optional override for callers that need a different Master proof budget. */
    masterTimeLimitMs?: number;
}

interface HumanProfile {
    depth: number;
    candidateLimit: number;
    nearBestWindow: number;
    secondChoiceThreshold: number;
    thirdChoiceThreshold: number;
}

interface SearchPolicy {
    candidateLimit?: number;
}

class Connect4Engine {
    // 7 bits per column, with 1 sentinel bit on top => classic 7x6 bitboard layout
    // bit index = col * 7 + rowFromBottom
    // rowFromBottom: 0..5 playable, 6 sentinel
    private currentPosition: bigint = 0n; // current player's stones
    private mask: bigint = 0n;            // all stones
    private movesPlayed = 0;

    private readonly tt = new Map<bigint, TTEntry>();
    private readonly options: SolverOptions;
    private searchDeadline = Infinity;
    private searchNodes = 0;

    private static readonly COL_ORDER = [3, 2, 4, 1, 5, 0, 6];
    private static readonly MAX_SCORE = 10_000_000;
    private static readonly WIN_SCORE = 1_000_000;
    private static readonly MATE_THRESHOLD = Connect4Engine.WIN_SCORE - (ROWS * COLS);
    private static readonly DRAW_SCORE = 0;
    private static readonly MAX_TRANSPOSITION_ENTRIES = 250_000;
    private static readonly MASTER_PROOF_TIME_MS = 900;
    private static readonly MASTER_FALLBACK_TIME_MS = 350;
    private static readonly SEARCH_ABORTED = Symbol('connect4-search-aborted');

    private static readonly BOTTOM_MASK = [
        1n << 0n,
        1n << 7n,
        1n << 14n,
        1n << 21n,
        1n << 28n,
        1n << 35n,
        1n << 42n
    ];

    private static readonly TOP_MASK = [
        1n << 5n,
        1n << 12n,
        1n << 19n,
        1n << 26n,
        1n << 33n,
        1n << 40n,
        1n << 47n
    ];

    private static readonly COLUMN_MASK = [
        ((1n << 6n) - 1n) << 0n,
        ((1n << 6n) - 1n) << 7n,
        ((1n << 6n) - 1n) << 14n,
        ((1n << 6n) - 1n) << 21n,
        ((1n << 6n) - 1n) << 28n,
        ((1n << 6n) - 1n) << 35n,
        ((1n << 6n) - 1n) << 42n
    ];

    constructor(board: Board, currentPlayer: Player, options: SolverOptions = {}) {
        this.options = options;
        this.loadBoard(board, currentPlayer);
    }

    private opponent(player: Player): Player {
        return player === PLAYER_1 ? PLAYER_2 : PLAYER_1;
    }

    private loadBoard(board: Board, currentPlayer: Player): void {
        let p1 = 0n;
        let p2 = 0n;
        let total = 0;

        for (let c = 0; c < COLS; c++) {
            for (let r = ROWS - 1; r >= 0; r--) {
                const cell = board[r][c];
                if (cell === EMPTY) continue;

                const rowFromBottom = ROWS - 1 - r;
                const bit = 1n << BigInt(c * 7 + rowFromBottom);

                if (cell === PLAYER_1) p1 |= bit;
                else p2 |= bit;
                total++;
            }
        }

        this.mask = p1 | p2;
        this.movesPlayed = total;

        // Internal convention:
        // currentPosition always stores the side-to-move stones.
        this.currentPosition = currentPlayer === PLAYER_1 ? p1 : p2;
    }

    private mirroredBits(bits: bigint): bigint {
        let mirrored = 0n;
        for (let col = 0; col < COLS; col++) {
            const column = (bits >> BigInt(col * 7)) & 0x7fn;
            mirrored |= column << BigInt((COLS - 1 - col) * 7);
        }
        return mirrored;
    }

    private transpositionKey(): { key: bigint; mirrored: boolean } {
        // Position and mask occupy disjoint 49-bit ranges, so this is a lossless
        // key rather than a practical/collision-prone hash. Canonicalizing a board
        // with its reflection lets both orientations share the same TT entry.
        const direct = this.currentPosition | (this.mask << 49n);
        const mirroredPosition = this.mirroredBits(this.currentPosition);
        const mirroredMask = this.mirroredBits(this.mask);
        const reflected = mirroredPosition | (mirroredMask << 49n);

        return reflected < direct
            ? { key: reflected, mirrored: true }
            : { key: direct, mirrored: false };
    }

    private beginTimedSearch(deadline: number): void {
        this.searchDeadline = deadline;
        this.searchNodes = 0;
    }

    private checkSearchDeadline(): void {
        // Checking every node is needlessly expensive with BigInt search. The
        // interval still keeps Master bounded to a small overshoot in its worker.
        if ((++this.searchNodes & 2047) === 0 && performance.now() >= this.searchDeadline) {
            throw Connect4Engine.SEARCH_ABORTED;
        }
    }

    private isSearchAborted(error: unknown): boolean {
        return error === Connect4Engine.SEARCH_ABORTED;
    }

    private canPlay(col: number): boolean {
        return (this.mask & Connect4Engine.TOP_MASK[col]) === 0n;
    }

    private playableMask(col: number): bigint {
        return (this.mask + Connect4Engine.BOTTOM_MASK[col]) & Connect4Engine.COLUMN_MASK[col];
    }

    private play(col: number): bigint {
        const move = this.playableMask(col);
        this.currentPosition ^= this.mask;
        this.mask |= move;
        this.movesPlayed++;
        return move;
    }

    private undo(move: bigint): void {
        this.movesPlayed--;
        this.mask ^= move;
        this.currentPosition ^= this.mask;
    }

    private hasWon(pos: bigint): boolean {
        let m = pos & (pos >> 1n);   // vertical
        if ((m & (m >> 2n)) !== 0n) return true;

        m = pos & (pos >> 7n);       // horizontal
        if ((m & (m >> 14n)) !== 0n) return true;

        m = pos & (pos >> 6n);       // diagonal \
        if ((m & (m >> 12n)) !== 0n) return true;

        m = pos & (pos >> 8n);       // diagonal /
        if ((m & (m >> 16n)) !== 0n) return true;

        return false;
    }

    private isWinningMove(col: number): boolean {
        if (!this.canPlay(col)) return false;
        const move = this.playableMask(col);
        return this.hasWon(this.currentPosition | move);
    }

    private getOpponentPosition(): bigint {
        return this.mask ^ this.currentPosition;
    }

    private countWinningMovesForCurrent(): number {
        let count = 0;
        for (const col of Connect4Engine.COL_ORDER) {
            if (this.canPlay(col) && this.isWinningMove(col)) count++;
        }
        return count;
    }

    private winningMovesForCurrent(): number[] {
        return Connect4Engine.COL_ORDER.filter((col) => this.canPlay(col) && this.isWinningMove(col));
    }

    private winningMovesForOpponent(): number[] {
        const savedPos = this.currentPosition;
        this.currentPosition = this.getOpponentPosition();
        const wins = this.winningMovesForCurrent();
        this.currentPosition = savedPos;
        return wins;
    }

    private countWinningMovesForOpponent(): number {
        const savedPos = this.currentPosition;
        this.currentPosition = this.getOpponentPosition();
        let count = 0;
        for (const col of Connect4Engine.COL_ORDER) {
            if (this.canPlay(col) && this.isWinningMove(col)) count++;
        }
        this.currentPosition = savedPos;
        return count;
    }

    private isDraw(): boolean {
        return this.movesPlayed >= 42;
    }

    private popcount(x: bigint): number {
        let n = x;
        let count = 0;
        while (n !== 0n) {
            n &= (n - 1n);
            count++;
        }
        return count;
    }

    /**
     * Cheap positional evaluation.
     * Not perfect, but intentionally fast:
     * - center control
     * - immediate threats
     * - potential alignments via bit tricks
     */
    private evaluate(): number {
        const me = this.currentPosition;
        const opp = this.getOpponentPosition();

        // Center preference
        const centerMask =
            (1n << 21n) | (1n << 22n) | (1n << 23n) | (1n << 24n) | (1n << 25n) | (1n << 26n);

        let score = 0;
        score += this.popcount(me & centerMask) * 12;
        score -= this.popcount(opp & centerMask) * 12;

        // Alignment potentials
        score += this.alignmentScore(me);
        score -= this.alignmentScore(opp);

        // Immediate tactical threats
        score += this.countWinningMovesForCurrent() * 300;
        score -= this.countWinningMovesForOpponent() * 340;

        return score;
    }

    private alignmentScore(pos: bigint): number {
        let score = 0;

        // Two-in-a-row and three-in-a-row style patterns, approximated via intersections
        let m = pos & (pos >> 1n);
        score += this.popcount(m) * 8;
        score += this.popcount(m & (m >> 1n)) * 40;

        m = pos & (pos >> 7n);
        score += this.popcount(m) * 10;
        score += this.popcount(m & (m >> 7n)) * 60;

        m = pos & (pos >> 6n);
        score += this.popcount(m) * 9;
        score += this.popcount(m & (m >> 6n)) * 55;

        m = pos & (pos >> 8n);
        score += this.popcount(m) * 9;
        score += this.popcount(m & (m >> 8n)) * 55;

        return score;
    }

    private applySearchPolicy(
        moves: number[],
        wins: number[],
        blocks: number[],
        forks: number[],
        safe: number[],
        risky: number[],
        policy?: SearchPolicy,
    ): number[] {
        if (!policy?.candidateLimit || moves.length <= policy.candidateLimit) return moves;

        // Human-style search keeps forcing moves, then only its most plausible
        // safe continuations. Risky support moves are considered only when there
        // is no safe alternative, which creates understandable blind spots on
        // deeper forks without overlooking one-ply tactics.
        const forcing = [...wins, ...blocks, ...forks];
        const remaining = Math.max(0, policy.candidateLimit - forcing.length);
        const plausible = safe.length > 0 ? safe : risky;
        return [...forcing, ...plausible.slice(0, remaining)];
    }

    private orderedMoves(ttBestMove: number = -1, policy?: SearchPolicy): number[] {
        const wins: number[] = [];
        const blocks: number[] = [];
        const forks: number[] = [];
        const safe: number[] = [];
        const risky: number[] = [];

        // Find opponent immediate wins before move
        const opponentWinsNow = new Set(this.winningMovesForOpponent());

        for (const col of Connect4Engine.COL_ORDER) {
            if (!this.canPlay(col)) continue;

            if (this.isWinningMove(col)) {
                wins.push(col);
                continue;
            }

            if (opponentWinsNow.has(col)) {
                blocks.push(col);
                continue;
            }

            const move = this.play(col);
            const oppCanWin = this.winningMovesForCurrent().length > 0;
            const savedPos = this.currentPosition;
            this.currentPosition = this.getOpponentPosition();
            const createsDoubleThreat = this.winningMovesForCurrent().length >= 2;
            this.currentPosition = savedPos;
            this.undo(move);

            if (oppCanWin) risky.push(col);
            else if (createsDoubleThreat) forks.push(col);
            else safe.push(col);
        }

        const merged = this.applySearchPolicy([...wins, ...blocks, ...forks, ...safe, ...risky], wins, blocks, forks, safe, risky, policy);
        return ttBestMove !== -1 && merged.includes(ttBestMove)
            ? [ttBestMove, ...merged.filter((col) => col !== ttBestMove)]
            : merged;
    }

    private nonLosingMoves(ttBestMove: number = -1): number[] {
        const safe: number[] = [];
        for (const col of Connect4Engine.COL_ORDER) {
            if (!this.canPlay(col)) continue;
            const move = this.play(col);
            const opponentCanWin = this.winningMovesForCurrent().length > 0;
            this.undo(move);
            if (!opponentCanWin) safe.push(col);
        }

        return ttBestMove !== -1 && safe.includes(ttBestMove)
            ? [ttBestMove, ...safe.filter((col) => col !== ttBestMove)]
            : safe;
    }

    private scoreAfterMove(score: number): number {
        if (score >= Connect4Engine.MATE_THRESHOLD) return score - 1;
        if (score <= -Connect4Engine.MATE_THRESHOLD) return score + 1;
        return score;
    }

    private negamax(depth: number, alpha: number, beta: number, policy?: SearchPolicy): number {
        this.checkSearchDeadline();
        const originalAlpha = alpha;
        const originalBeta = beta;
        const state = this.transpositionKey();
        const entry = this.tt.get(state.key);

        if (entry && entry.depth >= depth) {
            if (entry.flag === 0) return entry.score;
            if (entry.flag === 1) alpha = Math.max(alpha, entry.score);
            else beta = Math.min(beta, entry.score);
            if (alpha >= beta) return entry.score;
        }

        // If previous player just made a win, current side is lost
        if (this.hasWon(this.getOpponentPosition())) {
            return -Connect4Engine.WIN_SCORE;
        }

        if (this.isDraw()) return Connect4Engine.DRAW_SCORE;
        if (depth === 0) return this.evaluate();

        const ttBestMove = entry
            ? (state.mirrored ? COLS - 1 - entry.bestMove : entry.bestMove)
            : -1;
        const moves = this.orderedMoves(ttBestMove, policy);
        if (moves.length === 0) return Connect4Engine.DRAW_SCORE;

        // Fast tactical resolution
        if (this.isWinningMove(moves[0])) {
            return Connect4Engine.WIN_SCORE;
        }

        let bestScore = -Connect4Engine.MAX_SCORE;
        let bestMove = moves[0];

        for (const col of moves) {
            const move = this.play(col);
            const score = this.scoreAfterMove(-this.negamax(depth - 1, -beta, -alpha, policy));
            this.undo(move);

            if (score > bestScore) {
                bestScore = score;
                bestMove = col;
            }

            if (score > alpha) alpha = score;
            if (alpha >= beta) break;
        }

        let flag: 0 | 1 | 2 = 0;
        if (bestScore <= originalAlpha) flag = 2;
        else if (bestScore >= originalBeta) flag = 1;

        if (this.tt.size >= Connect4Engine.MAX_TRANSPOSITION_ENTRIES) this.tt.clear();
        this.tt.set(state.key, {
            depth,
            score: bestScore,
            bestMove: state.mirrored ? COLS - 1 - bestMove : bestMove,
            flag
        });

        return bestScore;
    }

    private exactNegamax(alpha: number, beta: number): number {
        this.checkSearchDeadline();

        if (this.hasWon(this.getOpponentPosition())) return -Connect4Engine.WIN_SCORE;
        if (this.isDraw()) return Connect4Engine.DRAW_SCORE;

        const remaining = 42 - this.movesPlayed;
        const originalAlpha = alpha;
        const originalBeta = beta;
        const state = this.transpositionKey();
        const entry = this.tt.get(state.key);

        // An exact entry uses the state's complete remaining horizon. Shallower
        // heuristic entries are intentionally ignored here.
        if (entry && entry.depth >= remaining) {
            if (entry.flag === 0) return entry.score;
            if (entry.flag === 1) alpha = Math.max(alpha, entry.score);
            else beta = Math.min(beta, entry.score);
            if (alpha >= beta) return entry.score;
        }

        const immediateWins = this.winningMovesForCurrent();
        if (immediateWins.length > 0) return Connect4Engine.WIN_SCORE;

        const ttBestMove = entry
            ? (state.mirrored ? COLS - 1 - entry.bestMove : entry.bestMove)
            : -1;
        const moves = this.nonLosingMoves(ttBestMove);

        // Every legal move lets the opponent win immediately. This is a proven
        // loss one opponent move away, not a heuristic evaluation.
        if (moves.length === 0) return -Connect4Engine.WIN_SCORE + 1;

        let bestScore = -Connect4Engine.MAX_SCORE;
        let bestMove = moves[0];
        for (const col of moves) {
            const move = this.play(col);
            let score: number;
            try {
                score = this.scoreAfterMove(-this.exactNegamax(-beta, -alpha));
            } finally {
                this.undo(move);
            }

            if (score > bestScore) {
                bestScore = score;
                bestMove = col;
            }
            if (score > alpha) alpha = score;
            if (alpha >= beta) break;
        }

        let flag: 0 | 1 | 2 = 0;
        if (bestScore <= originalAlpha) flag = 2;
        else if (bestScore >= originalBeta) flag = 1;

        if (this.tt.size >= Connect4Engine.MAX_TRANSPOSITION_ENTRIES) this.tt.clear();
        this.tt.set(state.key, {
            depth: remaining,
            score: bestScore,
            bestMove: state.mirrored ? COLS - 1 - bestMove : bestMove,
            flag,
        });

        return bestScore;
    }

    private humanProfile(): HumanProfile {
        const seed = Math.abs(this.options.variationSeed ?? Number(this.transpositionKey().key % 10_000n));
        return {
            // A player retains these traits through a game because they are derived
            // from gameId, not from the changing board position.
            depth: 4 + (seed % 3 === 0 ? 1 : 0),
            candidateLimit: 3 + (seed % 2),
            nearBestWindow: 20 + ((seed * 7) % 17),
            secondChoiceThreshold: 14 + ((seed * 11) % 11),
            thirdChoiceThreshold: 3 + ((seed * 5) % 5),
        };
    }

    private pickVariedMove(
        candidates: Array<{ col: number; score: number }>,
        strength: 'casual' | 'human',
        humanProfile?: HumanProfile,
    ): { col: number; score: number } {
        candidates.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            const centerDistance = Math.abs(3 - a.col) - Math.abs(3 - b.col);
            return centerDistance || a.col - b.col;
        });
        const best = candidates[0];

        if (!best) return { col: 3, score: 0 };

        // Never randomize forced wins/losses
        if (Math.abs(best.score) >= Connect4Engine.MATE_THRESHOLD) {
            return best;
        }

        const scoreWindow = humanProfile?.nearBestWindow ?? DIFFICULTY_CONFIG[strength]!.nearBestWindow;
        const near = candidates.filter(m => m.score >= best.score - scoreWindow);

        // Prefer center among close moves
        near.sort((a, b) => {
            const da = Math.abs(3 - a.col);
            const db = Math.abs(3 - b.col);
            if (da !== db) return da - db;
            return b.score - a.score;
        });

        // Stable, board-derived variation gives a game a consistent character and
        // makes repeated analysis reproducible. It is only applied to near-best,
        // non-forced moves; tactical wins and losses stay deterministic.
        const state = this.transpositionKey().key;
        const gameSeed = BigInt(Math.abs(this.options.variationSeed ?? 0));
        const roll = Number((state ^ (gameSeed * 0x9e3779b97f4a7c15n)) % 100n) / 100;
        if (strength === 'casual') {
            if (near.length >= 3 && roll < 0.22) return near[2];
            if (near.length >= 2 && roll < 0.58) return near[1];
        } else {
            const thirdThreshold = (humanProfile?.thirdChoiceThreshold ?? 4) / 100;
            const secondThreshold = (humanProfile?.secondChoiceThreshold ?? 18) / 100;
            if (near.length >= 3 && roll < thirdThreshold) return near[2];
            if (near.length >= 2 && roll < secondThreshold) return near[1];
        }
        return near[0];
    }

    private exactMasterCandidates(rootMoves: number[], remaining: number): Array<{ col: number; score: number }> | null {
        const proofBudget = this.options.masterTimeLimitMs ?? Connect4Engine.MASTER_PROOF_TIME_MS;
        this.beginTimedSearch(remaining <= 14 ? Infinity : performance.now() + proofBudget);
        const proven: Array<{ col: number; score: number }> = [];

        try {
            for (const col of rootMoves) {
                const move = this.play(col);
                try {
                    proven.push({ col, score: this.scoreAfterMove(-this.exactNegamax(-Connect4Engine.MAX_SCORE, Connect4Engine.MAX_SCORE)) });
                } finally {
                    this.undo(move);
                }
            }
            return proven;
        } catch (error) {
            if (!this.isSearchAborted(error)) throw error;

            // A proven win or draw is safer than an attractive but unproven static
            // score. Do not allow the later heuristic pass to override either.
            const wins = proven.filter((candidate) => candidate.score >= Connect4Engine.MATE_THRESHOLD);
            if (wins.length > 0) return wins;
            const draws = proven.filter((candidate) => candidate.score === Connect4Engine.DRAW_SCORE);
            return draws.length > 0 ? draws : null;
        }
    }

    private iterativeCandidates(
        rootMoves: number[],
        maxDepth: number,
        policy?: SearchPolicy,
        deadline: number = Infinity,
    ): Array<{ col: number; score: number }> {
        this.beginTimedSearch(deadline);
        let finalCandidates: Array<{ col: number; score: number }> = [];

        for (let depth = 1; depth <= maxDepth; depth++) {
            const candidates: Array<{ col: number; score: number }> = [];

            try {
                for (const col of rootMoves) {
                    const move = this.play(col);
                    try {
                        candidates.push({
                            col,
                            score: this.scoreAfterMove(-this.negamax(depth - 1, -Connect4Engine.MAX_SCORE, Connect4Engine.MAX_SCORE, policy)),
                        });
                    } finally {
                        this.undo(move);
                    }
                }
            } catch (error) {
                if (!this.isSearchAborted(error)) throw error;
                break;
            }

            finalCandidates = candidates;
            finalCandidates.sort((a, b) => b.score - a.score || Math.abs(3 - a.col) - Math.abs(3 - b.col));
            rootMoves = finalCandidates.map((candidate) => candidate.col);

            if (Math.abs(finalCandidates[0]?.score ?? 0) >= Connect4Engine.MATE_THRESHOLD) break;
        }

        return finalCandidates;
    }

    public suggest(strength: AiStrength = 'human'): MoveSuggestionResult {
        const remaining = 42 - this.movesPlayed;
        if (this.hasWon(this.currentPosition) || this.hasWon(this.getOpponentPosition()) || this.isDraw()) {
            const move = { column: -1, score: 0 };
            return { move, suggestions: [move] };
        }

        let rootMoves = this.orderedMoves();
        if (rootMoves.length === 0) {
            const move = { column: -1, score: 0 };
            return { move, suggestions: [move] };
        }

        if (strength === 'random') {
            const column = rootMoves[Math.floor(Math.random() * rootMoves.length)];
            return {
                move: { column, score: 0 },
                suggestions: rootMoves.map((col) => ({ column: col, score: 0 }))
            };
        }

        // Immediate tactical fast path
        for (const col of rootMoves) {
            if (this.isWinningMove(col)) {
                const suggestions = rootMoves
                    .filter((candidateCol) => this.isWinningMove(candidateCol))
                    .map((candidateCol) => ({ column: candidateCol, score: Connect4Engine.WIN_SCORE }));
                return {
                    move: suggestions[0],
                    suggestions
                };
            }
        }

        // No non-winning move can be correct while the opponent has one immediate
        // winning square. Restrict every non-random difficulty to the available
        // blocks so shallow search never turns a mandatory block into a heuristic
        // preference.
        const opponentWins = this.winningMovesForOpponent();
        const mandatoryBlocks = rootMoves.filter((col) => opponentWins.includes(col));
        if (mandatoryBlocks.length > 0) rootMoves = mandatoryBlocks;
        if (mandatoryBlocks.length === 1) {
            const move = { column: mandatoryBlocks[0], score: 0 };
            return { move, suggestions: [move] };
        }

        if (strength === 'master') {
            // Do not spend proof-search time on a move that immediately exposes a
            // win when at least one non-losing alternative exists. If every move
            // loses, keep all of them so exact search can maximize resistance.
            const nonLosing = this.nonLosingMoves();
            if (nonLosing.length > 0) rootMoves = nonLosing;
        }

        let finalCandidates: Array<{ col: number; score: number }>;
        let humanProfile: HumanProfile | undefined;

        if (strength === 'master') {
            const proven = this.exactMasterCandidates(rootMoves, remaining);
            if (proven) {
                finalCandidates = proven;
            } else {
                // The proof search was inconclusive within its worker budget. Use
                // every completed iterative-deepening layer available afterwards,
                // rather than reverting to a fixed arbitrary depth.
                finalCandidates = this.iterativeCandidates(
                    rootMoves,
                    remaining,
                    undefined,
                    performance.now() + Connect4Engine.MASTER_FALLBACK_TIME_MS,
                );
            }
        } else {
            let maxDepth = DIFFICULTY_CONFIG[strength]!.depth;
            let policy: SearchPolicy | undefined;

            if (strength === 'expert') {
                if (remaining <= 20) maxDepth = 10;
                if (remaining <= 14) maxDepth = 11;
                if (remaining <= 10) maxDepth = 12;
            } else if (strength === 'human') {
                humanProfile = this.humanProfile();
                maxDepth = humanProfile.depth;
                policy = { candidateLimit: humanProfile.candidateLimit };
                rootMoves = this.applySearchPolicy(rootMoves, [], [], [], rootMoves, [], policy);
            } else if (strength === 'casual') {
                policy = { candidateLimit: DIFFICULTY_CONFIG.casual!.candidateLimit };
                rootMoves = this.applySearchPolicy(rootMoves, [], [], [], rootMoves, [], policy);
            }

            finalCandidates = this.iterativeCandidates(rootMoves, maxDepth, policy);
        }

        if (finalCandidates.length === 0) {
            const move = { column: rootMoves[0], score: 0 };
            return { move, suggestions: [move] };
        }

        finalCandidates.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return Math.abs(3 - a.col) - Math.abs(3 - b.col);
        });

        const topScore = finalCandidates[0].score;
        const suggestions = finalCandidates
            .filter((candidate) => candidate.score === topScore)
            .map((candidate) => ({ column: candidate.col, score: candidate.score }));

        if (strength === 'casual' || strength === 'human') {
            const selected = this.pickVariedMove(finalCandidates, strength, humanProfile);
            const plausible = finalCandidates
                .filter((candidate) => candidate.score >= topScore - (humanProfile?.nearBestWindow ?? DIFFICULTY_CONFIG[strength]!.nearBestWindow))
                .map((candidate) => ({ column: candidate.col, score: candidate.score }));
            const move = { column: selected.col, score: selected.score };
            return {
                move,
                suggestions: [move, ...plausible.filter((candidate) => candidate.column !== move.column)],
            };
        }

        const move = suggestions[0] ?? { column: rootMoves[0], score: topScore };
        return { move, suggestions: suggestions.length > 0 ? suggestions : [move] };
    }

    public solve(strength: AiStrength = 'human'): MoveSuggestion {
        return this.suggest(strength).move;
    }
}

// --- PUBLIC API ---

export function minimax(
    board: Board,
    _depth: number, // Ignored, engine manages depth dynamically
    _alpha: number,
    _beta: number,
    _maximizingPlayer: boolean,
    currentPlayer: Player
): [number, number] {
    const engine = new Connect4Engine(board, currentPlayer);
    const result = engine.solve();

    // Preserve legacy score expectations
    let s = result.score;
    if (s >= Connect4Engine["WIN_SCORE"] - 1000) s = 10000000000000;
    else if (s <= -Connect4Engine["WIN_SCORE"] + 1000) s = -10000000000000;
    else s *= 100;

    return [result.column, s];
}

export function getBestMove(
    board: Board,
    currentPlayer: Player,
    strength: AiStrength = 'human',
    options: SolverOptions = {},
): MoveSuggestion {
    const engine = new Connect4Engine(board, currentPlayer, options);
    return engine.solve(strength);
}

export function getMoveSuggestions(
    board: Board,
    currentPlayer: Player,
    strength: AiStrength = 'human',
    options: SolverOptions = {},
): MoveSuggestionResult {
    const engine = new Connect4Engine(board, currentPlayer, options);
    return engine.suggest(strength);
}
