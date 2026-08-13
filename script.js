
const prizes = [10,20,30,40,50,60,70,80,90,100,150,200,250,300,500];

const questions = [
  {q:'Qual destas cidades é conhecida como a “Terra da Uva” no estado de São Paulo?', a:['Jundiaí','Santos','Campinas','Sorocaba'], correct:0},
  {q:'Qual ingrediente é indispensável em um Moscow Mule clássico?', a:['Rum','Vodka','Tequila','Gin'], correct:1},
  {q:'Quantos lados tem um dodecágono?', a:['10','11','12','14'], correct:2},
  {q:'Em qual continente fica o deserto do Saara?', a:['Ásia','África','América','Oceania'], correct:1},
  {q:'Qual banda lançou o álbum “The Dark Side of the Moon”?', a:['Queen','Pink Floyd','The Who','U2'], correct:1},
  {q:'Qual é a capital do Canadá?', a:['Toronto','Vancouver','Ottawa','Montreal'], correct:2},
  {q:'Qual elemento químico tem símbolo Fe?', a:['Flúor','Ferro','Fósforo','Frâncio'], correct:1},
  {q:'Quem escreveu “Dom Casmurro”?', a:['José de Alencar','Machado de Assis','Lima Barreto','Graciliano Ramos'], correct:1},
  {q:'Qual destes países NÃO faz fronteira com o Brasil?', a:['Chile','Bolívia','Peru','Colômbia'], correct:0},
  {q:'Em que década o primeiro videogame Atari 2600 foi lançado?', a:['1960','1970','1980','1990'], correct:1},
  {q:'Qual é o maior oceano da Terra?', a:['Atlântico','Índico','Pacífico','Ártico'], correct:2},
  {q:'Qual cientista formulou as leis do movimento e da gravitação?', a:['Darwin','Newton','Einstein','Galileu'], correct:1},
  {q:'Qual obra tem o personagem Jean Valjean?', a:['Os Miseráveis','O Conde de Monte Cristo','Germinal','Madame Bovary'], correct:0},
  {q:'Qual é a menor unidade estrutural e funcional dos seres vivos?', a:['Átomo','Molécula','Célula','Tecido'], correct:2},
  {q:'PERGUNTA DO CHOPÃO: qual é a resposta certa desta prévia?', a:['A','B','C','O apresentador decide 🍺'], correct:3},
];

let current = 0;
let selected = null;
let remaining = 30;
let timerId = null;

const qNum = document.getElementById('questionNumber');
const qBox = document.getElementById('questionBox');
const prizeEl = document.getElementById('currentPrize');
const statusText = document.getElementById('statusText');
const answersEl = document.getElementById('answers');
const ladder = document.getElementById('prizeLadder');
const timerEl = document.getElementById('timer');

function money(v){ return `R$ ${v.toLocaleString('pt-BR')}`; }

function renderLadder(){
  ladder.innerHTML = '';
  prizes.forEach((p,i)=>{
    const div = document.createElement('div');
    div.className = 'ladder-item' + (i===current?' current':'') + ([9,13].includes(i)?' milestone':'') + (i===14?' jackpot':'');
    div.innerHTML = `<span>${i+1}ª</span><span>${money(p)}</span>`;
    ladder.appendChild(div);
  });
}

function renderQuestion(){
  selected = null;
  document.querySelectorAll('.answer').forEach(x=>x.className='answer');
  const data = questions[current];
  qNum.textContent = current+1;
  qBox.textContent = data.q;
  prizeEl.textContent = money(prizes[current]);
  statusText.textContent = `VALENDO ${money(prizes[current])}`;
  [...answersEl.querySelectorAll('.answer')].forEach((btn,i)=>{
    btn.querySelector('b').textContent = data.a[i];
  });
  renderLadder();
  resetTimer();
}

function resetTimer(){
  clearInterval(timerId);
  remaining = 30;
  timerEl.textContent = remaining;
  timerId = setInterval(()=>{
    remaining--;
    timerEl.textContent = remaining;
    if(remaining<=0) clearInterval(timerId);
  },1000);
}

answersEl.addEventListener('click',e=>{
  const btn = e.target.closest('.answer');
  if(!btn || btn.classList.contains('disabled')) return;
  document.querySelectorAll('.answer').forEach(x=>x.classList.remove('selected'));
  btn.classList.add('selected');
  selected = [...answersEl.children].indexOf(btn);
});

function showOverlay(kind){
  clearInterval(timerId);
  const overlay = document.getElementById('overlay');
  const title = document.getElementById('overlayTitle');
  const sub = document.getElementById('overlaySub');
  const emoji = document.getElementById('overlayEmoji');
  if(kind==='correct'){
    title.textContent='ACERTOU!';
    sub.textContent = current === 14 ? 'VOCÊ CONQUISTOU O CHOPÃO! R$ 500!' : `Agora você vai jogar valendo ${money(prizes[Math.min(current+1,14)])}.`;
    emoji.textContent = current===14 ? '🏆🍺' : '🍺🎉';
    confetti();
  }else{
    title.textContent='ERROU!';
    title.style.color='var(--red)';
    sub.textContent='Fim de jogo nesta rodada.';
    emoji.textContent='😵‍💫';
  }
  overlay.classList.remove('hidden');
}
document.getElementById('closeOverlay').onclick=()=>{
  document.getElementById('overlay').classList.add('hidden');
  document.getElementById('overlayTitle').style.color='var(--gold)';
  resetTimer();
};

document.getElementById('correctBtn').onclick=()=>{
  if(selected!==null){
    document.querySelectorAll('.answer')[selected].classList.add('correct');
  }
  showOverlay('correct');
};
document.getElementById('wrongBtn').onclick=()=>{
  if(selected!==null) document.querySelectorAll('.answer')[selected].classList.add('wrong');
  showOverlay('wrong');
};
document.getElementById('nextBtn').onclick=()=>{ if(current<14){current++;renderQuestion()} };
document.getElementById('prevBtn').onclick=()=>{ if(current>0){current--;renderQuestion()} };

document.getElementById('fiftyBtn').onclick=()=>{
  const correct = questions[current].correct;
  const candidates=[0,1,2,3].filter(i=>i!==correct);
  candidates.sort(()=>Math.random()-.5).slice(0,2).forEach(i=>document.querySelectorAll('.answer')[i].classList.add('disabled'));
};
document.getElementById('pubBtn').onclick=()=>alert('Na versão final, esta ajuda pode abrir uma votação da plateia ou mostrar percentuais simulados.');
document.getElementById('swapBtn').onclick=()=>alert('Na versão final, este botão troca a pergunta pela próxima disponível do mesmo nível.');

function confetti(){
  const box=document.getElementById('confetti');
  for(let i=0;i<80;i++){
    const p=document.createElement('i');
    p.style.left=Math.random()*100+'vw';
    p.style.animationDelay=(Math.random()*.4)+'s';
    p.style.background=['#ffc72c','#a14cff','#ffffff','#ff8a00','#32d17c'][Math.floor(Math.random()*5)];
    box.appendChild(p);
    setTimeout(()=>p.remove(),2200);
  }
}
renderQuestion();
