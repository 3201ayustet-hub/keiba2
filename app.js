(()=>{
const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);
const screens=['title-screen','quiz-screen','final-intro-screen','final-screen','final-result-screen'];
let questions=[], finals=[], quiz=[], qIndex=0, score=0, answered=false, currentFinal=null;

const show=id=>screens.forEach(s=>$('#'+s).classList.toggle('active',s===id));
const shuffle=a=>{
  a=[...a];
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
};
const norm=s=>String(s??'').trim().normalize('NFKC').replace(/[\s　]+/g,'');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function validateQuestion(q){
  return q && typeof q.question==='string' &&
    Array.isArray(q.choices) && q.choices.length>=4 &&
    new Set(q.choices).size===q.choices.length &&
    q.choices.some(v=>norm(v)===norm(q.answer));
}
function validateFinal(r){
  return r && r.playable!==false && r.venue && r.winner &&
    r.second && r.fourth && r.fifth && r.time;
}
function valueText(v){return Array.isArray(v)?v.join(' ／ '):String(v??'—');}

const panelMap=[
  {key:'time',label:'TIME',name:'TIME PANEL'},
  {key:'fourth_fifth',label:'4TH + 5TH',name:'4TH + 5TH PANEL'},
  {key:'third',label:'3RD',name:'3RD PANEL'},
  {key:'second',label:'2ND',name:'2ND PANEL'},
  {key:'venue',label:'VENUE',name:'VENUE PANEL'}
];

function earnedPanels(){
  return panelMap.filter((_,i)=>score>=i+1);
}

function updateStock(){
  $$('.stock-chip').forEach(el=>{
    const key=el.dataset.panel;
    const on=earnedPanels().some(p=>p.key===key);
    el.classList.toggle('earned',on);
  });
  $('#score-label').textContent=`${score} / 5`;
}
function updateEarnedPreview(){
  const items=earnedPanels();
  $('#earned-summary').textContent=`${score} / 5 PANELS EARNED`;
  $('#earned-panel-preview').innerHTML=items.length
    ? items.map(p=>`<span>${esc(p.label)}</span>`).join('')
    : '<span style="opacity:.55">NO PANELS</span>';
}
function prepareQuiz(){
  const pool=questions.filter(validateQuestion);
  quiz=shuffle(pool).slice(0,5).map(q=>({...q,choices:shuffle(q.choices)}));
  qIndex=0;score=0;answered=false;updateStock();renderQuestion();
}
function renderQuestion(){
  const q=quiz[qIndex];
  if(!q){
    console.error('Question index out of range', {qIndex, quizLength:quiz.length});
    alert('通常問題の読み込みに失敗しました。問題DBを確認してください。');
    show('title-screen');
    return;
  }
  answered=false;
  $('#question-count').textContent=`QUESTION ${qIndex+1} / 5`;
  $('#category').textContent=q.category||'RACE QUIZ';
  $('#question-text').textContent=q.question;
  $('#choices').innerHTML='';
  $('#answer-mark').hidden=true;
  $('#panel-get').hidden=true;
  $('#next-btn').hidden=true;
  updateStock();

  q.choices.forEach(choice=>{
    const b=document.createElement('button');
    b.className='choice';
    b.textContent=choice;
    b.addEventListener('click',()=>answerQuestion(choice,b));
    $('#choices').appendChild(b);
  });
}
function answerQuestion(choice,btn){
  if(answered)return;
  answered=true;
  const q=quiz[qIndex];
  const correct=norm(choice)===norm(q.answer);
  if(correct)score++;
  updateStock();

  $$('.choice').forEach(b=>b.classList.add('disabled'));
  btn.classList.add(correct?'correct':'wrong');

  const mark=$('#answer-mark');
  mark.hidden=false;
  mark.textContent=correct?'○':'×';
  mark.className='answer-mark '+(correct?'ok':'ng');

  if(correct){
    const gained=earnedPanels().filter(p=>{
      if(score===1)return p.key==='time';
      if(score===2)return p.key==='fourth_fifth';
      if(score===3)return p.key==='third';
      if(score===4)return p.key==='second';
      if(score===5)return p.key==='venue';
      return false;
    });
    $('#panel-get-name').textContent=gained.map(p=>p.name).join(' + ');
    $('#panel-get').hidden=false;
  }
  $('#next-btn').hidden=false;
}
function nextQuestion(){
  if(!answered)return;
  if(qIndex<4){
    qIndex++;
    renderQuestion();
  }else{
    updateEarnedPreview();
    show('final-intro-screen');
  }
}
function renderFinal(){
  const valid=finals.filter(validateFinal);
  if(!valid.length)throw new Error('FINAL問題DBに有効なレースがありません。');
  currentFinal=valid[Math.floor(Math.random()*valid.length)];
  const openCount=score;

  const winnerInitial=Array.from(String(currentFinal.winner??'').trim())[0]||'—';
  const venueValue=openCount>=5
    ? `<span class="venue-name">${esc(valueText(currentFinal.venue))}</span><span class="winner-initial">1ST INITIAL : ${esc(winnerInitial)}</span>`
    : esc(valueText(currentFinal.venue));
  const rows=[
    ['VENUE',venueValue,5,true],
    ['1ST','',6,false],
    ['2ND',currentFinal.second,4,false],
    ['3RD',currentFinal.third,3,false],
    ['4TH',currentFinal.fourth,2,false],
    ['5TH',currentFinal.fifth,2,false],
    ['TIME',currentFinal.time,1,false]
  ];
  $('#final-board').innerHTML=rows.map(([label,value,need,isVenue])=>
    `<div class="board-row ${openCount>=need?'':'closed'} ${isVenue?'venue-row':''}">
      <div class="board-label">${label}</div>
      <div class="board-value">${value}</div>
    </div>`
  ).join('');

  $('#final-answer').value='';
  $('#final-answer').disabled=false;
  $('#final-submit').disabled=false;
}
function submitFinal(){
  const a=norm($('#final-answer').value);
  if(!a||!currentFinal)return;
  const ok=a===norm(currentFinal.winner);

  // FINAL answer -> dedicated result screen.
  // Do not reveal the correct horse on an incorrect answer.
  $('#final-answer').disabled=true;
  $('#final-submit').disabled=true;

  const mark=$('#final-result-mark');
  const title=$('#final-result-title');
  const copy=$('#final-result-copy');

  mark.textContent=ok?'○':'×';
  mark.className='final-result-mark '+(ok?'ok':'ng');
  title.textContent=ok?'CONGRATULATIONS':'残念！';
  copy.textContent=`${currentFinal.year}年 ${currentFinal.race} — 正解は「${currentFinal.winner}」`;

  // Explicitly leave FINAL before showing the result screen.
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const resultScreen = document.getElementById('final-result-screen');
  if (resultScreen) resultScreen.classList.add('active');
}
async function loadData(){
  const [qr,fr]=await Promise.all([
    fetch('questions.json',{cache:'no-store'}),
    fetch('final_races.json',{cache:'no-store'})
  ]);
  if(!qr.ok||!fr.ok)throw new Error('問題DBを読み込めませんでした。');
  questions=await qr.json();
  finals=await fr.json();
  questions=Array.isArray(questions)?questions:(questions.questions||[]);
  finals=Array.isArray(finals)?finals:(finals.races||finals.finalRaces||[]);
  questions=questions.filter(validateQuestion).map(q=>({...q,category:q.category||'RACE QUIZ'}));
  finals=finals.filter(validateFinal);
  if(questions.length<5)throw new Error('通常問題が5問未満です。');
  if(!finals.length)throw new Error('FINAL問題がありません。');
  console.info(`Loaded ${questions.length} normal questions / ${finals.length} final races`);
}

$('#start-btn').addEventListener('click',()=>{
  try{prepareQuiz();show('quiz-screen')}
  catch(e){alert(e.message)}
});
$('#next-btn').addEventListener('click',nextQuestion);
$('#final-start-btn').addEventListener('click',()=>{
  try{renderFinal();show('final-screen')}
  catch(e){alert(e.message)}
});
$('#final-submit').addEventListener('click',(e)=>{
  e.preventDefault();
  submitFinal();
});
$('#final-answer').addEventListener('keydown',e=>{if(e.key==='Enter')submitFinal()});
$('#restart-btn').addEventListener('click',()=>{
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  $('#title-screen').classList.add('active');
  currentFinal=null;
});

loadData().catch(e=>{
  console.error(e);
  alert('データ読み込みエラー：'+e.message);
});
})();
