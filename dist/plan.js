(()=>{
  'use strict';
  const PLAN=window.GMAT_PLAN||[],KEY='gmat-plan';
  const localKey=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const parseDate=value=>new Date(`${value}T12:00:00`);
  const step=(date,offset)=>{const value=parseDate(date);value.setDate(value.getDate()+offset);return localKey(value)};
  const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const text=(id,value)=>{const element=document.getElementById(id);if(element)element.textContent=value};
  let today=localKey(new Date()),done={},storageError=false;
  const valid=value=>value&&typeof value==='object'&&!Array.isArray(value);
  try{
    const saved=localStorage.getItem(KEY);
    if(saved===null){
      done={'2026-11-04:livre1':true,'2026-11-04:revue':true,'2026-11-05:matin':true};
      localStorage.setItem(KEY,JSON.stringify(done));
    }else{
      const parsed=JSON.parse(saved);if(valid(parsed))done=parsed;else storageError=true;
    }
  }catch{storageError=true}
  const tasksMarkup=day=>`<ul class="plan-tasks">${day.tasks.map(task=>{
    const key=`${day.date}:${task.id}`;
    return `<li><label><input type="checkbox" data-plan-key="${escape(key)}"><span class="tt">${escape(task.t)}<span class="td">${escape(task.d)}</span></span><span class="th">${escape(task.h)}</span></label></li>`;
  }).join('')}</ul>`;
  function build(){
    document.querySelectorAll('[data-plan-root]').forEach(root=>{
      if(root.dataset.planView==='today'){
        const day=PLAN.find(item=>item.date===today);
        root.innerHTML=day?tasksMarkup(day):'<p class="sub">No tasks are scheduled for this date. Open the full plan to choose your next session.</p>';
        return;
      }
      const weeks=[];
      PLAN.forEach(day=>{
        const value=parseDate(day.date);value.setDate(value.getDate()-(value.getDay()+6)%7);const key=localKey(value);
        let week=weeks.find(item=>item.key===key);if(!week){week={key,days:[]};weeks.push(week)}week.days.push(day);
      });
      root.innerHTML=weeks.map((week,index)=>{
        const current=week.days.some(day=>day.date===today),short=date=>parseDate(date).toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
        return `<details class="week" ${current?'open':''}><summary>Semaine ${index+1}<span>${escape(short(week.days[0].date))} – ${escape(short(week.days.at(-1).date))}</span></summary><div class="days">${week.days.map(day=>`<article class="day plan-day ${day.date===today?'today':''} ${day.date<today?'past':''}" id="d-${day.date}"><div class="dh"><h3>${escape(day.label)}${day.date===today?' · aujourd’hui':''}</h3><span class="tag ${day.kind==='sunday'?'sun':''}">${day.kind==='sunday'?'Dimanche test':`${day.tasks.reduce((sum,task)=>sum+(task.n||0),0)} questions du livre`}</span></div>${tasksMarkup(day)}</article>`).join('')}</div></details>`;
      }).join('');
    });
  }
  function render(){
    let questions=0,totalQuestions=0,completed=0,total=0;
    PLAN.forEach(day=>day.tasks.forEach(task=>{total++;totalQuestions+=task.n||0;if(done[`${day.date}:${task.id}`]){completed++;questions+=task.n||0}}));
    const active=PLAN.filter(day=>day.tasks.some(task=>done[`${day.date}:${task.id}`])).map(day=>day.date),set=new Set(active);
    let streak=0,cursor=set.has(today)?today:step(today,-1);while(set.has(cursor)){streak++;cursor=step(cursor,-1)}
    const day=PLAN.find(item=>item.date===today),count=day?day.tasks.filter(task=>done[`${day.date}:${task.id}`]).length:0;
    text('plan-today-progress',day?`${count} / ${day.tasks.length}`:'—');
    text('plan-question-progress',`${questions} / ${totalQuestions}`);
    text('plan-streak',`${streak} ${streak===1?'day':'days'}`);
    text('plan-day-status',day?(count===day.tasks.length?'Done':`${day.tasks.length-count} left`):'No tasks');
    text('plan-today-date',parseDate(today).toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'}));
    text('sQ',questions);text('sQt',totalQuestions);text('sS',`${streak} ${streak===1?'jour':'jours'}`);
    const bar=document.getElementById('bQ');if(bar)bar.style.width=`${totalQuestions?questions/totalQuestions*100:0}%`;
    document.querySelectorAll('[data-plan-key]').forEach(input=>{input.checked=!!done[input.dataset.planKey];input.closest('li').classList.toggle('checked',input.checked)});
    PLAN.forEach(item=>document.getElementById(`d-${item.date}`)?.classList.toggle('complete',item.tasks.every(task=>done[`${item.date}:${task.id}`])));
    if(storageError)text('plan-save-status','Changes could not be saved on this device. Keep this page open.');
  }
  document.addEventListener('change',event=>{
    const input=event.target.closest('[data-plan-key]');if(!input)return;
    if(input.checked)done[input.dataset.planKey]=true;else delete done[input.dataset.planKey];
    try{localStorage.setItem(KEY,JSON.stringify(done));storageError=false;text('plan-save-status','Saved on this device.')}catch{storageError=true}
    render();
  });
  document.getElementById('jump')?.addEventListener('click',()=>{
    const target=document.getElementById(`d-${today}`);if(!target)return;
    target.closest('details').open=true;target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  });
  window.addEventListener('storage',event=>{if(event.key!==KEY)return;try{const saved=JSON.parse(event.newValue||'{}');if(valid(saved)){done=saved;render()}}catch{}});
  document.addEventListener('visibilitychange',()=>{const current=localKey(new Date());if(!document.hidden&&current!==today){today=current;build();render()}});
  build();render();
})();
