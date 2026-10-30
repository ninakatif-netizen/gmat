(()=>{
  'use strict';

  const STORAGE_KEY='gmat655-study-timer-v1';
  const UNATTENDED_LIMIT_MS=90*60*1000;
  const MAX_SESSIONS=200;
  const categories=['Quant','Verbal','Data Insights','Mock Exam','Review'];
  const $=selector=>document.querySelector(selector);
  const elements={
    clock:$('#timer-clock'),category:$('#timer-category'),start:$('#timer-start'),pause:$('#timer-pause'),resume:$('#timer-resume'),finish:$('#timer-finish'),state:$('#timer-state'),status:$('#timer-status'),prompt:$('#still-studying'),confirm:$('#timer-confirm'),confirmPause:$('#timer-confirm-pause'),today:$('#timer-today'),week:$('#timer-week'),quant:$('#timer-quant'),verbal:$('#timer-verbal'),di:$('#timer-di'),list:$('#timer-session-list'),distributionToday:$('#distribution-today'),distributionWeek:$('#distribution-week'),distributionAll:$('#distribution-all'),distributionTodayTotal:$('#distribution-today-total'),distributionWeekTotal:$('#distribution-week-total'),distributionAllTotal:$('#distribution-all-total'),summaryQuantShare:$('#summary-quant-share'),summaryVerbalShare:$('#summary-verbal-share'),summaryDiShare:$('#summary-di-share'),summaryTotal:$('#summary-total-time'),summaryWeek:$('#summary-week-time')
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

  let timerData=loadState(),progressData=null,celebrationUntil=0,celebrationMessage='';
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
    timerData.sessions=timerData.sessions.slice(0,MAX_SESSIONS);timerData.activeSession=null;celebrationUntil=now+8000;celebrationMessage=`Session saved — ${formatDuration(duration)} of focused effort. You showed up.`;saveState();render();
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

  function syncProgressSessions(data){
    let changed=false;
    data.studySessions.forEach((session,index)=>{if(!categories.includes(session.timerCategory))return;const id=`progress-${session.date}-${index}`;if(timerData.sessions.some(saved=>saved.id===id))return;timerData.sessions.push({id,date:session.date,category:session.timerCategory,activeDurationMs:session.minutes*60000,source:'progress',label:session.breakdown});changed=true});
    if(changed){timerData.sessions.sort((a,b)=>String(b.date).localeCompare(String(a.date)));timerData.sessions=timerData.sessions.slice(0,MAX_SESSIONS);saveState()}
  }

  function renderMetrics(now){
    const records=recordsWithActive(now),todayKey=localKey(new Date(now)),weekStart=new Date(now);weekStart.setHours(0,0,0,0);weekStart.setDate(weekStart.getDate()-weekStart.getDay());const weekKey=localKey(weekStart);
    const total=predicate=>records.filter(predicate).reduce((sum,session)=>sum+session.activeDurationMs,0);
    elements.today.textContent=formatDuration(total(session=>session.date===todayKey));elements.week.textContent=formatDuration(total(session=>session.date>=weekKey&&session.date<=todayKey));elements.quant.textContent=formatDuration(total(session=>session.category==='Quant'));elements.verbal.textContent=formatDuration(total(session=>session.category==='Verbal'));elements.di.textContent=formatDuration(total(session=>session.category==='Data Insights'));
  }

  function exactPercentages(values){
    const total=values.reduce((sum,value)=>sum+value,0);if(!total)return values.map(()=>0);
    const raw=values.map(value=>value/total*100),rounded=raw.map(Math.floor);let remainder=100-rounded.reduce((sum,value)=>sum+value,0);
    raw.map((value,index)=>({index,fraction:value-Math.floor(value)})).sort((a,b)=>b.fraction-a.fraction||a.index-b.index).slice(0,remainder).forEach(item=>rounded[item.index]++);return rounded;
  }

  function renderDistribution(now){
    if(!elements.distributionToday)return;
    const records=recordsWithActive(now),todayKey=localKey(new Date(now)),weekStart=new Date(now);weekStart.setHours(0,0,0,0);weekStart.setDate(weekStart.getDate()-weekStart.getDay());const weekKey=localKey(weekStart);
    const scopes=[{records:records.filter(session=>session.date===todayKey),container:elements.distributionToday,total:elements.distributionTodayTotal},{records:records.filter(session=>session.date>=weekKey&&session.date<=todayKey),container:elements.distributionWeek,total:elements.distributionWeekTotal},{records,container:elements.distributionAll,total:elements.distributionAllTotal}];
    const definitions=[{label:'Quant',matches:category=>category==='Quant'},{label:'Verbal',matches:category=>category==='Verbal'},{label:'Data Insights',matches:category=>category==='Data Insights'},{label:'Mock',matches:category=>category==='Mock'||category==='Mock Exam'},{label:'Review',matches:category=>category==='Review'},{label:'Uncategorized',matches:category=>!categories.includes(category)&&category!=='Mock'}];
    let allPercentages=[];
    scopes.forEach((scope,scopeIndex)=>{const values=definitions.map(definition=>scope.records.filter(session=>definition.matches(session.category)).reduce((sum,session)=>sum+session.activeDurationMs,0)),total=values.reduce((sum,value)=>sum+value,0),percentages=exactPercentages(values);if(scopeIndex===2)allPercentages=percentages;scope.total.textContent=`${formatDuration(total)} total`;scope.container.innerHTML=definitions.map((definition,index)=>definition.label==='Uncategorized'&&!values[index]?'':`<div class="distribution-row"><span>${escapeHtml(definition.label)}</span><div class="progress"><span style="width:${percentages[index]}%"></span></div><b>${escapeHtml(formatDuration(values[index]))} · ${percentages[index]}%</b></div>`).join('')});
    const allRecords=scopes[2].records,allTotal=allRecords.reduce((sum,session)=>sum+session.activeDurationMs,0),weekTotal=scopes[1].records.reduce((sum,session)=>sum+session.activeDurationMs,0);elements.summaryQuantShare.textContent=`${allPercentages[0]||0}%`;elements.summaryVerbalShare.textContent=`${allPercentages[1]||0}%`;elements.summaryDiShare.textContent=`${allPercentages[2]||0}%`;elements.summaryTotal.textContent=formatDuration(allTotal);elements.summaryWeek.textContent=formatDuration(weekTotal);
  }

  function renderMainStudyTotals(now){
    if(!progressData)return;
    const totalsByDate={},studyDays=new Set(progressData.studyDays||[]);
    progressData.studySessions.forEach(session=>{totalsByDate[session.date]=(totalsByDate[session.date]||0)+session.minutes*60000;studyDays.add(session.date)});
    recordsWithActive(now).filter(session=>session.source!=='progress').forEach(session=>{totalsByDate[session.date]=(totalsByDate[session.date]||0)+session.activeDurationMs;if(session.activeDurationMs>0)studyDays.add(session.date)});
    const today=new Date(now),todayKey=localKey(today),weekStart=new Date(today);weekStart.setHours(0,0,0,0);weekStart.setDate(weekStart.getDate()-weekStart.getDay());const weekKey=localKey(weekStart),weekly=Object.entries(totalsByDate).filter(([date])=>date>=weekKey&&date<=todayKey).reduce((sum,[,milliseconds])=>sum+milliseconds,0),target=progressData.weeklyTargetMinutes*60000,weeklyPercent=Math.max(0,Math.min(100,Math.round(weekly/target*100))),formatProgress=milliseconds=>{const minutes=Math.floor(milliseconds/60000);return minutes>=60?`${Math.floor(minutes/60)}h ${String(minutes%60).padStart(2,'0')}m`:`${minutes}m`};
    let streak=0,cursor=new Date(today);for(let i=0;i<365;i++){const key=localKey(cursor);if(studyDays.has(key)){streak++;cursor.setDate(cursor.getDate()-1)}else if(i===0){cursor.setDate(cursor.getDate()-1)}else break}
    const start=new Date(weekStart);let days='';for(let i=0;i<7;i++){const day=new Date(start);day.setDate(start.getDate()+i);const key=localKey(day),milliseconds=totalsByDate[key]||0,studied=studyDays.has(key);days+=`<div class="day ${studied?'studied':''} ${key===todayKey?'today':''}"><i title="${escapeHtml(milliseconds?formatProgress(milliseconds):studied?'Study recorded; duration not tracked':'No study recorded')}"></i><small>${['S','M','T','W','T','F','S'][i]}</small></div>`}
    const allTime=Object.values(totalsByDate).reduce((sum,milliseconds)=>sum+milliseconds,0);$('#week-target').textContent=`This week · ${formatProgress(target)} target`;$('#week-total').textContent=`${formatProgress(weekly)} / ${formatProgress(target)}`;$('#week-percent').textContent=`${weeklyPercent}%`;$('#week-bar').style.width=`${weeklyPercent}%`;$('#week-grid').innerHTML=days;$('#streak').textContent=`${streak}-day streak`;$('#active-study').textContent=formatProgress(allTime);
  }

  function renderHistory(){
    const recent=timerData.sessions.slice(0,5);
    if(!recent.length){elements.list.className='empty-sessions';elements.list.textContent='No timer sessions yet.';return}
    elements.list.className='';elements.list.innerHTML=recent.map(session=>{const title=session.startTime&&session.endTime?`${new Date(session.startTime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}–${new Date(session.endTime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`:'Imported from progress history';return `<div class="session-row" title="${escapeHtml(title)}"><span>${escapeHtml(formatDate(session.date))}</span><span>${escapeHtml(session.category)}</span><span>${escapeHtml(formatDuration(session.activeDurationMs))}</span></div>`}).join('');
  }

  function render(){
    const now=Date.now(),session=timerData.activeSession,confirming=needsConfirmation(session,now);
    elements.clock.textContent=formatClock(session?activeDuration(session,now):0);elements.start.disabled=!!session;elements.pause.disabled=!session||session.status!=='running';elements.resume.disabled=!session||session.status!=='paused';elements.finish.disabled=!session;elements.category.disabled=!!session;elements.prompt.hidden=!confirming;
    const celebrating=!session&&now<celebrationUntil;elements.status.classList.toggle('celebrate',celebrating);
    if(session){elements.category.value=session.category==='Uncategorized'?'':session.category;elements.state.textContent=confirming?'Confirm':session.status==='running'?'Running':'Paused';elements.status.textContent=confirming?'Timer capped at 1h 30m pending confirmation.':session.status==='running'?`${session.category} session in progress.`:`${session.category} session paused; paused time is excluded.`}else{elements.state.textContent=celebrating?'Saved ✓':'Ready';elements.status.textContent=celebrating?celebrationMessage:'Choose a category or start without one.'}
    renderMetrics(now);renderDistribution(now);renderHistory();renderMainStudyTotals(now);
  }

  elements.start.addEventListener('click',startSession);elements.pause.addEventListener('click',pauseSession);elements.resume.addEventListener('click',resumeSession);elements.finish.addEventListener('click',finishSession);elements.confirm.addEventListener('click',confirmContinuedStudy);elements.confirmPause.addEventListener('click',pauseSession);document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});window.addEventListener('gmat:progress-loaded',event=>{progressData=event.detail;syncProgressSessions(progressData);render()});
  render();setInterval(render,1000);
})();
