import test from 'node:test';
import assert from 'node:assert/strict';
import { fitAndForecast, STATS_ENGINE, MODELS } from '../src/oeis/engine.js';
import { findExactPattern } from '../src/oeis/exact.js';
import { parseSequence } from '../src/oeis/input.js';

test('exact continuations: Fibonacci, Lucas, Tribonacci, polynomials and alternating periods', () => {
    for (const [sequence, next] of [
        [[0,1,1,2,3,5,8,13], ['21','34','55']],
        [[2,1,3,4,7,11,18,29], ['47','76','123']],
        [[0,0,1,1,2,4,7,13,24,44], ['81','149','274']],
        [[1,4,9,16,25], ['36','49','64']],
        [[1,8,27,64,125,216], ['343','512','729']],
        [[5,5,5], ['5','5','5']],
        [[0,0,0], ['0','0','0']],
        [[1,-1,1,-1,1,-1], ['1','-1','1']],
        [[1,2,4], ['8','16','32']],
        [[1,2,3], ['4','5','6']],
    ]) {
        const result = fitAndForecast(sequence, 3);
        assert.equal(result.exact, true);
        assert.deepEqual(result.ensembleForecast.map(f => f.value), next);
        assert.ok(result.ensembleForecast.every(f => f.lo === null && f.hi === null));
        structuredClone(result);
    }
});

test('exact solver validates held-out terms and preserves arbitrarily large output integers', () => {
    assert.equal(findExactPattern([0,1,1,2,3,5,8,14], 2), null);
    assert.equal(findExactPattern([1.1,2.2,4.4,8.8], 2), null);
    const result = fitAndForecast([1,2,4,8,16,32], 50);
    assert.equal(result.ensembleForecast.at(-1).value, '36028797018963968');
});

test('parser supports signed decimals, exponent notation and rejects corruption', () => {
    assert.deepEqual(parseSequence('1e3, -2.5; +.3\n4E-2'), [1000,-2.5,0.3,0.04]);
    for (const input of ['1, nope, 3', '1, 0x10, 3', '1, Infinity, 3', '9007199254740993,2,3', '1e-999,2,3', '1.0000000000000001,2,3']) assert.throws(() => parseSequence(input));
    assert.throws(() => parseSequence(Array(201).fill(1).join(',')));
    for (const h of [0,51,NaN,1.5]) assert.throws(() => fitAndForecast([1,2,3],h));
});

test('metrics handle constant targets, zero values and unavailable percentage errors', () => {
    assert.equal(STATS_ENGINE.metrics([5,5,5],[5,5,5]).r2, 1);
    assert.equal(STATS_ENGINE.metrics([5,5,5],[4,4,4]).r2, 0);
    assert.equal(STATS_ENGINE.metrics([0,2,4],[1,1,2]).mape, 0.5);
    assert.equal(STATS_ENGINE.metrics([0,0],[0,0]).mape, null);
});

test('detrended lag detection finds noncalendar periods and rejects linear drift', () => {
    for (const period of [2,3,5,8,12]) {
        const pattern = Array.from({length:period}, (_,i) => i === 0 ? 10 : -1);
        const values = Array.from({length:period*6},(_,i) => pattern[i%period] + i*0.03);
        assert.equal(STATS_ENGINE.detectSeasonality(values), period);
    }
    assert.equal(STATS_ENGINE.detectSeasonality(Array.from({length:50},(_,i)=>3*i+2)),1);
    assert.equal(STATS_ENGINE.detectSeasonality(Array(20).fill(5)),1);
});

test('Householder regression solves coefficients and prediction leverage grows with distance', () => {
    const result = STATS_ENGINE.leastSquares([[1,1],[1,2],[1,3],[1,4]], [3,5,7,9]);
    assert.ok(Math.abs(result.beta[0]-1)<1e-10);
    assert.ok(Math.abs(result.beta[1]-2)<1e-10);
    const near = STATS_ENGINE.linearModelInterval([1,2.5],result.R,1,1)(0)[1];
    const far = STATS_ENGINE.linearModelInterval([1,20],result.R,1,1)(0)[1];
    assert.ok(far>near*3);
});

