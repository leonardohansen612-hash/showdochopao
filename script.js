
const prizes = [10,20,30,40,50,60,70,80,90,100,150,200,250,300,500];

const questions = [
  {q:'A pequena haste com algodão nas pontas para fins higiênicos chama-se?', a:['Guardanapo','Toalha','Alfinete','Cotonete'], correct:3},
  {q:'Qual destas bebidas é feita tradicionalmente com tequila, limão e licor de laranja?', a:['Margarita','Negroni','Mojito','Cosmopolitan'], correct:0},
  {q:'Qual planeta é conhecido como Planeta Vermelho?', a:['Vênus','Marte','Júpiter','Mercúrio'], correct:1},
  {q:'Qual é a capital da Argentina?', a:['Córdoba','Rosário','Buenos Aires','Mendoza'], correct:2},
  {q:'Quem pintou a Mona Lisa?', a:['Van Gogh','Da Vinci','Picasso','Monet'], correct:1},
  {q:'Quantos lados tem um hexágono?', a:['5','6','7','8'], correct:1},
  {q:'Qual destes países fica na Europa?', a:['Peru','Portugal','México','Japão'], correct:1},
  {q:'Qual banda gravou “Bohemian Rhapsody”?', a:['Queen','Nirvana','U2','Oasis'], correct:0},
  {q:'Qual é o maior oceano da Terra?', a:['Atlântico','Índico','Pacífico','Ártico'], correct:2},
  {q:'Qual elemento químico tem símbolo Fe?', a:['Ferro','Flúor','Fósforo','Frâncio'], correct:0},
  {q:'Quem escreveu Dom Casmurro?', a:['José de Alencar','Machado de Assis','Lima Barreto','Clarice Lispector'], correct:1},
  {q:'Qual país sediou a Copa do Mundo de 2014?', a:['África do Sul','Brasil','Rússia','Alemanha'], correct:1},
  {q:'Qual é a raiz quadrada de 144?', a:['10','11','12','14'], correct:2},
  {q:'Qual destes cientistas formulou as leis do movimento?', a:['Newton','Darwin','Pasteur','Bohr'], correct:0},
  {q:'Valendo o Chopão: qual alternativa foi marcada como correta nesta prévia?', a:['A','B','C','D'], correct:3},
];

let current = 0;
let selected = null;
let remaining = 30;
let timerId = null;

const qNumber = document.getElementById('questionNumber');
const currentPrize = document.getElementById('currentPrize');
const questionText = document.getElementById('questionText');
const answers = [...document.querySelectorAll('.answer')];
const ladder = document.getElementById('ladder');
const timerEl = document.getElementById('timer');

function brl(v){
  return `R$ ${v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
}

function renderLadder(){
  ladder.innerHTML='';
  prizes.forEach((p,i)=>{
    const el=document.createElement('div');
    let cls='ladder-item';
    if([4,9].includes(i)) cls+=' milestone';
    if(i===14) cls+=' jackpot';
    if(i===current) cls+=' current';
    el.className=cls;
    el.innerHTML=`<span>${i+1}</span><span>${brl(p)}</span>`;
    ladder.appendChild(el);
  });
}

function resetTimer(){
  clearInterval(timerId);
  remaining=30;
  timerEl.textContent=remaining;
  timerId=setInterval(()=>{
    remaining--;
    timerEl.textContent=Math.max(remaining,0);
    if(remaining<=0) clearInterval(timerId);
  },1000);
}

function render(){
  selected=null;
  const data=questions[current];
  qNumber.textContent=String(current+1).padStart(2,'0');
  currentPrize.textContent=brl(prizes[current]);
  questionText.textContent=data.q;
  answers.forEach((btn,i)=>{
    btn.className='answer';
    btn.querySelector('.txt').textContent=data.a[i];
  });
  renderLadder();
  resetTimer();
}

answers.forEach((btn,i)=>{
  btn.addEventListener('click',()=>{
    if(btn.classList.contains('disabled')) return;
    answers.forEach(a=>a.classList.remove('selected'));
    btn.classList.add('selected');
    selected=i;
  });
});

function showOverlay(kind){
  clearInterval(timerId);
  const box=document.getElementById('overlay');
  const title=document.getElementById('overlayTitle');
  const sub=document.getElementById('overlaySub');
  const icon=document.getElementById('overlayIcon');

  if(kind==='correct'){
    title.textContent=current===14?'GANHOU O CHOPÃO!':'ACERTOU!';
    sub.textContent=current===14
      ? 'R$ 500,00 conquistados! 🍺🏆'
      : `Você segue no jogo. A próxima vale ${brl(prizes[current+1])}.`;
    icon.textContent=current===14?'🏆🍺':'🍺';
  }else if(kind==='wrong'){
    title.textContent='ERROU!';
    sub.textContent='Fim de jogo nesta rodada.';
    icon.textContent='❌';
  }else{
    title.textContent='PAROU!';
    sub.textContent=`Você encerrou com ${brl(prizes[current])}.`;
    icon.textContent='💰';
  }
  box.classList.remove('hidden');
}

document.getElementById('correctBtn').onclick=()=>{
  const correct=questions[current].correct;
  answers[correct].classList.add('correct');
  showOverlay('correct');
};
document.getElementById('wrongBtn').onclick=()=>{
  if(selected!==null) answers[selected].classList.add('wrong');
  answers[questions[current].correct].classList.add('correct');
  showOverlay('wrong');
};
document.getElementById('stopBtn').onclick=()=>showOverlay('stop');
document.getElementById('continueBtn').onclick=()=>{
  document.getElementById('overlay').classList.add('hidden');
  resetTimer();
};

document.getElementById('nextBtn').onclick=()=>{
  if(current<14){ current++; render(); }
};
document.getElementById('prevBtn').onclick=()=>{
  if(current>0){ current--; render(); }
};

document.getElementById('fiftyBtn').onclick=()=>{
  const correct=questions[current].correct;
  const wrong=[0,1,2,3].filter(i=>i!==correct).sort(()=>Math.random()-.5).slice(0,2);
  wrong.forEach(i=>answers[i].classList.add('disabled'));
};
document.getElementById('pubBtn').onclick=()=>{
  alert('Prévia: na próxima versão podemos abrir uma votação da plateia e mostrar os percentuais na tela.');
};
document.getElementById('swapBtn').onclick=()=>{
  alert('Prévia: na próxima versão este botão trocará por outra pergunta do mesmo nível.');
};

render();
