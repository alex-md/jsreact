var $parcel$global=globalThis,$parcel$modules={},$parcel$inits={},parcelRequire=$parcel$global.parcelRequire10ab;null==parcelRequire&&(parcelRequire=function(e){if(e in $parcel$modules)return $parcel$modules[e].exports;if(e in $parcel$inits){var t=$parcel$inits[e];delete $parcel$inits[e];var n={id:e,exports:{}};return $parcel$modules[e]=n,t.call(n.exports,n,n.exports),n.exports}var r=new Error("Cannot find module '"+e+"'");throw r.code="MODULE_NOT_FOUND",r},parcelRequire.register=function(e,t){$parcel$inits[e]=t},$parcel$global.parcelRequire10ab=parcelRequire);var parcelRegister=parcelRequire.register;parcelRegister("48snt",(function(module,exports){function p(e){function t(t){return e.next(t)}function n(t){return e.throw(t)}return new Promise((function(r,o){!function e(l){l.done?r(l.value):Promise.resolve(l.value).then(t,n).then(e,o)}(e.next())}))}document.addEventListener("DOMContentLoaded",(function(){function e(t,n=0,r=t.length){if(1==r-n)return[t[n]];let o=[];for(let l=n+1;l<r;l+=2){let i=e(t,n,l),u=e(t,l+1,r);i.forEach((e=>{u.forEach((n=>{o.push(`(${e}${t[l]}${n})`)}))}))}return o}function k(a,b){try{return eval(a)===b}catch(e){if(e instanceof SyntaxError||e instanceof ReferenceError||e instanceof EvalError)return!1;throw e}}function*l(t,n){if(1===t.length)yield t[0].toString();else for(let r of h(t))for(let o of m(n,t.length-1)){let t=[];for(let e=0;e<r.length;e++)0<e&&t.push(o[e-1]),t.push(r[e].toString());for(let n of e(t))yield n}}function*h(e){if(0===e.length)yield[];else for(let t=0;t<e.length;t++)for(let n of h(e.slice(0,t).concat(e.slice(t+1))))yield[e[t],...n]}function*m(e,t){if(0===t)yield[];else for(let n of e)for(let r of m(e,t-1))yield[n,...r]}function n(e,t){return new Promise((n=>{setTimeout((()=>{e:{var r=["+","-","*","/"];document.getElementById("exponents-checkbox").checked&&r.push("**");for(let n of l(e,r))if(k(n,t)){r=n;break e}r="No solution found"}n(r)}),800)}))}document.getElementById("random-numbers-button").addEventListener("click",(function(e){e.preventDefault(),e=document.getElementById("num-integers-input").value||6;let t=document.getElementById("max-number-input").value||60;e=Array.from({length:e},(()=>Math.floor(Math.random()*t)+1)),document.getElementById("numbers-input").value=e.join(",")})),document.getElementById("submit-button").addEventListener("click",(function(e){return p(function*(){e.preventDefault();let t=document.getElementById("submit-button");t.innerHTML="Calculating...";var r=document.getElementById("numbers-input").value,o=document.getElementById("target-input").value;r=r.split(",").map(Number),o=yield n(r,Number(o)),document.getElementById("solution-output").innerHTML=o,t.innerHTML="Find expression"}())}))})),document.addEventListener("DOMContentLoaded",(function(){let e=document.querySelector("#advancedSettings");document.querySelector(".text-end a").addEventListener("click",(function(){"none"===e.style.display?e.style.display="block":e.style.display="none"})),e.querySelectorAll('input[type="number"]').forEach((function(e){e.addEventListener("click",(function(e){e.stopPropagation()}))}))}))})),parcelRequire("48snt");
//# sourceMappingURL=expression.84152da7.js.map
