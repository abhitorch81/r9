const m=globalThis.math;
export const PRESETS={
 vortex:{name:'The vortex',icon:'↻',sub:'Rotation without expansion',field:['-a*y','a*x','0'],title:'A little rotation. No expansion.',tag:'CURL ≠ 0 · DIV = 0',headline:'It spins. But does it spread?',description:'A field can swirl without creating or removing anything locally. Curl measures local rotation; divergence measures local expansion. They answer different questions.',steps:[['Watch a particle','It circles the vertical axis. The arrows are tangent to each orbit.'],['Place a tiny paddle wheel','Its spin reveals a curl pointing along the vertical axis.'],['Lift the spanning surface','The boundary stays fixed. Curl flux still matches circulation.']],note:'Try doubling the loop radius. Circulation scales with the enclosed area, so it becomes four times larger.'},
 source:{name:'The source',icon:'✳',sub:'Expansion without rotation',field:['a*x','a*y','a*z'],title:'Everything flows outward.',tag:'CURL = 0 · DIV = 3a',headline:'Outward flow. No local spin.',description:'This field points away from the origin when strength is positive. A tiny volume expands, but a small paddle wheel has no local tendency to rotate.',steps:[['Change the field strength','Negative strength turns the source into a sink.'],['Inspect divergence','Each Cartesian component contributes a to the divergence.'],['Trace a closed loop','The circulation is zero even though the arrows are not.']],note:'For a sphere of radius R, outward flux is 4πaR³. The comparison below uses a circle and its spanning surface, not that sphere.'},
 saddle:{name:'The saddle',icon:'⤢',sub:'Stretch here. Compress there.',field:['a*x','-a*y','0'],title:'Stretching can hide in plain sight.',tag:'CURL = 0 · DIV = 0',headline:'Zero divergence does not mean still.',description:'The field stretches along one axis and compresses along another. The two contributions cancel: local volume is preserved, even while shapes change.',steps:[['Follow the horizontal arrows','The x component pushes away from the origin.'],['Look along the other axis','The y component pulls inward with equal strength.'],['Inspect the derivatives','Expansion and compression cancel in the divergence.']],note:'A zero vector operator does not mean the original vector field is zero. Shape deformation and volume change are different.'},
 gradient:{name:'The gradient',icon:'∇',sub:'Climb an invisible landscape',field:['2*a*x','2*a*y','-2*a*z'],title:'The steepest climb, made visible.',tag:'F = ∇φ · CURL = 0',headline:'A landscape behind every arrow.',description:'For φ = a(x² + y² − z²), the gradient points toward steepest local increase. The field is conservative throughout space, so work around a closed loop is zero.',steps:[['Read the potential','Differentiate φ with respect to each coordinate.'],['Follow a gradient path','The potential increases along non-stationary forward trajectories.'],['Close the loop','The endpoint returns to its start; net work cancels.']],note:'The vertical axis descends in this saddle-shaped potential. A gradient points uphill locally, not necessarily upward on the screen.'},
 singular:{name:'The loophole',icon:'⊘',sub:'When zero curl is not enough',field:['-a*y/(x^2+y^2)','a*x/(x^2+y^2)','0'],title:'The theorem has a fine print.',tag:'DOMAIN EXCLUDES THE z-AXIS',headline:'Zero curl. Nonzero circulation.',description:'Away from the vertical axis, this vortex has zero curl. Yet a loop encircling that excluded axis has nonzero circulation. The disk touches a singularity, so Stokes’ smoothness assumptions fail.',steps:[['Inspect the missing axis','The field is undefined when x and y are both zero.'],['Walk around the hole','The circulation is 2πa, independent of the loop radius.'],['Check the domain first','A disk through the hole is not an admissible surface for this field.']],note:'This is a classic counterexample, not a new discovery. The zero-curl test alone does not establish a global potential on this domain.'}
};
export function compileField(expressions){
 if(!Array.isArray(expressions)||expressions.length!==3)throw Error('Enter exactly three field components.');
 const allowedFunctions=new Set(['sin','cos','tan','exp','sqrt','log','abs','sinh','cosh']);
 const symbols=new Set(['x','y','z','a','pi','e']);
 expressions=expressions.map(s=>typeof s==='string'?s.trim().replace(/−/g,'-').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/²/g,'^2').replace(/³/g,'^3').replace(/\*\*/g,'^'):s);
 const nodes=expressions.map((s,index)=>{
  if(typeof s!=='string'||s.length>160)throw Error('Keep each expression under 160 characters.');
  const n=m.parse(s);
  n.traverse(node=>{
   if(node.isSymbolNode&&!symbols.has(node.name)&&!allowedFunctions.has(node.name))throw Error('Unsupported symbol: '+node.name);
   if(node.isFunctionNode&&(!node.fn.isSymbolNode||!allowedFunctions.has(node.fn.name)))throw Error('Unsupported function.');
   if(node.isOperatorNode&&!['+','-','*','/','^'].includes(node.op))throw Error('Unsupported operator.');
   if(!['OperatorNode','ConstantNode','SymbolNode','FunctionNode','ParenthesisNode'].includes(node.type))throw Error('Component '+(index+1)+' '+JSON.stringify(s)+' contains '+node.type+'. Use a scalar expression such as -2*y, without labels, brackets or assignments.');
  });return n;
 });
 const j=nodes.map(n=>['x','y','z'].map(v=>m.derivative(n,v)));
 const curlNodes=[m.simplify(`(${j[2][1]})-(${j[1][2]})`),m.simplify(`(${j[0][2]})-(${j[2][0]})`),m.simplify(`(${j[1][0]})-(${j[0][1]})`)];
 const divNode=m.simplify(`(${j[0][0]})+(${j[1][1]})+(${j[2][2]})`);
 const evaluators=nodes.map(n=>n.compile()),curlEvaluators=curlNodes.map(n=>n.compile());
 const evalVector=(f,p,a)=>{try{const scope={x:p[0],y:p[1],z:p[2],a};const v=f.map(n=>Number(n.evaluate(scope)));return v.every(Number.isFinite)&&v.every(x=>Math.abs(x)<1e6)?v:null}catch{return null}};
 return {expressions,evaluate:(p,a)=>evalVector(evaluators,p,a),curl:(p,a)=>evalVector(evaluators,p,a)?evalVector(curlEvaluators,p,a):null,div:(p,a)=>{if(!evalVector(evaluators,p,a))return NaN;try{return Number(divNode.evaluate({x:p[0],y:p[1],z:p[2],a}))}catch{return NaN}},curlText:curlNodes.map(n=>n.toString()),divText:divNode.toString()};
}
export function integrate(field,{a=1,radius=1.5,lift=0,orientation=1},resolution=32){
 let line=0,flux=0,invalid=false;const nt=resolution*4,dr=radius/resolution,dt=2*Math.PI/nt;
 for(let j=0;j<nt;j++){const t=(j+.5)*dt,c=Math.cos(t),s=Math.sin(t);const v=field.evaluate([radius*c,radius*s,0],a);if(!v){invalid=true;continue}line+=(-radius*s*v[0]+radius*c*v[1])*dt;
  for(let i=0;i<resolution;i++){const r=(i+.5)*dr;const p=[r*c,r*s,lift*(1-r*r/(radius*radius))],v=field.curl(p,a);if(!v){invalid=true;continue}const n=[2*lift*r*r*c/(radius*radius),2*lift*r*r*s/(radius*radius),r];flux+=(v[0]*n[0]+v[1]*n[1]+v[2]*n[2])*dr*dt;}
 }
 return {line:orientation*line,flux:orientation*flux,residual:Math.abs(line-flux),invalid,resolution};
}
export function rk4(field,p,a,dt){const v1=field.evaluate(p,a);if(!v1)return null;const add=(u,v,s)=>u.map((x,i)=>x+v[i]*s);const v2=field.evaluate(add(p,v1,dt/2),a);if(!v2)return null;const v3=field.evaluate(add(p,v2,dt/2),a);if(!v3)return null;const v4=field.evaluate(add(p,v3,dt),a);if(!v4)return null;return p.map((x,i)=>x+dt*(v1[i]+2*v2[i]+2*v3[i]+v4[i])/6)}

