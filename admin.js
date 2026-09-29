(()=>{
const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);
const PASSWORD='4649';
let questions=[], finals=[], activeTab='normal';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const valueText=v=>Array.isArray(v)?v.join(' ／ '):String(v??'—');

function isLoggedIn(){return sessionStorage.getItem('keiba_admin_auth')==='1'}
function setLoggedIn(v){if(v)sessionStorage.setItem('keiba_admin_auth','1');else sessionStorage.removeItem('keiba_admin_auth')}

function showAdmin(){
  $('#login-view').classList.remove('active');
  $('#admin-view').classList.add('active');
  renderSummary();
  renderList();
}
function showLogin(){
  $('#admin-view').classList.remove('active');
  $('#login-view').classList.add('active');
  $('#admin-password').value='';
}
function renderSummary(){
  $('#db-summary').innerHTML=`
    <div class="summary-card"><b>${questions.length}</b><span>通常問題</span></div>
    <div class="summary-card"><b>${finals.length}</b><span>FINAL DB</span></div>
    <div class="summary-card"><b>${finals.filter(r=>r.verification?.top5==='pending_individual_jra_check').length}</b><span>着順・タイム要照合</span></div>
  `;
}
function normalCard(q){
  const choices=(q.choices||[]).map(c=>{
    const ans=String(c).trim()===String(q.answer).trim();
    return `<div class="choice-item ${ans?'answer':''}">${esc(c)}</div>`;
  }).join('');
  return `<article class="data-card">
    <div class="card-head">
      <div class="card-id">${esc(q.id||'NO ID')}</div>
      <div class="card-meta">${esc(q.category||'')} ${esc(q.difficulty||'')}</div>
    </div>
    <div class="card-question">${esc(q.question)}</div>
    <div class="choice-grid">${choices}</div>
    <div class="answer-tag">ANSWER: ${esc(q.answer)}</div>
    ${q.factCheck?`<div class="fact-status">${esc(q.factCheck)}</div>`:''}
  </article>`;
}
function finalCard(r){
  const top5Status=r.verification?.top5==='pending_individual_jra_check';
  const timeStatus=r.verification?.time==='pending_individual_jra_check';
  return `<article class="data-card final-card">
    <div class="final-date">${esc(r.date||'')}<br>${esc(r.venue||'')}</div>
    <div>
      <div class="card-id">${esc(r.id||'')}</div>
      <div class="final-race-name">${esc(r.race||'')}</div>
      <div class="finish-grid">
        <div class="finish-item"><b>1ST</b>${esc(valueText(r.winner))}</div>
        <div class="finish-item"><b>2ND</b>${esc(valueText(r.second))}</div>
        <div class="finish-item"><b>3RD</b>${esc(valueText(r.third))}</div>
        <div class="finish-item"><b>4TH</b>${esc(valueText(r.fourth))}</div>
        <div class="finish-item"><b>5TH</b>${esc(valueText(r.fifth))}</div>
        <div class="finish-item"><b>TIME</b>${esc(r.time||'—')}</div>
      </div>
      <div class="verification-row">
        <span>WINNER: ${esc(r.verification?.winner||'—')}</span>
        <span class="${top5Status?'pending':''}">TOP5: ${esc(r.verification?.top5||'—')}</span>
        <span class="${timeStatus?'pending':''}">TIME: ${esc(r.verification?.time||'—')}</span>
      </div>
    </div>
  </article>`;
}
function matches(text,q){
  const t=String(text||'').toLowerCase();
  return t.includes(q);
}
function renderList(){
  const query=$('#search-input').value.trim().toLowerCase();
  if(activeTab==='normal'){
    $('#year-filter').hidden=true;
    $('#normal-list').hidden=false;
    $('#final-list').hidden=true;
    const rows=questions.filter(q=>[
      q.id,q.category,q.question,q.answer,...(q.choices||[])
    ].some(v=>matches(v,query)));
    $('#normal-list').innerHTML=rows.length?rows.map(normalCard).join(''):'<div class="empty">NO RESULTS</div>';
  }else{
    $('#year-filter').hidden=false;
    $('#normal-list').hidden=true;
    $('#final-list').hidden=false;
    const year=$('#year-filter').value;
    const rows=finals.filter(r=>
      (!year||String(r.year)===year) &&
      [r.id,r.year,r.date,r.race,r.venue,r.winner,r.second,r.third,r.fourth,r.fifth,r.time]
        .some(v=>matches(Array.isArray(v)?v.join(' '):v,query))
    );
    $('#final-list').innerHTML=rows.length?rows.map(finalCard).join(''):'<div class="empty">NO RESULTS</div>';
  }
}
async function load(){
  const [q,f]=await Promise.all([
    fetch('questions.json',{cache:'no-store'}),
    fetch('final_races.json',{cache:'no-store'})
  ]);
  if(!q.ok||!f.ok)throw new Error('DATABASE LOAD ERROR');
  questions=await q.json();
  finals=await f.json();
  if(!Array.isArray(questions))questions=questions.questions||[];
  if(!Array.isArray(finals))finals=finals.races||[];
  const years=[...new Set(finals.map(r=>r.year).filter(Boolean))].sort((a,b)=>b-a);
  $('#year-filter').innerHTML='<option value="">全年度</option>'+years.map(y=>`<option value="${esc(y)}">${esc(y)}年</option>`).join('');
}

$('#login-form').addEventListener('submit',e=>{
  e.preventDefault();
  if($('#admin-password').value===PASSWORD){
    setLoggedIn(true);
    $('#login-error').hidden=true;
    showAdmin();
  }else{
    $('#login-error').hidden=false;
    $('#admin-password').select();
  }
});
$('#logout-btn').addEventListener('click',()=>{setLoggedIn(false);showLogin()});
$$('.tab').forEach(tab=>tab.addEventListener('click',()=>{
  activeTab=tab.dataset.tab;
  $$('.tab').forEach(t=>t.classList.toggle('active',t===tab));
  renderList();
}));
$('#search-input').addEventListener('input',renderList);
$('#year-filter').addEventListener('change',renderList);

load().then(()=>{
  if(isLoggedIn())showAdmin();else showLogin();
}).catch(e=>{
  console.error(e);
  $('#login-error').hidden=false;
  $('#login-error').textContent='データベースを読み込めませんでした。';
});
})();
