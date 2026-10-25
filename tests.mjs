import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
globalThis.math=require('./dist/vendor/math.js');
const {compileField,integrate,PRESETS,rk4}=await import('./dist/math-core.mjs');
for(const [name,p]of Object.entries(PRESETS)){
 const f=compileField(p.field),r=integrate(f,{a:1,radius:1.5,lift:.8,orientation:1});
 if(name!=='singular')assert.ok(r.residual<1e-6,name);
 if(name==='vortex'){assert.ok(Math.abs(r.line-4.5*Math.PI)<1e-8);assert.deepEqual(f.curl([1,0,0],1),[0,0,2]);}
 if(name==='singular'){assert.ok(Math.abs(r.line-2*Math.PI)<1e-8);assert.equal(r.flux,0);assert.equal(f.evaluate([0,0,0],1),null);}
 const reversed=integrate(f,{a:1,radius:1.5,lift:.8,orientation:-1});
 assert.ok(Math.abs(reversed.line+r.line)<1e-8);
 assert.ok(Math.abs(reversed.flux+r.flux)<1e-8);
}
const f=compileField(['x*y','y*z','z*x']);
assert.ok(integrate(f,{a:1,radius:1.4,lift:.7,orientation:1},64).residual<1e-5);
for(const expression of ['x=2','import("a")','x.constructor','[x,y]'])assert.throws(()=>compileField([expression,'0','0']));
const v=compileField(PRESETS.vortex.field),p=rk4(v,[1,0,0],1,.01);
assert.ok(Math.abs(p[0]-Math.cos(.01))<1e-10);
console.log('Passed: smooth Stokes examples, analytic circulation, curl, orientation reversal, singular domain, custom field, expression restrictions and RK4.');

assert.deepEqual(compileField(['−2×y','2·x','0']).curl([1,0,0],1),[0,0,4]);
assert.equal(compileField(['x**2','y²','z³']).div([1,1,1],1),7);

const {isPolynomialField,observationCatalog}=await import('./dist/math-core.mjs');
assert.equal(isPolynomialField(['-2*y','2*x','0']),true);
assert.equal(isPolynomialField(PRESETS.singular.field),false);
assert.equal(isPolynomialField(['sin(x)','y','z']),false);
const checked=compileField(['-2*y','2*x','0']);
assert.deepEqual(checked.curl([1,0,0],1),[0,0,4]);
assert.equal(checked.div([1,0,0],1),0);
assert.ok(Math.abs(integrate(checked,{radius:2,lift:-1.5}).line-16*Math.PI)<1e-9);
assert.match(observationCatalog(checked,{},{}).domain,/smooth everywhere/);
assert.ok(!Object.hasOwn(observationCatalog(checked,{},{}),'curl'));
console.log('Passed: polynomial domain certification and checked observation eligibility.');

const singularProbe=compileField(PRESETS.singular.field);
assert.equal(singularProbe.curl([0,0,0],1),null);
assert.ok(Number.isNaN(singularProbe.div([0,0,0],1)));
assert.deepEqual(singularProbe.curl([1,0,0],1),[0,0,0]);
const {investigate,validateWorkspace}=await import('./dist/math-core.mjs');
const suite=investigate(checked,{a:1,radius:2,lift:0,orientation:1});
assert.equal(suite.length,8);
assert.ok(Math.abs(suite[0].line-Math.PI)<1e-9);
assert.ok(Math.abs(suite[3].line-16*Math.PI)<1e-9);
assert.ok(suite.slice(4,7).every(r=>Math.abs(r.flux-16*Math.PI)<1e-8));
assert.ok(Math.abs(suite[7].line+16*Math.PI)<1e-9);
assert.throws(()=>validateWorkspace({version:1,key:'vortex',a:1,radius:100,lift:0,orientation:1,expressions:['x','y','z']}));
assert.equal(validateWorkspace({version:1,key:'vortex',a:1,radius:1,lift:0,orientation:1,expressions:['x','y','z']}).radius,1);
console.log('Passed: eight-comparison investigation and workspace bounds.');
const {extractExplicitField}=await import('./dist/input-core.mjs');
assert.deepEqual(extractExplicitField('Use F=(-3*y,3*x,0).'),['-3*y','3*x','0']);
assert.deepEqual(extractExplicitField('F = (-y/(x^2+y^2), x/(x^2+y^2), 0).'),['-y/(x^2+y^2)','x/(x^2+y^2)','0']);
assert.deepEqual(extractExplicitField('Use components .5*x, 2*y, 0.'),['.5*x','2*y','0']);
assert.deepEqual(extractExplicitField('Fx=x², Fy=y², Fz=z²'),['x^2','y^2','z^2']);
assert.equal(extractExplicitField('Show an outward field.'),null);
assert.throws(()=>extractExplicitField('F=(x,y)'));
assert.throws(()=>extractExplicitField('F=(x.constructor,y,z)'));
const development=JSON.parse(require('node:fs').readFileSync(new URL('./evaluation/cases.json',import.meta.url)));
let extracted=0;
for(const c of development){const direct=extractExplicitField(c.question);if(!direct)continue;extracted++;const actual=compileField(direct),expected=compileField(c.expected);assert.ok(c.points.every(p=>actual.evaluate(p,1).every((v,i)=>Math.abs(v-expected.evaluate(p,1)[i])<1e-8)),c.id)}
console.log('Passed: direct input preservation for '+extracted+'/30 development cases; remaining cases require model interpretation.');
const {validatePlan,selectComparisons,plannerPrompt}=await import('./dist/planner-core.mjs');
assert.deepEqual(validatePlan({field:'vortex',comparison:'radius'}),{field:'vortex',comparison:'radius'});
assert.throws(()=>validatePlan({field:'outside_scope',comparison:'surface'}));
assert.throws(()=>validatePlan({field:'vortex',comparison:'none',components:['x','y','z']}));
assert.throws(()=>validatePlan({field:'unknown',comparison:'none'}));
assert.equal(selectComparisons(suite,'radius').length,4);
assert.equal(selectComparisons(suite,'surface').length,3);
const pair=selectComparisons(suite,'orientation');
assert.equal(pair.length,2);assert.ok(Math.abs(pair[0].line+pair[1].line)<1e-10);
assert.equal(pair[0].parameters.radius,2);
assert.ok(plannerPrompt('test').includes('outside_scope'));
console.log('Passed: bounded plan validation, outside-scope consistency and selected comparison groups.');
const {scopeGate}=await import('./dist/scope-core.mjs');
for(const q of ['Solve the heat equation on a cube.','Prove Stokes theorem.','Compute flux through an arbitrary torus.','Animate a time-dependent field.','Find all critical points of my arbitrary scalar potential.','Tell me the weather.'])assert.equal(scopeGate(q).decision,'blocked',q);
assert.equal(scopeGate('Change the surface.').decision,'clarify');
for(const q of ['Show a rotating field and compare radii.','F=(-3*y,3*x,0)','Show a source.','Reverse a gradient loop.','Show the excluded-axis counterexample.'])assert.equal(scopeGate(q).decision,'allow',q);
// Negated/novel unsupported requests remain a documented limitation of phrase rules.
console.log('Passed: code scope rules and clarification routing.');