test('exponential smearing estimates means while transformed intervals retain log-fit center', () => {
    const values = [1.3,1.7,3.3,3.7,5.3,5.7,7.3,7.7].map((v,i)=>Math.exp(0.1*v+0.3*i));
    const model=MODELS.find(m=>m.key==='exp').fit(values);
    const logFit=STATS_ENGINE.robustOls(values.map((_,i)=>[1,i+1]),values.map(Math.log));
    assert.ok(model.predict(9) >= Math.exp(logFit.beta[0]+9*logFit.beta[1]));
    const [lo,hi]=model.interval(9,1.96,model.predict(9));
    assert.ok(Math.abs(Math.log(lo*hi)/2-(logFit.beta[0]+9*logFit.beta[1]))<1e-8);
});

test('nonseasonal ARIMA executes, bounded seasonal factors and forecasts remain finite', () => {
    const model = MODELS.find(m=>m.key==='auto_seasonal_arima');
    const data=Array.from({length:45},(_,i)=>20+0.1*i+Math.sin(i*1.7)+Math.cos(i*0.3));
    const fit=model.fit(data);
    assert.match(fit.name,/ARIMA/);
    for (const [key,value] of Object.entries(fit.params)) if (key.startsWith('coefficient')) assert.ok(Math.abs(value)<=0.98);
    for (let h=1;h<=50;h++) assert.ok(Number.isFinite(fit.predict(data.length+h)));
    assert.equal(fit.predict(46),fit.predict(46));
});

test('noisy data produces finite serializable forecasts including the shortest allowed input', () => {
    for (const sequence of [[1.1,2.9,2.2],Array.from({length:65},(_,i)=>20+Math.sin(i)*3+i*0.1)]) {
        const result=fitAndForecast(sequence,10);
        assert.equal(result.exact,false);
        assert.ok(result.ensembleForecast.every(f=>[f.value,f.lo,f.hi].every(Number.isFinite)));
        assert.ok(Math.abs(result.weights.reduce((a,b)=>a+b,0)-1)<1e-10);
        structuredClone(result);
    }
});

test('repeating patterns can be verified from two cycles without fitting a full recurrence', () => {
    const result=fitAndForecast([2,7,-3,2,7,-3],4);
    assert.equal(result.exact,true);
    assert.deepEqual(result.ensembleForecast.map(f=>f.value),['2','7','-3','2']);
});

test('seasonal ARIMA searches noncalendar factors and preserves forecast trend', () => {
    const sequence=Array.from({length:60},(_,i)=>10+i*0.2+[7,-4,2][i%3]+Math.sin(i*2.72)*0.2);
    const fit=MODELS.find(m=>m.key==='auto_seasonal_arima').fit(sequence);
    assert.equal(fit.params.period,3);
    const predictions=Array.from({length:12},(_,i)=>fit.predict(sequence.length+i+1));
    assert.ok(predictions.every(Number.isFinite));
    assert.ok(Math.abs(predictions[3]-predictions[0]-0.6)<1);
});

// Superseeker ports: independent mathematical fixtures and inverse identities.
import { rat, eq, str } from '../src/oeis/rational.js';
import { transform, TRANSFORM_CATALOG, exploreTransforms } from '../src/oeis/transforms.js';
import { beattyTest } from '../src/oeis/superseeker.js';
const rationals = a => a.map(v => rat(BigInt(v)));
const transformed = (id, a) => transform(id, rationals(a)).map(str);

test('Rate quotient and holonomic methods continue factorial, Catalan and central binomial sequences', () => {
    for (const [seq, expected] of [
        [[1,2,6,24,120,720,5040], ['40320','362880','3628800']],
        [[1,1,2,5,14,42,132,429,1430,4862,16796,58786], ['208012','742900','2674440']],
        [[1,2,6,20,70,252,924,3432,12870,48620], ['184756','705432','2704156']],
        [[1,2,8,64,1024,32768], ['2097152','268435456','68719476736']],
        // Motzkin needs an order-2 recurrence or algebraic GF.
        [[1,1,2,4,9,21,51,127,323,835,2188,5798,15511,41835], ['113634','310572','853467']],
    ]) {
        const r = findExactPattern(seq, 3);
        assert.ok(r, seq.join(','));
        assert.deepEqual(r.ensembleForecast.map(v => v.value), expected);
        structuredClone(r);
    }
});

