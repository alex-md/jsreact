import React from 'react';
import { CircleHelp } from 'lucide-react';

interface GameHeaderProps {
    onOpenHowToPlay: () => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({ onOpenHowToPlay }) => (
    <header className="connect4-game-header">
        <div>
            <p className="connect4-kicker">The strategy workbench</p>
            <h1>Connect 4 <em>solver.</em></h1>
            <p className="connect4-intro">Set up a position. Find your next move. Or put it to the test against AI.</p>
        </div>
        <button type="button" onClick={onOpenHowToPlay} className="connect4-help-button" aria-label="How to play">
            <CircleHelp aria-hidden="true" size={18} />
            <span>How to play</span>
        </button>
    </header>
);

export default GameHeader;
