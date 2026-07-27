import { getMoveSuggestions } from './utils/solver';
import type { Board, Player } from './utils/solver';
import type { AiStrength } from './utils/aiStrength';

interface SolverRequest {
    id: number;
    board: Board;
    player: Player;
    strength: AiStrength;
    cacheKey: string;
    gameId?: number;
    purpose?: 'hint' | 'practice';
}

self.onmessage = (event: MessageEvent<SolverRequest>) => {
    const { id, board, player, strength, cacheKey, gameId, purpose = 'hint' } = event.data;
    const result = getMoveSuggestions(board, player, strength, { variationSeed: gameId });
    self.postMessage({
        id,
        move: result.move,
        suggestions: result.suggestions,
        evaluations: result.evaluations,
        cacheKey,
        purpose,
    });
};
