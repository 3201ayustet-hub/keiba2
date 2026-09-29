
const $=s=>document.querySelector(s);
const app=$("#app");
let qs=[], finals=[], idx=0, score=0, answered=false, revealed=0, finalIndex=0;

async function load(){
  const [q,f]=await Promise.all([fetch("questions.json").then(r=>r.json()),fetch("final_races.json").then(r=>r.json())]);
  qs=shuffle(q).slice(0,5); finals=f; renderTitle();
}
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function renderTitle(){app.innerHTML=`<main class="screen title"><div class="mini">SINCE 2018 · RACING QUIZ</div><h1>KEIBA<span>QUIZ</span></h1><button class="start" onclick="start()">START</button></main>`}
function start(){idx=0;score=0;renderQuestion()}
function renderQuestion(){
 answered=false;
 const q=qs[idx];
 app.innerHTML=`<main class="screen">
 <header class="header"><div class="eyebrow">QUESTION ${String(idx+1).padStart(2,"0")}</div><div class="count">${idx+1} / 05</div></header>
 <div class="progress">${[0,1,2,3,4].map(i=>`<i class="dot ${i<idx?"on":""}"></i>`).join("")}</div>
 <section class="question"><h1>${q.question}</h1><div class="choices">${q.choices.map((c,i)=>`<button class="choice" data-i="${i}" onclick="answer(${i})"><span class="num">${String(i+1).padStart(2,"0")}</span><span class="label">${c}</span><span class="mark"></span></button>`).join("")}</div></section>
 <footer class="footer"><button id="next" class="next hidden" onclick="nextQ()">NEXT →</button></footer></main>`;
}
function answer(i){
 if(answered)return; answered=true;
 const q=qs[idx], buttons=[...document.querySelectorAll(".choice")], ok=q.choices[i]===q.answer;
 buttons[i].classList.add(ok?"correct":"wrong"); buttons[i].querySelector(".mark").textContent=ok?"○":"×";
 if(ok)score++;
 const flash=document.createElement("div");flash.className="resultflash "+(ok?"ok":"ng");flash.textContent=ok?"○":"×";document.body.appendChild(flash);setTimeout(()=>flash.remove(),650);
 $("#next").classList.remove("hidden");
}
function nextQ(){if(idx<4){idx++;renderQuestion()}else renderFinal()}
function renderFinal(){
 const f=finals[Math.floor(Math.random()*finals.length)]; finalIndex=f; revealed=0;
 app.innerHTML=`<main class="screen"><header class="header"><div class="eyebrow">FINAL BOARD</div><div class="count">5 HINTS</div></header>
 <section class="board"><div class="boardtop"><div class="venue" id="venue">？？？</div><div class="time">${f.time}</div></div>
 <div class="rows">${f.finish.map((h,i)=>`<div class="row"><span class="place">${i+1}着</span><span class="horse ${i===0?"hiddenhorse":""}" id="horse${i}">${i===0?"？？？？？？":h}</span></div>`).join("")}</div>
 <div class="reveal"><span id="hintLabel">HINT 01</span><button onclick="revealHint()">OPEN →</button></div>
 <div class="finalanswer"><input id="answerInput" placeholder="1着馬名"><button onclick="submitFinal()">ANSWER</button></div>
 </section></main>`;
}
function revealHint(){
 if(revealed>=5)return;
 revealed++;
 if(revealed===1)$("#hintLabel").textContent="HINT 01 · TIME";
 else if(revealed===2)$("#hintLabel").textContent="HINT 02 · 4TH / 5TH";
 else if(revealed===3)$("#hintLabel").textContent="HINT 03 · 3RD";
 else if(revealed===4)$("#hintLabel").textContent="HINT 04 · 2ND";
 else {$("#hintLabel").textContent="HINT 05 · VENUE";$("#venue").textContent=finalIndex.venue}
}
function submitFinal(){
 const val=$("#answerInput").value.trim();
 const ok=val===finalIndex.finish[0];
 app.innerHTML=`<main class="screen end"><div class="big">${ok?"○":"×"}</div><h2>${ok?"CONGRATULATIONS":"残念"}</h2><p>${ok?"BOARD READ COMPLETE":"THE ANSWER WAS "+finalIndex.finish[0]}</p><button class="start" onclick="start()">PLAY AGAIN</button></main>`;
}
load();
