// Conservative, explicit product boundaries. This is not a general intent classifier.
export function scopeGate(question){
 const q=String(question).trim();
 const unsupported=[[/\b(PDEs?|partial differential|heat equation|wave equation|Navier[ -]?Stokes|Schr[oö]dinger|quantum|hydrogen atom)\b/i,'This lab does not solve PDEs or quantum equations.'],[/\b(prove|proof of|formal proof|derive a proof)\b/i,'This lab illustrates and numerically compares examples; it does not prove theorems.'],[/\b(torus|tori|arbitrary (?:surface|geometry|region|potential|scalar)|time[ -]dependent|all critical points|indefinite integral)\b/i,'That geometry or calculation is outside the supported circular-boundary experiments.'],[/\b(weather|forecast|stock price|recipe|job application)\b/i,'That request is outside this vector-calculus lab.']];
 for(const [pattern,message]of unsupported)if(pattern.test(q))return {decision:'blocked',message};
 const explicit=/\bF\s*=|\bcomponents\b|\bF[xyz]\s*=/i.test(q);
 const fieldHint=/\b(vortex|rotat\w*|swirl\w*|spin\w*|source|sink|outward|inward|expan\w*|contract\w*|saddle|stretch\w*|compress\w*|gradient|potential|steepest|conservative|singular\w*|excluded[ -]axis|excluded axis|hole|counterexample|zero[ -]curl)\b/i.test(q);
 if(!q||(!explicit&&!fieldHint))return {decision:'clarify',message:'Name a field or behavior: rotation, expansion, equal stretch/compression, gradient, or the excluded-axis counterexample. You can also enter F=(x,y,z). Your current experiment is unchanged.'};
 return {decision:'allow',message:'No known scope rule matched. This is not a guarantee that the request is supported; review Gemma’s proposed example.'};
}
