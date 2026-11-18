// Round statistical outputs for presentation/copy/export, while preserving the
// engine's full precision and exact integer/fraction strings from rule discovery.
export function forecastValue(value) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (!Number.isFinite(value)) throw new Error('Cannot format a nonfinite forecast');
    return BigInt(Math.round(value)).toString();
}

export function formatForecast(value) {
    const text = forecastValue(value);
    return /^-?\d+$/.test(text) ? BigInt(text).toLocaleString('en-US') : text;
}
