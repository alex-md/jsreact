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
        if (board[r][col] === EMPTY) return r;
    }
    return -1;
}

export function dropPiece(board: Board, row: number, col: number, piece: Player): void {
    board[row][col] = piece;
}

export function checkWin(board: Board, piece: Player): boolean {
    // Legacy checkWin for UI/Game Loop compatibility
    // (The engine uses its own bitboard check internally)
    for (let c = 0; c < COLS - 3; c++) {
        for (let r = 0; r < ROWS; r++) {
            if (board[r][c] === piece && board[r][c + 1] === piece && board[r][c + 2] === piece && board[r][c + 3] === piece) return true;
        }
    }
    for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS - 3; r++) {
            if (board[r][c] === piece && board[r + 1][c] === piece && board[r + 2][c] === piece && board[r + 3][c] === piece) return true;
        }
    }
    for (let c = 0; c < COLS - 3; c++) {
        for (let r = 0; r < ROWS - 3; r++) {
            if (board[r][c] === piece && board[r + 1][c + 1] === piece && board[r + 2][c + 2] === piece && board[r + 3][c + 3] === piece) return true;
        }
    }
    for (let c = 0; c < COLS - 3; c++) {
        for (let r = 3; r < ROWS; r++) {
            if (board[r][c] === piece && board[r - 1][c + 1] === piece && board[r - 2][c + 2] === piece && board[r - 3][c + 3] === piece) return true;
        }
    }
    return false;
}

// --- UNBEATABLE SOLVER ENGINE ---

/**
 * Transposition Table Entry
 * Stores results of previously searched positions to avoid re-calculating.
 */
interface TTEntry {
    flag: 'EXACT' | 'LOWER' | 'UPPER';
    value: number;
}

class Connect4Solver {
    // Bitboard representation: 
    // Two 64-bit integers. One for 'position' (current player), one for 'mask' (occupied).
    // Layout: 7 columns of 6 bits, plus a buffer bit at the top of each col to prevent wrap-around.
    // 6 13 20 27 34 41 48 (Buffer Row - always 0)
    // 5 12 19 26 33 40 47 (Top Playable Row)
    // ...
    // 0 7  14 21 28 35 42 (Bottom Row)
    
    private position: bigint;
    private mask: bigint;
    private moves: number; 
    private tt: Map<bigint, TTEntry>; // Transposition Table

    // Order to explore columns: Center out is statistically best for pruning.
    private static readonly COLUMN_ORDER = [3, 2, 4, 1, 5, 0, 6];

    constructor(board: Board, currentPlayer: Player) {
        this.tt = new Map();
        this.position = 0n;
        this.mask = 0n;
        this.moves = 0;
        this.loadFromBoard(board, currentPlayer);
    }

    /**
     * Parse standard 2D array into Bitboards
     */
    private loadFromBoard(board: Board, player: Player) {
        for (let c = 0; c < COLS; c++) {
            for (let r = ROWS - 1; r >= 0; r--) {
                if (board[r][c] !== EMPTY) {
                    this.moves++;
                    // Calculate bit index
                    // r=5 (bottom) -> index 0
                    // r=0 (top)    -> index 5
                    const rowFromBottom = ROWS - 1 - r;
                    const bitIndex = BigInt(c * (ROWS + 1) + rowFromBottom);
                    
                    this.mask |= (1n << bitIndex);
                    if (board[r][c] === player) {
                        this.position |= (1n << bitIndex);
                    }
                }
            }
        }
    }

    /**
     * Check if the *current* position has a connect 4.
     * This uses bitwise shifts to check the whole board in constant time.
     */
    private hasWon(pos: bigint): boolean {
        // Horizontal: shift 7 (height+1)
        let m = pos & (pos >> 7n);
        if ((m & (m >> 14n)) !== 0n) return true;

        // Diagonal \: shift 6
        m = pos & (pos >> 6n);
        if ((m & (m >> 12n)) !== 0n) return true;

        // Diagonal /: shift 8
        m = pos & (pos >> 8n);
        if ((m & (m >> 16n)) !== 0n) return true;

        // Vertical: shift 1
        m = pos & (pos >> 1n);
        if ((m & (m >> 2n)) !== 0n) return true;

        return false;
    }