test('periodic differences wrap correctly for arbitrary horizons', () => {
    const seq=[0,1,4,6,7,10,12,13,16,18,19,22];
    const result=findExactPattern(seq,8);
    const fit=result.fits.find(f=>f.key==='periodic-differences');
    assert.ok(fit);
    assert.deepEqual(fit.continuation,['24','25','28','30','31','34','36','37']);
});

test('fan, transformed recognition, algebraic GF and interleaving expose exact alternatives', () => {
    const fan=findExactPattern([1,2,4,8,16,32,64,128],3).fits.find(f=>f.key.startsWith('difference-fan'));
    assert.ok(fan);
    assert.deepEqual(fan.continuation,['256','512','1024']);
    const catalan=findExactPattern([1,1,2,5,14,42,132,429,1430,4862],3);
    const gf=catalan.fits.find(f=>f.key==='algebraic-gf');
    assert.ok(gf);
    assert.deepEqual(gf.continuation,['16796','58786','208012']);
    const bell=findExactPattern([1,2,5,15,52,203,877,4140,21147,115975],3);
    assert.deepEqual(bell.fits.find(f=>f.key==='transform-115').continuation,['678570','4213597','27644437']);
    const interleaved=findExactPattern([1,3,2,9,3,27,4,81,5,243,6,729],3);
    assert.deepEqual(interleaved.fits.find(f=>f.key==='interleaved-2').continuation,['7','2187','8']);
});

test('rational OGF numerator/denominator follow zero-based Fibonacci coefficients', () => {
    const fit=findExactPattern([0,1,1,2,3,5,8,13],3).fits.find(f=>f.key==='recurrence');
    assert.equal(fit.params['OGF numerator (ascending powers)'],'0, 1');
    assert.equal(fit.params['OGF denominator (ascending powers)'],'1, -1, -1');
});

test('transform catalog implements the 111 operational transforms, leaving original placeholders out', () => {
    assert.equal(TRANSFORM_CATALOG.length,111);
    assert.equal(new Set(TRANSFORM_CATALOG.map(t=>t.id)).size,111);
    for (const id of [95,96,97,98]) assert.ok(!TRANSFORM_CATALOG.some(t=>t.id===id));
    const a=rationals([1,2,3,4,5,6]);
    for (const t of TRANSFORM_CATALOG) {
        const result=transform(t.id,a);
        assert.ok(Array.isArray(result),t.code);
        assert.ok(result.every(v=>v.length===2&&typeof v[0]==='bigint'&&v[1]>0n),t.code);
    }
    for (const [forward,inverse] of [[100,101],[104,105],[114,115],[112,111],[108,109],[102,103],[15,15]]) {
        for (const seq of [[1,-2,3,0,5,6],[1,1,1,1,1,1]]) {
            const a=rationals(seq), b=transform(inverse,transform(forward,a));
            assert.equal(b.length,a.length);
            assert.ok(b.every((v,i)=>eq(v,a[i])),`${forward}/${inverse}`);
        }
    }
});

test('classical transform fixtures retain signs, factorial indexing, and completed runs', () => {
    assert.deepEqual(transformed(100,[1,1,1,1,1]),['1','2','4','8','16']);
    assert.deepEqual(transformed(101,[1,2,4,8,16]),['1','1','1','1','1']);
    assert.deepEqual(transformed(104,[1,1,1,1,1,1,1,1]),['1','2','3','5','7','11','15','22']);
    assert.deepEqual(transformed(106,[1,1,1,1,1,1]),['1','2','5','15','52','203']);
    assert.deepEqual(transformed(110,[1,2,5,15,52,203]),['1','1','1','1','1','1']);
    assert.deepEqual(transformed(114,[1,1,1,1,1,1]),['1','2','5','15','52','203']);
    assert.deepEqual(transformed(112,[1,1,1,1,1,1]),['1','2','2','3','2','4']);
    assert.deepEqual(transformed(14,[1,1,1,1]),['1','2','3','4']);
    assert.deepEqual(transformed(55,[1,1,1,1]),['1','2','4','8']);
    assert.deepEqual(transformed(8,[1,1,2,6,24]),['1','1','1','1','1']);
    assert.deepEqual(transformed(10,[1,2,6,24,120]),['1','1','1','1','1']);
    assert.deepEqual(transformed(5,[99,42,6,12,18]),['1','2','3']);
    const binary=exploreTransforms([5,5,-2,-2,-2,5,-2]).binary;
    assert.deepEqual(binary.map(b=>b.values),[
        ['1','1','2','2','2','1','2'],['2','2','1','1','1','2','1'],['1','2','6'],['3','4','5','7'],['2','3','1'],['2','5','6'],
    ]);
});