export function isPolynomialField(expressions){
 const polynomial=n=>n.isConstantNode||n.isSymbolNode||n.isParenthesisNode&&polynomial(n.content)||n.isOperatorNode&&(['+','-','*'].includes(n.op)?n.args.every(polynomial):n.op==='^'&&polynomial(n.args[0])&&n.args[1].isConstantNode&&Number.isInteger(Number(n.args[1].value))&&Number(n.args[1].value)>=0);
 try{return expressions.every(s=>polynomial(m.parse(s)))}catch{return false}
}
export function observationCatalog(field,parameters,result){
 const polynomial=isPolynomialField(field.expressions);
 const observations={comparison:'The displayed circulation and curl flux are independently sampled integrals. Numerical agreement alone is not a proof.',orientation:'Reverse orientation to reverse both signed integrals.',surface:'Change surface lift to compare different spanning surfaces with the same boundary.'};
 if(polynomial)observations.domain='These polynomial components are smooth everywhere. The circular boundary and its spanning surface satisfy the smoothness requirements for Stokes’ theorem.';
 else observations.domain='The domain and smoothness of this field have not been certified. Inspect excluded points before applying Stokes’ theorem.';
 if(field.divText==='0')observations.divergence='The symbolic divergence is zero: local expansion and compression balance.';
 if(field.curlText.every(s=>s==='0'))observations.curl='The symbolic curl is zero. Whether a global potential exists also depends on the domain.';
 if(!field.expressions.some(s=>/\ba\b/.test(s)))observations.strength='This custom field contains no parameter a, so its strength is fixed by its formula.';
 return observations;
}

export function investigate(field,base){
 const configurations=[...([.5,1,1.5,2].map(radius=>({label:'Radius '+radius,...base,radius}))),...([-1,0,1].map(lift=>({label:'Surface lift '+lift,...base,lift}))),{label:'Reverse orientation',...base,orientation:-base.orientation}];
 return configurations.map(({label,...parameters})=>({label,parameters,...integrate(field,parameters,32)}));
}
export function validateWorkspace(s){
 if(!s||s.version!==1||!Object.hasOwn(PRESETS,s.key))throw Error('Unsupported workspace.');
 if(!Number.isFinite(s.a)||Math.abs(s.a)>2||!Number.isFinite(s.radius)||s.radius<.5||s.radius>2||!Number.isFinite(s.lift)||Math.abs(s.lift)>1.5||![1,-1].includes(s.orientation))throw Error('Workspace parameters are outside supported bounds.');
 compileField(s.expressions);return s;
}
