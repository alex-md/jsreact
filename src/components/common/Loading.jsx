import React from 'react';

export function Loading({
    size = 'md',
    variant = 'primary',
    fullscreen = false,
    text = 'Loading...'
}) {
    const sizes = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    };

    const variants = {
        primary: 'border-primary-500',
        secondary: 'border-gray-300',
        white: 'border-white'
    };

    const spinner = (
        <div className="flex flex-col items-center gap-3">
            <div className={`
                ${sizes[size]} 
                border-2 
                ${variants[variant]} 
                border-t-transparent 
                rounded-full 
                animate-spin
            `} />
            {text && (
                <p className="text-sm text-gray-600 dark:text-gray-300">{text}</p>
            )}
        </div>
    );

    if (fullscreen) {
        return (
            <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
                {spinner}
            </div>
        );
    }

    return spinner;
}
