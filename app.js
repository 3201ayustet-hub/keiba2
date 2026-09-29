let questions=[], finals=[], qIndex=0, correctCount=0, selected=false, currentFinal=null;
const $=s=>document.querySelector(s);
const show=id=>{document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));$('#'+id).classList.add('active');};
async function loadData(){
  const [q,f]=await Promise.all([fetch('questions.json').then(r=>r.json()),fetch('final_races.json').then(r=>r.json())]);
  questions=q; finals=f;
}
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function typeLabel(t){return ({'G2/G3 winner':'GⅡ / GⅢ','bloodline':'BLOODLINE','record':'RECORD','profile':'PROFILE'})[t]||'QUIZ'}
function renderQuestion(){
  selected=false;
  $('#nextBtn').disabled=true;
  const q=questions[qIndex%questions.length];
  $('#qNo').textContent=String((qIndex%5)+1).padStart(2,'0');
  $('#qType').textContent=typeLabel(q.type);
  $('#qEyebrow').textContent=q.type==='G2/G3 winner'?'WINNER':q.type.toUpperCase();
  $('#questionText').textContent=q.question;
  document.querySelectorAll('.progress-dots i').forEach((dot,i)=>dot.classList.toggle('active',i===qIndex));
  const choices=shuffle(q.choices);
  $('#choices').innerHTML=choices.map((c,i)=>`<button class="choice" data-answer="${escapeHtml(c)}"><span class="num">${String(i+1).padStart(2,'0')}</span><span class="label">${escapeHtml(c)}</span><span class="mark" aria-hidden="true"></span></button>`).join('');
  document.querySelectorAll('.choice').forEach(btn=>btn.addEventListener('click',()=>choose(btn,q.answer)));
  updateHintStatus();
}
function choose(btn,answer){
  if(selected)return;
  selected=true;
  const isCorrect=btn.dataset.answer===answer;
  if(isCorrect) correctCount++;
  document.querySelectorAll('.choice').forEach(x=>x.classList.add('locked'));
  btn.classList.add(isCorrect?'correct':'wrong');
  btn.querySelector('.mark').textContent=isCorrect?'○':'×';
  // 不正解時は正解肢を表示しない。選択した肢の判定だけを示す。
  $('#nextBtn').disabled=false;
  updateHintStatus();
  toast(isCorrect?'CORRECT':'INCORRECT',isCorrect);
}
function updateHintStatus(){
  $('#hintCount').textContent=String(correctCount).padStart(2,'0')+' / 05';
}
function toast(t,ok){const el=$('#toast');el.textContent=t;el.className='show '+(ok?'ok':'ng');setTimeout(()=>el.className='',850)}
function renderFinal(){
  currentFinal=finals[Math.floor(Math.random()*finals.length)];
  // ヒント順: 1 TIME / 2 4・5着 / 3 3着 / 4 2着 / 5 競馬場
  const n=correctCount;
  $('#courseName').textContent=n>=5?currentFinal.course:'????';
  $('#firstHorse').textContent='？？？？';
  $('#secondHorse').textContent=n>=4?currentFinal.second:'— — — —';
  $('#thirdHorse').textContent=n>=3?currentFinal.third:'— — — —';
  $('#fourthHorse').textContent=n>=2?currentFinal.fourth:'— — — —';
  $('#fifthHorse').textContent=n>=2?currentFinal.fifth:'— — — —';
  $('#raceTime').textContent=n>=1?currentFinal.time:'—:—.—';
  ['h1','h2','h3','h4','h5'].forEach((id,i)=>$('#'+id).classList.toggle('open',n>=i+1));
  $('#finalHint').textContent=`HINT ${String(n).padStart(2,'0')} / 05`;
  $('#answerInput').value='';
  show('final');
  setTimeout(()=>$('#answerInput').focus(),150);
}
function answerFinal(){
  const val=$('#answerInput').value.trim();
  if(!val)return;
  const ok=normalize(val)===normalize(currentFinal.winner);
  $('#resultSymbol').textContent=ok?'○':'×';
  $('#resultTitle').textContent=ok?'的中':'残念';
  $('#resultSub').textContent=ok?'BOARD READ COMPLETE':'BOARD READ FAILED';
  $('#resultHorse').textContent=currentFinal.winner;
  $('#result').dataset.ok=ok?'1':'0';
  show('result');
}
function normalize(s){return s.replace(/\s+/g,'').replace(/[（）()]/g,'').toLowerCase()}
function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
$('#startBtn').addEventListener('click',()=>{qIndex=0;correctCount=0;renderQuestion();show('quiz')});
$('#nextBtn').addEventListener('click',()=>{if(!selected)return;if(qIndex<4){qIndex++;renderQuestion()}else renderFinal()});
$('#answerBtn').addEventListener('click',answerFinal);
$('#answerInput').addEventListener('keydown',e=>{if(e.key==='Enter')answerFinal()});
$('#restartBtn').addEventListener('click',()=>{qIndex=0;correctCount=0;renderQuestion();show('quiz')});
loadData().catch(()=>{});
