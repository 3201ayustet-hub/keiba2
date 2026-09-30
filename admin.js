const SUPABASE_URL='https://uczkqklqdbzkxerboatx.supabase.co';
const SUPABASE_KEY='sb_publishable_3GgBI0FRcfcA7YaN0VWu7A_DpU1jI_k';
const API=`${SUPABASE_URL}/rest/v1/quiz_questions`;

const $=s=>document.querySelector(s);
let rows=[];

function headers(extra={}){
  return {
    apikey:SUPABASE_KEY,
    Authorization:`Bearer ${SUPABASE_KEY}`,
    'Content-Type':'application/json',
    ...extra
  };
}

async function api(url, options={}){
  const r=await fetch(url,{...options,headers:headers(options.headers||{})});
  const text=await r.text();
  let body=null;
  try{ body=text?JSON.parse(text):null; }catch{}
  if(!r.ok) throw new Error(`${r.status}: ${body?.message||body?.hint||text||'Supabase error'}`);
  return body;
}

function rowToRecord(q){
  const choices=q.choices||[];
  const answerIndex=choices.indexOf(q.answer);
  if(choices.length!==4 || answerIndex<0) throw new Error(`問題 ${q.id||''} の4択/正解データが不正です`);
  return {
    question:q.question,
    option1:choices[0],
    option2:choices[1],
    option3:choices[2],
    option4:choices[3],
    correct_option:answerIndex+1,
    explanation:q.explanation||'',
    active:true
  };
}

async function load(){
  rows=await api(`${API}?select=*&order=id.asc`);
  render();
  updateSeedButton();
}

function render(){
  const box=$('#question-list');
  if(!box)return;
  box.innerHTML=rows.map(q=>`
    <div class="question-row">
      <div class="question-id">#${q.id}</div>
      <div class="question-text">${esc(q.question)}</div>
      <div class="question-actions">
        <button onclick="editQuestion(${q.id})">編集</button>
        <button onclick="deleteQuestion(${q.id})">削除</button>
      </div>
    </div>
  `).join('') || '<p>通常問題はまだありません。</p>';
}

function esc(s){
  return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function updateSeedButton(){
  const b=$('#seed-button');
  if(!b)return;
  b.style.display=rows.length===0?'':'none';
}

async function seedInitial100(){
  const b=$('#seed-button');
  if(b)b.disabled=true;
  try{
    const response=await fetch('questions.json',{cache:'no-store'});
    if(!response.ok) throw new Error(`questions.json の読み込みに失敗しました (${response.status})`);
    const data=await response.json();

    if(!Array.isArray(data) || data.length!==100){
      throw new Error(`初期問題データが100問ではありません（${Array.isArray(data)?data.length:0}問）`);
    }

    const records=data.map(rowToRecord);

    // Insert in batches to avoid an oversized request.
    const batchSize=20;
    for(let i=0;i<records.length;i+=batchSize){
      const batch=records.slice(i,i+batchSize);
      await api(API,{
        method:'POST',
        headers:{Prefer:'return=minimal'},
        body:JSON.stringify(batch)
      });
    }

    const verify=await api(`${API}?select=id&limit=101`);
    if(!Array.isArray(verify) || verify.length<100){
      throw new Error(`登録後の確認で100問を確認できませんでした（${verify?.length||0}問）`);
    }

    alert('初期100問をSupabaseへ登録しました。');
    await load();
  }catch(e){
    console.error(e);
    alert(`初期100問の登録に失敗しました。\n\n${e.message}`);
  }finally{
    if(b)b.disabled=false;
  }
}

function editQuestion(id){
  const q=rows.find(x=>x.id===id);
  if(!q)return;
  const question=prompt('問題文',q.question);
  if(question===null)return;
  const opts=[1,2,3,4].map(n=>prompt(`選択肢${n}`,q[`option${n}`]));
  if(opts.some(x=>x===null))return;
  const correct=Number(prompt('正解選択肢（1〜4）',q.correct_option));
  if(![1,2,3,4].includes(correct))return alert('正解選択肢は1〜4で指定してください。');
  const explanation=prompt('解説',q.explanation||'');
  if(explanation===null)return;

  api(`${API}?id=eq.${id}`,{
    method:'PATCH',
    headers:{Prefer:'return=minimal'},
    body:JSON.stringify({
      question,option1:opts[0],option2:opts[1],option3:opts[2],option4:opts[3],
      correct_option:correct,explanation
    })
  }).then(load).catch(e=>alert(`更新に失敗しました。\n\n${e.message}`));
}

function deleteQuestion(id){
  if(!confirm(`問題 #${id} を削除しますか？`))return;
  api(`${API}?id=eq.${id}`,{
    method:'DELETE',
    headers:{Prefer:'return=minimal'}
  }).then(load).catch(e=>alert(`削除に失敗しました。\n\n${e.message}`));
}

async function addQuestion(){
  const question=prompt('問題文');
  if(question===null||!question.trim())return;
  const opts=[1,2,3,4].map(n=>prompt(`選択肢${n}`));
  if(opts.some(x=>x===null||!x.trim()))return;
  const correct=Number(prompt('正解選択肢（1〜4）','1'));
  if(![1,2,3,4].includes(correct))return alert('正解選択肢は1〜4で指定してください。');
  const explanation=prompt('解説','');
  if(explanation===null)return;

  try{
    await api(API,{
      method:'POST',
      headers:{Prefer:'return=minimal'},
      body:JSON.stringify({
        question:question.trim(),
        option1:opts[0].trim(),option2:opts[1].trim(),
        option3:opts[2].trim(),option4:opts[3].trim(),
        correct_option:correct,explanation
      })
    });
    await load();
  }catch(e){alert(`追加に失敗しました。\n\n${e.message}`);}
}

window.seedInitial100=seedInitial100;
window.editQuestion=editQuestion;
window.deleteQuestion=deleteQuestion;
window.addQuestion=addQuestion;

document.addEventListener('DOMContentLoaded',()=>{
  $('#seed-button')?.addEventListener('click',seedInitial100);
  $('#add-question')?.addEventListener('click',addQuestion);
  load().catch(e=>{
    console.error(e);
    alert(`通常問題の読み込みに失敗しました。\n\n${e.message}`);
  });
});
