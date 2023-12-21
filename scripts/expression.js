document.addEventListener("DOMContentLoaded",function(){function insertParentheses(t,n=0,o=t.length){if(o-n==1)return[t[n]];let r=[];for(let u=n+1;u<o;u+=2){let l=insertParentheses(t,n,u),i=insertParentheses(t,u+1,o);l.forEach(n=>{i.forEach(o=>{r.push(`(${n}${t[u]}${o})`)})})}return r}function calculateAndCompare(expression,target){try{return 1e-2>Math.abs(eval(expression)-target)}catch(e){if(e instanceof SyntaxError||e instanceof ReferenceError||e instanceof EvalError)return!1;throw e}}function findExpression(t,n){for(let o of generateAllExpressions(t,["+","-","*","/","**"]))if(calculateAndCompare(o,n))return o;return"No solution found"}function*generateAllExpressions(t,n){if(1===t.length){yield t[0].toString();return}for(let o of permutations(t))for(let r of product(n,t.length-1)){let t=[];for(let n=0;n<o.length;n++)n>0&&t.push(r[n-1]),t.push(o[n].toString());for(let n of insertParentheses(t))yield n}}function*permutations(t){if(0===t.length){yield[];return}for(let n=0;n<t.length;n++)for(let o of permutations(t.slice(0,n).concat(t.slice(n+1))))yield[t[n],...o]}function*product(t,n){if(0===n){yield[];return}for(let o of t)for(let r of product(t,n-1))yield[o,...r]}function findExpressionAsync(t,n){return new Promise(o=>{setTimeout(()=>{o(findExpression(t,n))},800)})}document.getElementById("random-numbers-button").addEventListener("click",function(t){t.preventDefault();let n=document.getElementById("num-integers-input").value||6,o=document.getElementById("max-number-input").value||60,r=Array.from({length:n},()=>Math.floor(Math.random()*o)+1);document.getElementById("numbers-input").value=r.join(",")}),document.getElementById("submit-button").addEventListener("click",async function(t){t.preventDefault();let n=document.getElementById("submit-button");n.innerHTML="Calculating...";let o=document.getElementById("numbers-input").value,r=document.getElementById("target-input").value,u=o.split(",").map(Number),l=Number(r),i=await findExpressionAsync(u,l);document.getElementById("solution-output").innerHTML=i,n.innerHTML="Find expression"})}),document.addEventListener("DOMContentLoaded",function(){document.querySelector(".text-end");let t=document.querySelector("#advancedSettings");document.querySelector(".text-end a").addEventListener("click",function(){"none"===t.style.display?t.style.display="block":t.style.display="none"}),t.querySelectorAll('input[type="number"]').forEach(function(t){t.addEventListener("click",function(t){t.stopPropagation()})})});
