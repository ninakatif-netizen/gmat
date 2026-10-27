(()=>{
  'use strict';

  const STORAGE_KEY='gmat655-study-timer-v1';
  const UNATTENDED_LIMIT_MS=90*60*1000;
  const MAX_SESSIONS=200;
  const categories=['Quant','Verbal','Data Insights','Mock Exam','Review'];
  const $=selector=>document.querySelector(selector);
  const elements={
    clock:$('#timer-clock'),category:$('#timer-category'),start:$('#timer-start'),pause:$('#timer-pause'),resume:$('#timer-resume'),finish:$('#timer-finish'),state:$('#timer-state'),status:$('#timer-status'),prompt:$('#still-studying'),confirm:$('#timer-confirm'),confirmPause:$('#timer-confirm-pause'),today:$('#timer-today'),week:$('#timer-week'),quant:$('#timer-quant'),verbal:$('#timer-verbal'),di:$('#timer-di'),list:$('#timer-session-list')
  };
  if(!elements.clock)return;

  const localKey=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const formatClock=milliseconds=>{const seconds=Math.max(0,Math.floor(milliseconds/1000)),hours=Math.floor(seconds/3600),minutes=Math.floor(seconds%3600/60);return `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`};
  const formatDuration=milliseconds=>{const minutes=Math.floor(Math.max(0,milliseconds)/60000);if(milliseconds>0&&minutes===0)return '<1m';if(minutes<60)return `${minutes}m`;const hours=Math.floor(minutes/60),remainder=minutes%60;return remainder?`${hours}h ${remainder}m`:`${hours}h`};
  const formatDate=date=>new Date(`${date}T12:00:00`).toLocaleDateString('en-US',{month:'short',day:'numeric'});
  const escapeHtml=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const emptyState=()=>({version:1,activeSession:null,sessions:[]});

  function loadState(){
    try{
      const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
      if(!parsed||typeof parsed!=='object')return emptyState();
      const sessions=Array.isArray(parsed.sessions)?parsed.sessions.filter(session=>session&&Number.isFinite(session.activeDurationMs)&&session.activeDurationMs>=0).slice(0,MAX_SESSIONS):[];
      let active=parsed.activeSession;
      if(!active||!['running','paused'].includes(active.status)||!Number.isFinite(active.activeMs)||active.activeMs<0)active=null;
      if(active){active.category=categories.includes(active.category)?active.category:'Uncategorized';active.runStartedAt=active.status==='running'&&Number.isFinite(active.runStartedAt)?active.runStartedAt:null}
      return {version:1,activeSession:active,sessions};
    }catch{return emptyState()}
  }

  let timerData=loadState();
  function saveState(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(timerData));return true}catch{return false}}
  function runningIncrement(session,now=Date.now()){return session.status==='running'&&Number.isFinite(session.runStartedAt)?Math.min(Math.max(0,now-session.runStartedAt),UNATTENDED_LIMIT_MS):0}
  function activeDuration(session,now=Date.now()){return Math.max(0,session.activeMs+runningIncrement(session,now))}
  function needsConfirmation(session,now=Date.now()){return !!session&&session.status==='running'&&Number.isFinite(session.runStartedAt)&&now-session.runStartedAt>=UNATTENDED_LIMIT_MS}

  function startSession(){
    if(timerData.activeSession)return;
    const now=Date.now(),selected=elements.category.value;
    timerData.activeSession={id:`session-${now}`,date:localKey(new Date(now)),startTime:new Date(now).toISOString(),category:categories.includes(selected)?selected:'Uncategorized',activeMs:0,runStartedAt:now,status:'running'};
    saveState();render();
  }

  function pauseSession(){
    const session=timerData.activeSession;if(!session||session.status!=='running')return;
    session.activeMs=activeDuration(session);session.runStartedAt=null;session.status='paused';saveState();render();
  }

  function resumeSession(){
    const session=timerData.activeSession;if(!session||session.status!=='paused')return;
    session.runStartedAt=Date.now();session.status='running';saveState();render();
  }

  function finishSession(){
    const session=timerData.activeSession;if(!session)return;
    const now=Date.now(),duration=Math.round(activeDuration(session,now));
    timerData.sessions.unshift({id:session.id,date:session.date,startTime:session.startTime,endTime:new Date(now).toISOString(),activeDurationMs:duration,category:session.category});
    timerData.sessions=timerData.sessions.slice(0,MAX_SESSIONS);timerData.activeSession=null;saveState();render();
  }

  function confirmContinuedStudy(){
    const session=timerData.activeSession;if(!session||session.status!=='running')return;
    session.activeMs=activeDuration(session);session.runStartedAt=Date.now();saveState();render();
  }

  function recordsWithActive(now){
    const records=[...timerData.sessions];
    if(timerData.activeSession)records.push({date:timerData.activeSession.date,category:timerData.activeSession.category,activeDurationMs:activeDuration(timerData.activeSession,now)});
    return records;
  }

  function renderMetrics(now){
    const records=recordsWithActive(now),todayKey=localKey(new Date(now)),weekStart=new Date(now);weekStart.setHours(0,0,0,0);weekStart.setDate(weekStart.getDate()-((weekStart.getDay()+6)%7));const weekKey=localKey(weekStart);
    const total=predicate=>records.filter(predicate).reduce((sum,session)=>sum+session.activeDurationMs,0);
    elements.today.textContent=formatDuration(total(session=>session.date===todayKey));elements.week.textContent=formatDuration(total(session=>session.date>=weekKey&&session.date<=todayKey));elements.quant.textContent=formatDuration(total(session=>session.category==='Quant'));elements.verbal.textContent=formatDuration(total(session=>session.category==='Verbal'));elements.di.textContent=formatDuration(total(session=>session.category==='Data Insights'));
  }

  function renderHistory(){
    const recent=timerData.sessions.slice(0,5);
    if(!recent.length){elements.list.className='empty-sessions';elements.list.textContent='No timer sessions yet.';return}
    elements.list.className='';elements.list.innerHTML=recent.map(session=>`<div class="session-row" title="${escapeHtml(new Date(session.startTime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}))}–${escapeHtml(new Date(session.endTime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}))}"><span>${escapeHtml(formatDate(session.date))}</span><span>${escapeHtml(session.category)}</span><span>${escapeHtml(formatDuration(session.activeDurationMs))}</span></div>`).join('');
  }

  function render(){
    const now=Date.now(),session=timerData.activeSession,confirming=needsConfirmation(session,now);
    elements.clock.textContent=formatClock(session?activeDuration(session,now):0);elements.start.disabled=!!session;elements.pause.disabled=!session||session.status!=='running';elements.resume.disabled=!session||session.status!=='paused';elements.finish.disabled=!session;elements.category.disabled=!!session;elements.prompt.hidden=!confirming;
    if(session){elements.category.value=session.category==='Uncategorized'?'':session.category;elements.state.textContent=confirming?'Confirm':session.status==='running'?'Running':'Paused';elements.status.textContent=confirming?'Timer capped at 1h 30m pending confirmation.':session.status==='running'?`${session.category} session in progress.`:`${session.category} session paused; paused time is excluded.`}else{elements.state.textContent='Ready';elements.status.textContent='Choose a category or start without one.'}
    renderMetrics(now);renderHistory();
  }

  elements.start.addEventListener('click',startSession);elements.pause.addEventListener('click',pauseSession);elements.resume.addEventListener('click',resumeSession);elements.finish.addEventListener('click',finishSession);elements.confirm.addEventListener('click',confirmContinuedStudy);elements.confirmPause.addEventListener('click',pauseSession);document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});
  render();setInterval(render,1000);
})();