test('diagonal transforms preserve the source’s shifted and factorial conventions', () => {
    assert.deepEqual(transformed(50,[1,1,1,1]),['1','-1','1','-1']);
    assert.deepEqual(transformed(51,[1,1,1,1]),['1','3','7','15']);
    assert.deepEqual(transformed(52,[1,1,1,1]),['1','3','10','35']);
    assert.deepEqual(transformed(53,[1,1,1,1]),['1','-1','4','-13']);
    assert.deepEqual(transformed(91,[1,2,6,24]),['1','-1','2','-6']);
});

test('Beatty reports an exact half-open interval rather than an unjustified exact forecast', () => {
    const seq=Array.from({length:15},(_,i)=>Math.floor((i+1)*Math.sqrt(2)));
    const r=beattyTest(rationals(seq));
    assert.ok(r);
    const value=s=>s.split('/').map(Number).reduce((n,d)=>n/d);
    assert.ok(value(r.lower)<=Math.sqrt(2)&&value(r.upper)>Math.sqrt(2));
    assert.equal(beattyTest(rationals([2,1,20])),null);
    assert.equal(beattyTest(rationals([0,2,3])),null); // empty interval at an excluded upper bound
});

test('new rule guesses reject perturbed holdouts, handle singularities and bound previews', () => {
    assert.equal(findExactPattern([1,2,6,24,120,720,5041],3),null);
    assert.equal(findExactPattern([1,1,2,5,14,42,132,429,1430,4863],3),null);
    const result=fitAndForecast(Array.from({length:40},(_,i)=>i+1),3);
    assert.equal(result.exploration.termsUsed,32);
    assert.ok(result.exploration.transforms.every(t=>t.values.length<=33));
    assert.ok(exploreTransforms([0,1,2,3]).skipped.includes('T015'));
    assert.ok(exploreTransforms([-1,0,1,2]).transforms.find(t=>t.code==='T011').values.includes('-2'));
    assert.deepEqual(exploreTransforms([1.2,3.4,5.6]).transforms,[]);
    structuredClone(result);
});

import { forecastValue, formatForecast } from '../src/oeis/forecast-format.js';

test('reported factorial-driven sequence predicts 416386 using a discovered rule', () => {
    const result=fitAndForecast([1,3,10,37,167,924,6131,47375],5);
    assert.equal(result.exact,true);
    assert.equal(result.bestFit.key,'factorial-recurrence');
    assert.deepEqual(result.ensembleForecast.map(f=>f.value),['416386','4092561','44425747','527519908','6798966455']);
    assert.equal(result.bestFit.params['a(n−1) coefficient'],'1');
    assert.equal(result.bestFit.params['a(n−2) coefficient'],'1');
    assert.equal(result.bestFit.params['factorial coefficient'],'1');
    assert.equal(result.bestFit.params['factorial index offset'],1);
    // No lookup table: different initial values, weights and index offsets.
    for (const offset of [0,2,3]) {
        const factorial=n=>{let f=1n;for(let k=2;k<=n;k++)f*=BigInt(k);return f;};
        const values=[2n,7n];
        for(let n=2;n<13;n++) values.push(2n*values[n-1]-values[n-2]+3n*factorial(n+offset));
        const r=fitAndForecast(values.slice(0,10).map(Number),3);
        assert.equal(r.bestFit.key,'factorial-recurrence');
        assert.deepEqual(r.ensembleForecast.map(f=>f.value),values.slice(10).map(String));
    }
    const changed=findExactPattern([1,3,10,37,167,924,6131,47376],3);
    assert.ok(!changed || !changed.fits.some(f=>f.key==='factorial-recurrence'));
});

