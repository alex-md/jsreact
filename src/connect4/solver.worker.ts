import { getBestMove } from './utils/solver';
import type { Board, Player } from './utils/solver';
import type { AiStrength } from './utils/aiStrength';

interface SolverRequest {
    id: number;
    board: Board;
    player: Player;
    strength: AiStrength;
    cacheKey: string;
}

self.onmessage = (event: MessageEvent<SolverRequest>) => {
    const { id, board, player, strength, cacheKey } = event.data;
    const move = getBestMove(board, player, strength);
    self.postMessage({ id, move, cacheKey });
};
