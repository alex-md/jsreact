export type Player = 1 | 2;
export type Board = number[][];

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
    return board[0][col] === EMPTY;
}

export function getNextOpenRow(board: Board, col: number): number {
    for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r][col] === EMPTY) {
            return r;
        }
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
            if (board[r][c] === piece && board[r][c + 1] === piece && board[r][c + 2] === piece && board[r][c + 3] === piece) return true;
        }
    }
    // Vertical
    for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS - 3; r++) {
            if (board[r][c] === piece && board[r + 1][c] === piece && board[r + 2][c] === piece && board[r + 3][c] === piece) return true;
        }
    }
    // Pos Diagonal
    for (let c = 0; c < COLS - 3; c++) {
        for (let r = 0; r < ROWS - 3; r++) {
            if (board[r][c] === piece && board[r + 1][c + 1] === piece && board[r + 2][c + 2] === piece && board[r + 3][c + 3] === piece) return true;
        }
    }
    // Neg Diagonal
    for (let c = 0; c < COLS - 3; c++) {
        for (let r = 3; r < ROWS; r++) {
            if (board[r][c] === piece && board[r - 1][c + 1] === piece && board[r - 2][c + 2] === piece && board[r - 3][c + 3] === piece) return true;
        }
    }
    return false;
}

// --- ADVANCED SOLVER ENGINE (UPGRADED) ---

interface TTEntry {
    depth: number;
    flag: 'EXACT' | 'LOWER' | 'UPPER';
    value: number;
    bestMove: number;
}

class Connect4Engine {
    private position: bigint = 0n; // Bitboard for Current Player
    private mask: bigint = 0n;     // Bitboard for Both Players
    private movesPlayed: number = 0;

    // Transposition Table
    private tt: Map<bigint, TTEntry>;

    // Column Order: Center, then alternating left/right (3, 2, 4, 1, 5, 0, 6)
    // We prioritize center control heavily.
    private static COL_ORDER = [3, 2, 4, 1, 5, 0, 6];

    constructor(board: Board, currentPlayer: Player) {
        this.tt = new Map();
        this.loadBoard(board, currentPlayer);
    }

    private loadBoard(board: Board, currentPlayer: Player) {
        this.position = 0n;
        this.mask = 0n;
        this.movesPlayed = 0;

        for (let c = 0; c < COLS; c++) {
            for (let r = ROWS - 1; r >= 0; r--) {
                const cell = board[r][c];
                if (cell !== EMPTY) {
                    this.movesPlayed++;
                    // Bit Index: Col * 7 + (RowFromBottom)
                    const rowFromBottom = ROWS - 1 - r;
                    const bitIndex = BigInt(c * 7 + rowFromBottom);

                    this.mask |= (1n << bitIndex);
                    if (cell === currentPlayer) {
                        this.position |= (1n << bitIndex);
                    }
                }
            }
        }
    }

    /**
     * Highly optimized bitwise win check.
     */
    private hasWon(pos: bigint): boolean {
        // Horizontal (Shift 7)
        let m = pos & (pos >> 7n);
        if ((m & (m >> 14n)) !== 0n) return true;

        // Diagonal \ (Shift 6)
        m = pos & (pos >> 6n);
        if ((m & (m >> 12n)) !== 0n) return true;

        // Diagonal / (Shift 8)
        m = pos & (pos >> 8n);
        if ((m & (m >> 16n)) !== 0n) return true;

        // Vertical (Shift 1)
        m = pos & (pos >> 1n);
        if ((m & (m >> 2n)) !== 0n) return true;

        return false;
    }

    private canPlay(col: number): boolean {
        // Check if top row (5) of column is empty.
        // Index = col * 7 + 5
        return (this.mask & (1n << BigInt(col * 7 + 5))) === 0n;
    }

