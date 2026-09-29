const $=s=>document.querySelector(s);
const app=$("#app");
let allQuestions=[], finalRaces=[], currentQuestions=[], qIndex=0, score=0, answered=false;
let finalRace=null, hintStep=0;

async function load(){
  [allQuestions, finalRaces] = await Promise.all([
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
function start(){
  currentQuestions=shuffle(allQuestions).slice(0,5);
  qIndex=0; score=0; renderQuestion();
}
function renderTitle(){
  app.innerHTML=`<main class="screen title">
    <div class="mini">SINCE 2018 · RACING QUIZ</div>
    <h1>KEIBA<span>QUIZ</span></h1>
    <button class="start" onclick="start()">START</button>
  </main>`;
}
function renderQuestion(){
  answered=false;
  const q=currentQuestions[qIndex];
  const choices=shuffle(q.choices);
  app.innerHTML=`<main class="screen">
    <header class="header">
      <div class="eyebrow">QUESTION ${String(qIndex+1).padStart(2,"0")}</div>
      <div class="count">${qIndex+1} / 05</div>
    </header>
    <div class="progress">
      ${[0,1,2,3,4].map(i=>`<i class="dot ${i<qIndex?"on":""}"></i>`).join("")}
    </div>
    <section class="question">
      <h1>${q.question}</h1>
      <div class="choices">
        ${choices.map((c,i)=>`
          <button class="choice" data-answer="${escapeHtml(c)}" onclick="answer(this)">
            <span class="num">${String(i+1).padStart(2,"0")}</span>
            <span class="label">${escapeHtml(c)}</span>
            <span class="mark"></span>
          </button>`).join("")}
      </div>
    </section>
    <footer class="footer">
      <button id="next" class="next hidden" onclick="nextQ()">NEXT →</button>
    </footer>
  </main>`;
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}
function answer(button){
  if(answered)return;
  answered=true;
  const q=currentQuestions[qIndex];
  const selected=button.dataset.answer;
  const ok=selected===q.answer;
  if(ok)score++;
  button.classList.add(ok?"correct":"wrong");
  button.querySelector(".mark").textContent=ok?"○":"×";

  const flash=document.createElement("div");
  flash.className="resultflash "+(ok?"ok":"ng");
  flash.textContent=ok?"○":"×";
  document.body.appendChild(flash);
  setTimeout(()=>flash.remove(),650);

  // Do not reveal the correct choice after a wrong answer.
  $("#next").classList.remove("hidden");
}
function nextQ(){
  if(qIndex<4){
    qIndex++;
    renderQuestion();
  }else{
    renderFinal();
  }
}
function renderFinal(){
  finalRace=finalRaces[Math.floor(Math.random()*finalRaces.length)];
  hintStep=0;

  app.innerHTML=`<main class="screen">
    <header class="header">
      <div class="eyebrow">FINAL</div>
      <div class="count">5 HINTS</div>
    </header>

    <section class="board">
      <div class="boardtop">
        <div class="venue" id="venue">？？？</div>
        <div class="time">${escapeHtml(finalRace.time)}</div>
      </div>

      <div class="rows">
        ${finalRace.finish.map((h,i)=>`
          <div class="row">
            <span class="place">${i+1}着</span>
            <span class="horse ${i===0?"hiddenhorse":""}" id="horse${i}">
              ${i===0?"？？？？？？":escapeHtml(h)}
            </span>
          </div>`).join("")}
      </div>

      <div class="reveal" id="hintArea">
        <span id="hintLabel">HINT 01 · TIME</span>
        <button onclick="revealHint()">OPEN →</button>
      </div>

      <div class="finalanswer">
        <input id="answerInput" placeholder="1着馬名" autocomplete="off">
        <button onclick="submitFinal()">ANSWER</button>
      </div>
    </section>
  </main>`;
}
function revealHint(){
  // Exactly the fixed five hints; no additional hint system.
  if(hintStep>=5)return;
  hintStep++;

  if(hintStep===1){
    $("#hintLabel").textContent="HINT 01 · TIME";
  }else if(hintStep===2){
    $("#hintLabel").textContent="HINT 02 · 4TH / 5TH";
  }else if(hintStep===3){
    $("#hintLabel").textContent="HINT 03 · 3RD";
  }else if(hintStep===4){
    $("#hintLabel").textContent="HINT 04 · 2ND";
  }else if(hintStep===5){
    $("#hintLabel").textContent="HINT 05 · VENUE";
    $("#venue").textContent=escapeHtml(finalRace.venue);
  }

  // Keep the interface simple: each click advances the already-defined hint stage.
  if(hintStep===5){
    const btn=$("#hintArea button");
    btn.textContent="ALL OPEN";
    btn.disabled=true;
    btn.style.opacity=".35";
  }
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
