(()=>{
  'use strict';
  fetch('./progress.json',{cache:'no-store'}).then(response=>{
    if(!response.ok)throw new Error('Study data unavailable');
    return response.json();
  }).then(data=>{
    const target=new Date(data.deadline),days=Math.max(0,Math.ceil((target-new Date())/86400000));
    document.querySelector('#days-left').textContent=`${days} days left`;
    document.querySelector('#deadline-label').textContent=target.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
    if(Number.isFinite(data.weeklyTargetMinutes)){
      const minutes=data.weeklyTargetMinutes,hours=Math.floor(minutes/60),remaining=minutes%60;
      document.querySelector('#timer-week-goal').textContent=`Weekly goal: ${hours?`${hours}h`:''}${remaining?` ${remaining}m`:''}`;
    }
    window.dispatchEvent(new CustomEvent('gmat:progress-loaded',{detail:data}));
  }).catch(()=>{
    document.querySelector('#days-left').textContent='Target 655+';
    document.querySelector('#deadline-label').textContent='Refresh to load exam date';
  });
})();
