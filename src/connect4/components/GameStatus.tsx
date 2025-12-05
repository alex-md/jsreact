import React from 'react';
import { PLAYER_1 } from '../utils/solver';
import type { Player } from '../utils/solver';

interface GameStatusProps {
    currentPlayer: Player;
    winner: Player | null;
}

const GameStatus: React.FC<GameStatusProps> = ({ currentPlayer, winner }) => {
    return (
        <div className="flex flex-col sm:flex-row justify-center items-center mb-4 gap-4 w-full">
            <div className="flex items-center gap-3 bg-card px-6 py-3 rounded-full shadow-md border border-border">
                <span className="text-muted-foreground font-medium text-sm uppercase tracking-wider">Current Turn</span>
                <div
                    className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${currentPlayer === PLAYER_1
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                        }`}
                >
                    <div className={`w-3 h-3 rounded-full shadow-sm ${currentPlayer === PLAYER_1 ? 'bg-red-500' : 'bg-yellow-400'}`}></div>
                    {currentPlayer === PLAYER_1 ? 'Red' : 'Yellow'}
                </div>
            </div>

            {winner && (
                <div
                    className={`px-8 py-3 rounded-2xl shadow-xl transform transition-all animate-bounce flex items-center gap-3 ${winner === PLAYER_1
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                        : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white'
                        }`}
                    role="alert"
                    aria-live="assertive"
                >
                    <i className="fas fa-trophy text-2xl"></i>
                    <span className="font-heading font-bold text-xl">{winner === PLAYER_1 ? 'Red Wins!' : 'Yellow Wins!'}</span>
                    <i className="fas fa-trophy text-2xl"></i>
                </div>
            )}
        </div>
    );
};

export default GameStatus;
