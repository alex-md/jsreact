import { trackAnalyticsEvent } from '@components/analytics.js';

export const CONNECT4_EVENTS = {
    manualHintRequested: 'connect4_hint_requested',
    autoHintToggled: 'connect4_auto_hint_toggled',
    undo: 'connect4_undo',
    redo: 'connect4_redo',
    reset: 'connect4_reset',
    solverTargetChanged: 'connect4_solver_target_changed',
    aiStrengthChanged: 'connect4_ai_strength_changed',
    helpOpened: 'connect4_help_opened',
    keyboardMove: 'connect4_keyboard_move',
    firstMove: 'connect4_first_move',
    winnerReached: 'connect4_winner_reached',
    hintCalculated: 'connect4_hint_calculated',
} as const;

type Connect4EventName = typeof CONNECT4_EVENTS[keyof typeof CONNECT4_EVENTS];
type Connect4EventParameters = Record<string, string | number | boolean>;

export const trackConnect4Event = (
    eventName: Connect4EventName,
    parameters: Connect4EventParameters = {}
) => {
    trackAnalyticsEvent(eventName, {
        event_category: 'connect4',
        game_name: 'connect4',
        ...parameters,
    });
};
