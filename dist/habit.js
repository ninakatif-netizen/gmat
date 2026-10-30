(()=>{
  'use strict';

  const STORAGE_KEY='gmat655-habit-v1';
  const $=selector=>document.querySelector(selector);
  const list=$('#quest-list');
  if(!list)return;

  const localKey=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const escapeHtml=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const emptyState=()=>({version:1,days:{}});

  function loadState(){
    try{
      const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
      if(!parsed||typeof parsed!=='object'||!parsed.days||typeof parsed.days!=='object')return emptyState();
      Object.values(parsed.days).forEach(day=>{day.completed=Array.isArray(day.completed)?day.completed.filter(id=>['recall','apply','review'].includes(id)):[]});
      return {version:1,days:parsed.days};
    }catch{return emptyState()}
  }

  let state=loadState(),progressData=null;
  const todayKey=()=>localKey(new Date());
  const dayState=()=>state.days[todayKey()]||{completed:[]};
  const save=()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));return true}catch{return false}};
  const titleCase=value=>String(value||'your next Quant rule').replace(/^./,character=>character.toUpperCase());

  function tasks(){
    const next=progressData?.route?.next,recommendations=progressData?.recommendations||[];
    return [
      {id:'recall',title:`Recall: ${titleCase(next)}`,detail:'15 min · retrieve the rule before checking notes',category:'Quant'},
      {id:'apply',title:recommendations[1]?.title||'Apply it without a topic label',detail:'35 min · solve 3 untitled medium-or-harder questions',category:'Quant'},
      {id:'review',title:'Close the loop',detail:'10 min · record one error, trap, or trigger you noticed',category:'Review'}
    ];
  }

  function totalXp(){return Object.values(state.days).reduce((sum,day)=>{const count=new Set(day.completed||[]).size;return sum+count*10+(count===3?20:0)},0)}
  function chain(){
    let count=0,cursor=new Date(),first=true;
    for(let i=0;i<365;i++){
      const completed=state.days[localKey(cursor)]?.completed?.length||0;
      if(completed){count++;cursor.setDate(cursor.getDate()-1)}else if(first){cursor.setDate(cursor.getDate()-1)}else break;
      first=false;
    }
    return count;
  }

  function render(){
    const completed=new Set(dayState().completed),items=tasks(),count=completed.size,xp=totalXp(),level=Math.floor(xp/150)+1,remaining=150-(xp%150);
    list.innerHTML=items.map(task=>`<label class="quest ${completed.has(task.id)?'done':''}"><input type="checkbox" data-quest-id="${task.id}" ${completed.has(task.id)?'checked':''}><span><strong>${escapeHtml(task.title)}</strong><p>${escapeHtml(task.detail)}</p><button class="quest-start" type="button" data-quest-start="${task.id}">Start with timer →</button></span></label>`).join('');
    $('#quest-xp').textContent=`${xp} XP`;$('#quest-level').textContent=`Momentum level ${level} · ${remaining} XP to next`;$('#quest-progress-label').textContent=`${count} of 3 complete`;$('#quest-progress-bar').style.width=`${Math.round(count/3*100)}%`;const currentChain=chain();$('#quest-chain').textContent=`${currentChain}-day quest chain`;
    const messages=['Start with the smallest win. Momentum follows action.','Good start. One action is now evidence.','One win left. Close the loop while it is fresh.','Daily Boost complete — 50 XP earned. You kept the promise to yourself.'];$('#quest-message').textContent=messages[count];$('#quest-message').classList.toggle('complete',count===3);
  }

  list.addEventListener('change',event=>{
    const input=event.target.closest('[data-quest-id]');if(!input)return;
    const key=todayKey(),current=new Set(state.days[key]?.completed||[]);input.checked?current.add(input.dataset.questId):current.delete(input.dataset.questId);if(current.size)state.days[key]={completed:[...current]};else delete state.days[key];save();render();
  });

  list.addEventListener('click',event=>{
    const button=event.target.closest('[data-quest-start]');if(!button)return;event.preventDefault();
    const task=tasks().find(item=>item.id===button.dataset.questStart),category=$('#timer-category'),start=$('#timer-start');if(task&&category&&!category.disabled)category.value=task.category;if(start&&!start.disabled)start.click();$('#study-timer')?.scrollIntoView({behavior:'smooth',block:'start'});
  });

  window.addEventListener('gmat:progress-loaded',event=>{progressData=event.detail;render()});
  render();
})();
