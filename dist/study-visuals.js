(()=>{
  'use strict';
  const root=document.querySelector('#study-rhythm');if(!root)return;
  const $=id=>root.querySelector(`#${id}`),MINUTE=60000;
  const localKey=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const duration=ms=>{const minutes=Math.floor(Math.max(0,ms)/MINUTE);return ms>0&&minutes===0?'<1m':minutes>=60?`${Math.floor(minutes/60)}h${minutes%60?` ${minutes%60}m`:''}`:`${minutes}m`};
  let selected=null,week=null,snapshot=null,lastDrawing='';
  function render(data){
    snapshot=data;
    const today=new Date(data.now),todayKey=localKey(today),start=new Date(today);start.setHours(0,0,0,0);start.setDate(start.getDate()-start.getDay());
    const weekKey=localKey(start),totals=new Map(),recorded=new Set(data.studyDays);
    data.records.forEach(record=>{if(Number.isFinite(record.activeDurationMs)&&record.activeDurationMs>0){totals.set(record.date,(totals.get(record.date)||0)+record.activeDurationMs);recorded.add(record.date)}});
    const days=Array.from({length:7},(_,index)=>{const date=new Date(start);date.setDate(start.getDate()+index);const key=localKey(date),future=key>todayKey;return {date,key,ms:future?0:totals.get(key)||0,studied:!future&&recorded.has(key),future}});
    if(week!==`${weekKey}:${todayKey}`){
      week=`${weekKey}:${todayKey}`;selected=todayKey;
      $('study-days').replaceChildren(...days.map(day=>{
        const button=document.createElement('button');button.type='button';button.className='study-day';button.dataset.date=day.key;button.disabled=day.future;
        const square=document.createElement('span');square.className='study-square';square.setAttribute('aria-hidden','true');
        const label=document.createElement('span');label.textContent=day.date.toLocaleDateString('en-US',{weekday:'short'});
        button.append(square,label);return button;
      }));
    }
    const target=Number.isFinite(data.weeklyTargetMinutes)&&data.weeklyTargetMinutes>0?data.weeklyTargetMinutes*MINUTE:0;
    const total=days.filter(day=>!day.future).reduce((sum,day)=>sum+day.ms,0),dailyGoal=target?target/7:60*MINUTE;
    let cumulative=0;
    days.forEach(day=>{
      cumulative+=day.future?0:day.ms;day.cumulative=cumulative;
      const button=$('study-days').querySelector(`[data-date="${day.key}"]`),full=day.date.toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'});
      day.description=day.future?'Upcoming':day.ms>0?`${duration(day.ms)} logged`:day.studied?'Study recorded · time not logged':'No time logged';
      button.setAttribute('aria-label',`${full}: ${day.description}`);button.title=`${full}: ${day.description}`;button.setAttribute('aria-pressed',String(day.key===selected));
      button.classList.toggle('is-today',day.key===todayKey);button.classList.toggle('has-study',day.studied);button.classList.toggle('untracked',day.studied&&!day.ms);
      button.style.setProperty('--activity-fill',`${day.ms>0?Math.min(100,25+day.ms/dailyGoal*75):0}%`);
    });
    const chosen=days.find(day=>day.key===selected)||days[today.getDay()];
    $('study-day-detail').textContent=`${chosen.key===todayKey?'Today':chosen.date.toLocaleDateString('en-US',{weekday:'long'})} · ${chosen.description}`;
    $('study-days-count').textContent=`${days.filter(day=>day.studied&&!day.future).length} / 7 days`;
    $('study-week-feedback').textContent=target&&total>=target?'Weekly goal reached. Keep your rhythm.':target&&total>0?`${duration(target-total)} to your weekly goal.`:total>0?'Your study time is adding up.':'A little time today starts the line.';
    const scale=Math.max(target,total,60*MINUTE),x=index=>32+index*(274/6),y=value=>108-value/scale*92,points=days.filter(day=>!day.future).map((day,index)=>`${x(index).toFixed(2)},${y(day.cumulative).toFixed(2)}`);
    const drawing=JSON.stringify([week,selected,Math.floor(total/1000),target,days.map(day=>Math.floor(day.ms/1000))]);
    if(drawing===lastDrawing)return;lastDrawing=drawing;
    $('study-chart-line').setAttribute('points',points.join(' '));$('study-chart-area').setAttribute('points',`32,108 ${points.join(' ')} ${x(today.getDay()).toFixed(2)},108`);
    $('study-chart-goal').setAttribute('points',days.map((_,index)=>`${x(index).toFixed(2)},${y(target*(index+1)/7).toFixed(2)}`).join(' '));
    $('study-chart-goal').style.display=target?'':'none';$('study-goal-legend').hidden=!target;$('study-chart-max').textContent=duration(scale);
    const svgNS='http://www.w3.org/2000/svg';
    $('study-chart-dots').replaceChildren(...days.filter(day=>!day.future).map((day,index)=>{const circle=document.createElementNS(svgNS,'circle');circle.setAttribute('cx',x(index));circle.setAttribute('cy',y(day.cumulative));circle.setAttribute('r','2.5');circle.setAttribute('class','study-chart-dot');return circle}));
    $('study-chart-selected').setAttribute('cx',x(days.indexOf(chosen)));$('study-chart-selected').setAttribute('cy',y(chosen.cumulative));
    $('study-chart-description').textContent=`Cumulative study time for the week of ${start.toLocaleDateString('en-US',{month:'short',day:'numeric'})}: ${duration(total)} logged${target?` toward a ${duration(target)} goal`:''}. ${days.filter(day=>!day.future).map(day=>`${day.date.toLocaleDateString('en-US',{weekday:'long'})}: ${duration(day.cumulative)} cumulative`).join('; ')}.`;
  }
  $('study-days').addEventListener('click',event=>{const button=event.target.closest('[data-date]');if(!button||button.disabled||!snapshot)return;selected=button.dataset.date;render(snapshot)});
  window.addEventListener('gmat:study-time-updated',event=>render(event.detail));
})();
