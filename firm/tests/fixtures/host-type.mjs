// Test double for Pi's host-provided TypeBox export. Not included in runtime loading.
export const Type={};
for(const name of ['String','Number','Boolean','Unknown'])Type[name]=()=>({type:name.toLowerCase()});
Type.Object=p=>({type:'object',properties:p});Type.Array=x=>({type:'array',items:x});Type.Union=x=>({anyOf:x});Type.Literal=x=>({const:x});Type.Optional=x=>x;Type.Record=(a,b)=>({type:'object',additionalProperties:b});
