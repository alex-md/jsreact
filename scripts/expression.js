function p (e) {
    function k (h) {
        return e.next(h);
    }
    function l (h) {
        return e.throw(h);
    }
    return new Promise(function (h, m) {
        function n (a) {
            a.done ? h(a.value) : Promise.resolve(a.value).then(k, l).then(n, m);
        }
        n(e.next());
    });
}
document.addEventListener("DOMContentLoaded", function () {
    function e (a, b = 0, c = a.length) {
        if (1 == c - b) {
            return [a[b]];
        }
        let d = [];
        for (let f = b + 1; f < c; f += 2) {
            let g = e(a, b, f), q = e(a, f + 1, c);
            g.forEach(r => {
                q.forEach(t => {
                    d.push(`(${r}${a[f]}${t})`);
                });
            });
        }
        return d;
    }
    function k (a, b) {
        try {
            return eval(a) === b;
        } catch (c) {
            if (c instanceof SyntaxError || c instanceof ReferenceError || c instanceof EvalError) {
                return !1;
            }
            throw c;
        }
    }
    function* l (a, b) {
        if (1 === a.length) {
            yield a[0].toString();
        } else {
            for (let c of h(a)) {
                for (let d of m(b, a.length - 1)) {
                    let f = [];
                    for (let g = 0; g < c.length; g++) {
                        0 < g && f.push(d[g - 1]), f.push(c[g].toString());
                    }
                    for (let g of e(f)) {
                        yield g;
                    }
                }
            }
        }
    }
    function* h (a) {
        if (0 === a.length) {
            yield [];
        } else {
            for (let b = 0; b < a.length; b++) {
                for (let c of h(a.slice(0, b).concat(a.slice(b + 1)))) {
                    yield [a[b], ...c];
                }
            }
        }
    }
    function* m (a, b) {
        if (0 === b) {
            yield [];
        } else {
            for (let c of a) {
                for (let d of m(a, b - 1)) {
                    yield [c, ...d];
                }
            }
        }
    }
    function n (a, b) {
        return new Promise(c => {
            setTimeout(() => {
                a: {
                    var d = ["+", "-", "*", "/"];
                    document.getElementById("exponents-checkbox").checked && d.push("**");
                    for (let f of l(a, d)) {
                        if (k(f, b)) {
                            d = f;
                            break a;
                        }
                    }
                    d = "No solution found";
                }
                c(d);
            }, 800);
        });
    }
    document.getElementById("random-numbers-button").addEventListener("click", function (a) {
        a.preventDefault();
        a = document.getElementById("num-integers-input").value || 6;
        let b = document.getElementById("max-number-input").value || 60;
        a = Array.from({ length: a }, () => Math.floor(Math.random() * b) + 1);
        document.getElementById("numbers-input").value = a.join(",");
    });
    document.getElementById("submit-button").addEventListener("click", function (a) {
        return p(function* () {
            a.preventDefault();
            let b = document.getElementById("submit-button");
            b.innerHTML = "Calculating...";
            var c = document.getElementById("numbers-input").value, d = document.getElementById("target-input").value;
            c = c.split(",").map(Number);
            d = yield n(c, Number(d));
            document.getElementById("solution-output").innerHTML = d;
            b.innerHTML = "Find expression";
        }());
    });
});
document.addEventListener("DOMContentLoaded", function () {
    let e = document.querySelector("#advancedSettings");
    document.querySelector(".text-end a").addEventListener("click", function () {
        "none" === e.style.display ? e.style.display = "block" : e.style.display = "none";
    });
    e.querySelectorAll('input[type="number"]').forEach(function (k) {
        k.addEventListener("click", function (l) {
            l.stopPropagation();
        });
    });
});
