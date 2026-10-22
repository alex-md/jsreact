import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';

// Use the same TypeScript transform and module resolution as the app.
const server = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
after(() => server.close());
const { createBoard, copyBoard, getNextOpenRow, dropPiece, checkWin, getWinningCells, getMoveSuggestions } = await server.ssrLoadModule('/src/connect4/utils/solver.ts');
const { hydrateMoveSequence, serializeHistory } = await server.ssrLoadModule('/src/connect4/utils/boardState.ts');

const strengths = ['random', 'casual', 'human', 'expert', 'master'];
const position = (sequence) => {
    const state = hydrateMoveSequence(sequence);
    assert.ok(state, sequence);
    return state.history[state.currentStep];
};

function safePosition(seed, count) {
    let board = createBoard();
    let player = 1;
    let sequence = '';
    for (let move = 0; move < count; move++) {
        const choices = [];
        for (let col = 0; col < 7; col++) {
            const row = getNextOpenRow(board, col);
            if (row < 0) continue;
            const next = copyBoard(board);
            dropPiece(next, row, col, player);
            if (!checkWin(next, player)) choices.push({ col, next });
        }
        if (!choices.length) break;
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const choice = choices[seed % choices.length];
        board = choice.next;
        sequence += choice.col + 1;
        player = 3 - player;
    }
    return { board, currentPlayer: player, sequence };
}

// Independent array-based endgame oracle, without bitboards or a transposition table.
function outcome(board, player) {
    if (checkWin(board, 3 - player)) return -1;
    let best = -2;
    for (let col = 0; col < 7; col++) {
        const row = getNextOpenRow(board, col);
        if (row < 0) continue;
        const next = copyBoard(board);
        dropPiece(next, row, col, player);
        best = Math.max(best, -outcome(next, 3 - player));
        if (best === 1) break;
    }
    return best === -2 ? 0 : best;
}

test('board rows are independent and copies do not mutate the source', () => {
    const board = createBoard();
    const copy = copyBoard(board);
    dropPiece(copy, 5, 3, 1);
    assert.equal(board[5][3], 0);
    assert.equal(copy[4][3], 0);
});

test('all four win directions and winning-cell highlights', () => {
    for (const cells of [[[5,0],[5,1],[5,2],[5,3]], [[5,2],[4,2],[3,2],[2,2]], [[2,0],[3,1],[4,2],[5,3]], [[5,0],[4,1],[3,2],[2,3]]]) {
        for (const player of [1,2]) {
            const board = createBoard();
            for (const [row,col] of cells) dropPiece(board,row,col,player);
            assert.equal(checkWin(board,player),true);
            assert.equal(checkWin(board,3-player),false);
            assert.equal(getWinningCells(board,player).length,4);
        }
    }
});

test('shared sequences round-trip; invalid, overfull and post-win moves are rejected', () => {
    for (const sequence of ['', '4', '443454', '4141424']) {
        const state = hydrateMoveSequence(sequence);
        assert.ok(state);
        assert.equal(serializeHistory(state.history,state.currentStep),sequence);
    }
    assert.equal(serializeHistory(hydrateMoveSequence('443454').history,3),'443');
    for (const sequence of ['0','8','hello','1111111','41414241','4'.repeat(43)]) assert.equal(hydrateMoveSequence(sequence),null);
    assert.equal(hydrateMoveSequence('4141424').winner,1);
});

for (const strength of strengths) {
    test(`${strength}: returns a legal move without changing the board`, () => {
        const { board, currentPlayer } = position('443454');
        const original = JSON.stringify(board);
        const result = getMoveSuggestions(board,currentPlayer,strength,{masterTimeLimitMs:20});
        assert.ok(getNextOpenRow(board,result.move.column)>=0);
        assert.equal(JSON.stringify(board),original);
        assert.ok(result.suggestions.some(move=>move.column===result.move.column));
        assert.ok(result.evaluations.every(move=>move.column>=0 && move.column<7 && Number.isFinite(move.score)));
    });
    if (strength !== 'random') {
        test(`${strength}: takes immediate wins and mandatory blocks for either color`, () => {
            for (const [sequence, column] of [['414142',3], ['4141427',3], ['1212123',1], ['121232',1]]) {
                const {board,currentPlayer} = position(sequence);
                assert.equal(getMoveSuggestions(board,currentPlayer,strength).move.column,column,sequence);
            }
        });
    }
    test(`${strength}: no move after a win or full board`, () => {
        const won=position('4141424');
        assert.equal(getMoveSuggestions(won.board,won.currentPlayer,strength).move.column,-1);
        const draw=Array.from({length:100},(_,seed)=>safePosition(seed,42)).find(state=>state.sequence.length===42);
        assert.ok(draw);
        assert.equal(getMoveSuggestions(draw.board,draw.currentPlayer,strength).move.column,-1);
    });
}

test('Master agrees with an independent endgame oracle on generated legal positions', () => {
    let checked = 0;
    for (let seed = 0; seed < 50 && checked < 15; seed++) {
        const {board,currentPlayer,sequence} = safePosition(seed,36);
        if (sequence.length !== 36) continue;
        const expected = outcome(board,currentPlayer);
        const {move} = getMoveSuggestions(board,currentPlayer,'master');
        const next = copyBoard(board);
        dropPiece(next,getNextOpenRow(next,move.column),move.column,currentPlayer);
        assert.equal(-outcome(next,3-currentPlayer),expected,sequence);
        checked++;
    }
    assert.equal(checked,15);
});
