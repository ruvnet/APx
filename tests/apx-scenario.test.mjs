import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { powerMetrics } from '../benchmark/src/metrics.mjs';

const source=await readFile(new URL('../lib/scenario-metrics.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {scenarioMetrics}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
test('all calculator settings match reference APx arithmetic',()=>{
  for(const accepted of [0,1,8,20,32]) for(const minutes of [15,120,480,600]) for(const wall of [.25,2,8,16]) {
    const a=scenarioMetrics(accepted,minutes,wall,30,12);
    const b=powerMetrics(a.credit,wall);
    assert.equal(a.power,b.AP);assert.equal(a.exponent,b.APx);
  }
});
test('calculator rejects invalid values',()=>{
  for(const values of [[-1,120,2,30,12],[1,0,2,30,12],[1,120,0,30,12],[1,120,2,-1,12],[1,120,2,30,NaN],[1.5,120,2,30,12]]) assert.throws(()=>scenarioMetrics(...values));
});
test('cost and labor do not change throughput but remain separate ratios',()=>{
  const a=scenarioMetrics(8,120,2,30,12);const b=scenarioMetrics(8,120,2,0,0);
  assert.equal(a.power,b.power);assert.equal(a.leverage,32);assert.equal(b.leverage,null);assert.equal(a.costPerHumanHour,.75);
});