test('rapid growth fallback uses relative errors and rejects reversing forecast paths', () => {
    const sequence=[4,400,40000,5000000,70000000];
    const r=fitAndForecast(sequence,10);
    assert.equal(r.exact,false);
    assert.equal(r.scoreMetric,'RMS log error');
    assert.ok(r.fits.some(f=>f.key==='local-growth'));
    assert.ok(!r.fits.some(f=>f.key==='naive'));
    assert.ok(r.ensembleForecast.every((f,i,all)=>f.value>(i ? all[i-1].value : sequence.at(-1))));
    assert.ok(r.ensembleForecast.every(f=>f.lo>0 && f.lo<f.value && f.value<f.hi));
    const origins=[3,4];
    const model=MODELS.find(m=>m.key==='local-growth');
    const expected=Math.sqrt(origins.reduce((sum,i)=>sum+(Math.log(sequence[i])-Math.log(model.fit(sequence.slice(0,i)).predict(i+1)))**2,0)/origins.length);
    assert.ok(Math.abs(r.fits.find(f=>f.key==='local-growth').score-expected)<1e-12);
    assert.ok(Math.abs(r.weights.reduce((sum,w)=>sum+w,0)-1)<1e-12);
    structuredClone(r);
});

test('growth heuristics support decay while leaving mixed and seasonal data unconstrained', () => {
    const decay=[10000,800,90,7,0.6];
    const r=fitAndForecast(decay,10);
    assert.equal(r.exact,false);
    assert.equal(r.scoreMetric,'RMS log error');
    assert.ok(r.ensembleForecast.every((f,i,all)=>f.value>0 && f.value<(i?all[i-1].value:decay.at(-1))));
    for(const seq of [[5.2,1.1,8.7,2.4,9.1],[-4.2,-40.8,-400.2,-5000.1,-7000.3],[10.1,10.2,10.25,10.3,10.4]]) {
        const fit=fitAndForecast(seq,5);
        assert.equal(fit.exact,false);
        assert.equal(fit.scoreMetric,'Validation RMSE');
        assert.ok(fit.ensembleForecast.every(f=>[f.value,f.lo,f.hi].every(Number.isFinite)));
    }
});

test('recent growth model is anchored, damped and independent of a fitted global intercept', () => {
    const growth=MODELS.find(m=>m.key==='local-growth').fit([4,400,40000,5000000,70000000]);
    assert.ok(Math.abs(growth.predict(6)/(70000000*14**0.9)-1)<1e-12);
    const forecasts=Array.from({length:10},(_,i)=>growth.predict(i+6));
    assert.ok(forecasts[1]/forecasts[0] < forecasts[0]/70000000);
    // Historical predictions cannot use the observation being predicted.
    const additive=MODELS.find(m=>m.key==='local-drift');
    const prefix=[1,2,4,8], extended=[...prefix,1000];
    assert.deepEqual(additive.fit(prefix).yhat,additive.fit(extended).yhat.slice(0,4));
    assert.equal(additive.fit(extended).yhat.at(-1),additive.fit(prefix).predict(5));
});

test('forecast display, copy and CSV values round consistently without changing exact strings', () => {
    assert.equal(forecastValue(79998.26410175193),'79998');
    assert.equal(formatForecast(79998.26410175193),'79,998');
    assert.equal(forecastValue(123.9),'124');
    assert.equal(forecastValue(-123.9),'-124');
    assert.equal(forecastValue(null),'');
    assert.equal(forecastValue('9007199254740993123456789'),'9007199254740993123456789');
    assert.equal(forecastValue('3/2'),'3/2');
    assert.match(forecastValue(1.23e25),/^\d+$/);
    const r=fitAndForecast([4,400,40000,5000000,70000000],3);
    assert.ok(r.ensembleForecast.every(f=>Number.isFinite(f.value)&&/^\d+$/.test(forecastValue(f.value))));
});
