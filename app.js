let questions=[], finals=[], qIndex=0, correctCount=0, selected=false, currentFinal=null;
const $=s=>document.querySelector(s);
function show(id){document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));$("#"+id).classList.add("active")}
async function loadData(){
  const [q,f]=await Promise.all([fetch("questions.json").then(r=>r.json()),fetch("final_races.json").then(r=>r.json())]);
  questions=q; finals=f;
}
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function typeLabel(t){return ({'G2/G3 winner':'GⅡ / GⅢ','bloodline':'BLOODLINE','record':'RECORD','profile':'PROFILE'})[t]||'QUIZ'}
function renderQuestion(){
  selected=false; $("#nextBtn").disabled=true;
  const q=questions[qIndex%questions.length];
  $("#qNo").textContent=String((qIndex%5)+1).padStart(2,"0");
  $("#qType").textContent=typeLabel(q.type);
  $("#qEyebrow").textContent=q.type==='G2/G3 winner'?'WINNER':q.type.toUpperCase();
  $("#questionText").textContent=q.question;
  const choices=shuffle(q.choices);
  $("#choices").innerHTML=choices.map((c,i)=>`<button class="choice" data-answer="${escapeHtml(c)}"><span class="num">${String(i+1).padStart(2,"0")}</span><span class="label">${escapeHtml(c)}</span><span class="mark"></span></button>`).join("");
  document.querySelectorAll(".choice").forEach(btn=>btn.addEventListener("click",()=>choose(btn,q.answer)));
  $("#hintCount").textContent=String(Math.min(5,correctCount+1)).padStart(2,"0")+" / 05";
}
function choose(btn,answer){
  if(selected)return;
  selected=true;
  const isCorrect=btn.dataset.answer===answer;
  if(isCorrect) correctCount++;
  document.querySelectorAll(".choice").forEach(x=>x.classList.add("selected"));
  btn.classList.add(isCorrect?"correct":"wrong");
  btn.querySelector(".mark").textContent=isCorrect?"○":"×";
  if(!isCorrect){
    document.querySelectorAll(".choice").forEach(x=>{if(x.dataset.answer===answer){x.classList.add("correct");x.querySelector(".mark").textContent="○"}});
  }
  $("#nextBtn").disabled=false;
  $("#hintCount").textContent=String(Math.min(5,correctCount+1)).padStart(2,"0")+" / 05";
  toast(isCorrect?"CORRECT":"INCORRECT");
}
function toast(t){const el=$("#toast");el.textContent=t;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),900)}
function renderFinal(){
  currentFinal=finals[Math.floor(Math.random()*finals.length)];
  $("#courseName").textContent=currentFinal.course.toUpperCase();
  $("#firstHorse").textContent="????????";
  $("#secondHorse").textContent=correctCount>=4?currentFinal.second:"— — — —";
  $("#thirdHorse").textContent=correctCount>=3?currentFinal.third:"— — — —";
  $("#fourthHorse").textContent=correctCount>=2?currentFinal.fourth:"— — — —";
  $("#fifthHorse").textContent=correctCount>=2?currentFinal.fifth:"— — — —";
  $("#raceTime").textContent=correctCount>=1?currentFinal.time:"— — —";
  const open=[correctCount>=1,correctCount>=2,correctCount>=3,correctCount>=4,correctCount>=5];
  ["h1","h2","h3","h4","h5"].forEach((id,i)=>$("#"+id).classList.toggle("open",open[i]));
  $("#finalHint").textContent=`HINT ${String(Math.min(5,correctCount)).padStart(2,"0")} / 05`;
  $("#answerInput").value="";
  show("final"); setTimeout(()=>$("#answerInput").focus(),150);
}
function answerFinal(){
  const val=$("#answerInput").value.trim();
  if(!val)return;
  const ok=normalize(val)===normalize(currentFinal.winner);
  $("#resultSymbol").textContent=ok?"○":"×";
  $("#resultTitle").textContent=ok?"的中":"残念";
  $("#resultSub").textContent=ok?"BOARD READ COMPLETE":"BOARD READ FAILED";
  $("#resultHorse").textContent=currentFinal.winner;
  $("#result").dataset.ok=ok?"1":"0";
  show("result");
}
function normalize(s){return s.replace(/\s+/g,"").replace(/[（）()]/g,"").toLowerCase()}
function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
$("#startBtn").addEventListener("click",()=>{qIndex=0;correctCount=0;renderQuestion();show("quiz")});
$("#nextBtn").addEventListener("click",()=>{if(qIndex<4){qIndex++;renderQuestion()}else renderFinal()});
$("#answerBtn").addEventListener("click",answerFinal);
$("#answerInput").addEventListener("keydown",e=>{if(e.key==="Enter")answerFinal()});
$("#restartBtn").addEventListener("click",()=>{qIndex=0;correctCount=0;renderQuestion();show("quiz")});
loadData().catch(()=>{});
