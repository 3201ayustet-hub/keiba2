const state={q:[],r:null,i:0,score:0,nCorrect:0,finalCorrect:false};
const $=id=>document.getElementById(id);
const screens=["start","quiz","final","result"];
const show=s=>screens.forEach(x=>$ (x) && $(""+x).classList.toggle("active",x===s));
const shuffle=a=>[...a].sort(()=>Math.random()-.5);

async function init(){
  const [qr,fr]=await Promise.all([fetch("questions.json"),fetch("final_races.json")]);
  if(!qr.ok||!fr.ok)throw Error("問題データを読み込めません");
  state.allQ=await qr.json();state.allR=await fr.json();
}
function start(){
  if(state.allQ.length<5||!state.allR.length){alert("問題データが不足しています");return}
  state.q=shuffle(state.allQ).slice(0,5);state.r=state.allR[Math.floor(Math.random()*state.allR.length)];
  state.i=0;state.score=0;state.nCorrect=0;state.finalCorrect=false;renderHints(0);show("quiz");renderQ();
}
function renderQ(){
  const q=state.q[state.i];
  $("progress").textContent=`第${state.i+1}問 / 5`;$("score").textContent=state.score;
  $("category").textContent=q.category;$("difficulty").textContent=q.difficulty;$("question").textContent=q.question;
  $("feedback").textContent="";$("choices").innerHTML="";
  shuffle(q.choices).forEach(c=>{const b=document.createElement("button");b.className="choice";b.textContent=c;b.onclick=()=>answer(q,c,b);$("choices").appendChild(b)});
}
function answer(q,c,b){
  const bs=[...document.querySelectorAll(".choice")];bs.forEach(x=>x.disabled=true);
  if(c===q.answer){b.classList.add("correct");state.nCorrect++;state.score+=100;renderHints(state.i+1);$("feedback").textContent="正解！ ヒントが開いた。"}
  else{b.classList.add("wrong");bs.find(x=>x.textContent===q.answer)?.classList.add("correct");$("feedback").textContent=`不正解。正解は「${q.answer}」`}
  setTimeout(()=>{if(state.i<4){state.i++;renderQ()}else{renderFinal();show("final")}},850);
}
function renderHints(n){
  const r=state.r;if(!r)return;
  const h=[["① TIME",r.time],["② 4・5着",`${r.finish4} / ${r.finish5}`],["③ 3着",r.finish3],["④ 2着",r.finish2],["⑤ 競馬場",r.course]];
  $("hints").innerHTML=h.map((x,i)=>`<div class="hint ${i<n?"":"locked"}"><span class="hint-name">${x[0]}</span><strong>${i<n?x[1]:"？？？"}</strong></div>`).join("");
}
function renderFinal(){
  const r=state.r;$("raceName").textContent=r.raceName;
  $("board").innerHTML=`<div class="board-head"><span>${r.year} ${r.raceName}</span><span>${r.course}</span></div>
  <div class="board-row"><span>1着</span><strong>？？？？？？</strong><span>${r.time}</span><span>—</span></div>
  <div class="board-row"><span>2着</span><strong>${r.finish2}</strong><span>—</span><span>${r.margin2}</span></div>
  <div class="board-row"><span>3着</span><strong>${r.finish3}</strong><span>—</span><span>${r.margin3}</span></div>
  <div class="board-row"><span>4着</span><strong>${r.finish4}</strong><span>—</span><span>${r.margin4}</span></div>
  <div class="board-row"><span>5着</span><strong>${r.finish5}</strong><span>—</span><span>${r.margin5}</span></div>`;
  $("answer").value="";$("finalFeedback").textContent="";
}
function finalAnswer(){
  const v=$("answer").value.trim();if(!v)return;
  state.finalCorrect=v===state.r.winner;
  if(state.finalCorrect){state.score+=1000;$("finalFeedback").textContent="正解！ FINAL BONUS +1000"}
  else $("finalFeedback").textContent=`不正解。正解は「${state.r.winner}」`;
  $("answerBtn").disabled=true;$("answer").disabled=true;setTimeout(result,1100);
}
function result(){
  $("resultTitle").textContent=state.finalCorrect?"レースを読み切った！":"惜しい！";
  $("resultScore").textContent=state.score.toLocaleString();
  $("resultStats").innerHTML=`<div>${state.nCorrect}/5<span>通常問題</span></div><div>${state.finalCorrect?"正解":"不正解"}<span>FINAL</span></div>`;
  show("result");
}
$("startBtn").onclick=start;$("againBtn").onclick=start;$("answerBtn").onclick=finalAnswer;
$("answer").onkeydown=e=>{if(e.key==="Enter")finalAnswer()};
init().catch(e=>{console.error(e);$("startBtn").disabled=true;$("startBtn").textContent="データ読み込みエラー"});
