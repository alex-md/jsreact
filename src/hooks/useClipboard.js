import { useState } from 'react';

export function useClipboard(timeout = 2000) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), timeout);
            return true;
        } catch (error) {
            console.error('Failed to copy:', error);
            return false;
        }
    };

    return [copied, copyToClipboard];
}
