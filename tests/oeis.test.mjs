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
