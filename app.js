
const app = document.getElementById('app');
let questions=[], finals=[];
let state={screen:'home', qIndex:0, correct:0, selected:null, currentFinal:null, hintOpen:0};

async function loadData(){
  const [q,f]=await Promise.all([fetch('questions.json').then(r=>r.json()),fetch('final_races.json').then(r=>r.json())]);
  questions=q.questions; finals=f.races;
  render();
}
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function pickQuestions(){return shuffle(questions).slice(0,5).map(q=>({...q, choices:shuffle(q.choices)}))}
function start(){
  state.screen='quiz';state.qIndex=0;state.correct=0;state.selected=null;
  state.sessionQuestions=pickQuestions();state.currentFinal=finals[Math.floor(Math.random()*finals.length)];
  state.hintOpen=0;render();scrollTo(0,0)
}
function render(){
  if(state.screen==='home') return home();
  if(state.screen==='quiz') return quiz();
  if(state.screen==='final') return finalScreen();
  if(state.screen==='result') return resultScreen();
}
function home(){
 app.innerHTML=`<section class="page">
  <div class="eyebrow">THE RACING QUIZ GAME / BOARD EDITION</div>
  <h1 class="title">5問の先に、<br><span class="red">掲示板が待つ。</span></h1>
  <div class="rule"></div>
  <p class="lead">5つの通常問題。正解するたび、最後の着順掲示板に情報が戻ってくる。<br>最後に答えるのは、ただ一頭。<strong>1着馬の名前だけ。</strong></p>
  <div class="hero"><div class="hero-mark">01</div><div class="hero-copy"><small>KEIBA QUIZ / 2026</small><h2>READ<br>THE BOARD.</h2></div></div>
  <div class="meta"><span>通常 05</span><span>FINAL 01</span><span>ANSWER / 馬名のみ</span></div>
  <div class="menu">
    <button onclick="start()">GAME START</button>
    <button onclick="showHow()">HOW TO PLAY</button>
  </div>
  <p id="home-note" class="source">問題DBは questions.json、FINALは final_races.json。GitHub Pages上でそのまま動作します。</p>
 </section>`;
}
function showHow(){
 const n=document.getElementById('home-note');
 n.innerHTML='<strong>遊び方：</strong> 通常5問に挑戦。正解数と同じ枚数だけFINALのヒントが開きます。最後は掲示板の1着馬を入力。通常問題の不正解ではヒントは減りません。';
}
function hintCells(){
 const f=state.currentFinal, n=state.hintOpen;
 const vals=[f.time,`${f.top[3]} / ${f.top[4]}`,f.top[2],f.top[1],f.venue];
 const labels=['01 / TIME','02 / 4・5着','03 / 3着','04 / 2着','05 / 競馬場'];
 return vals.map((v,i)=>`<div class="hint-cell ${i<n?'open':''}"><b>${labels[i]}</b><span>${i<n?v:'LOCKED'}</span></div>`).join('');
}
function quiz(){
 const q=state.sessionQuestions[state.qIndex];
 app.innerHTML=`<section class="page">
  <div class="quiz-top"><div><div class="eyebrow">QUESTION</div><h1 class="title">勝負の5問</h1></div><div class="counter">第<b>${state.qIndex+1}</b>問 / 5</div></div>
  <div class="rule"></div>
  <div class="question-card">
   <div class="tag">${q.type}</div>
   <div class="question">${q.prompt}</div>
   <div class="choices">${q.choices.map((c,i)=>`<button class="choice ${state.selected===c?(c===q.answer?'correct':'wrong'):''} ${state.selected?'disabled':''}" onclick="answer('${esc(c)}')"><span class="letter">${'ABCD'[i]}</span><span>${c}</span></button>`).join('')}</div>
   <div class="feedback">${state.selected ? (state.selected===q.answer?'正解 — FINAL BOARD に1枚戻ります。':'不正解 — FINAL BOARD はそのまま。') : ''}</div>
  </div>
  <div class="hint-strip"><div class="hint-strip-head"><span>FINAL BOARD / HINT</span><span>${state.correct} / 5 OPEN</span></div><div class="hint-cells">${hintCells()}</div></div>
  ${state.selected?`<div style="text-align:right;margin-top:18px"><button class="cta" onclick="nextQuestion()">NEXT</button></div>`:''}
 </section>`;
}
function esc(s){return s.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}
function answer(c){
 if(state.selected)return;
 const q=state.sessionQuestions[state.qIndex];state.selected=c;
 if(c===q.answer) state.correct++;
 state.hintOpen=state.correct;render()
}
function nextQuestion(){
 if(state.qIndex===4){state.screen='final';state.hintOpen=state.correct;render();scrollTo(0,0)}
 else{state.qIndex++;state.selected=null;render();scrollTo(0,0)}
}
function finalScreen(){
 const f=state.currentFinal;
 app.innerHTML=`<section class="page final">
  <div class="quiz-top"><div><div class="eyebrow">FINAL / GⅠ ARCHIVE</div><h1 class="title">着順掲示板</h1></div><div class="counter">HINT <b>${state.hintOpen}</b> / 5</div></div>
  <div class="rule"></div>
  <p class="final-note">この掲示板の<strong>1着馬</strong>を当てる。<br><span style="color:var(--muted)">レース名は表示されません。</span></p>
  <div class="final-stage">
   <div class="board-head"><div class="venue">${state.hintOpen>=5?f.venue:'？？？'}</div><div class="rno">${f.race_no}</div></div>
   ${f.top.map((h,i)=>`<div class="board-row ${i===0?'unknown':''}"><div class="rank">${['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ'][i]}</div><div class="horse">${i===0?'？？？？？？':(state.hintOpen>= (i===1?4:(i===2?3:2)) ? h:'？？？？？？')}</div><div class="time">${i===0&&state.hintOpen>=1?f.time:'—'}</div></div>`).join('')}
   <div class="board-footer"><span>${state.hintOpen>=5?'芝 2,000m':'芝 ？？？？m'}</span><span>TIME ${state.hintOpen>=1?f.time:'--:--.-'}</span></div>
  </div>
  <div class="answer-box"><label for="answer">YOUR FINAL ANSWER / 1着馬名</label><input id="answer" autocomplete="off" placeholder="馬名を入力"></div>
  <div class="answer-actions"><button class="cta" onclick="submitFinal()">ANSWER</button></div>
  <p class="source">※レース名はゲーム画面には表示しません。記録確認用の出典はデータファイルに保持しています。</p>
 </section>`;
}
function submitFinal(){
 const input=document.getElementById('answer');const val=input.value.trim();
 if(!val){input.focus();return}
 state.finalAnswer=val;state.finalCorrect=normalize(val)===normalize(state.currentFinal.top[0]);state.screen='result';render();scrollTo(0,0)
}
function normalize(s){return s.replace(/[　\s・･]/g,'').replace(/[（）()]/g,'')}
function resultScreen(){
 const f=state.currentFinal, ok=state.finalCorrect;
 app.innerHTML=`<section class="page result ${ok?'success':'fail'}">
  <div class="eyebrow">RESULT / FINAL</div>
  <div class="result-title">${ok?'的中':'残念'}</div>
  ${ok?'<div class="stamp">BOARD READ COMPLETE</div>':'<div class="stamp" style="border-color:var(--ink);color:var(--ink)">BOARD READ FAILED</div>'}
  <div class="result-answer"><small>FINAL ANSWER</small><strong>${f.top[0]}</strong></div>
  <p class="lead">${ok?'掲示板を読み切った。見事な正解です。':'最後の一頭を読み違えました。もう一度、挑戦できます。'}</p>
  <div class="meta"><span>${state.correct}/5 通常問題</span><span>${state.hintOpen}/5 HINT OPEN</span><span>${ok?'FINAL 正解':'FINAL 不正解'}</span></div>
  <button class="cta" onclick="start()">PLAY AGAIN</button>
  <p class="source">このゲームは最終問題の正否を勝敗とします。通常問題の正解数は、FINALに開く情報量だけに影響します。</p>
 </section>`;
}
loadData().catch(err=>{app.innerHTML='<section class="page"><h1 class="title">DATA ERROR</h1><p class="lead">問題データを読み込めませんでした。GitHub Pages上で再読み込みしてください。</p></section>';console.error(err)})
