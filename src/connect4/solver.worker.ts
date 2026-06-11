import { getBestMove } from './utils/solver';
import type { Board, Player } from './utils/solver';

interface SolverRequest {
    id: number;
    board: Board;
    player: Player;
    cacheKey: string;
}

self.onmessage = (event: MessageEvent<SolverRequest>) => {
    const { id, board, player, cacheKey } = event.data;
    const move = getBestMove(board, player);
    self.postMessage({ id, move, cacheKey });
};
