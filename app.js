const state={
  allQ:[], allR:[], q:[], race:null, index:0, score:0, correct:0,
  hintCount:0, finalCorrect:false
};
const $=id=>document.getElementById(id);
const screens=["start","quiz","final","result"];
const show=s=>screens.forEach(x=>$(x).classList.toggle("active",x===s));
const shuffle=a=>[...a].sort(()=>Math.random()-.5);

async function init(){
  const [q,r]=await Promise.all([fetch("questions.json"),fetch("final_races.json")]);
  if(!q.ok||!r.ok) throw new Error("data load error");
  state.allQ=await q.json(); state.allR=await r.json();
}
function start(){
  state.q=shuffle(state.allQ).slice(0,5);
  state.race=state.allR[Math.floor(Math.random()*state.allR.length)];
  state.index=0;state.score=0;state.correct=0;state.hintCount=0;state.finalCorrect=false;
  $("answerBtn").disabled=false;$("answer").disabled=false;
  renderMini();show("quiz");renderQuestion();
}
function renderQuestion(){
  const q=state.q[state.index];
  $("progress").textContent=`第${state.index+1}問 / 5`;
  $("qType").textContent=q.typeLabel;
  $("qDifficulty").textContent="★".repeat(q.difficulty)+"☆".repeat(3-q.difficulty);
  $("question").textContent=q.question;
  $("feedback").textContent="";
  $("score").textContent=state.score;
  $("choices").innerHTML="";
  shuffle(q.choices).forEach(c=>{
    const b=document.createElement("button");
    b.className="choice";b.textContent=c;
    b.onclick=()=>answerQuestion(q,c,b);
    $("choices").appendChild(b);
  });
}
function answerQuestion(q,c,b){
  const buttons=[...document.querySelectorAll(".choice")];
  buttons.forEach(x=>x.disabled=true);
  if(c===q.answer){
    b.classList.add("correct");
    state.correct++;state.hintCount++;
    state.score+=100;
    $("feedback").textContent="正解！ FINALのヒントが1枚開いた。";
  }else{
    b.classList.add("wrong");
    buttons.find(x=>x.textContent===q.answer)?.classList.add("correct");
    $("feedback").textContent=`不正解。正解は「${q.answer}」`;
  }
  renderMini();
  setTimeout(()=>{
    if(state.index<4){state.index++;renderQuestion()}
    else{renderFinal();show("final")}
  },850);
}
function renderMini(){
  const r=state.race;
  const items=[
    ["① TIME",r.time],
    ["② 4・5着",`${r.fourth} / ${r.fifth}`],
    ["③ 3着",r.third],
    ["④ 2着",r.second],
    ["⑤ 競馬場",r.venue]
  ];
  $("hintMini").innerHTML=items.map((x,i)=>
    `<div class="mini ${i<state.hintCount?"":"locked"}"><b>${x[0]}</b><strong>${i<state.hintCount?x[1]:"？？？"}</strong></div>`
  ).join("");
}
function renderFinal(){
  const r=state.race;
  $("finalHintCount").textContent=`HINT ${state.hintCount} / 5`;
  $("boardVenue").textContent=state.hintCount>=5?r.venue:"？？？？";
  $("board1").textContent="？？？？？？";
  $("board2").textContent=state.hintCount>=4?r.second:"？？？？？？";
  $("board3").textContent=state.hintCount>=3?r.third:"？？？？？？";
  $("board4").textContent=state.hintCount>=2?r.fourth:"？？？？？？";
  $("board5").textContent=state.hintCount>=2?r.fifth:"？？？？？？";
  $("board2m").textContent=state.hintCount>=4?r.secondMargin:"—";
  $("board3m").textContent=state.hintCount>=3?r.thirdMargin:"—";
  $("board4m").textContent=state.hintCount>=2?r.fourthMargin:"—";
  $("board5m").textContent=state.hintCount>=2?r.fifthMargin:"—";
  $("boardTime").textContent=state.hintCount>=1?`TIME ${r.time}`:"TIME --:--.-";
  $("raceYear").textContent=r.year;
  $("answer").value="";$("finalFeedback").textContent="";
}
function finalAnswer(){
  const v=$("answer").value.trim();
  if(!v)return;
  state.finalCorrect=(v===state.race.winner);
  $("answerBtn").disabled=true;$("answer").disabled=true;
  if(state.finalCorrect){
    state.score+=1000;
    $("finalFeedback").textContent="正解！ FINAL BONUS +1000";
  }else{
    $("finalFeedback").textContent=`不正解。正解は「${state.race.winner}」`;
  }
  setTimeout(renderResult,1100);
}
function renderResult(){
  $("resultTitle").textContent=state.finalCorrect?"掲示板を読み切った！":"あと一歩！";
  $("resultScore").textContent=state.score.toLocaleString();
  $("resultStats").innerHTML=
    `<div>${state.correct}/5<span>通常問題</span></div>
     <div>${state.hintCount}/5<span>HINT OPEN</span></div>
     <div>${state.finalCorrect?"正解":"不正解"}<span>FINAL</span></div>`;
  $("answerReveal").textContent=state.race.winner;
  show("result");
}
$("startBtn").onclick=start;
$("againBtn").onclick=start;
$("answerBtn").onclick=finalAnswer;
$("answer").onkeydown=e=>{if(e.key==="Enter")finalAnswer()};
init().catch(e=>{
  console.error(e);
  $("startBtn").disabled=true;
  $("startBtn").textContent="データ読み込みエラー";
});
