/** Bind one new consultant session to a worksite through the directory owner's PUBLIC event API. */
export const SET_CWD='pi-change-working-dir:set-execution-cwd';
export const RESOLVE_CWD='pi-change-working-dir:resolve-execution-cwd';
export const VISIT_ENTRY='pi-consultants:arrival-v1';

export function registerArrival(pi,{env=process.env}={}){
  const project=env.PI_CONSULTANTS_ARRIVAL_PROJECT;
  const sessionId=env.PI_CONSULTANTS_ARRIVAL_SESSION_ID;
  if(!project||!sessionId)return;
  let firstSeen=false;
  let targetSeen=false;
  let ready=false;
  let problem='Worksite initialization has not finished';
  const isTarget=ctx=>ctx.sessionManager.getSessionId()===sessionId;
  const guard=ctx=>(!targetSeen||isTarget(ctx))&&!ready;
  const explain=()=>`Consultant worksite unavailable: ${problem}. No project tools may run here.`;
  const notify=(ctx)=>{
    if(!ctx.hasUI)return;
    ctx.ui.setStatus('consultant-worksite',ready?'Worksite ready':'Worksite blocked');
    if(!ready)ctx.ui.notify(explain(),'error');
  };
  function request(event,ctx,path){
    const message={sessionManager:ctx.sessionManager,...(path===undefined?{}:{path})};
    pi.events.emit(event,message);
    return message.result;
  }
  function initialize(ctx){
    if(!isTarget(ctx))return;
    try{
      if(ctx.cwd===project)throw Error('Visit was launched with the HQ as the worksite');
      const branch=ctx.sessionManager.getBranch();
      const hasEntry=branch.some(e=>e.type==='custom'&&e.customType===VISIT_ENTRY&&e.data?.sessionId===sessionId);
      let result=hasEntry?request(RESOLVE_CWD,ctx):request(SET_CWD,ctx,project);
      if(!result||result.error)throw Error(result?.error??'the pinned worksite extension did not answer the public directory event');
      if(hasEntry&&result.cwd===ctx.cwd){
        // A restored directory can be missing or was reset after the owner initialized.
        result=request(SET_CWD,ctx,project);
        if(!result||result.error)throw Error(result?.error??'could not restore the visited project');
      }
      if(result.cwd!==project&&(!hasEntry||result.cwd===ctx.cwd))throw Error(`expected ${project}, got ${result.cwd}`);
      if(!hasEntry)pi.appendEntry(VISIT_ENTRY,{sessionId,project});
      ready=true;problem='';
    }catch(error){ready=false;problem=error instanceof Error?error.message:String(error);}
    notify(ctx);
  }
  pi.on('session_start',(_event,ctx)=>{
    if(!firstSeen){firstSeen=true;if(!isTarget(ctx)){ready=false;problem='Pi opened a different session than the one requested';}}
    if(isTarget(ctx)){targetSeen=true;initialize(ctx);}
    else if(ctx.hasUI)ctx.ui.setStatus('consultant-worksite',undefined);
  });
  pi.on('session_tree',(_event,ctx)=>{if(isTarget(ctx))initialize(ctx);});
  pi.on('before_agent_start',(_event,ctx)=>{
    if(isTarget(ctx)){
      // Also resolves startup-order races: the directory owner may not be ready at session_start.
      const result=request(RESOLVE_CWD,ctx);
      if(!ready||result?.error||!result||result.cwd===ctx.cwd)initialize(ctx);
    }
  });
  pi.on('tool_call',(_event,ctx)=>{if(guard(ctx))return {block:true,reason:explain()};});
  pi.on('user_bash',(_event,ctx)=>{
    if(guard(ctx))return {operations:{exec:async()=>{throw Error(explain());}}};
  });
}
