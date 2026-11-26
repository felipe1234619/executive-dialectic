"use strict";
(() => {
 const $ = id => document.getElementById(id);
 const events = {
  withdrawn: ["Partner withdraws USD 45,000 estimate", "A-001 loses its supporting estimate; total cost is unknown.", "Finance must verify replacement cost; procurement obtains comparable quotes.", false],
  overrun: ["Comparable quote: USD 72,000", "Quote exceeds the USD 60,000 ceiling by USD 12,000 (20%).", "No commitment under existing authority; Finance reviews alternatives.", false],
  verified: ["Finance verifies full cost: USD 52,000", "Verified cost is USD 8,000 below the ceiling.", "Cost condition supported; contract review remains required.", true],
  legal: ["Contract review identifies unresolved liability", "Contract clearance condition is not satisfied.", "Legal must resolve liability before any commitment.", false],
  cleared: ["Legal confirms contract clearance", "Contract clearance condition is supported by new evidence.", "Finance condition must independently remain satisfied.", true]
 };
 const original = {version:"1.0",type:"judgment",authority:"Executive committee (fictional)",judgment:"Conditional pilot approval",evidence:["E-001"],assumption:"A-001",objection:"O-001",conditions:["USD 60,000 ceiling","Finance verifies full cost","Contract review complete"]};
 let history = [original], pending = null, version = 0, evidenceNumber = 1;
 const state = {cost:"unverified",legal:"unverified",costEvidence:null,legalEvidence:null};
 let latestCost=null, selectedNode="judgment", selectedRevision=null;
 function renderIntelligence(j){
  const evidence=history.filter(x=>x.type==="evidence"), latest=evidence.at(-1);
  $("metric-evidence").textContent=1+evidence.length;
  $("metric-versions").textContent=history.filter(x=>x.type==="judgment").length;
  $("metric-conditions").textContent=[state.cost,state.legal].filter(x=>x==="supported").length+" / 2";
  $("metric-review").textContent=j.judgment==="Reject pilot"?"Closed":pending?"Reconsideration required":version?"Judgment recorded":"Awaiting evidence";
  const nodes={
   evidence:["Latest evidence",latest?latest.id+" · "+latest.description:"E-001 · Partner estimate USD 45,000; incomplete.","Procurement / evidence originator",latest?latest.next:"Obtain full cost and contract review."],
   cost:["A-001 · Cost condition",state.cost+" · "+(state.costEvidence||"E-001")+" · USD 60,000 ceiling","Finance",state.cost==="supported"?"Maintain verified cost evidence.":"Verify full cost within ceiling."],
   objection:["O-001 · Finance dissent","Local support may strain the budget. Original objection remains preserved.","Finance","Consider dissent in every revision."],
   legal:["Contract condition",state.legal+" · "+(state.legalEvidence||"No clearance evidence"),"Legal",state.legal==="supported"?"Maintain clearance evidence.":"Complete contract clearance."],
   judgment:["Human judgment","v"+j.version+" · "+j.judgment+(pending?" · New evidence requires reconsideration":""),"Executive committee (simulated)",j.judgment==="Reject pilot"?"Proposal closed.":pending?"Record a reasoned human judgment.":j.nextAction||"Verify cost and contract conditions. No execution authorized."]
  };
  const n=nodes[selectedNode];["title","detail","owner","next"].forEach((k,i)=>$("inspect-"+k).textContent=n[i]);
  document.querySelectorAll("[data-node]").forEach(b=>{b.setAttribute("aria-pressed",String(b.dataset.node===selectedNode));b.dataset.status=b.dataset.node==="cost"?state.cost:b.dataset.node==="legal"?state.legal:b.dataset.node==="judgment"&&pending?"review":"neutral";});
  const entries=[history[0],...history.slice(1)];
  $("revision-timeline").replaceChildren(...entries.map((entry,i)=>{const b=document.createElement("button");b.type="button";b.textContent=entry.type==="judgment"?"v"+entry.version+" · "+entry.judgment:entry.id+" · "+entry.description;b.setAttribute("aria-pressed",String(i===(selectedRevision??entries.length-1)));b.onclick=()=>{selectedRevision=i;renderIntelligence(j);};return b;}));
  const entry=entries[selectedRevision??entries.length-1];
  $("revision-detail").textContent=entry.type==="judgment"?(entry.authority+" · "+(entry.rationale||"Original conditional judgment")+" · "+(entry.nextAction||"Original conditions retained")+" · Execution not authorized."):(entry.impact+" · "+entry.next);
 }
 document.querySelectorAll("[data-node]").forEach(b=>b.addEventListener("click",()=>{selectedNode=b.dataset.node;renderConsole();}));
 function renderConsole(){
  const j=history.filter(x=>x.type==="judgment").slice(-1)[0];
  $("console-judgment").textContent=j.judgment;
  $("console-version").textContent="v"+j.version;
  $("console-graph-judgment").textContent="v"+j.version+" · "+j.judgment;
  $("console-evidence").textContent=history.filter(x=>x.type==="evidence").slice(-1)[0]?.id||"E-001";
  $("console-cost").textContent=latestCost===null?"Not verified":"$"+latestCost.toLocaleString("en-US");
  $("console-cost-bar").style.width=(latestCost===null?0:latestCost/80000*100)+"%";
  $("console-cost-bar").classList.toggle("over-limit",latestCost!==null&&latestCost>60000);
  $("console-delta").textContent=latestCost===null?"Full cost verification pending.":latestCost>60000?"$12,000 above ceiling · 20% over · quote, not verified full cost.":"$8,000 below ceiling · Finance verified full cost.";
  $("console-legal").textContent="Contract: "+state.legal;
  if($("flow-evidence")){
   const e=history.filter(x=>x.type==="evidence").slice(-1)[0];
   $("flow-evidence").textContent=e?e.id+" · "+e.description:"E-001 · Partner estimate";
   $("flow-review").textContent="Cost: "+state.cost+" · Contract: "+state.legal;
   $("flow-judgment").textContent=pending?"Reconsideration required · "+j.judgment:j.judgment;
  }
  for(const [id,value] of [["network-cost",state.cost],["network-legal",state.legal]]){
   $(id).textContent=value;
   $(id).parentElement.dataset.condition=value==="supported"?"supported":value==="unverified"?"neutral":"alert";
  }
  $("network-review").textContent=pending?"Reconsideration required · judgment unchanged":version?"Human judgment recorded · history preserved":"Awaiting new evidence";
  $("network-review").parentElement.dataset.condition=pending?"alert":"neutral";
  renderIntelligence(j);
 }
 const choices = {retain:"Retain conditional approval",suspend:"Suspend pilot",reject:"Reject pilot"};
 function append(entry, description) {
  history.push(entry); selectedRevision=null;
  const li = document.createElement("li"); li.textContent = description; $("history-list").append(li);
 }
 $("evidence-form").addEventListener("submit", e => {
  e.preventDefault();
  if (pending) return;
  const latest=history.filter(x=>x.type==="judgment").slice(-1)[0];
  if(latest.judgment==="Reject pilot") return;
  const key = $("event").value, event = events[key];
  if (!event) return;
  pending = {id:"E-"+String(++evidenceNumber).padStart(3,"0"),key,description:event[0],impact:event[1],next:event[2]};
  if(key==="withdrawn" || key==="overrun" || key==="verified"){state.cost=key==="verified"?"supported":key==="overrun"?"exceeds ceiling":"unverified";state.costEvidence=pending.id;}else if(key==="legal" || key==="cleared"){state.legal=key==="cleared"?"supported":"unresolved liability";state.legalEvidence=pending.id;}
  if(key==="withdrawn")latestCost=null;else if(key==="overrun")latestCost=72000;else if(key==="verified")latestCost=52000;
  pending.conditionState={...state};
  append({type:"evidence",...pending}, pending.id+" — "+event[0]);
  renderConsole();
  $("evidence-status").textContent = pending.id+" introduced. Record a judgment before introducing another event.";
  $("review-status").textContent = "Reconsideration required · No automatic change to authorized judgment.";
  $("impact-list").replaceChildren(...[event[1],event[2],"Cumulative cost condition: "+state.cost+(state.costEvidence?" ("+state.costEvidence+")":""),"Cumulative contract condition: "+state.legal+(state.legalEvidence?" ("+state.legalEvidence+")":""),"No execution is authorized. Both conditions must be independently satisfied."].map(t=>{const li=document.createElement("li");li.textContent=t;return li;}));
  $("judgment-fields").disabled=false;
  $("evidence-form").querySelector("button").disabled=true;
  $("event").disabled=true;
  $("judgment-status").textContent="";
 });
 $("judgment-form").addEventListener("submit", e => {
  e.preventDefault();
  if (!pending || !$("confirm").checked) return;
  const choice=$("choice").value, reason=$("reason").value.trim();
  if (!choices[choice] || !reason) {$("judgment-status").textContent="Provide a judgment and a non-empty rationale.";return;}
  const entry={type:"judgment",version:"1."+(++version),authority:"Simulated executive committee (visitor)",judgment:choices[choice],rationale:reason,evidence:["E-001",...history.filter(x=>x.type==="evidence").map(x=>x.id)],triggerEvidence:pending.id,conditionState:{...state},priorVersion:"1."+(version-1),conditions:[...original.conditions],objection:"O-001",nextAction:choice==="reject"?"Close pilot proposal":(state.cost!=="supported"?"Finance verifies cost within ceiling. ":"")+(state.legal!=="supported"?"Legal completes contract clearance. ":"")+(state.cost==="supported"&&state.legal==="supported"?"Committee considers separate execution authorization.":""),executionAuthorized:false};
  append(entry,"v"+entry.version+" — "+entry.judgment+" · "+pending.id+" · Rationale: "+reason+" · Next: "+entry.nextAction);
  $("judgment-status").textContent="v"+entry.version+" recorded. No execution authorized; original conditions remain preserved.";
  $("review-status").textContent="Simulated judgment recorded · Historical record retained.";
  pending=null; renderConsole(); $("judgment-form").reset(); $("judgment-fields").disabled=true;
  $("event").disabled=false; $("event").value=""; $("evidence-form").querySelector("button").disabled=false;
  if(choice==="reject"){ $("event").disabled=true; $("evidence-form").querySelector("button").disabled=true; $("evidence-status").textContent="Proposal closed. Export or reset to begin a new simulation."; }else{$("evidence-status").textContent="You may introduce another evidence event.";}
 });
 $("export").addEventListener("click",()=>{
  const url=URL.createObjectURL(new Blob([JSON.stringify({fictional:true,decisionId:"CHILE-001",history},null,2)],{type:"application/json"}));
  const a=document.createElement("a");a.href=url;a.download="CHILE-001-fictional.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 $("reset").addEventListener("click",()=>{if(window.confirm("Discard this local simulation history?")) window.location.reload();});
 renderConsole();
 $("lab-interactive").hidden=false;
})();
