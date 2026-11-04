(()=>{
  'use strict';

  const KEY='gmat655-og-retry-v1';
  const $=selector=>document.querySelector(selector);
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let results={};
  try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))results=saved}catch{}

  const review=$('#review'),today=$('#today');
  if(!review||!today)return;
  const panel=document.createElement('article');panel.id='retry-panel';panel.className='card retry-panel';review.prepend(panel);
  const next=document.createElement('article');next.id='retry-next';next.className='card retry-next';today.insertBefore(next,$('#study-timer'));
  let missed=[];

  function render(){
    if(!missed.length){panel.hidden=true;next.hidden=true;return}
    const solved=missed.filter(item=>results[item.id]==='solved').length;
    const remaining=missed.length-solved;
    const guided=missed.filter(item=>item.guided&&results[item.id]!=='solved').length;
    next.innerHTML=`<div class="retry-next-main"><div><div class="eyebrow">Next useful move</div><h2>${remaining?`Retry ${remaining} missed OG question${remaining===1?'':'s'}`:'All OG misses solved independently'}</h2><p class="sub">${remaining?`${guided} guided answer${guided===1?'':'s'} still need an independent solve. Use your Official Guide book.`:'Revisit a mixed set after a short delay to check retention.'}</p></div><button class="timer-btn primary" id="retry-open" type="button">Open retry list</button></div>`;
    panel.innerHTML=`<div class="row"><div><div class="eyebrow">Official Guide review</div><h2>Retry your missed questions</h2><p class="sub">Solve without hints, then record the retry result. Original scores stay unchanged.</p></div><span class="pill">${solved}/${missed.length} solved independently</span></div><div class="progress" style="margin:14px 0"><span style="width:${Math.round(solved/missed.length*100)}%"></span></div><div class="retry-instructions">1. Open the question in your OG book. 2. Solve it without notes. 3. Mark the result here. Try missed ones again later.</div><div class="retry-list">${missed.map(item=>{const value=results[item.id]||'pending';return `<div class="retry-row"><span><strong>#${item.number}</strong> <span class="sub">${esc(item.group)}${item.guided?' · needed hints':''}</span></span><select aria-label="Retry result for question ${item.number}" data-retry-id="${esc(item.id)}"><option value="pending" ${value==='pending'?'selected':''}>Not retried</option><option value="solved" ${value==='solved'?'selected':''}>Solved alone</option><option value="missed" ${value==='missed'?'selected':''}>Still missed</option></select></div>`}).join('')}</div>`;
    $('#retry-open').addEventListener('click',()=>{$('[data-tab="review"]').click();panel.scrollIntoView({behavior:'smooth',block:'start'})});
  }

  panel.addEventListener('change',event=>{const select=event.target.closest('[data-retry-id]');if(!select)return;results[select.dataset.retryId]=select.value;try{localStorage.setItem(KEY,JSON.stringify(results))}catch{}render()});
  window.addEventListener('gmat:progress-loaded',event=>{
    missed=(event.detail.practiceSessions||[]).flatMap(session=>session.groups.flatMap(group=>group.questions.filter(question=>question.result==='incorrect').map(question=>({id:`${session.date}:${session.source}:${question.number}`,number:question.number,group:group.name,guided:!!question.guided})))).sort((a,b)=>Number(b.guided)-Number(a.guided)||a.number-b.number);
    render();
  });
})();
