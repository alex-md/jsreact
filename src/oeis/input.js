export const MAX_SEQUENCE_LENGTH = 200;
export function parseSequence(text) {
    if (text.length > 20000) throw new Error('Input is too long. Enter at most 200 numbers.');
    const tokens = text.trim().split(/[\s,;]+/).filter(Boolean);
    if (tokens.length > MAX_SEQUENCE_LENGTH) throw new Error('Enter at most 200 numbers.');
    return tokens.map((token, i) => {
        if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(token)) {
            throw new Error(`Item ${i + 1} is not a number: ${token.slice(0, 24)}`);
        }
        const value = Number(token);
        if (!Number.isFinite(value) || Math.abs(value) > 1e100 || (value === 0 && /[1-9]/.test(token.split(/e/i)[0]))) {
            throw new Error(`Item ${i + 1} is outside the supported numeric range.`);
        }
        if (Number.isSafeInteger(value)) {
            // Do not classify a decimal rounded to an integer as an exact input.
            const [mantissa, exponent = '0'] = token.toLowerCase().split('e');
            const decimals = (mantissa.split('.')[1] || '').length;
            const digits = mantissa.replace('.', '');
            const shift = Number(exponent) - decimals;
            if (Math.abs(shift) < 1000) {
                const numerator = BigInt(digits) * (shift > 0 ? 10n ** BigInt(shift) : 1n);
                const denominator = shift < 0 ? 10n ** BigInt(-shift) : 1n;
                if (numerator !== BigInt(value) * denominator) throw new Error(`Item ${i + 1} loses precision when converted to an integer.`);
            }
        }
        if (Number.isInteger(value) && !Number.isSafeInteger(value)) {
            throw new Error(`Item ${i + 1} exceeds the exact integer input limit (±9007199254740991).`);
        }
        return value;
    });
}
export function validateInput(sequence, horizon) {
    if (!Array.isArray(sequence) || sequence.length < 3 || sequence.length > MAX_SEQUENCE_LENGTH ||
        sequence.some(v => !Number.isFinite(v) || Math.abs(v) > 1e100 || (Number.isInteger(v) && !Number.isSafeInteger(v)))) {
        throw new Error('Enter 3–200 finite numbers within the supported range.');
    }
    if (!Number.isInteger(horizon) || horizon < 1 || horizon > 50) throw new Error('Forecast horizon must be an integer from 1 to 50.');
}
