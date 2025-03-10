import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '@services/store';
import { animation } from '@utils/core';

const VARIANTS = {
    info: {
        bg: 'bg-blue-500',
        icon: 'fas fa-info-circle'
    },
    success: {
        bg: 'bg-green-500',
        icon: 'fas fa-check-circle'
    },
    warning: {
        bg: 'bg-yellow-500',
        icon: 'fas fa-exclamation-circle'
    },
    error: {
        bg: 'bg-red-500',
        icon: 'fas fa-times-circle'
    }
};

export function Toast() {
    const [toasts, setToasts] = useState([]);
    const position = useStore('toast-position', 'bottom-right');

    const addToast = useCallback((message, variant = 'info', duration = 3000) => {
        const id = Date.now();
        const toast = { id, message, variant, duration };

        setToasts(prev => [...prev, toast]);

        if (duration > 0) {
            setTimeout(() => removeToast(id), duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const positions = {
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4'
    };

    return (
        <div className={`fixed ${positions[position]} z-50 space-y-2 min-w-[300px] max-w-[400px]`}>
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`
                        ${VARIANTS[toast.variant].bg} 
                        text-white p-4 rounded-lg shadow-lg
                        transform transition-all duration-300
                        hover:scale-102 hover:shadow-xl
                    `}
                >
                    <div className="flex items-center gap-3">
                        <i className={VARIANTS[toast.variant].icon} />
                        <p className="flex-grow">{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-white/80 hover:text-white"
                        >
                            <i className="fas fa-times" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Helper function to show toasts from anywhere
export function showToast(message, variant = 'info', duration = 3000) {
    const event = new CustomEvent('show-toast', {
        detail: { message, variant, duration }
    });
    window.dispatchEvent(event);
}
