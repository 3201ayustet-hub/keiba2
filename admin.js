(()=>{
const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);
const cfg=()=>window.KEIBA_QUIZ_SUPABASE;
let questions=[], finals=[], activeTab='normal', editingId=null;

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const valueText=v=>Array.isArray(v)?v.join(' ／ '):String(v??'—');
const headers=()=>({apikey:cfg().key,Authorization:`Bearer ${cfg().key}`,'Content-Type':'application/json'});
function normalizeQuestionRow(r){
  const choices=[r.option1,r.option2,r.option3,r.option4];
  return {
    ...r,
    choices,
    answer:choices[(Number(r.correct_option)||1)-1]||'',
    category:r.category||'RACE QUIZ'
  };
}

function showAdmin(){
  $('#login-view').hidden=true;
  $('#admin-view').classList.add('active');
  renderSummary();
  renderList();
}
function renderSummary(){
  $('#db-summary').innerHTML=`
    <div class="summary-card"><b>${questions.length}</b><span>通常問題</span></div>
    <div class="summary-card"><b>${finals.length}</b><span>FINAL DB</span></div>
    <div class="summary-card"><b>${questions.filter(q=>q.active!==false).length}</b><span>出題中</span></div>
  `;
  updateSeedButton();
}
function normalCard(q){
  const choices=(q.choices||[]).map((c,i)=>{
    const ans=String(c).trim()===String(q.answer).trim();
    return `<div class="choice-item ${ans?'answer':''}"><b>${i+1}.</b> ${esc(c)}</div>`;
  }).join('');
  return `<article class="data-card">
    <div class="card-head">
      <div class="card-id">#${esc(q.id||'NO ID')}</div>
      <div class="card-meta">${q.active===false?'停止中':'出題中'}</div>
    </div>
    <div class="card-question">${esc(q.question)}</div>
    <div class="choice-grid">${choices}</div>
    <div class="answer-tag">ANSWER: ${esc(q.answer)}</div>
    <div class="explanation">${esc(q.explanation||'')}</div>
    <div class="card-actions">
      <button type="button" class="small-btn edit-question" data-id="${esc(q.id)}">編集</button>
      <button type="button" class="small-btn danger delete-question" data-id="${esc(q.id)}">削除</button>
    </div>
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
function matches(text,q){return String(text||'').toLowerCase().includes(q)}
function renderList(){
  const query=$('#search-input').value.trim().toLowerCase();
  const normalList=$('#normal-list'), finalList=$('#final-list'), yearFilter=$('#year-filter');
  if(activeTab==='normal'){
    yearFilter.hidden=true; normalList.hidden=false; finalList.hidden=true;
    const rows=questions.filter(q=>[q.id,q.question,q.answer,q.explanation,...(q.choices||[])].some(v=>matches(v,query)));
    normalList.innerHTML=rows.length?rows.map(normalCard).join(''):'<div class="empty">NO RESULTS</div>';
    $$('.edit-question').forEach(b=>b.addEventListener('click',()=>openEditor(b.dataset.id)));
    $$('.delete-question').forEach(b=>b.addEventListener('click',()=>deleteQuestion(b.dataset.id)));
    return;
  }
  yearFilter.hidden=false; normalList.hidden=true; finalList.hidden=false;
  const year=yearFilter.value;
  const rows=finals.filter(r=>(!year||String(r.year)===year)&&[r.id,r.year,r.date,r.race,r.venue,r.winner,r.second,r.third,r.fourth,r.fifth,r.time].some(v=>matches(Array.isArray(v)?v.join(' '):v,query)));
  finalList.innerHTML=rows.length?rows.map(finalCard).join(''):'<div class="empty">NO RESULTS</div>';
}
async function loadQuestionsFromSupabase(){
  const c=cfg();
  if(!c?.url||!c?.key)throw new Error('Supabase設定がありません。');
  const res=await fetch(`${c.url}/quiz_questions?select=*&order=id.asc`,{headers:headers(),cache:'no-store'});
  if(!res.ok)throw new Error(`通常問題の取得に失敗しました (${res.status})`);
  return (await res.json()).map(normalizeQuestionRow);
}
async function load(){
  const f=await fetch('final_races.json',{cache:'no-store'});
  if(!f.ok)throw new Error('FINAL DATABASE LOAD ERROR');
  finals=await f.json(); if(!Array.isArray(finals))finals=finals.races||[];
  questions=await loadQuestionsFromSupabase();
  const years=[...new Set(finals.map(r=>r.year).filter(Boolean))].sort((a,b)=>b-a);
  $('#year-filter').innerHTML='<option value="">全年度</option>'+years.map(y=>`<option value="${esc(y)}">${esc(y)}年</option>`).join('');
}
async function loadLocalSeedQuestions(){
  const res=await fetch('questions.json',{cache:'no-store'});
  if(!res.ok)throw new Error('questions.json の読み込みに失敗しました。');
  const data=await res.json();
  return (Array.isArray(data)?data:(data.questions||[])).filter(q=>Array.isArray(q.choices)&&q.choices.length>=4&&q.question&&q.answer);
}
async function seedDefaultQuestions(){
  if(questions.length){
    alert('通常問題が既に登録されています。初期100問の登録は、問題が0件のときのみ実行できます。');
    return;
  }
  if(!confirm('元の100問をSupabaseへ登録します。よろしいですか？'))return;
  try{
    const seed=await loadLocalSeedQuestions();
    if(seed.length!==100){
      alert(`初期問題が100問ではありません（${seed.length}問）。処理を中止しました。`);
      return;
    }
    const payload=seed.map(q=>{
      const choices=q.choices.slice(0,4);
      const correct=choices.findIndex(v=>String(v).trim()===String(q.answer).trim())+1;
      return {
        question:q.question,
        option1:choices[0],
        option2:choices[1],
        option3:choices[2],
        option4:choices[3],
        correct_option:correct,
        explanation:q.explanation||'',
        active:true
      };
    });
    if(payload.some(x=>x.correct_option<1)){
      alert('正解選択肢を特定できない問題があるため、中止しました。');
      return;
    }
    const c=cfg();
    const res=await fetch(`${c.url}/quiz_questions`,{
      method:'POST',
      headers:{...headers(),Prefer:'return=representation'},
      body:JSON.stringify(payload),
      cache:'no-store'
    });
    const body=await res.text();
    if(!res.ok){
      let detail=body;
      try{detail=JSON.parse(body)?.message||JSON.parse(body)?.hint||body}catch{}
      throw new Error(`Supabase登録エラー (${res.status})\n${detail}`);
    }
    const inserted=body?JSON.parse(body):[];
    if(Array.isArray(inserted) && inserted.length!==100){
      throw new Error(`登録件数が100件ではありません（${inserted.length}件）。`);
    }
    questions=await loadQuestionsFromSupabase();
    if(questions.length!==100){
      throw new Error(`登録後の取得件数が100件ではありません（${questions.length}件）。`);
    }
    renderSummary();
    renderList();
    updateSeedButton();
    alert('初期100問を登録しました。以後は管理者ページから編集・削除できます。');
  }catch(err){
    console.error(err);
    alert(`初期100問の登録に失敗しました。\n\n${err.message||err}`);
  }
}

function updateSeedButton(){
  const b=$('#seed-questions-btn');
  if(!b)return;
  b.hidden=questions.length!==0;
}

function openEditor(id){
  editingId=id?String(id):null;
  const q=editingId?questions.find(x=>String(x.id)===editingId):null;
  $('#editor-title').textContent=q?'通常問題を編集':'通常問題を追加';
  $('#question-id').textContent=q?`ID: ${q.id}`:'NEW';
  $('#q-question').value=q?.question||'';
  [1,2,3,4].forEach(i=>$('#q-option'+i).value=q?.['option'+i]??q?.choices?.[i-1]??'');
  const answerIndex=q?((q.choices||[]).findIndex(v=>String(v).trim()===String(q.answer).trim())+1):1;
  $('#q-correct').value=String(answerIndex>0?answerIndex:1);
  $('#q-explanation').value=q?.explanation||'';
  $('#editor').hidden=false;
  window.scrollTo({top:0,behavior:'smooth'});
}
function closeEditor(){editingId=null;$('#editor').hidden=true}
async function saveQuestion(e){
  e.preventDefault();
  const options=[1,2,3,4].map(i=>$('#q-option'+i).value.trim());
  const payload={question:$('#q-question').value.trim(),option1:options[0],option2:options[1],option3:options[2],option4:options[3],correct_option:Number($('#q-correct').value),explanation:$('#q-explanation').value.trim(),active:true};
  if(!payload.question||options.some(v=>!v)||!payload.explanation){alert('問題文・4択・解説をすべて入力してください。');return}
  const c=cfg();
  const url=editingId?`${c.url}/quiz_questions?id=eq.${encodeURIComponent(editingId)}`:`${c.url}/quiz_questions`;
  const res=await fetch(url,{method:editingId?'PATCH':'POST',headers:{...headers(),Prefer:'return=representation'},body:JSON.stringify(payload)});
  if(!res.ok){alert(`保存に失敗しました (${res.status})`);return}
  closeEditor();
  questions=await loadQuestionsFromSupabase();
  renderSummary();renderList();
}
async function deleteQuestion(id){
  const q=questions.find(x=>String(x.id)===String(id));
  if(!q||!confirm(`この問題を削除しますか？\n\n${q.question}`))return;
  const c=cfg();
  const res=await fetch(`${c.url}/quiz_questions?id=eq.${encodeURIComponent(id)}`,{method:'DELETE',headers:headers()});
  if(!res.ok){alert(`削除に失敗しました (${res.status})`);return}
  questions=await loadQuestionsFromSupabase();renderSummary();renderList();
}

$$('.tab').forEach(tab=>tab.addEventListener('click',e=>{e.preventDefault();activeTab=tab.dataset.tab;$$('.tab').forEach(t=>t.classList.remove('active'));tab.classList.add('active');renderList()}));
$('#search-input').addEventListener('input',renderList);
$('#year-filter').addEventListener('change',renderList);
$('#seed-questions-btn').addEventListener('click',seedDefaultQuestions);
$('#add-question-btn').addEventListener('click',()=>openEditor(null));
$('#cancel-editor-btn').addEventListener('click',closeEditor);
$('#question-form').addEventListener('submit',saveQuestion);

load().then(()=>{showAdmin()}).catch(e=>{
  console.error(e);
  alert('Supabaseから通常問題を読み込めませんでした。SQL・API設定を確認してください。');
});
})();
