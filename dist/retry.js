(()=>{
  'use strict';

  const KEY='gmat655-og-retry-v1';
  const $=selector=>document.querySelector(selector);
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let results={};
  try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))results=saved}catch{}

  const review=$('#review');
  if(!review)return;
  const panel=document.createElement('article');panel.id='retry-panel';panel.className='card retry-panel';review.prepend(panel);
  let missed=[],progressData=null;

  function render(){
    if(!missed.length){panel.hidden=true;return}
    const solved=missed.filter(item=>results[item.id]==='solved').length;
    const remaining=missed.length-solved;
    const guided=missed.filter(item=>item.guided&&results[item.id]!=='solved').length;
    const openGroups=new Set([...panel.querySelectorAll('.retry-group[open]')].map(group=>group.dataset.group));if(!panel.querySelector('.retry-group'))openGroups.add('guided');
    const first=missed.find(item=>results[item.id]!=='solved'),action=$('#momentum-study');
    if(first){$('#greeting').textContent=`Redo OG #${first.number} without hints`;$('#hero-summary').textContent=`${remaining} missed question${remaining===1?'':'s'} left to solve independently${guided?` · ${guided} needed hints originally`:''}. Open your Official Guide, solve, then mark the result.`;action.textContent='Open retry list';action.dataset.action='review'}
    else if(progressData){$('#greeting').textContent=`Focus: ${progressData.route.next}`;$('#hero-summary').textContent=progressData.bottleneck.summary;action.textContent='Start studying';action.dataset.action='timer'}
    const rows=items=>items.map(item=>{const value=results[item.id]||'pending';return `<div class="retry-row"><span><strong>#${item.number}</strong> <span class="sub">${esc(item.group)}</span></span><select aria-label="Retry result for question ${item.number}" data-retry-id="${esc(item.id)}"><option value="pending" ${value==='pending'?'selected':''}>Not retried</option><option value="solved" ${value==='solved'?'selected':''}>Solved alone</option><option value="missed" ${value==='missed'?'selected':''}>Still missed</option></select></div>`}).join('');
    panel.innerHTML=`<div class="row"><div><div class="eyebrow">Official Guide review</div><h2>Retry your missed questions</h2><p class="sub">Solve without hints, then record the retry result. Original scores stay unchanged.</p></div><span class="pill">${solved}/${missed.length} solved independently</span></div><div class="progress" style="margin:14px 0"><span style="width:${Math.round(solved/missed.length*100)}%"></span></div><div class="retry-instructions">Open your OG book, solve without notes, then record the result. Try missed ones again later.</div><details class="retry-group" data-group="guided" ${openGroups.has('guided')?'open':''}><summary>Needed hints originally · ${missed.filter(item=>item.guided).length} questions</summary><div class="retry-list">${rows(missed.filter(item=>item.guided))}</div></details><details class="retry-group" data-group="other" ${openGroups.has('other')?'open':''}><summary>Other misses · ${missed.filter(item=>!item.guided).length} questions</summary><div class="retry-list">${rows(missed.filter(item=>!item.guided))}</div></details>`;
  }

  panel.addEventListener('change',event=>{const select=event.target.closest('[data-retry-id]');if(!select)return;results[select.dataset.retryId]=select.value;try{localStorage.setItem(KEY,JSON.stringify(results))}catch{}render()});
  window.addEventListener('gmat:progress-loaded',event=>{
    progressData=event.detail;
    missed=(event.detail.practiceSessions||[]).flatMap(session=>session.groups.flatMap(group=>group.questions.filter(question=>question.result==='incorrect').map(question=>({id:`${session.date}:${session.source}:${question.number}`,number:question.number,group:group.name,guided:!!question.guided})))).sort((a,b)=>Number(b.guided)-Number(a.guided)||a.number-b.number);
    render();
  });
})();