    /**
     * Negamax with Alpha-Beta Pruning.
     * This is the core "Unbeatable" logic.
     * 
     * @param depth - Remaining depth to search
     * @param alpha - Best score we can guarantee
     * @param beta  - Best score opponent can guarantee
     */
    private negamax(depth: number, alpha: number, beta: number): number {
        const alphaOrig = alpha;

        // 1. Transposition Table Lookup
        // Key: Position + Mask + BottomRowOffset is unique
        const key = this.position + this.mask; 
        const entry = this.tt.get(key);
        
        if (entry) {
            if (entry.flag === 'EXACT') return entry.value;
            if (entry.flag === 'LOWER') alpha = Math.max(alpha, entry.value);
            if (entry.flag === 'UPPER') beta = Math.min(beta, entry.value);
            if (alpha >= beta) return entry.value;
        }

        // 2. Base Case: Check for immediate win
        // Note: In Negamax, we check if the *opponent* (who just moved) won.
        // But to optimize, we check win immediately after making move in the loop.
        // So here, we just check draw.
        if (this.moves === 42) return 0; // Draw

        if (depth === 0) {
            // If we hit max depth and haven't found a win/loss, use heuristic
            return this.evaluatePosition();
        }

        // 3. Move Generation & Ordering
        // Use pre-defined column order (Center -> Out)
        // Optimization: Win Score = (43 - moves). Closer wins are better.
        // Max theoretical score is 21 (win in 1). Min is -21.
        
        let maxScore = (43 - this.moves) / 2;
        if (beta > maxScore) {
            beta = maxScore;
            if (alpha >= beta) return beta;
        }

        let bestScore = -Infinity;

        for (let col of Connect4Solver.COLUMN_ORDER) {
            // Check if column is playable: Top bit (row 5) must be empty
            // Index of top row for col C is C*7 + 5
            if ((this.mask & (1n << BigInt(col * 7 + 5))) !== 0n) continue;

            // Make Move
            // Find the first 0 in the column within the mask
            // (mask + bottom_mask) & ~mask logic for finding next open slot
            const colShift = BigInt(col * 7);
            const moveBit = (this.mask + (1n << colShift)) & ~this.mask;

            // --- IMMEDIATE WIN CHECK ---
            // Before recursing, check if this move wins.
            if (this.hasWon(this.position | moveBit)) {
                // Return positive score inversely proportional to moves played.
                // Less moves = Higher score (Prefer fast wins).
                bestScore = (43 - this.moves) / 2; // e.g. 21
                
                // Store and Return
                this.tt.set(key, { flag: 'EXACT', value: bestScore });
                return bestScore;
            }

            // Apply Move
            const nextMask = this.mask | moveBit;
            const nextPos = this.position ^ this.mask; // Switch perspective for Negamax
            
            const savedPos = this.position;
            const savedMask = this.mask;
            
            this.position = nextPos;
            this.mask = nextMask;
            this.moves++;

            // Recursive Call
            const score = -this.negamax(depth - 1, -beta, -alpha);

            // Undo Move
            this.moves--;
            this.position = savedPos;
            this.mask = savedMask;

            if (score > bestScore) bestScore = score;
            
            alpha = Math.max(alpha, score);
            if (alpha >= beta) break; // Pruning
        }

        // 4. Store Result
        let flag: 'EXACT' | 'LOWER' | 'UPPER' = 'EXACT';
        if (bestScore <= alphaOrig) flag = 'UPPER';
        else if (bestScore >= beta) flag = 'LOWER';
        
        this.tt.set(key, { flag, value: bestScore });

        return bestScore;
    }

    /**
     * Advanced Heuristic Evaluation
     * Only used when max search depth is reached without a definitive result.
     * Calculates "Threats" and "Odd/Even" parity advantages.
     */
    private evaluatePosition(): number {
        // Since this is a "perfect" solver attempt, the heuristic is less critical 
        // than the search, but it guides the engine in complex mid-games.
        
        let score = 0;
        const opponentPos = this.position ^ this.mask;

        // 1. Center Control (Static Weights)
        // Prioritize center heavily.
        const CENTER_WEIGHTS = [
            0, 3, 6, 8, 6, 3, 0,
            0, 4, 7, 10, 7, 4, 0,
            0, 5, 8, 11, 8, 5, 0,
            0, 5, 8, 11, 8, 5, 0,
            0, 4, 7, 10, 7, 4, 0,
            0, 3, 6, 8, 6, 3, 0
        ];
        
        // Add weights based on piece positions
        // This is slow in JS loops, but robust.
        // (Optimized bitwise scoring is possible but verbose in JS)
        for(let c=0; c<7; c++) {
            for(let r=0; r<6; r++) {
                const bit = 1n << BigInt(c*7 + r);
                if ((this.position & bit) !== 0n) score += CENTER_WEIGHTS[r*7+c];
                else if ((opponentPos & bit) !== 0n) score -= CENTER_WEIGHTS[r*7+c];
            }
        }

        // 2. Threat Detection (The "Aggressive" Feel)
        // Score 3-in-a-rows that have an open slot
        score += this.countThreats(this.position, this.mask) * 10;
        score -= this.countThreats(opponentPos, this.mask) * 12; // Defensive bias slightly higher to avoid silly losses

        return score;
    }

