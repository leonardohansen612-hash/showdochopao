
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

const qNumber = document.getElementById('questionNumber');
const currentPrize = document.getElementById('currentPrize');
const questionText = document.getElementById('questionText');
const answers = [...document.querySelectorAll('.answer')];
const ladder = document.getElementById('ladder');

function brl(v){return `R$ ${v.toLocaleString('pt-BR')}`}

function renderLadder(){
  ladder.innerHTML='';
  prizes.forEach((p,i)=>{
    const el=document.createElement('div');
    el.className='ladder-item'+(i===current?' current':'')+([9,13,14].includes(i)?' big':'');
    el.innerHTML=`<span>${String(i+1).padStart(2,'0')}</span><span>${brl(p)}</span>`;
    ladder.appendChild(el);
  });
}

function render(){
  selected=null;
  const data=questions[current];
  qNumber.textContent=current+1;
  currentPrize.textContent=brl(prizes[current]);
  questionText.textContent=data.q;
  answers.forEach((btn,i)=>{
    btn.className='answer';
    btn.querySelector('.txt').textContent=data.a[i];
  });

  const stop = prizes[current];
  const next = current < prizes.length-1 ? prizes[current+1] : prizes[current];
  document.getElementById('stopValue').textContent=brl(stop);
  document.getElementById('nextValue').textContent=brl(next);
  document.getElementById('wrongValue').textContent=current===0?'R$ 0':brl(prizes[Math.max(0,current-1)]);
  renderLadder();
}

answers.forEach((btn,i)=>{
  btn.addEventListener('click',()=>{
    if(btn.classList.contains('disabled'))return;
    answers.forEach(a=>a.classList.remove('selected'));
    btn.classList.add('selected');
    selected=i;
  });
});

function overlay(kind){
  const box=document.getElementById('overlay');
  const title=document.getElementById('overlayTitle');
  const sub=document.getElementById('overlaySub');
  const icon=document.getElementById('overlayIcon');
  if(kind==='correct'){
    title.textContent=current===14?'GANHOU O CHOPÃO!':'ACERTOU!';
    sub.textContent=current===14?'R$ 500 conquistados! 🍺🏆':`Você segue no jogo. Próxima: ${brl(prizes[current+1])}.`;
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
  overlay('correct');
};
document.getElementById('wrongBtn').onclick=()=>{
  if(selected!==null) answers[selected].classList.add('wrong');
  answers[questions[current].correct].classList.add('correct');
  overlay('wrong');
};
document.getElementById('stopBtn').onclick=()=>overlay('stop');

document.getElementById('continueBtn').onclick=()=>document.getElementById('overlay').classList.add('hidden');

document.getElementById('nextBtn').onclick=()=>{if(current<14){current++;render()}};
document.getElementById('prevBtn').onclick=()=>{if(current>0){current--;render()}};

document.getElementById('fiftyBtn').onclick=()=>{
  const correct=questions[current].correct;
  const wrong=[0,1,2,3].filter(i=>i!==correct).sort(()=>Math.random()-.5).slice(0,2);
  wrong.forEach(i=>answers[i].classList.add('disabled'));
};
document.getElementById('pubBtn').onclick=()=>alert('Na próxima versão podemos abrir votação da plateia.');
document.getElementById('swapBtn').onclick=()=>alert('Na próxima versão podemos trocar por outra pergunta do mesmo nível.');

render();
