// Translation probe: separate from full UI/end-to-end evaluation.
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);globalThis.math=require('../dist/vendor/math.js');
const {compileField}=await import('../dist/math-core.mjs');
const cases=JSON.parse(fs.readFileSync(new URL('./cases.json',import.meta.url)));
const model=process.env.FIELDTRIP_EVAL_MODEL||'gemma3:1b';
const endpoint=process.env.FIELDTRIP_EVAL_URL||'http://127.0.0.1:11434/api/generate';
const {extractExplicitField,translationPrompt,translationSchema}=await import('../dist/input-core.mjs');
const mode=process.argv.includes('--hybrid')?'hybrid':'model-only';
const results=[];
for(const test of cases){const started=performance.now();let output='',correct=false,error=null,route='model';
 try{const direct=mode==='hybrid'?extractExplicitField(test.question):null;let components;if(direct){route='direct-parser';components=direct;output=JSON.stringify({components})}else{const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,stream:false,options:{temperature:0},format:translationSchema,prompt:translationPrompt(test.question)}),signal:AbortSignal.timeout(180000)});if(!response.ok)throw Error('HTTP '+response.status);const data=await response.json();output=data.response;components=JSON.parse(output).components;}const candidate=compileField(components),expected=compileField(test.expected);correct=test.points.every(point=>{const actual=candidate.evaluate(point,1),gold=expected.evaluate(point,1);return actual&&gold&&actual.every((v,i)=>Math.abs(v-gold[i])<1e-7)});}catch(e){error=e.message}
 results.push({id:test.id,category:test.category,route,correct,error,output,seconds:(performance.now()-started)/1000});
 fs.writeFileSync(new URL('./'+mode+'-results.json',import.meta.url),JSON.stringify({mode,model,endpoint,createdAt:new Date().toISOString(),scope:'Development-set translation probe; sampled equivalence, not proof. Hybrid routes explicit syntax through the same parser as the app. No plan or observation evaluation, no repair pass. Not end-to-end app accuracy.',completed:results.length,total:cases.length,correct:results.filter(r=>r.correct).length,results},null,2));
 console.log(test.id,correct?'PASS':'FAIL',results.at(-1).seconds.toFixed(1)+'s');
}
