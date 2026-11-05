(()=>{
  'use strict';
  const card=document.querySelector('#climb-card');if(!card)return;
  const $=id=>card.querySelector(`#${id}`),NS='http://www.w3.org/2000/svg',compact=matchMedia('(max-width:650px)');
  const guide=[
    'Build the core rules and practise solving independently.',
    'Mix topics and recognise which tool the question needs.',
    'Build accurate pacing and endurance in timed sets.',
    'Use official mock exams to check performance and find weak spots.',
    'Aim for consistent performance in your target score range.'
  ];
  let data=null,stages=[],current=-1,selected=0,progress=null;
  function describe(){
    const stage=stages[selected];if(!stage)return;
    [...$('climb-camps').children].forEach((button,index)=>{button.setAttribute('aria-pressed',String(index===selected));button.classList.toggle('is-current',index===current)});
    [...$('climb-markers').children].forEach((marker,index)=>marker.classList.toggle('is-selected',index===selected));
    const status=selected===current?'Current camp':current>=0&&selected<current?'Reached':'Ahead';
    $('climb-stage-title').textContent=`${stage.name} · ${stage.description}`;
    $('climb-stage-detail').textContent=`${status} · ${selected===current&&data.hero?.summary?data.hero.summary:guide[selected]||stage.description}`;
    $('climb-next').hidden=selected!==current||!data.route.next;
    $('climb-next').textContent=data.route.next?`Next learning step: ${data.route.next}`:'';
  }
  function draw(){
    if(!data)return;
    const small=compact.matches,path=small?'M24 160 C70 165 80 130 120 137 S180 115 210 102 S280 75 300 68 S355 25 375 28':'M55 210 C170 205 190 160 280 170 S405 125 480 135 S600 75 680 90 S800 35 850 28';
    $('climb-route').setAttribute('viewBox',small?'0 0 400 200':'0 0 900 270');
    $('climb-track').setAttribute('d',path);$('climb-done').setAttribute('d',path);
    $('climb-slope').setAttribute('d',`${path} L${small?'375 192 L24 192':'850 260 L55 260'} Z`);
    $('climb-done').setAttribute('stroke-dasharray',`${progress??0} 100`);$('climb-done').style.opacity=progress>0?'1':'0';
    const length=$('climb-track').getTotalLength(),positions=stages.length===5?[.15,.35,.55,.76,1]:stages.map((_,index)=>(index+1)/stages.length);
    $('climb-markers').replaceChildren(...stages.map((stage,index)=>{
      const point=$('climb-track').getPointAtLength(length*positions[index]),group=document.createElementNS(NS,'g');group.classList.add('climb-marker');
      if(index===current)group.classList.add('is-current');if(current>=0&&index<current)group.classList.add('is-reached');
      group.setAttribute('transform',`translate(${point.x},${point.y})`);
      const circle=document.createElementNS(NS,'circle');circle.setAttribute('r',small?'11':'13');
      const label=document.createElementNS(NS,'text');label.setAttribute('text-anchor','middle');label.setAttribute('dy','.35em');label.textContent=String(index+1);
      group.append(circle,label);return group;
    }));
    for(const [id,x,y] of [['climb-start-label',small?24:55,small?185:246],['climb-summit-label',small?375:850,10]]){
      $(id).setAttribute('x',x);$(id).setAttribute('y',y);$(id).setAttribute('text-anchor',id==='climb-summit-label'?'middle':'start');
    }
    describe();
  }
  $('climb-camps').addEventListener('click',event=>{const button=event.target.closest('[data-camp-index]');if(!button)return;selected=Number(button.dataset.campIndex);describe()});
  compact.addEventListener('change',draw);
  window.addEventListener('gmat:progress-loaded',event=>{
    data=event.detail;stages=Array.isArray(data.route?.stages)?data.route.stages:[];if(!stages.length)return;
    current=stages.findIndex(stage=>String(data.hero?.camp||'').split('·')[0].trim().toLowerCase()===stage.name.toLowerCase());selected=Math.max(0,current);
    progress=Number.isFinite(data.overallProgress)?Math.max(0,Math.min(100,data.overallProgress)):null;
    $('climb-heading').textContent=`Your climb to ${data.targetScore}`;$('climb-route-title').textContent=`Your ${stages.length}-camp route to GMAT ${data.targetScore}`;
    $('climb-current').textContent=current>=0?stages[current].name:'Your route';
    const updated=data.lastUpdated?new Date(`${data.lastUpdated.slice(0,10)}T12:00:00`):null;
    $('climb-progress').textContent=`${progress===null?'Preparation estimate unavailable':`${progress}% preparation estimate`}${updated&&!Number.isNaN(updated.getTime())?` · Study update ${updated.toLocaleDateString('en-US',{month:'short',day:'numeric'})}`:''}`;
    $('climb-route-description').textContent=`${current>=0?`Currently at ${stages[current].name}. `:''}${progress===null?'':`Overall preparation estimate: ${progress}%. `}${stages.map(stage=>`${stage.name}: ${stage.description}`).join('; ')}.`;
    $('climb-camps').replaceChildren(...stages.map((stage,index)=>{const button=document.createElement('button');button.type='button';button.dataset.campIndex=index;button.textContent=stage.name;button.setAttribute('aria-label',`${stage.name}: ${stage.description}${index===current?', current camp':''}`);return button}));
    card.hidden=false;draw();
  });
})();
