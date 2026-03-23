import{u as Ne,t as he,g as xe,a as T,i as oe,j as s}from"./index-Bg03UWM7.js";import{r as a}from"./vendor-react-wGySg1uH.js";import{L as De,a as Me}from"./LiveTimeComponents--MiW50yG.js";import"./vendor-capacitor-B00bZtM7.js";function Te(){const c=new Date;return c.setDate(c.getDate()-1),c.toISOString().slice(0,10)}const _="v4",x={behavior:`tp_behavior_${_}`,session:`tp_session_${_}`,mode:`tp_mode_${_}`,weekly:`tp_weekly_${_}`,insightShown:`tp_insight_${_}`},d={get:c=>{try{return JSON.parse(localStorage.getItem(c)||"null")}catch{return null}},set:(c,g)=>{try{localStorage.setItem(c,JSON.stringify(g))}catch{}},merge:(c,g)=>{d.set(c,{...d.get(c)||{},...g})},syncToBackend:async(c,g)=>{}};function K(){return d.get(x.behavior)||{}}function Ce(){const c=K(),g=new Date().getHours();d.merge(x.behavior,{completionHours:[...(c.completionHours||[]).slice(-99),g],totalCompleted:(c.totalCompleted||0)+1})}function $e(c){const C=K().skipCounts||{};d.merge(x.behavior,{skipCounts:{...C,[c]:(C[c]||0)+1}})}function Ee(c){const g=K();d.merge(x.behavior,{pauseDurations:[...(g.pauseDurations||[]).slice(-19),c]})}function Ie(c,g,C){const v=x.weekly,j=d.get(v)||[],H=(()=>{const l=new Date,S=new Date(l.getFullYear(),0,1);return`${l.getFullYear()}-W${Math.ceil(((l-S)/864e5+S.getDay()+1)/7)}`})();if(!j.find(l=>l.week===H)){const l=[...j.slice(-11),{week:H,pct:c,done:g,total:C}];d.set(v,l),d.syncToBackend(null,{weeklyHistory:l})}}function ie(c,g){const C=new Date().getHours();new Date().getHours()*60+new Date().getMinutes();const v=g.completionHours||[];let j=null,H=!1;if(v.length>=10){const p=Array(24).fill(0);v.forEach(e=>{e>=0&&e<24&&p[e]++});const m=Math.max(...p),k=v.length/24;j=p.indexOf(m),H=m>k*1.3&&Math.abs(C-j)<=1}const l=Array.from({length:14},(p,m)=>{const k=new Date;k.setDate(k.getDate()-m-1);const e=he(),u=c.filter(L=>xe(L,e));return{done:u.filter(L=>oe(L,e)).length,total:u.length}}).filter(p=>p.done>0),S=l.length>=5?Math.round(l.reduce((p,m)=>p+m.done,0)/l.length):null,J=g.skipCounts||{},w=g.pauseDurations||[],N=w.length>=3?Math.round(w.reduce((p,m)=>p+m,0)/w.length):null,z=d.get(x.weekly)||[],$=z.length>=3?(()=>{const p=z.slice(-3).map(k=>k.pct),m=p[p.length-1]-p[0];return m>5?"up":m<-5?"down":"stable"})():null,V=(()=>{try{return d.get(`tp_lowstreak_${_}`)||{count:0,lastDate:null}}catch{return{count:0}}})();return{peakHour:j,isPeakNow:H,avgCapacity:S,skipCounts:J,avgPause:N,trend:$,weeklyHistory:z,dataAge:v.length,lowStreak:V}}function Ae(){const c=Ne(),{appLanguage:g,userName:C,setActiveView:v,done:j,total:H,pct:ee,weekly:l,streakDays:S,dueSoon:J,goals:w,liveCurrentGoal:N,isOffline:z,onAddTask:$,onPlanDay:V,onAutoSchedule:p,onStartFocus:m,removeGoal:k}=c,e=g==="ta",u=he(),[L,ve]=a.useState(()=>{var t;return((t=d.get(x.mode))==null?void 0:t.aiMode)??"smart"});a.useCallback(()=>{const t=L==="smart"?"simple":"smart";ve(t),d.merge(x.mode,{aiMode:t})},[L]);const P=L==="smart",[D,le]=a.useState(()=>{const t=d.get(x.session);return(t==null?void 0:t.energyDate)===u?t.energyMode:null});a.useCallback(t=>{le(t),d.merge(x.session,{energyMode:t,energyDate:u});const n=`tp_lowstreak_${_}`;if(t==="low"){const i=d.get(n)||{count:0,lastDate:null},o=i.lastDate===Te()?i.count+1:1;d.set(n,{count:o,lastDate:u})}else d.set(n,{count:0,lastDate:u})},[u]);const A=d.get(x.session)||{},[O,te]=a.useState(A.paused??!1),[E,se]=a.useState(A.pausedAt??null),[Y,ce]=a.useState(A.skippedDate===u?A.skipped||[]:[]),[B,ye]=a.useState(A.focusDate===u&&A.focusTop3||!1),[ae,de]=a.useState([]),[ze,ne]=a.useState(!1),U=a.useRef(null),q=a.useCallback((t,n,i)=>{de(o=>[...o.slice(-4),{type:t,payload:n,label:i}]),ne(!0),U.current&&clearTimeout(U.current),U.current=setTimeout(()=>ne(!1),5e3)},[]);a.useCallback(()=>{const t=ae[ae.length-1];t&&(t.type==="skip"&&ce(n=>n.filter(i=>i!==t.payload.id)),t.type==="focus3"&&ye(!1),t.type==="energy"&&le(t.payload.prev),t.type==="pause"&&(te(!1),se(null)),de(n=>n.slice(0,-1)),ne(!1))},[ae]),a.useEffect(()=>()=>{U.current&&clearTimeout(U.current)},[]),a.useEffect(()=>{d.merge(x.session,{paused:O,pausedAt:E,skipped:Y,skippedDate:u,focusTop3:B,focusDate:u}),d.syncToBackend(null,{session:{paused:O,skipped:Y,focusTop3:B,date:u}})},[O,E,Y,u,B]);const[h,ue]=a.useState(()=>ie(w||[],K()));a.useEffect(()=>{ue(ie(w||[],K()))},[w]),a.useEffect(()=>{j>0&&Ce()},[j]),a.useEffect(()=>{(l==null?void 0:l.weekPct)!=null&&Ie(l.weekPct,l.weekDone,l.weekTotal)},[]);const R=a.useMemo(()=>(w||[]).filter(t=>xe(t,u)),[w,u]),M=a.useMemo(()=>T(new Date().toTimeString().slice(0,5)),[]),X=a.useMemo(()=>R.filter(t=>!oe(t,u)).sort((t,n)=>{const i=T(t.startTime||""),o=T(n.startTime||""),b=i&&i<M-5,I=o&&o<M-5;if(b&&!I)return-1;if(!b&&I)return 1;if(i&&o)return i-o;if(i)return-1;if(o)return 1;const F={High:0,Medium:1,Low:2};return(F[t.priority]??1)-(F[n.priority]??1)}),[R,u,M]),W=a.useMemo(()=>{const t=X.filter(i=>!Y.includes(i.id)),n=B||D==="low"?3:1/0;return t.slice(0,n)},[X,Y,B,D]),r=W[0]||null,y=R.filter(t=>oe(t,u)).length,f=R.length;W.slice(0,3);const re=r!=null&&r.startTime?T(r.startTime)<M-5:!1,pe=P&&h.avgCapacity!==null&&X.length>h.avgCapacity*1.5&&X.length>=6,Q=a.useMemo(()=>{var i;if(!r||!P)return null;const t=r.text.slice(0,20).toLowerCase().replace(/\s/g,"_"),n=((i=h.skipCounts)==null?void 0:i[t])||0;if(re){const o=Math.round(M-T(r.startTime));return e?`${o} நிமிடம் கடந்துவிட்டது`:`${o} min past start time`}if(n>=2)return e?"இதை சில முறை தள்ளிப்போட்டீர்கள்":"You've deferred this a few times";if(h.isPeakNow&&h.dataAge>=10)return e?"இது உங்கள் productive நேரம்":"This tends to be a productive hour for you";if(r.startTime){const o=T(r.startTime)-M;return o<=5?e?"இப்போது தொடங்க வேண்டியது":"Starting now":o<=20?e?`${o} நிமிடத்தில் தொடங்கும்`:`Starts in ${o} min`:e?`${r.startTime} க்கு scheduled`:`Scheduled for ${r.startTime}`}return r.priority==="High"?"High priority":null},[r,re,h,e,M,P]);a.useMemo(()=>{var n,i,o,b;if(!r)return null;const t=W.length-1;return t>0?e?`அடுத்தது: "${(i=(n=W[1])==null?void 0:n.text)==null?void 0:i.slice(0,24)}..."`:`Next: "${(b=(o=W[1])==null?void 0:o.text)==null?void 0:b.slice(0,30)}..."`:t===0?e?"இன்றைய list முடியும்":"That's the last one for today":null},[r,W,e]);const be=a.useMemo(()=>D==="low"?{maxTasks:3,nudgeStyle:"gentle",ctaLabel:e?"மெதுவாக தொடங்கு":"Take it easy — start",emptyMsg:e?"இன்று 3 tasks மட்டும் போதும்":"Three tasks is plenty today",metricShow:!1}:D==="high"?{maxTasks:1/0,nudgeStyle:"direct",ctaLabel:e?"தொடங்கு":"Start",emptyMsg:e?"நாளை திட்டமிடலாம்":"Ready to plan?",metricShow:!0}:{maxTasks:1/0,nudgeStyle:"direct",ctaLabel:e?"தொடங்கு":"Start",emptyMsg:e?"இன்றைய பணிகள் இல்லை":"No tasks yet today",metricShow:!0},[D,e]);a.useMemo(()=>{var ge,fe;const t=h.weeklyHistory;if(!t||t.length<3)return null;const n=(()=>{const G=new Date,Z=new Date(G.getFullYear(),0,1);return`${G.getFullYear()}-W${Math.ceil(((G-Z)/864e5+Z.getDay()+1)/7)}`})();if((d.get(x.insightShown)||{})[n])return null;const o=t.slice(-4),b=Math.round(o.reduce((G,Z)=>G+Z.pct,0)/o.length),I=((ge=o[o.length-1])==null?void 0:ge.pct)??0,F=((fe=o[o.length-2])==null?void 0:fe.pct)??0,je=I-F;return h.trend==="up"?{title:e?"கடந்த சில வாரங்களாக நல்ல trend":`${b}% avg — trending up`,body:e?"இந்த வேகம் தொடர்ந்தால் மாதாந்திர இலக்கு எட்டலாம்":"Keep this pace and your monthly goal is reachable",action:null,tone:"positive"}:h.trend==="down"&&je<-10?{title:e?"வாரம் வாரமாக குறைந்து வருகிறது":"Completion dropping week-over-week",body:e?"Tasks அதிகமா இருக்கா? Schedule பார்க்கலாம்":"Too many tasks? Let's look at your schedule",action:{label:e?"Schedule பார்":"Review schedule",tap:()=>v("planner")},tone:"neutral"}:b>=75?{title:e?`${b}% — consistent week`:`${b}% consistency`,body:e?"நல்ல rhythm கிடைத்திருக்கிறது":"You've found a good rhythm",action:null,tone:"positive"}:null},[h,e]),a.useMemo(()=>{if(!O||!E)return null;const t=Math.round((Date.now()-E)/6e4),n=N!=null&&N.endTime?T(N.endTime):null,i=n?n-M:null;return{pausedMins:t,label:t<2?e?"இப்போது நிறுத்தினீர்கள்":"Just paused":e?`${t} நிமிடம்`:`${t} min`,urgency:i!==null&&i<=5?e?"Task window மூடுகிறது":"Task window closing soon":null}},[O,E,N,M,e]),a.useMemo(()=>{const t=(l==null?void 0:l.weekDone)||0,n=(l==null?void 0:l.weekTotal)||0,i=n>0?Math.round(t/n*100):0,o=((l==null?void 0:l.days)||[]).filter(F=>F.total>0),b=o.length>0?Math.round(t/o.length):0,I=J||0;return{rate:i,avgPerDay:b,overdue:I,rateColor:i>=70?"#22C55E":i>=40?"var(--accent)":"#EF4444",overdueColor:I>0?"#EF4444":"var(--muted)",rateAction:i<50?{label:e?"ஏன்?":"Why?",hint:e?"schedule பார்":"review schedule",tap:()=>v("planner")}:i>=80?{label:"Push",hint:e?"harder task":"add challenge",tap:()=>$==null?void 0:$()}:null,overdueAction:I>0?{label:"Start",tap:()=>v("tasks")}:null}},[l,J,e]),a.useMemo(()=>!P&&D!=="high"?null:D==="low"?e?"இன்று மெதுவாக போகலாம்.":"A slower day is still a day.":y===0&&f>0&&h.isPeakNow&&h.dataAge>=10?e?"இது உங்கள் productive நேரம்.":"Good time to get started.":y===1&&f>2?e?"முதல் task முடிந்தது.":"First one done.":f>0&&y===Math.floor(f/2)?e?"பாதி முடிந்தது.":"Halfway there.":y===f-1&&f>1?e?"கடைசி ஒன்று மட்டும்.":"One left.":S>=5&&y===f?e?`${S} நாள் தொடர்.`:`${S} days in a row.`:null,[P,D,y,f,h,S,e]),a.useMemo(()=>{if(f===0||y<f)return null;let t=0;return R.forEach(n=>{n.startTime&&n.endTime&&(t+=Math.max(0,T(n.endTime)-T(n.startTime)))}),{count:f,effort:t>=60?`${Math.floor(t/60)}h ${t%60}m`:t>0?`${t}m`:null}},[R,f,y]);const me=a.useMemo(()=>f===0?"empty":y===f?"complete":O?"paused":N?"in-progress":r?"ready":"empty",[f,y,O,N,r]),we=a.useCallback(()=>{if(!r)return;const t=r.text.slice(0,20).toLowerCase().replace(/\s/g,"_");$e(t),ce(n=>[...n,r.id]),k==null||k(r.id),ue(ie(w||[],K())),q("skip",{id:r.id},e?"Skipped":`Skipped "${r.text.slice(0,22)}"`)},[r,w,k,q,e]);a.useCallback(()=>{const t=Date.now();te(!0),se(t),q("pause",{},"Session paused")},[q,e]),a.useCallback(()=>{if(E){const t=Math.round((Date.now()-E)/6e4);t>0&&Ee(t)}te(!1),se(null)},[E]);const[Le,ke]=a.useState(!1);a.useEffect(()=>{if(me!=="in-progress")return;const t=setInterval(()=>ke(n=>!n),2e3);return()=>clearInterval(t)},[me]),be.metricShow;const Se=new Date().toLocaleDateString(e?"ta-IN":"en-IN",{weekday:"long",day:"numeric",month:"short"});return C?s.jsxs("div",{className:"animate-fade-in view-transition",children:[s.jsxs("div",{className:"dashboard-header-v2",children:[s.jsxs("div",{className:"header-main-stack",children:[s.jsx("span",{className:"header-greeting",children:e?"இன்றைய கவனம்":"Today's Focus"}),s.jsxs("div",{className:"header-sub-text",children:[s.jsx(De,{})," ",s.jsx("span",{children:"•"})," ",y,"/",f," ",e?"முடிந்தது":"Done"]})]}),s.jsxs("div",{className:"header-stat-capsule",children:[s.jsxs("div",{className:"capsule-value",children:[ee,"%"]}),s.jsx("div",{className:"capsule-label",children:e?"முடிவு":"DONE"})]})]}),s.jsxs("div",{className:"quick-actions-grid-v6",style:{margin:"0 14px 16px",display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:"10px"},children:[s.jsxs("button",{className:"v6-action-btn focus",onClick:()=>m==null?void 0:m(),style:{background:"var(--chip)",border:"1px solid var(--card-border)",borderRadius:"18px",padding:"16px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:"6px"},children:[s.jsx("span",{style:{fontSize:"1.2rem"},children:"🎯"}),s.jsx("span",{style:{fontSize:"0.75rem",fontWeight:800,color:"var(--text)"},children:e?"கவனம்":"Focus"})]}),s.jsxs("button",{className:"v6-action-btn new",onClick:()=>$==null?void 0:$(),style:{background:"var(--accent)",color:"#fff",border:"none",borderRadius:"18px",padding:"16px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:"6px",boxShadow:"0 4px 12px rgba(59, 130, 246, 0.3)"},children:[s.jsx("span",{style:{fontSize:"1.2rem"},children:"＋"}),s.jsx("span",{style:{fontSize:"0.75rem",fontWeight:800},children:e?"சேர்":"New Task"})]}),s.jsxs("button",{className:"v6-action-btn plan",onClick:()=>!z&&(p==null?void 0:p()),style:{background:"var(--chip)",border:"1px solid var(--card-border)",borderRadius:"18px",padding:"16px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:"6px",opacity:z?.5:1},children:[s.jsx("span",{style:{fontSize:"1.2rem"},children:"🤖"}),s.jsx("span",{style:{fontSize:"0.75rem",fontWeight:800,color:"var(--text)"},children:e?"திட்டம்":"AI Plan"})]})]}),s.jsx("div",{style:{margin:"0 14px 20px"},children:s.jsxs("button",{onClick:()=>!z&&(V==null?void 0:V()),className:"optimize-btn-v6",style:{width:"100%",padding:"14px",borderRadius:"16px",background:"linear-gradient(135deg, #a855f7, #6366f1)",color:"#fff",border:"none",fontWeight:800,fontSize:"0.95rem",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",boxShadow:"0 8px 24px rgba(139, 92, 246, 0.25)"},children:["✨ ",e?"அட்டவணையைச் சீராக்கு":"Optimize Schedule"]})}),s.jsxs("div",{className:"section-container-v2",children:[s.jsxs("h2",{className:"section-title-v2",children:[s.jsx("span",{children:"🤖"})," AI Coach"]}),s.jsxs("div",{className:"ai-briefing-grid-v2",children:[s.jsxs("div",{className:"ai-card-v2",children:[s.jsx("div",{className:"ai-card-label",children:e?"நிலை":"LIVE MODE"}),s.jsxs("div",{className:"ai-card-value live",children:[s.jsx("div",{className:"pulse-dot-v2"})," On"]})]}),s.jsxs("div",{className:"ai-card-v2",children:[s.jsx("div",{className:"ai-card-label",children:e?"கவனம்":"FOCUS"}),s.jsx("div",{className:"ai-card-value",children:r?`${e?"தயார்":"Prep"} "${r.text.substring(0,15)}..."`:e?"தீர்வு இல்லை":"No tasks"})]}),s.jsxs("div",{className:"ai-card-v2",children:[s.jsx("div",{className:"ai-card-label",children:e?"அபாயம்":"RISK"}),s.jsx("div",{className:"ai-card-value",style:{color:pe?"var(--error)":"var(--text)"},children:pe?e?"அதிகம்":"High":e?"குறைவு":"Low"})]}),s.jsxs("div",{className:"ai-card-v2",children:[s.jsx("div",{className:"ai-card-label",children:e?"ஆலோசனை":"SUGGESTION"}),s.jsx("div",{className:"ai-card-value",children:Q?Q.length>20?Q.substring(0,18)+"..":Q:e?"வேகம்":"Momentum"})]})]})]}),s.jsxs("div",{className:"section-container-v2",children:[s.jsxs("div",{className:"section-header-row-v2",children:[s.jsxs("h2",{className:"section-title-v2",children:[s.jsx("span",{children:"📊"})," ",e?"உற்பத்தித்திறன்":"Productivity"]}),s.jsx("span",{className:"section-date-label",children:Se})]}),s.jsxs("div",{className:"productivity-grid-v2",children:[s.jsxs("div",{className:"stat-card-v2 success",children:[s.jsxs("div",{className:"stat-value",children:[y,"/",f]}),s.jsx("div",{className:"stat-label",children:e?"முடிந்தவை":"TASKS DONE"})]}),s.jsxs("div",{className:"stat-card-v2 primary",children:[s.jsx("div",{className:"stat-value",children:Math.round(S)}),s.jsx("div",{className:"stat-label",children:e?"தொடர் நாள்":"DAY STREAK"})]})]})]}),r&&s.jsx("div",{style:{margin:"0 14px 20px"},children:s.jsxs("div",{className:"card next-up-card-v6",style:{padding:"20px",borderRadius:"24px",background:"var(--card)",border:"2px solid var(--accent)",boxShadow:"0 12px 32px rgba(59, 130, 246, 0.15)",position:"relative",overflow:"hidden"},children:[s.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"},children:[s.jsx("div",{className:"ai-briefing-label",style:{color:"var(--accent)",margin:0},children:re?e?"தாமதம்":"OVERDUE":e?"அடுத்தது":"NEXT UP"}),s.jsx(Me,{endTime:r.endTime})]}),s.jsx("h3",{style:{fontSize:"1.25rem",fontWeight:900,color:"var(--text)",marginBottom:"8px",lineHeight:1.2},children:r.text}),s.jsxs("p",{style:{fontSize:"0.9rem",color:"var(--muted)",fontWeight:600,marginBottom:"20px"},children:[r.startTime," ",r.endTime?` — ${r.endTime}`:""]}),s.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"},children:[s.jsxs("button",{onClick:()=>{v("tasks"),m==null||m()},style:{background:"var(--accent)",color:"#fff",border:"none",padding:"14px",borderRadius:"14px",fontWeight:800,fontSize:"0.9rem"},children:["▶ ",e?"தொடங்கு":"Start Focus"]}),s.jsx("button",{onClick:we,style:{background:"var(--chip)",color:"var(--text)",border:"1px solid var(--card-border)",padding:"14px",borderRadius:"14px",fontWeight:800,fontSize:"0.9rem"},children:e?"தவிர்":"Skip →"})]}),s.jsx("div",{style:{position:"absolute",bottom:"-20px",right:"-10px",fontSize:"6rem",opacity:.03,transform:"rotate(-15deg)",pointerEvents:"none"},children:"🎯"})]})}),s.jsx("div",{style:{padding:"20px 14px 40px",textAlign:"center"},children:s.jsx("p",{style:{fontSize:"0.7rem",color:"var(--muted)",fontWeight:600,opacity:.5,letterSpacing:"0.1em",textTransform:"uppercase"},children:"Life OS · AI Productivity System"})}),s.jsx("style",{dangerouslySetInnerHTML:{__html:`
        .dashboard-header-v2 {
          padding: calc(24px + var(--safe-top)) 20px 20px !important;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .header-main-stack {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .header-greeting {
          font-size: 1.8rem !important;
          font-weight: 900 !important;
          letter-spacing: -0.04em !important;
          color: var(--text);
          display: block;
        }
        .header-sub-text {
          font-size: 0.85rem !important;
          font-weight: 700 !important;
          color: var(--muted);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .header-stat-capsule {
          background: var(--chip);
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid var(--card-border);
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 80px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .capsule-value {
          font-size: 1.25rem;
          font-weight: 900;
          color: var(--text);
          line-height: 1;
        }
        .capsule-label {
          font-size: 0.6rem;
          font-weight: 900;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 2px;
        }
        .section-container-v2 {
          margin: 0 16px 28px;
        }
        .section-title-v2 {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--text);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding-left: 4px;
        }
        .ai-briefing-grid-v2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .ai-card-v2 {
          background: var(--chip);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: 16px;
          transition: 0.2s;
        }
        .ai-card-label {
          font-size: 0.6rem;
          font-weight: 900;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 6px;
        }
        .ai-card-value {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ai-card-value.live { color: var(--success); }
        .pulse-dot-v2 {
          width: 6px; height: 6px;
          background: var(--success);
          border-radius: 50%;
          animation: pulse-dot 2s infinite ease-in-out;
        }
        
        .section-header-row-v2 {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 14px;
          padding: 0 4px;
        }
        .section-date-label {
          font-size: 0.7rem;
          color: var(--muted);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .productivity-grid-v2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .stat-card-v2 {
          border-radius: 24px;
          padding: 24px 16px;
          text-align: center;
          border: 1px solid var(--card-border);
        }
        .stat-card-v2.success {
          background: linear-gradient(145deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.02));
          border-color: rgba(16, 185, 129, 0.2);
        }
        .stat-card-v2.primary {
          background: linear-gradient(145deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.02));
          border-color: rgba(99, 102, 241, 0.2);
        }
        .stat-value {
          font-size: 2.2rem;
          font-weight: 900;
          line-height: 1;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }
        .stat-card-v2.success .stat-value { color: var(--success); }
        .stat-card-v2.primary .stat-value { color: var(--accent); }
        .stat-label {
          font-size: 0.6rem;
          font-weight: 900;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        .v6-action-btn:active, .ai-card-v2:active {
          transform: scale(0.96);
          transition: transform 0.1s ease;
        }
      `}})]}):s.jsx("div",{className:"animate-fade-in view-transition",style:{opacity:.5,pointerEvents:"none",filter:"blur(4px)"},children:s.jsx("div",{className:"hero mobile-hero-v6",children:s.jsx("h1",{className:"title v6",children:e?"வரவேற்பு":"Welcome"})})})}export{Ae as default};
