const app = document.getElementById('app');
let questions = [], finals = [];
const state = {
  screen:'home', qIndex:0, correct:0, selected:null,
  currentFinal:null, hintOpen:0, sessionQuestions:[]
};

async function loadData(){
  const [q,f] = await Promise.all([
    fetch('questions.json').then(r=>r.json()),
    fetch('final_races.json').then(r=>r.json())
  ]);
  questions = q.questions;
  finals = f.races;
  render();
}
function shuffle(a){ return [...a].sort(()=>Math.random()-.5); }
function pickQuestions(){
  return shuffle(questions).slice(0,5).map(q=>({...q, choices:shuffle(q.choices)}));
}
function start(){
  state.screen='quiz';
  state.qIndex=0;
  state.correct=0;
  state.selected=null;
  state.sessionQuestions=pickQuestions();
  state.currentFinal=finals[Math.floor(Math.random()*finals.length)];
  state.hintOpen=0;
  render();
  window.scrollTo(0,0);
}
function render(){
  if(state.screen==='home') return home();
  if(state.screen==='quiz') return quiz();
  if(state.screen==='final') return finalScreen();
  if(state.screen==='result') return resultScreen();
}
function home(){
  app.innerHTML = `
    <section class="screen title-screen">
      <div class="eyebrow">1990s RACING GAME / ORIGINAL EDITION</div>
      <div class="title-lockup">
        <div class="title-kicker">THE RACING QUIZ</div>
        <h1 class="main-logo">競馬<span class="red">クイズ</span></h1>
        <div class="title-mark"></div>
      </div>
      <div class="start-row">
        <div class="start-meta">5 QUESTIONS / FINAL 01<br>ANSWER : HORSE NAME</div>
        <button class="start-button" onclick="start()">START GAME</button>
      </div>
    </section>`;
}
function hintDots(){
  return Array.from({length:5},(_,i)=>`<span class="${i<state.correct?'open':''}"></span>`).join('');
}
function answer(c){
  if(state.selected) return;
  const q = state.sessionQuestions[state.qIndex];
  state.selected = c;
  if(c === q.answer) state.correct++;
  state.hintOpen = state.correct;
  render();
}
function nextQuestion(){
  if(state.qIndex === 4){
    state.screen='final';
    state.hintOpen=state.correct;
  }else{
    state.qIndex++;
    state.selected=null;
  }
  render();
  window.scrollTo(0,0);
}
function quiz(){
  const q = state.sessionQuestions[state.qIndex];
  const feedback = state.selected
    ? (state.selected===q.answer ? 'CORRECT / HINT +1' : 'MISS / HINT UNCHANGED')
    : '';
  app.innerHTML = `
    <section class="screen quiz-screen">
      <div class="quiz-head">
        <div>
          <div class="eyebrow">QUIZ</div>
          <h1 class="quiz-title">QUESTION</h1>
        </div>
        <div class="quiz-count"><b>${String(state.qIndex+1).padStart(2,'0')}</b> / 05</div>
      </div>
      <div class="quiz-rule"></div>
      <div class="question-area">
        <div class="question-meta"><span>${q.type}</span><span>HORSE NAME</span></div>
        <div class="question-prompt">${q.prompt}</div>
        <div class="choices">
          ${q.choices.map((c,i)=>`
            <button class="choice ${state.selected===c?(c===q.answer?'correct':'wrong'):''} ${state.selected?'disabled':''}" onclick="answer('${esc(c)}')">
              <span class="letter">${'ABCD'[i]}</span><span class="choice-text">${c}</span>
            </button>`).join('')}
        </div>
        <div class="feedback">${feedback}</div>
      </div>
      <div class="quiz-footer">
        <div class="hint-progress">
          FINAL BOARD / HINT ${state.correct} / 05
          <div class="hint-dots">${hintDots()}</div>
        </div>
        ${state.selected ? `<button class="next-button" onclick="nextQuestion()">${state.qIndex===4?'FINAL':'NEXT'}</button>` : ''}
      </div>
    </section>`;
}
function finalScreen(){
  const f = state.currentFinal;
  const n = state.hintOpen;
  const horse = (i, need) => n>=need ? f.top[i] : '？？？？？？';
  const venue = n>=5 ? f.venue : '？？？？';
  app.innerHTML = `
    <section class="screen final-screen">
      <div class="final-head">
        <div><div class="eyebrow">FINAL</div><h1 class="final-title">着順掲示板</h1></div>
        <div class="final-hint">HINT <b>${n}</b> / 05</div>
      </div>
      <div class="final-rule"></div>
      <div class="board">
        <div class="board-top"><span class="venue ${n>=5?'':'hidden'}">${venue}</span><span class="race-no">${f.race_no}</span></div>
        ${f.top.map((h,i)=>`<div class="board-row ${i===0?'unknown':''}">
          <span class="rank">${['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ'][i]}</span>
          <span class="horse">${i===0?'？？？？？？':horse(i,i===1?4:(i===2?3:2))}</span>
          <span class="time">${i===0&&n>=1?f.time:'—'}</span>
        </div>`).join('')}
        <div class="board-bottom"><span>TIME</span><span>${n>=1?f.time:'--:--.-'}</span></div>
      </div>
      <div class="final-help">1着馬名を入力してください。レース名は表示されません。</div>
      <div class="answer-line">
        <div><div class="answer-label">YOUR FINAL ANSWER</div><input class="answer-input" id="answer" autocomplete="off" placeholder="馬名"></div>
        <button class="answer-button" onclick="submitFinal()">ANSWER</button>
      </div>
    </section>`;
}
function submitFinal(){
  const input=document.getElementById('answer');
  const val=input.value.trim();
  if(!val){input.focus();return;}
  state.finalAnswer=val;
  state.finalCorrect=normalize(val)===normalize(state.currentFinal.top[0]);
  state.screen='result';
  render();
  window.scrollTo(0,0);
}
function normalize(s){return s.replace(/[　\s・･]/g,'').replace(/[（）()]/g,'');}
function resultScreen(){
  const f=state.currentFinal;
  const ok=state.finalCorrect;
  app.innerHTML = `
    <section class="screen result-screen">
      <div class="eyebrow">RESULT / FINAL</div>
      <div class="result-title">${ok?'的中':'残念'}</div>
      <div class="result-sub">${ok?'BOARD READ COMPLETE':'BOARD READ FAILED'}</div>
      <div class="result-answer"><small>FINAL ANSWER</small><strong>${f.top[0]}</strong></div>
      <div class="result-note">${ok?'掲示板を読み切った。':'最後の一頭を読み違えた。'}</div>
      <button class="again-button" onclick="start()">PLAY AGAIN</button>
    </section>`;
}
function esc(s){return s.replace(/\\/g,'\\\\').replace(/'/g,"\\'");}
loadData().catch(err=>{
  app.innerHTML='<section class="screen center"><div class="eyebrow">DATA ERROR</div><h1 class="quiz-title">DATA ERROR</h1><p>問題データを読み込めませんでした。</p></section>';
  console.error(err);
});