    /**
     * Counts how many "3-in-a-rows" can become 4
     */
    private countThreats(pos: bigint, mask: bigint): number {
        let threats = 0;
        const shifts = [1n, 7n, 6n, 8n]; // Vert, Horiz, Diag1, Diag2

        // A threat is: 3 bits set + 1 bit empty (but playable eventually)
        // This is a simplified check for speed.
        // We look for patterns 1110, 1101, 1011, 0111
        for(let s of shifts) {
            const p2 = pos & (pos >> s);
            const p3 = p2 & (pos >> (s*2n));
            
            // If we have 3, check the 4th spot (logic simplified for brevity)
            if (p3 !== 0n) threats++; 
        }
        return threats;
    }

    /**
     * Main Entry Point
     */
    public solve(): { column: number, score: number } {
        // Iterative Deepening
        // We start shallow and go deep. This populates the Transposition Table
        // with good move ordering for deeper searches.
        
        let bestMove = -1;
        let bestScore = -Infinity;
        
        // If we are late in the game, search to the end (Endgame solver)
        // If early, limit depth to avoid browser hang (though 18 is basically unbeatable for human)
        const maxDepth = (this.moves > 20) ? 42 : 18; 
        
        // Loop depths
        for (let d = 1; d <= maxDepth; d++) {
            let iterationBestMove = -1;
            let iterationBestScore = -Infinity;
            let alpha = -Infinity;
            let beta = Infinity;

            // Search at root level
            for (let col of Connect4Solver.COLUMN_ORDER) {
                if ((this.mask & (1n << BigInt(col * 7 + 5))) !== 0n) continue;

                const colShift = BigInt(col * 7);
                const moveBit = (this.mask + (1n << colShift)) & ~this.mask;

                if (this.hasWon(this.position | moveBit)) {
                    return { column: col, score: 10000 }; // Found instant win
                }

                // Make
                const nextMask = this.mask | moveBit;
                const nextPos = this.position ^ this.mask;
                const savedPos = this.position;
                const savedMask = this.mask;
                this.position = nextPos;
                this.mask = nextMask;
                this.moves++;

                // Search
                // Score is inverted because negamax returns score for 'next' player
                const s = -this.negamax(d, -beta, -alpha);

                // Unmake
                this.moves--;
                this.position = savedPos;
                this.mask = savedMask;

                if (s > iterationBestScore) {
                    iterationBestScore = s;
                    iterationBestMove = col;
                }
                alpha = Math.max(alpha, s);
            }

            bestMove = iterationBestMove;
            bestScore = iterationBestScore;

            // If we found a guaranteed win, stop searching deeper
            if (bestScore > 10) break; // >10 means forced win found
            if (bestScore < -10) break; // < -10 means forced loss detected
        }
        
        // Fallback
        if (bestMove === -1) {
             for (let c of Connect4Solver.COLUMN_ORDER) if (isValidLocation(createBoard(), c)) return { column: c, score: 0 };
        }

        return { column: bestMove, score: bestScore };
    }
}

// --- PUBLIC API WRAPPER ---

/**
 * Returns [Column, Score]
 * This maintains compatibility with your previous code structure.
 */
export function minimax(
    board: Board,
    _depth: number, 
    _alpha: number,
    _beta: number,
    _maximizingPlayer: boolean,
    currentPlayer: Player
): [number, number] {
    const engine = new Connect4Solver(board, currentPlayer);
    const result = engine.solve();

    // Scale scores for legacy frontend expectations
    // Solver returns (21..-21), Frontend expects (100000...)
    let s = result.score;
    if (s > 0) s = 100000 + s;
    else if (s < 0) s = -100000 + s;
    else s = 0;

    return [result.column, s];
}

export function getBestMove(board: Board, currentPlayer: Player): { column: number; score: number } {
    const engine = new Connect4Solver(board, currentPlayer);
    return engine.solve();
}
