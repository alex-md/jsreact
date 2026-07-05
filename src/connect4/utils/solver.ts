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

// --- OPTIMIZED ENGINE ---

interface TTEntry {
    depth: number;
    score: number;
    bestMove: number;
    flag: 0 | 1 | 2; // EXACT=0, LOWER=1, UPPER=2
}

class Connect4Engine {
    // 7 bits per column, with 1 sentinel bit on top => classic 7x6 bitboard layout
    // bit index = col * 7 + rowFromBottom
    // rowFromBottom: 0..5 playable, 6 sentinel
    private currentPosition: bigint = 0n; // current player's stones
    private mask: bigint = 0n;            // all stones
    private movesPlayed = 0;

    private readonly tt = new Map<bigint, TTEntry>();

    private static readonly COL_ORDER = [3, 2, 4, 1, 5, 0, 6];
    private static readonly MAX_SCORE = 10_000_000;
    private static readonly WIN_SCORE = 1_000_000;
    private static readonly DRAW_SCORE = 0;

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

    constructor(board: Board, currentPlayer: Player) {
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

    private key(): bigint {
        // collision-resistant enough for practical TT use here
        return this.currentPosition + this.mask * 65537n;
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

    private orderedMoves(ttBestMove: number = -1): number[] {
        const wins: number[] = [];
        const blocks: number[] = [];
        const safe: number[] = [];
        const risky: number[] = [];

        // Find opponent immediate wins before move
        const opponentWinsNow: boolean[] = Array(COLS).fill(false);
        const savedPos = this.currentPosition;
        this.currentPosition = this.getOpponentPosition();
        for (const col of Connect4Engine.COL_ORDER) {
            if (this.canPlay(col) && this.isWinningMove(col)) {
                opponentWinsNow[col] = true;
            }
        }
        this.currentPosition = savedPos;

        for (const col of Connect4Engine.COL_ORDER) {
            if (!this.canPlay(col)) continue;

            if (this.isWinningMove(col)) {
                wins.push(col);
                continue;
            }

            if (opponentWinsNow[col]) {
                blocks.push(col);
                continue;
            }

            const move = this.play(col);
            const oppCanWin = this.countWinningMovesForCurrent() > 0;
            this.undo(move);

            if (oppCanWin) risky.push(col);
            else safe.push(col);
        }

        const merged = [...wins, ...blocks, ...safe, ...risky];

        if (ttBestMove !== -1) {
            merged.sort((a, b) => {
                if (a === ttBestMove) return -1;
                if (b === ttBestMove) return 1;
                return 0;
            });
        }

        return merged;
    }

    private negamax(depth: number, alpha: number, beta: number, ply: number): number {
        const originalAlpha = alpha;
        const key = this.key();
        const entry = this.tt.get(key);

        if (entry && entry.depth >= depth) {
            if (entry.flag === 0) return entry.score;
            if (entry.flag === 1) alpha = Math.max(alpha, entry.score);
            else beta = Math.min(beta, entry.score);
            if (alpha >= beta) return entry.score;
        }

        // If previous player just made a win, current side is lost
        if (this.hasWon(this.getOpponentPosition())) {
            return -Connect4Engine.WIN_SCORE + ply;
        }

        if (this.isDraw()) return Connect4Engine.DRAW_SCORE;
        if (depth === 0) return this.evaluate();

        const moves = this.orderedMoves(entry?.bestMove ?? -1);
        if (moves.length === 0) return Connect4Engine.DRAW_SCORE;

        // Fast tactical resolution
        if (this.isWinningMove(moves[0])) {
            return Connect4Engine.WIN_SCORE - ply;
        }

        let bestScore = -Connect4Engine.MAX_SCORE;
        let bestMove = moves[0];

        for (const col of moves) {
            const move = this.play(col);
            const score = -this.negamax(depth - 1, -beta, -alpha, ply + 1);
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
        else if (bestScore >= beta) flag = 1;

        this.tt.set(key, {
            depth,
            score: bestScore,
            bestMove,
            flag
        });

        return bestScore;
    }

    private pickVariedMove(
        candidates: Array<{ col: number; score: number }>,
        strength: 'casual' | 'human'
    ): { col: number; score: number } {
        candidates.sort((a, b) => b.score - a.score);
        const best = candidates[0];

        if (!best) return { col: 3, score: 0 };

        // Never randomize forced wins/losses
        if (Math.abs(best.score) >= Connect4Engine.WIN_SCORE - 1000) {
            return best;
        }

        const scoreWindow = strength === 'casual' ? 90 : 24;
        const near = candidates.filter(m => m.score >= best.score - scoreWindow);

        // Prefer center among close moves
        near.sort((a, b) => {
            const da = Math.abs(3 - a.col);
            const db = Math.abs(3 - b.col);
            if (da !== db) return da - db;
            return b.score - a.score;
        });

        const roll = Math.random();
        if (strength === 'casual') {
            if (near.length >= 3 && roll > 0.72) return near[2];
            if (near.length >= 2 && roll > 0.42) return near[1];
        } else {
            if (near.length >= 3 && roll > 0.94) return near[2];
            if (near.length >= 2 && roll > 0.80) return near[1];
        }
        return near[0];
    }

    public suggest(strength: AiStrength = 'human'): MoveSuggestionResult {
        const remaining = 42 - this.movesPlayed;
        const rootMoves = this.orderedMoves();
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

        let maxDepth = strength === 'casual' ? 2 : strength === 'human' ? 5 : 9;
        if (strength === 'expert') {
            if (remaining <= 20) maxDepth = 10;
            if (remaining <= 14) maxDepth = 11;
            if (remaining <= 10) maxDepth = 12;
        } else if (strength === 'master') {
            maxDepth = remaining <= 12 ? remaining : 11;
        }

        const candidates: Array<{ col: number; score: number }> = [];
        let bestCol = rootMoves[0];
        let bestScore = -Connect4Engine.MAX_SCORE;
        let finalCandidates: Array<{ col: number; score: number }> = [];

        // Iterative deepening keeps move quality decent under shallower searches
        for (let depth = 1; depth <= maxDepth; depth++) {
            candidates.length = 0;
            let localBestCol = rootMoves[0];
            let localBestScore = -Connect4Engine.MAX_SCORE;

            for (const col of rootMoves) {
                const move = this.play(col);
                const score = -this.negamax(depth - 1, -Connect4Engine.MAX_SCORE, Connect4Engine.MAX_SCORE, 1);
                this.undo(move);

                candidates.push({ col, score });

                if (score > localBestScore) {
                    localBestScore = score;
                    localBestCol = col;
                }
            }

            bestCol = localBestCol;
            bestScore = localBestScore;
            finalCandidates = [...candidates];

            // Early exit on forced line
            if (Math.abs(bestScore) >= Connect4Engine.WIN_SCORE - 1000) break;

            // Reorder root moves for next iteration
            candidates.sort((a, b) => b.score - a.score);
            for (let i = 0; i < candidates.length; i++) {
                rootMoves[i] = candidates[i].col;
            }
        }

        finalCandidates.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return Math.abs(3 - a.col) - Math.abs(3 - b.col);
        });

        const topScore = finalCandidates[0]?.score ?? bestScore;
        const suggestions = finalCandidates
            .filter((candidate) => candidate.score === topScore)
            .map((candidate) => ({ column: candidate.col, score: candidate.score }));

        if (suggestions.length > 0) {
            return {
                move: suggestions[0],
                suggestions
            };
        }

        const move = {
            column: bestCol,
            score: bestScore
        };
        return {
            move,
            suggestions: [move]
        };
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
    strength: AiStrength = 'human'
): MoveSuggestion {
    const engine = new Connect4Engine(board, currentPlayer);
    return engine.solve(strength);
}

export function getMoveSuggestions(
    board: Board,
    currentPlayer: Player,
    strength: AiStrength = 'human'
): MoveSuggestionResult {
    const engine = new Connect4Engine(board, currentPlayer);
    return engine.suggest(strength);
}
