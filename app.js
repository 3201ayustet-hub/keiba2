const $=s=>document.querySelector(s);
const app=$("#app");
let allQuestions=[], finalRaces=[], currentQuestions=[], qIndex=0, score=0, answered=false, finalRace=null;

async function load(){
  [allQuestions,finalRaces]=await Promise.all([
    fetch("questions.json").then(r=>r.json()),
    fetch("final_races.json").then(r=>r.json())
  ]);
  renderTitle();
}
function shuffle(a){
  const x=[...a];
  for(let i=x.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [x[i],x[j]]=[x[j],x[i]];
  }
  return x;
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}
function start(){
  currentQuestions=shuffle(allQuestions).slice(0,5);
  qIndex=0; score=0; renderQuestion();
}
function renderTitle(){
  app.innerHTML=`<main class="screen title"><div class="mini">SINCE 2018 · RACING QUIZ</div><h1>KEIBA<span>QUIZ</span></h1><button class="start" onclick="start()">START</button></main>`;
}
function renderQuestion(){
  answered=false;
  const q=currentQuestions[qIndex];
  const choices=shuffle(q.choices);
  app.innerHTML=`<main class="screen">
    <header class="header"><div class="eyebrow">QUESTION ${String(qIndex+1).padStart(2,"0")}</div><div class="count">${qIndex+1} / 05</div></header>
    <div class="progress">${[0,1,2,3,4].map(i=>`<i class="dot ${i<qIndex?"on":""}"></i>`).join("")}</div>
    <section class="question"><h1>${escapeHtml(q.question)}</h1>
      <div class="choices">${choices.map((c,i)=>`<button class="choice" data-answer="${escapeHtml(c)}" onclick="answer(this)">
        <span class="num">${String(i+1).padStart(2,"0")}</span><span class="label">${escapeHtml(c)}</span><span class="mark"></span>
      </button>`).join("")}</div>
    </section>
    <footer class="footer"><button id="next" class="next hidden" onclick="nextQ()">NEXT →</button></footer>
  </main>`;
}
function answer(button){
  if(answered)return;
  answered=true;
  const q=currentQuestions[qIndex];
  const ok=button.dataset.answer===q.answer;
  if(ok)score++;
  button.classList.add(ok?"correct":"wrong");
  button.querySelector(".mark").textContent=ok?"○":"×";
  const flash=document.createElement("div");
  flash.className="resultflash "+(ok?"ok":"ng");
  flash.textContent=ok?"○":"×";
  document.body.appendChild(flash);
  setTimeout(()=>flash.remove(),650);
  $("#next").classList.remove("hidden");
}
function nextQ(){
  if(qIndex<4){qIndex++;renderQuestion();}
  else renderFinal();
}
function renderFinal(){
  finalRace=finalRaces[Math.floor(Math.random()*finalRaces.length)];
  // score = number of panels already open. No manual hint action exists.
  const open=score;
  app.innerHTML=`<main class="screen">
    <header class="header"><div class="eyebrow">FINAL</div><div class="count">${open} / 05 OPEN</div></header>
    <section class="board">
      <div class="boardtop">
        <div class="venue">${open>=5?escapeHtml(finalRace.venue):"？？？"}</div>
        <div class="time">${open>=1?escapeHtml(finalRace.time):"？？？"}</div>
      </div>
      <div class="rows">
        ${finalRace.finish.map((h,i)=>{
          const visible=(i===0)?false:
            (i===1?open>=4:
             (i===2?open>=3:
              (i===3?open>=2:
               open>=2)));
          // 4着/5着 open together at panel 2; 3着 panel 3; 2着 panel 4; venue panel 5.
          return `<div class="row">
            <span class="place">${i+1}着</span>
            <span class="horse ${visible?"":"hiddenhorse"}">${visible?escapeHtml(h):"？？？？？？"}</span>
          </div>`;
        }).join("")}
      </div>
      <div class="finalanswer"><input id="answerInput" placeholder="1着馬名" autocomplete="off"><button onclick="submitFinal()">ANSWER</button></div>
    </section>
  </main>`;
}
function submitFinal(){
  const val=$("#answerInput").value.trim();
  const ok=val===finalRace.finish[0];
  app.innerHTML=`<main class="screen end">
    <div class="big">${ok?"○":"×"}</div>
    <h2>${ok?"CONGRATULATIONS":"残念"}</h2>
    <p>${ok?"BOARD READ COMPLETE":"THE ANSWER WAS "+escapeHtml(finalRace.finish[0])}</p>
    <button class="start" onclick="start()">PLAY AGAIN</button>
  </main>`;
}
load();