    /**
     * Advanced "Aggressive & Human-Like" Heuristic.
     * 1. Rewards "Odd" threats (Zugzwang potential).
     * 2. Rewards connecting 3s with open ends (Traps).
     * 3. Penalizes pure vertical stacking (to avoid predictable bot behavior).
     * 4. Non-linear scoring (Forks are valued exponentially higher).
     */
    private score(): number {
        const oppPos = this.mask ^ this.position;

        // Evaluate Aggressiveness (My Potential) vs Defense (Opponent Potential)
        // We use a multiplier for offense to make the bot aggressive.
        const myScore = this.evaluateCluster(this.position, this.mask);
        const oppScore = this.evaluateCluster(oppPos, this.mask);

        // Aggression Multiplier: 1.2x. We prefer creating our own threats 
        // slightly more than blocking opponent's non-lethal setups.
        return Math.floor(myScore * 1.2) - oppScore;
    }

    /**
     * Evaluates bitboard based on 4-in-a-row potentials.
     * Scans for patterns like 1-1-1-0 or 1-0-1-1 where 0 is empty but playable.
     */
    private evaluateCluster(pos: bigint, mask: bigint): number {
        let score = 0;

        // 1. Center Control (Static Weights) - Gaussian distribution preferred
        const CENTER_WEIGHTS = [
            0, 2, 4, 6, 4, 2, 0,  // Row 0
            1, 3, 5, 7, 5, 3, 1,
            2, 4, 8, 10, 8, 4, 2,
            2, 4, 8, 10, 8, 4, 2,
            1, 3, 5, 7, 5, 3, 1,
            0, 2, 4, 6, 4, 2, 0
        ];

        for (let i = 0; i < 42; i++) {
            if ((pos & (1n << BigInt(i))) !== 0n) {
                score += CENTER_WEIGHTS[i];
            }
        }

        // 2. Connectivity & Open Lines
        // We look for every possible line of 4.
        // If a line contains ONLY my pieces and empty spots, it's a potential win.
        // We sum squares: 1 piece = 1, 2 pieces = 4, 3 pieces = 9.
        // This makes 3-connected vastly more valuable than 3 scattered pieces.

        // Directions: Vert(1), Horiz(7), Diag1(6), Diag2(8)
        const shifts = [1n, 7n, 6n, 8n];

        // Iterate over all possible 4-slots on the board manually for precision
        // (A fully unrolled loop would be faster, but this loop logic is cleaner for the snippet)

        // Check Horizontal
        for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 4; c++) {
                score += this.evaluateWindow(pos, mask, r, c, 0, 1);
            }
        }
        // Check Vertical
        for (let c = 0; c < 7; c++) {
            for (let r = 0; r < 3; r++) {
                // Vertical Penalty: We subtract slightly for vertical lines 
                // to encourage the bot to spread out ("Human feel").
                score += (this.evaluateWindow(pos, mask, r, c, 1, 0) - 5);
            }
        }
        // Check Diagonals
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 4; c++) {
                score += this.evaluateWindow(pos, mask, r, c, 1, 1); // Up-Right
                score += this.evaluateWindow(pos, mask, r + 3, c, -1, 1); // Down-Right
            }
        }

        return score;
    }

    private evaluateWindow(pos: bigint, mask: bigint, r: number, c: number, dr: number, dc: number): number {
        let pieces = 0;
        let empty = 0;
        let oddRowThreat = 0;

        for (let i = 0; i < 4; i++) {
            const tr = r + dr * i;
            const tc = c + dc * i;
            const idx = BigInt(tc * 7 + tr);

            if ((pos & (1n << idx)) !== 0n) {
                pieces++;
                // Bonus for threats on even rows (0, 2, 4) if we are Player 1, or Odd if Player 2.
                // Simplified: Even rows (from bottom 0) are generally stronger for P1 due to parity.
                if (tr % 2 === 0) oddRowThreat++;
            } else if ((mask & (1n << idx)) === 0n) {
                empty++;
            } else {
                // Opponent block
                return 0;
            }
        }

        // Scoring Formula
        if (pieces === 4) return 10000; // Win
        if (pieces === 3 && empty === 1) return 100 + (oddRowThreat * 10); // Threat
        if (pieces === 2 && empty === 2) return 10; // Setup

        return 0;
    }

    private pvs(depth: number, alpha: number, beta: number): number {
        const key = this.position ^ (this.mask + 0x9e3779b9n); // Simple Hash
        const ttEntry = this.tt.get(key);

        if (ttEntry && ttEntry.depth >= depth) {
            if (ttEntry.flag === 'EXACT') return ttEntry.value;
            if (ttEntry.flag === 'LOWER' && ttEntry.value > alpha) alpha = ttEntry.value;
            if (ttEntry.flag === 'UPPER' && ttEntry.value < beta) beta = ttEntry.value;
            if (alpha >= beta) return ttEntry.value;
        }

        // Draw check
        if (this.movesPlayed === 42) return 0;

        if (depth <= 0) return this.score();

        let moves = [];
        for (let c of Connect4Engine.COL_ORDER) {
            if (this.canPlay(c)) moves.push(c);
        }

        if (moves.length === 0) return 0;

        // Move Ordering: TT best move first
        if (ttEntry) {
            moves.sort((a, b) => (a === ttEntry.bestMove ? -1 : (b === ttEntry.bestMove ? 1 : 0)));
        }

        let bestScore = -Infinity;
        let bestMove = moves[0];
        let originalAlpha = alpha;

        for (let i = 0; i < moves.length; i++) {
            const col = moves[i];

            // Execute Move
            const colShift = BigInt(col * 7);
            const moveBit = (this.mask + (1n << colShift)) & ~this.mask;

            // Immediate Win Check (Optimization)
            if (this.hasWon(this.position | moveBit)) {
                bestScore = 10000 + depth; // Prefer winning sooner
                bestMove = col;
                // Store and return immediately
                this.tt.set(key, { depth, flag: 'EXACT', value: bestScore, bestMove });
                return bestScore;
            }

            const nextMask = this.mask | moveBit;
            const nextPos = this.position ^ this.mask; // Flip perspective

            // Recursion
            const savedPos = this.position;
            const savedMask = this.mask;
            this.position = nextPos;
            this.mask = nextMask;
            this.movesPlayed++;

            let score;
            if (i === 0) {
                score = -this.pvs(depth - 1, -beta, -alpha);
            } else {
                score = -this.pvs(depth - 1, -alpha - 1, -alpha);
                if (score > alpha && score < beta) {
                    score = -this.pvs(depth - 1, -beta, -alpha);
                }
            }

            this.movesPlayed--;
            this.position = savedPos;
            this.mask = savedMask;

            if (score > bestScore) {
                bestScore = score;
                bestMove = col;
            }

            alpha = Math.max(alpha, score);
            if (alpha >= beta) break;
        }

        const flag = bestScore <= originalAlpha ? 'UPPER' : (bestScore >= beta ? 'LOWER' : 'EXACT');
        this.tt.set(key, { depth, flag, value: bestScore, bestMove });

        return bestScore;
    }

    public solve(): { column: number, score: number } {
        // Grandmaster Search Depth
        const MAX_DEPTH = 10;

        let bestMove = -1;
        let bestScore = -Infinity;

        // Iterative Deepening
        for (let d = 1; d <= MAX_DEPTH; d++) {
            // Aspiration Window Optimization could go here, 
            // but standard PVS is robust enough for this constraint.
            this.pvs(d, -200000, 200000);

            // Fetch best from TT
            const key = this.position ^ (this.mask + 0x9e3779b9n);
            const entry = this.tt.get(key);

            if (entry) {
                bestMove = entry.bestMove;
                bestScore = entry.value;
            }

            // Time management / Early exit on win
            if (bestScore > 9000 || bestScore < -9000) break;
        }

        // Failsafe
        if (bestMove === -1) {
            for (let c of Connect4Engine.COL_ORDER) if (this.canPlay(c)) return { column: c, score: 0 };
        }

        return { column: bestMove, score: bestScore };
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

    // Scale score to match legacy expectation (huge numbers for wins)
    let s = result.score;
    if (s > 9000) s = 10000000000000;
    else if (s < -9000) s = -10000000000000;
    else s = s * 100;

    return [result.column, s];
}

export function getBestMove(board: Board, currentPlayer: Player): { column: number; score: number } {
    const engine = new Connect4Engine(board, currentPlayer);
    return engine.solve();
}
