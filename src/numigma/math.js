const mathCache = new Map();
function memoize(key, compute) {
    if (mathCache.has(key)) {
        return mathCache.get(key);
    }
    const value = compute();
    mathCache.set(key, value);
    return value;
}
function digitsOf(n) {
    return memoize(`digits:${n}`, () => n.toString().split('').map(Number));
}
export function digitSum(n) {
    return memoize(`digit-sum:${n}`, () => digitsOf(n).reduce((acc, d) => acc + d, 0));
}
export function digitProduct(n) {
    return memoize(`digit-product:${n}`, () => digitsOf(n).reduce((acc, d) => acc * d, 1));
}
export function isPalindrome(n, base = 10) {
    return memoize(`pal:${base}:${n}`, () => {
        const repr = n.toString(base);
        return repr === repr.split('').reverse().join('');
    });
}
export function isDigitsNonDecreasing(n) {
    return memoize(`digits-nondecrease:${n}`, () => {
        const digits = digitsOf(n);
        for (let i = 1; i < digits.length; i += 1) {
            if (digits[i] < digits[i - 1]) {
                return false;
            }
        }
        return true;
    });
}
export function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) {
        [x, y] = [
            y,
            x % y
        ];
    }
    return x;
}
export function lcm(a, b) {
    if (a === 0 || b === 0) return 0;
    return Math.abs(a / gcd(a, b) * b);
}
export function primeFactors(n) {
    return memoize(`prime-factors:${n}`, () => {
        const factors = new Map();
        let value = n;
        while (value % 2 === 0) {
            factors.set(2, (factors.get(2) || 0) + 1);
            value /= 2;
        }
        let divisor = 3;
        while (divisor * divisor <= value) {
            while (value % divisor === 0) {
                factors.set(divisor, (factors.get(divisor) || 0) + 1);
                value /= divisor;
            }
            divisor += 2;
        }
        if (value > 1) {
            factors.set(value, (factors.get(value) || 0) + 1);
        }
        return factors;
    });
}
export function isPrime(n) {
    if (n < 2) return false;
    return memoize(`prime:${n}`, () => {
        if (n === 2) return true;
        if (n % 2 === 0) return false;
        for (let i = 3; i * i <= n; i += 2) {
            if (n % i === 0) return false;
        }
        return true;
    });
}
export function divisorCount(n) {
    return memoize(`divcount:${n}`, () => {
        let count = 1;
        primeFactors(n).forEach((exp) => {
            count *= exp + 1;
        });
        return count;
    });
}
function sumOfDivisors(n) {
    return memoize(`sumdiv:${n}`, () => {
        let total = 1;
        primeFactors(n).forEach((exp, prime) => {
            total *= (prime ** (exp + 1) - 1) / (prime - 1);
        });
        return total;
    });
}
export function eulerTotient(n) {
    return memoize(`totient:${n}`, () => {
        let result = n;
        primeFactors(n).forEach((_, prime) => {
            result = result * (1 - 1 / prime);
        });
        return Math.round(result);
    });
}
export function isAbundant(n) {
    return memoize(`abundant:${n}`, () => sumOfDivisors(n) - n > n);
}
export function isPerfectSquare(n) {
    const r = Math.round(Math.sqrt(n));
    return r * r === n;
}
export function isPerfectCube(n) {
    const r = Math.round(Math.cbrt(n));
    return r * r * r === n;
}
export function isPerfectFourthPower(n) {
    const r = Math.round(Math.pow(n, 0.25));
    return r ** 4 === n;
}
function isPowerOfTwo(n) {
    if (n <= 0) return false;
    return (n & n - 1) === 0;
}
export function isTriangular(n) {
    return memoize(`triangular:${n}`, () => {
        const d = 8 * n + 1;
        const sqrt = Math.sqrt(d);
        return Number.isInteger(sqrt) && (sqrt - 1) % 2 === 0;
    });
}
export function isFibonacci(n) {
    return memoize(`fibonacci:${n}`, () => isPerfectSquare(5 * n * n + 4) || isPerfectSquare(5 * n * n - 4));
}
export function describeBaseNumber(n) {
    if (isPerfectSquare(n)) return 'a perfect square';
    if (isPerfectCube(n)) return 'a perfect cube';
    if (isTriangular(n)) return 'a triangular number';
    if (isFibonacci(n)) return 'a Fibonacci number';
    if (isPrime(n)) return 'a prime number';
    if (n % 2 === 0) return 'an even number';
    return 'an odd number';
}
export function describeDeltaAmount(n) {
    const descriptors = [
        {
            matches: isPowerOfTwo,
            text: 'a power of two',
            predicate: (value) => isPowerOfTwo(value)
        },
        {
            matches: isPerfectSquare,
            text: 'a perfect square',
            predicate: (value) => isPerfectSquare(value)
        },
        {
            matches: isPerfectCube,
            text: 'a perfect cube',
            predicate: (value) => isPerfectCube(value)
        },
        {
            matches: isTriangular,
            text: 'a triangular number',
            predicate: (value) => isTriangular(value)
        },
        {
            matches: isFibonacci,
            text: 'a Fibonacci number',
            predicate: (value) => isFibonacci(value)
        },
        {
            matches: isPrime,
            text: 'a prime number',
            predicate: (value) => isPrime(value)
        }
    ];
    for (const descriptor of descriptors) {
        if (descriptor.matches(n)) {
            return {
                text: descriptor.text,
                predicate: descriptor.predicate
            };
        }
    }
    if (n % 2 === 0) {
        return {
            text: 'an even number',
            predicate: (value) => value % 2 === 0
        };
    }
    return {
        text: 'an odd number',
        predicate: (value) => value % 2 === 1
    };
}
export function factorialNumbersUpTo(limit) {
    return memoize(`factorials:${limit}`, () => {
        const values = new Set();
        let value = 1;
        let i = 1;
        while (value <= limit) {
            values.add(value);
            i += 1;
            value *= i;
        }
        return values;
    });
}
export function catalanNumbersUpTo(limit) {
    return memoize(`catalan:${limit}`, () => {
        const values = new Set([
            1
        ]);
        let n = 1;
        let value = 1;
        while (value <= limit) {
            value = value * 2 * (2 * n - 1) / (n + 1);
            values.add(Math.round(value));
            n += 1;
            if (value > limit * 4) break;
        }
        return values;
    });
}
export function bellNumbersUpTo(limit) {
    return memoize(`bell:${limit}`, () => {
        const bells = [
            1
        ];
        let n = 1;
        while (true) {
            const row = [
                bells[n - 1]
            ];
            for (let k = 1; k <= n; k += 1) {
                const value = row[k - 1] + (bells[k - 1] ?? 0);
                row.push(value);
            }
            const next = row[n];
            if (next > limit) break;
            bells.push(next);
            n += 1;
        }
        return new Set(bells);
    });
}
function sumOfProperDivisors(n) {
    return sumOfDivisors(n) - n;
}
export function isPerfectNumber(n) {
    return memoize(`perfect:${n}`, () => sumOfProperDivisors(n) === n);
}
export function isSphenic(n) {
    return memoize(`sphenic:${n}`, () => {
        const factors = primeFactors(n);
        if (factors.size !== 3) return false;
        for (const exp of factors.values()) {
            if (exp !== 1) {
                return false;
            }
        }
        return true;
    });
}
export function isSquareFree(n) {
    return memoize(`square-free:${n}`, () => {
        const factors = primeFactors(n);
        for (const exp of factors.values()) {
            if (exp > 1) {
                return false;
            }
        }
        return true;
    });
}
export function mobius(n) {
    return memoize(`mobius:${n}`, () => {
        if (n === 1) return 1;
        const factors = primeFactors(n);
        for (const exp of factors.values()) {
            if (exp > 1) {
                return 0;
            }
        }
        return factors.size % 2 === 0 ? 1 : -1;
    });
}
export function describeMobius(mu) {
    if (mu === 0) {
        return '0 (not square-free)';
    }
    if (mu === 1) {
        return '1 (square-free with an even number of prime factors)';
    }
    if (mu === -1) {
        return '-1 (square-free with an odd number of prime factors)';
    }
    return `${mu}`;
}
export function largestPrimeFactor(n) {
    return memoize(`largest-prime-factor:${n}`, () => {
        let largest = 1;
        primeFactors(n).forEach((_, prime) => {
            if (prime > largest) {
                largest = prime;
            }
        });
        return largest;
    });
}
export function reverseNumber(n) {
    return memoize(`reverse:${n}`, () => Number(n.toString().split('').reverse().join('')));
}
export function isBinaryPalindrome(n) {
    return memoize(`binary-pal:${n}`, () => {
        const representation = n.toString(2);
        return representation === representation.split('').reverse().join('');
    });
}
const digitFactorials = [
    1,
    1,
    2,
    6,
    24,
    120,
    720,
    5040,
    40320,
    362880
];
export function sumOfDigitFactorials(n) {
    return memoize(`digit-factorials:${n}`, () => digitsOf(n).reduce((acc, digit) => acc + digitFactorials[digit], 0));
}
export function digitsArithmeticProgressionStep(n) {
    return memoize(`digit-ap-step:${n}`, () => {
        const digits = digitsOf(n);
        if (digits.length < 3) {
            return null;
        }
        const step = digits[1] - digits[0];
        for (let i = 2; i < digits.length; i += 1) {
            if (digits[i] - digits[i - 1] !== step) {
                return null;
            }
        }
        return step;
    });
}
export function isHappyNumber(n) {
    return memoize(`happy:${n}`, () => {
        const seen = new Set();
        let value = n;
        while (value !== 1 && !seen.has(value)) {
            seen.add(value);
            value = digitSum(value ** 2);
        }
        return value === 1;
    });
}
export function isNarcissistic(n) {
    return memoize(`narcissistic:${n}`, () => {
        const digits = digitsOf(n);
        const power = digits.length;
        const total = digits.reduce((sum, d) => sum + d ** power, 0);
        return total === n;
    });
}
const highlyCompositeCache = new Set();
function computeHighlyCompositeUpTo(limit) {
    let maxDivisors = 0;
    for (let i = 1; i <= limit; i++) {
        const divs = divisorCount(i);
        if (divs > maxDivisors) {
            highlyCompositeCache.add(i);
            maxDivisors = divs;
        }
    }
}
export function isHighlyComposite(n) {
    // Precompute up to a reasonable limit if not already done
    const LIMIT = 10000;
    if (highlyCompositeCache.size === 0) {
        computeHighlyCompositeUpTo(LIMIT);
    }
    if (n <= LIMIT) {
        return highlyCompositeCache.has(n);
    }
    // Fallback to slow method for very large n
    return memoize(`highly-composite:${n}`, () => {
        const current = divisorCount(n);
        for (let i = 1; i < n; i += 1) {
            if (divisorCount(i) >= current) {
                return false;
            }
        }
        return true;
    });
}
export function binaryDigitCount(n) {
    return memoize(`binary-count:${n}`, () => n.toString(2).split('').filter((bit) => bit === '1').length);
}
export function quadraticResidueRemainders(modulus) {
    return memoize(`quadratic-residues:${modulus}`, () => {
        const residues = new Set();
        for (let i = 0; i < modulus; i += 1) {
            residues.add(i * i % modulus);
        }
        return residues;
    });
}
export function sumDigitsInBase(n, base) {
    return memoize(`digit-sum-base:${base}:${n}`, () => n.toString(base).split('').reduce((acc, char) => acc + parseInt(char, base), 0));
}
export function binaryLength(n) {
    return memoize(`binary-length:${n}`, () => n.toString(2).length);
}
