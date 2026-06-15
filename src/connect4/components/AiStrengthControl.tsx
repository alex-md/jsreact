import React from 'react';
import {
    AI_STRENGTHS,
    getAiStrengthIndex,
    getAiStrengthOption,
} from '../utils/aiStrength';
import type { AiStrength } from '../utils/aiStrength';

interface AiStrengthControlProps {
    value: AiStrength;
    onChange: (value: AiStrength) => void;
    compact?: boolean;
}

const AiStrengthControl: React.FC<AiStrengthControlProps> = ({
    value,
    onChange,
    compact = false,
}) => {
    const selectedIndex = getAiStrengthIndex(value);
    const selected = getAiStrengthOption(value);

    return (
        <div className={`connect4-strength ${compact ? 'is-compact' : ''}`}>
            <div className="flex items-center justify-between gap-3">
                <label htmlFor={compact ? 'ai-strength-mobile' : 'ai-strength-desktop'} className="text-xs font-semibold text-muted-foreground">
                    AI strength
                </label>
                <span className="rounded-full bg-primary-500/10 px-2 py-1 text-xs font-bold text-primary-700">
                    {selected.label}
                </span>
            </div>
            <input
                id={compact ? 'ai-strength-mobile' : 'ai-strength-desktop'}
                className="connect4-strength-slider"
                type="range"
                min="0"
                max={AI_STRENGTHS.length - 1}
                step="1"
                value={selectedIndex}
                onChange={(event) => onChange(AI_STRENGTHS[Number(event.target.value)].id)}
                aria-valuetext={`${selected.label}. ${selected.description}`}
            />
            <div className="connect4-strength-labels" aria-hidden="true">
                {AI_STRENGTHS.map((option, index) => (
                    <span
                        key={option.id}
                        className={index === selectedIndex ? 'is-active' : ''}
                    >
                        {option.shortLabel}
                    </span>
                ))}
            </div>
            {!compact && (
                <p className="text-xs leading-5 text-muted-foreground">
                    {selected.description}
                </p>
            )}
        </div>
    );
};

export default AiStrengthControl;
