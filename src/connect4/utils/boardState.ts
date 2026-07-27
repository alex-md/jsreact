import {
    checkWin,
    copyBoard,
    createBoard,
    dropPiece,
    getNextOpenRow,
    PLAYER_1,
    PLAYER_2,
} from './solver';
import type { Board, Player } from './solver';

export interface GameSnapshot {
    board: Board;
    currentPlayer: Player;
    move?: number;
}

export interface HydratedBoardState {
    history: GameSnapshot[];
    currentStep: number;
    winner: Player | null;
}

export function hydrateMoveSequence(sequence: string | null): HydratedBoardState | null {
    if (sequence === null || sequence === '') {
        return {
            history: [{ board: createBoard(), currentPlayer: PLAYER_1 }],
            currentStep: 0,
            winner: null,
        };
    }

    if (!/^[1-7]{1,42}$/.test(sequence)) return null;

    const history: GameSnapshot[] = [{ board: createBoard(), currentPlayer: PLAYER_1 }];
    let board = createBoard();
    let currentPlayer: Player = PLAYER_1;
    let winner: Player | null = null;

    for (const value of sequence) {
        if (winner) return null;

        const column = Number(value) - 1;
        const row = getNextOpenRow(board, column);
        if (row === -1) return null;

        const nextBoard = copyBoard(board);
        dropPiece(nextBoard, row, column, currentPlayer);
        winner = checkWin(nextBoard, currentPlayer) ? currentPlayer : null;
        currentPlayer = currentPlayer === PLAYER_1 ? PLAYER_2 : PLAYER_1;
        history.push({ board: nextBoard, currentPlayer, move: column });
        board = nextBoard;
    }

    return {
        history,
        currentStep: history.length - 1,
        winner,
    };
}

export function serializeHistory(history: GameSnapshot[], currentStep: number): string {
    return history
        .slice(1, currentStep + 1)
        .map((snapshot) => snapshot.move === undefined ? '' : String(snapshot.move + 1))
        .join('');
}
