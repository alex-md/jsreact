// Convert the solver's arithmetic grammar without depending on Math.js loading.
// In particular, TeX exponents must group the entire operand, including roots.
export function expressionToTex(expression) {
    let position = 0;
    const source = expression.replace(/\*\*/g, '^');
    const skipSpace = () => { while (/\s/.test(source[position] ?? '') && position < source.length) position++; };
    const consume = token => {
        skipSpace();
        if (!source.startsWith(token, position)) return false;
        position += token.length;
        return true;
    };
    const expect = token => {
        if (!consume(token)) throw new SyntaxError(`Expected ${token} at ${position}`);
    };
    function atom() {
        if (consume('sqrt')) {
            expect('(');
            const argument = sum();
            expect(')');
            return `\\sqrt{${argument}}`;
        }
        if (consume('(')) {
            const value = sum();
            expect(')');
            return `\\left(${value}\\right)`;
        }
        skipSpace();
        const number = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(source.slice(position));
        if (!number) throw new SyntaxError(`Expected a number at ${position}`);
        position += number[0].length;
        const [coefficient, exponent] = number[0].split(/[eE]/);
        return exponent === undefined ? coefficient : `${coefficient} \\times 10^{${exponent}}`;
    }
    function power() {
        const base = atom();
        return consume('^') ? `{${base}}^{${unary()}}` : base;
    }
    function unary() {
        if (consume('-')) return `-${unary()}`;
        if (consume('+')) return `+${unary()}`;
        return power();
    }
    function product() {
        let value = unary();
        while (true) {
            if (consume('*')) value += ` \\times ${unary()}`;
            else if (consume('/')) value += ` \\div ${unary()}`;
            else return value;
        }
    }
    function sum() {
        let value = product();
        while (true) {
            if (consume('+')) value += ` + ${product()}`;
            else if (consume('-')) value += ` - ${product()}`;
            else return value;
        }
    }
    const tex = sum();
    skipSpace();
    if (position !== source.length) throw new SyntaxError(`Unexpected input at ${position}`);
    return tex;
}

export function renderEquation(element, expression, target, renderer = globalThis.katex) {
    const plainText = `${expression} = ${target}`;
    try {
        if (!renderer) throw new Error('Math renderer unavailable');
        renderer.render(`${expressionToTex(expression)} = ${expressionToTex(String(target))}`, element, {
            displayMode: true,
            throwOnError: true,
            trust: false,
        });
        element.dataset.rendering = 'math';
    } catch {
        // Never display parser diagnostics or raw TeX in place of the equation.
        element.textContent = plainText;
        element.dataset.rendering = 'plain';
    }
}
