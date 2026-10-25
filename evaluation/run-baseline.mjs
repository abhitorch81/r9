// Translation probe: separate from full UI/end-to-end evaluation.
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);globalThis.math=require('../dist/vendor/math.js');
const {compileField}=await import('../dist/math-core.mjs');
const cases=JSON.parse(fs.readFileSync(new URL('./cases.json',import.meta.url)));
const model=process.env.FIELDTRIP_EVAL_MODEL||'gemma3:1b';
const endpoint=process.env.FIELDTRIP_EVAL_URL||'http://127.0.0.1:11434/api/generate';
const results=[];
for(const test of cases){const started=performance.now();let output='',correct=false,error=null;
 try{const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,stream:false,options:{temperature:0},format:{type:'object',properties:{components:{type:'array',items:{type:'string'},minItems:3,maxItems:3}},required:['components'],additionalProperties:false},prompt:'Translate the question to three Cartesian vector field components. Output JSON {"components":["-2*y","2*x","0"]}. Each string must be one scalar formula. Use x,y,z,a, explicit * and ^. No assignments, labels, LaTeX or commas inside a component. Question: '+test.question}),signal:AbortSignal.timeout(180000)});if(!response.ok)throw Error('HTTP '+response.status);const data=await response.json();output=data.response;const candidate=compileField(JSON.parse(output).components),expected=compileField(test.expected);correct=test.points.every(point=>{const actual=candidate.evaluate(point,1),gold=expected.evaluate(point,1);return actual&&gold&&actual.every((v,i)=>Math.abs(v-gold[i])<1e-7)});}catch(e){error=e.message}
 results.push({id:test.id,category:test.category,correct,error,output,seconds:(performance.now()-started)/1000});
 fs.writeFileSync(new URL('./baseline-rerun-results.json',import.meta.url),JSON.stringify({model,endpoint,createdAt:new Date().toISOString(),scope:'Translation-only probe; sampled equivalence, not symbolic proof. No repair pass. Not end-to-end app accuracy.',completed:results.length,total:cases.length,correct:results.filter(r=>r.correct).length,results},null,2));
 console.log(test.id,correct?'PASS':'FAIL',results.at(-1).seconds.toFixed(1)+'s');
}
