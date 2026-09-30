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
  const n=Number(r.correct_option);
  return {...r,choices,answer:choices[n-1]||'',category:r.category||'RACE QUIZ'};
}
async function api(url, options={}){
  const res=await fetch(url,{...options,headers:{...headers(),...(options.headers||{})},cache:'no-store'});
  const text=await res.text();
  let body=null; try{body=text?JSON.parse(text):null}catch{}
  if(!res.ok) throw new Error(`${res.status}: ${body?.message||body?.hint||text||'Supabase error'}`);
  return body;
}
function renderSummary(){
  $('#db-summary').innerHTML=`
    <div class="summary-card"><b>${questions.length}</b><span>通常問題</span></div>
    <div class="summary-card"><b>${finals.length}</b><span>FINAL DB</span></div>
    <div class="summary-card"><b>${questions.filter(q=>q.active!==false).length}</b><span>出題中</span></div>`;
  updateSeedButton();
}
function normalCard(q){
  const choices=(q.choices||[]).map((c,i)=>{
    const ans=String(c).trim()===String(q.answer).trim();
    return `<div class="choice-item ${ans?'answer':''}"><b>${i+1}.</b> ${esc(c)}</div>`;
  }).join('');
  return `<article class="data-card">
    <div class="card-head"><div class="card-id">#${esc(q.id??'')}</div><div class="card-meta">${q.active===false?'停止中':'出題中'}</div></div>
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
        <span>TOP5: ${esc(r.verification?.top5||'—')}</span>
        <span>TIME: ${esc(r.verification?.time||'—')}</span>
      </div>
    </div>
  </article>`;
}
function matches(text,q){return String(text??'').toLowerCase().includes(q)}
function renderList(){
  const query=$('#search-input').value.trim().toLowerCase();
  const normalList=$('#normal-list'), finalList=$('#final-list'), yearFilter=$('#year-filter');
  if(activeTab==='normal'){
    yearFilter.hidden=true; normalList.hidden=false; finalList.hidden=true;
    const rows=questions.filter(q=>[q.id,q.question,q.answer,q.explanation,...(q.choices||[])].some(v=>matches(v,query)));
    normalList.innerHTML=rows.length?rows.map(normalCard).join(''):'<div class="empty">NO RESULTS</div>';
    $$('.edit-question').forEach(b=>b.addEventListener('click',()=>openEditor(b.dataset.id)));
    $$('.delete-question').forEach(b=>b.addEventListener('click',()=>deleteQuestion(b.dataset.id)));
  }else{
    yearFilter.hidden=false; normalList.hidden=true; finalList.hidden=false;
    const year=yearFilter.value;
    const rows=finals.filter(r=>(!year||String(r.year)===year)&&
      [r.id,r.year,r.date,r.race,r.venue,r.winner,r.second,r.third,r.fourth,r.fifth,r.time]
      .some(v=>matches(Array.isArray(v)?v.join(' '):v,query)));
    finalList.innerHTML=rows.length?rows.map(finalCard).join(''):'<div class="empty">NO RESULTS</div>';
  }
}
async function loadQuestionsFromSupabase(){
  const c=cfg();
  if(!c?.url||!c?.key)throw new Error('Supabase設定がありません。');
  const data=await api(`${c.url}/quiz_questions?select=*&order=id.asc`);
  return (Array.isArray(data)?data:[]).map(normalizeQuestionRow);
}
async function loadFinals(){
  const res=await fetch('final_races.json',{cache:'no-store'});
  if(!res.ok)throw new Error('FINAL DATABASE LOAD ERROR');
  const data=await res.json();
  return (Array.isArray(data)?data:(data.races||data.finalRaces||[]));
}
async function loadAll(){
  finals=await loadFinals();
  questions=await loadQuestionsFromSupabase();
  const years=[...new Set(finals.map(r=>r.year).filter(Boolean))].sort((a,b)=>b-a);
  $('#year-filter').innerHTML='<option value="">全年度</option>'+years.map(y=>`<option value="${esc(y)}">${esc(y)}年</option>`).join('');
  renderSummary(); renderList();
}
async function loadLocalSeedQuestions(){
  const res=await fetch('questions.json',{cache:'no-store'});
  if(!res.ok)throw new Error(`questions.json の読み込みに失敗しました (${res.status})`);
  const data=await res.json();
  const seed=Array.isArray(data)?data:(data.questions||[]);
  if(seed.length!==100)throw new Error(`questions.json が100問ではありません（${seed.length}問）`);
  return seed;
}
function toSupabaseRow(q){
  const choices=q.choices||[];
  if(choices.length!==4)throw new Error(`問題 ${q.id||''} の選択肢が4つではありません`);
  const correct=choices.findIndex(v=>String(v).trim()===String(q.answer).trim())+1;
  if(correct<1)throw new Error(`問題 ${q.id||''} の正解を4択から特定できません`);
  return {
    question:q.question, option1:choices[0], option2:choices[1],
    option3:choices[2], option4:choices[3], correct_option:correct,
    explanation:q.explanation||'', active:true
  };
}
async function seedDefaultQuestions(){
  if(questions.length!==0){
    alert(`Supabaseには現在 ${questions.length} 問あります。\n初期100問の一括登録は、問題が0問のときだけ実行できます。`);
    return;
  }
  if(!confirm('同梱されている初期100問をSupabaseへ登録します。よろしいですか？'))return;
  const button=$('#seed-questions-btn'); button.disabled=true;
  try{
    const seed=await loadLocalSeedQuestions();
    const payload=seed.map(toSupabaseRow);
    for(let i=0;i<payload.length;i+=20){
      await api(`${cfg().url}/quiz_questions`,{
        method:'POST',
        headers:{Prefer:'return=minimal'},
        body:JSON.stringify(payload.slice(i,i+20))
      });
    }
    questions=await loadQuestionsFromSupabase();
    if(questions.length<100)throw new Error(`登録後の確認で ${questions.length} 問しか取得できませんでした。`);
    renderSummary(); renderList();
    alert(`初期100問を登録しました。現在 ${questions.length} 問です。`);
  }catch(e){
    console.error(e);
    alert(`初期100問の登録に失敗しました。\n\n${e.message}`);
  }finally{
    button.disabled=false;
  }
}
function updateSeedButton(){
  const b=$('#seed-questions-btn');
  if(b)b.hidden=questions.length!==0;
}
function openEditor(id){
  editingId=id?String(id):null;
  const q=editingId?questions.find(x=>String(x.id)===editingId):null;
  $('#editor-title').textContent=q?'通常問題を編集':'通常問題を追加';
  $('#question-id').textContent=q?`ID: ${q.id}`:'NEW';
  $('#q-question').value=q?.question||'';
  [1,2,3,4].forEach(i=>$('#q-option'+i).value=q?.option1&&i===1?q.option1:q?.[`option${i}`]??q?.choices?.[i-1]??'');
  const answerIndex=q?Number(q.correct_option||0):1;
  $('#q-correct').value=String(answerIndex>0?answerIndex:1);
  $('#q-explanation').value=q?.explanation||'';
  $('#editor').hidden=false;
  window.scrollTo({top:0,behavior:'smooth'});
}
function closeEditor(){editingId=null;$('#editor').hidden=true}
async function saveQuestion(e){
  e.preventDefault();
  const options=[1,2,3,4].map(i=>$('#q-option'+i).value.trim());
  const payload={
    question:$('#q-question').value.trim(), option1:options[0], option2:options[1],
    option3:options[2], option4:options[3], correct_option:Number($('#q-correct').value),
    explanation:$('#q-explanation').value.trim(), active:true
  };
  if(!payload.question||options.some(v=>!v)||!payload.explanation){
    alert('問題文・4択・解説をすべて入力してください。'); return;
  }
  try{
    const c=cfg();
    const url=editingId?`${c.url}/quiz_questions?id=eq.${encodeURIComponent(editingId)}`:`${c.url}/quiz_questions`;
    await api(url,{method:editingId?'PATCH':'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});
    closeEditor(); questions=await loadQuestionsFromSupabase(); renderSummary(); renderList();
  }catch(e){alert(`保存に失敗しました。\n\n${e.message}`)}
}
async function deleteQuestion(id){
  const q=questions.find(x=>String(x.id)===String(id));
  if(!q||!confirm(`この問題を削除しますか？\n\n${q.question}`))return;
  try{
    await api(`${cfg().url}/quiz_questions?id=eq.${encodeURIComponent(id)}`,{method:'DELETE'});
    questions=await loadQuestionsFromSupabase(); renderSummary(); renderList();
  }catch(e){alert(`削除に失敗しました。\n\n${e.message}`)}
}

$$('.tab').forEach(tab=>tab.addEventListener('click',()=>{activeTab=tab.dataset.tab;$$('.tab').forEach(t=>t.classList.remove('active'));tab.classList.add('active');renderList()}));
$('#search-input').addEventListener('input',renderList);
$('#year-filter').addEventListener('change',renderList);
$('#seed-questions-btn').addEventListener('click',seedDefaultQuestions);
$('#add-question-btn').addEventListener('click',()=>openEditor(null));
$('#cancel-editor-btn').addEventListener('click',closeEditor);
$('#question-form').addEventListener('submit',saveQuestion);

loadAll().catch(e=>{
  console.error(e);
  $('#db-summary').innerHTML=`<div class="empty">読み込みエラー：${esc(e.message)}</div>`;
  $('#normal-list').innerHTML='';
  $('#final-list').innerHTML='';
});
})();