
const prizes = [10,20,30,40,50,60,70,80,90,100,150,200,250,300,500];

let current = 0;
let selected = null;
let remaining = 30;
let timerId = null;
let currentQuestion = null;
let questionHistory = [];
let playerNo = Number(localStorage.getItem('chopao_player_no') || 1);
let sessionId = localStorage.getItem('chopao_session_id') || null;
let localBank = [];
let localUsed = new Set(JSON.parse(localStorage.getItem('chopao_used_ids') || '[]'));
let appReady = false;
let gameStarted = false;

let lifelines = {
  fiftyUsed: false,
  publicUsed: false,
  swapUsed: 0,
  cardsUsed: false
};

function resetLifelines(){
  lifelines = { fiftyUsed:false, publicUsed:false, swapUsed:0, cardsUsed:false };
  updateLifelineButtons();
}

function updateLifelineButtons(){
  const fiftyBtn = document.getElementById('fiftyBtn');
  const pubBtn = document.getElementById('pubBtn');
  const swapBtn = document.getElementById('swapBtn');
  const cardsBtn = document.getElementById('cardsBtn');
  const swapCount = document.getElementById('swapCount');

  if(fiftyBtn){
    fiftyBtn.disabled = lifelines.fiftyUsed;
    fiftyBtn.classList.toggle('used', lifelines.fiftyUsed);
  }
  if(pubBtn){
    pubBtn.disabled = lifelines.publicUsed;
    pubBtn.classList.toggle('used', lifelines.publicUsed);
  }
  if(cardsBtn){
    cardsBtn.disabled = lifelines.cardsUsed;
    cardsBtn.classList.toggle('used', lifelines.cardsUsed);
  }
  if(swapBtn){
    const left = Math.max(0, 2 - lifelines.swapUsed);
    swapBtn.disabled = left === 0;
    swapBtn.classList.toggle('used', left === 0);
    if(swapCount) swapCount.textContent = `${left} ${left === 1 ? 'USO' : 'USOS'}`;
  }
}


const cfg = window.SHOW_DO_CHOPAO_CONFIG || {};
const hasSupabaseConfig = Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
const supabaseClient = hasSupabaseConfig
  ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
  : null;

const qNumber = document.getElementById('questionNumber');
const currentPrize = document.getElementById('currentPrize');
const questionText = document.getElementById('questionText');
const answers = [...document.querySelectorAll('.answer')];
const ladder = document.getElementById('ladder');
const timerEl = document.getElementById('timer');
const dbStatus = document.getElementById('dbStatus');
const startScreen = document.getElementById('startScreen');
const startGameBtn = document.getElementById('startGameBtn');
const startStatus = document.getElementById('startStatus');
const openingScreen = document.getElementById('openingScreen');
const questionTransition = document.getElementById('questionTransition');
const openingAudio = document.getElementById('openingAudio');
const questionAudio = document.getElementById('questionAudio');

function prepareAudio(audio){
  if(!audio) throw new Error('Elemento de áudio não encontrado.');
  audio.muted = false;
  audio.volume = 1;
  audio.preload = 'auto';
  audio.load();
}

function waitForAudioReady(audio, timeoutMs=8000){
  return new Promise((resolve,reject)=>{
    if(audio.readyState >= 2) return resolve();

    let settled=false;
    const cleanup=()=>{
      clearTimeout(timeout);
      audio.removeEventListener('canplay',onReady);
      audio.removeEventListener('loadeddata',onReady);
      audio.removeEventListener('error',onError);
    };
    const onReady=()=>{
      if(settled) return;
      settled=true;
      cleanup();
      resolve();
    };
    const onError=()=>{
      if(settled) return;
      settled=true;
      cleanup();
      reject(new Error(`Não foi possível carregar ${audio.currentSrc || audio.src}.`));
    };
    const timeout=setTimeout(()=>{
      if(settled) return;
      settled=true;
      cleanup();
      reject(new Error(`O áudio demorou demais para carregar: ${audio.currentSrc || audio.src}.`));
    },timeoutMs);

    audio.addEventListener('canplay',onReady,{once:true});
    audio.addEventListener('loadeddata',onReady,{once:true});
    audio.addEventListener('error',onError,{once:true});
  });
}

async function playAudioToEnd(audio){
  prepareAudio(audio);
  await waitForAudioReady(audio);
  audio.pause();
  audio.currentTime=0;
  audio.muted=false;
  audio.volume=1;

  await audio.play();

  return new Promise((resolve,reject)=>{
    let settled=false;
    const cleanup=()=>{
      clearTimeout(safetyTimeout);
      audio.removeEventListener('ended',onEnded);
      audio.removeEventListener('error',onError);
    };
    const onEnded=()=>{
      if(settled) return;
      settled=true;
      cleanup();
      resolve();
    };
    const onError=()=>{
      if(settled) return;
      settled=true;
      cleanup();
      reject(new Error(`Falha durante a reprodução de ${audio.currentSrc || audio.src}.`));
    };
    const expected = Number.isFinite(audio.duration) ? audio.duration * 1000 : 60000;
    const safetyTimeout=setTimeout(()=>{
      if(settled) return;
      settled=true;
      cleanup();
      reject(new Error('A reprodução do áudio não foi concluída.'));
    },Math.max(expected+5000,10000));

    audio.addEventListener('ended',onEnded,{once:true});
    audio.addEventListener('error',onError,{once:true});
  });
}

async function playQuestionTransition(){
  questionTransition.classList.remove('hidden');
  try{
    await playAudioToEnd(questionAudio);
  }catch(err){
    console.error('Erro na vinheta de pergunta:',err);
    alert('A vinheta não pôde ser reproduzida. Detalhe: '+(err.message||err));
  }
  questionTransition.classList.add('fade-out');
  await new Promise(resolve=>setTimeout(resolve,260));
  questionTransition.classList.add('hidden');
  questionTransition.classList.remove('fade-out');
}

async function startGameForFirstTime(){
  if(!appReady || gameStarted) return;
  gameStarted=true;
  startGameBtn.disabled=true;
  startScreen.classList.add('hidden');
  openingScreen.classList.remove('hidden');

  try{
    await playAudioToEnd(openingAudio);
  }catch(err){
    console.error('Erro no áudio de abertura:',err);
    openingScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    startGameBtn.disabled=false;
    gameStarted=false;
    startStatus.textContent='ERRO AO TOCAR O ÁUDIO';
    alert('O navegador não conseguiu tocar a abertura. Clique novamente em INICIAR O JOGO. Detalhe: '+(err.message||err));
    return;
  }

  openingScreen.classList.add('opening-finish');
  await new Promise(resolve=>setTimeout(resolve,500));
  openingScreen.classList.add('hidden');
  openingScreen.classList.remove('opening-finish');
  await loadQuestion(1,true,false);
}

startGameBtn.addEventListener('click',startGameForFirstTime);

function brl(v){
  return `R$ ${v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
}

function shuffle(arr){
  const copy=[...arr];
  for(let i=copy.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
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

function setStatus(text, ok=false){
  dbStatus.textContent=text;
  dbStatus.style.color = ok ? '#8dffb6' : '#ffe45b';
}

async function ensureLocalBank(){
  if(localBank.length) return;
  const res = await fetch('questions.json');
  localBank = await res.json();
}

async function ensureSession(){
  if(sessionId) return sessionId;

  if(supabaseClient){
    const {data,error} = await supabaseClient
      .from('game_sessions')
      .insert({name:`Show do Chopão - ${new Date().toLocaleString('pt-BR')}`})
      .select('id')
      .single();
    if(error) throw error;
    sessionId=data.id;
    localStorage.setItem('chopao_session_id',sessionId);
    setStatus('SUPABASE • SESSÃO ATIVA',true);
    return sessionId;
  }

  sessionId='local-'+Date.now();
  localStorage.setItem('chopao_session_id',sessionId);
  localUsed = new Set();
  localStorage.setItem('chopao_used_ids','[]');
  setStatus('BANCO LOCAL • SESSÃO ATIVA');
  return sessionId;
}

async function getUnusedQuestion(level){
  await ensureSession();

  if(supabaseClient){
    const {data:questions,error:qErr}=await supabaseClient
      .from('questions')
      .select('id,difficulty,category,prompt,answers,correct_answer')
      .eq('difficulty',level)
      .eq('active',true);
    if(qErr) throw qErr;

    const {data:used,error:uErr}=await supabaseClient
      .from('used_questions')
      .select('question_id')
      .eq('session_id',sessionId);
    if(uErr) throw uErr;

    const usedIds=new Set((used||[]).map(x=>Number(x.question_id)));
    const available=(questions||[]).filter(q=>!usedIds.has(Number(q.id)));
    if(!available.length) throw new Error(`Sem perguntas inéditas disponíveis no nível ${level}. Inicie uma nova sessão ou adicione perguntas.`);
    const picked=available[Math.floor(Math.random()*available.length)];

    const {error:markErr}=await supabaseClient
      .from('used_questions')
      .insert({session_id:sessionId,question_id:picked.id,player_no:playerNo});
    if(markErr) throw markErr;

    return picked;
  }

  await ensureLocalBank();
  const available=localBank.filter(q=>q.difficulty===level && q.active && !localUsed.has(Number(q.id)));
  if(!available.length) throw new Error(`Sem perguntas inéditas disponíveis no nível ${level}. Clique em NOVA SESSÃO.`);
  const picked=available[Math.floor(Math.random()*available.length)];
  localUsed.add(Number(picked.id));
  localStorage.setItem('chopao_used_ids',JSON.stringify([...localUsed]));
  return picked;
}

function normalizeQuestion(q){
  const shuffled=shuffle(q.answers.map(text=>({text,correct:text===q.correct_answer})));
  return {
    id:q.id,
    difficulty:q.difficulty,
    category:q.category,
    prompt:q.prompt,
    answers:shuffled.map(x=>x.text),
    correctIndex:shuffled.findIndex(x=>x.correct)
  };
}

async function loadQuestion(level=current+1, pushHistory=true, withTransition=false){
  try{
    clearInterval(timerId);
    answers.forEach(a=>{a.disabled=true; a.className='answer';});
    if(withTransition) await playQuestionTransition();
    questionText.textContent='SORTEANDO PERGUNTA...';
    const q=normalizeQuestion(await getUnusedQuestion(level));
    currentQuestion=q;
    if(pushHistory) questionHistory.push({level:current,question:q});
    selected=null;

    qNumber.textContent=String(current+1).padStart(2,'0');
    currentPrize.textContent=brl(prizes[current]);
    questionText.textContent=q.prompt;
    answers.forEach((btn,i)=>{
      btn.disabled=false;
      btn.className='answer';
      btn.querySelector('.txt').textContent=q.answers[i];
    });
    renderLadder();
    resetTimer();
  }catch(err){
    console.error(err);
    questionText.textContent='ERRO AO CARREGAR PERGUNTA';
    alert(err.message || 'Não foi possível carregar a pergunta.');
  }
}

answers.forEach((btn,i)=>{
  btn.addEventListener('click',()=>{
    if(btn.disabled || btn.classList.contains('disabled')) return;
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
    sub.textContent='Fim de jogo. Clique em NOVO PARTICIPANTE para começar outra rodada.';
    icon.textContent='❌';
  }else{
    title.textContent='PAROU!';
    sub.textContent=`Você encerrou com ${brl(prizes[current])}.`;
    icon.textContent='💰';
  }
  box.classList.remove('hidden');
}

document.getElementById('respondBtn').onclick=()=>{
  if(!currentQuestion) return;

  if(selected === null){
    alert('Selecione uma alternativa antes de responder.');
    return;
  }

  clearInterval(timerId);

  // Lock all alternatives after the answer is confirmed.
  answers.forEach(a => a.disabled = true);

  if(selected === currentQuestion.correctIndex){
    answers[selected].classList.remove('selected');
    answers[selected].classList.add('correct');
    setTimeout(()=>showOverlay('correct'), 450);
  }else{
    answers[selected].classList.remove('selected');
    answers[selected].classList.add('wrong');
    answers[currentQuestion.correctIndex].classList.add('correct');
    setTimeout(()=>showOverlay('wrong'), 650);
  }
};

document.getElementById('stopBtn').onclick=()=>showOverlay('stop');

document.getElementById('restartBtn').onclick=async()=>{
  const ok = confirm('Recomeçar o jogo com um novo participante? As perguntas já usadas nesta sessão continuarão bloqueadas.');
  if(!ok) return;

  clearInterval(timerId);
  document.getElementById('overlay').classList.add('hidden');

  playerNo++;
  localStorage.setItem('chopao_player_no', String(playerNo));

  current = 0;
  selected = null;
  currentQuestion = null;
  questionHistory = [];
  resetLifelines();

  answers.forEach(a=>{
    a.disabled = false;
    a.className = 'answer';
  });

  await loadQuestion(1,true,true);
};

document.getElementById('continueBtn').onclick=async()=>{
  document.getElementById('overlay').classList.add('hidden');
  if(current<14){
    current++;
    await loadQuestion(current+1,true,true);
  }else{
    resetTimer();
  }
};

document.getElementById('nextBtn').onclick=async()=>{
  if(current<14){
    current++;
    await loadQuestion(current+1,true,true);
  }
};

document.getElementById('prevBtn').onclick=()=>{
  if(questionHistory.length<2) return;
  questionHistory.pop();
  const prev=questionHistory[questionHistory.length-1];
  current=prev.level;
  currentQuestion=prev.question;
  selected=null;
  qNumber.textContent=String(current+1).padStart(2,'0');
  currentPrize.textContent=brl(prizes[current]);
  questionText.textContent=currentQuestion.prompt;
  answers.forEach((btn,i)=>{
    btn.disabled=false;
    btn.className='answer';
    btn.querySelector('.txt').textContent=currentQuestion.answers[i];
  });
  renderLadder();
  resetTimer();
};


document.getElementById('fiftyBtn').onclick=()=>{
  if(!currentQuestion || lifelines.fiftyUsed) return;

  lifelines.fiftyUsed = true;
  updateLifelineButtons();

  const wrong=[0,1,2,3]
    .filter(i=>i!==currentQuestion.correctIndex)
    .sort(()=>Math.random()-.5)
    .slice(0,2);

  wrong.forEach(i=>answers[i].classList.add('disabled'));
};

document.getElementById('swapBtn').onclick=async()=>{
  if(lifelines.swapUsed >= 2) return;

  lifelines.swapUsed++;
  updateLifelineButtons();
  await loadQuestion(current+1,true,true);
};

document.getElementById('pubBtn').onclick=()=>{
  if(lifelines.publicUsed) return;

  lifelines.publicUsed = true;
  updateLifelineButtons();

  alert('AJUDA DO PÚBLICO! A plateia pode levantar as plaquinhas com as alternativas.');
};

function eliminateWrongAnswers(count){
  if(!currentQuestion || count <= 0) return;

  const candidates = [0,1,2,3]
    .filter(i => i !== currentQuestion.correctIndex)
    .filter(i => !answers[i].classList.contains('disabled'));

  candidates
    .sort(()=>Math.random()-.5)
    .slice(0, Math.min(count, candidates.length))
    .forEach(i => answers[i].classList.add('disabled'));
}

function openCards(){
  if(lifelines.cardsUsed || !currentQuestion) return;

  lifelines.cardsUsed = true;
  updateLifelineButtons();

  const values = [0,1,2,3];

// Fisher-Yates: garante que as quatro cartas 0, 1, 2 e 3
// estejam presentes exatamente uma vez, mudando apenas a posição.
for(let i = values.length - 1; i > 0; i--){
  const randomBuffer = new Uint32Array(1);
  crypto.getRandomValues(randomBuffer);
  const j = randomBuffer[0] % (i + 1);
  [values[i], values[j]] = [values[j], values[i]];
}
  const grid = document.getElementById('cardsGrid');
  const overlay = document.getElementById('cardsOverlay');
  const closeBtn = document.getElementById('cardsCloseBtn');

  grid.innerHTML = '';
  grid.classList.remove('picked');
  closeBtn.classList.add('hidden');

  values.forEach(value=>{
    const card = document.createElement('button');
    card.className = 'chopao-card';
    card.dataset.cardValue = String(value);
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-face card-back">
          <img src="assets/show-do-chopao-logo.png?v=6" alt="Show do Chopão">
        </div>
        <div class="card-face card-front">
          <strong>${value}</strong>
          <span>${value === 1 ? 'RESPOSTA ERRADA ELIMINADA' : 'RESPOSTAS ERRADAS ELIMINADAS'}</span>
        </div>
      </div>
    `;

    card.onclick = ()=>{
      if(grid.classList.contains('picked')) return;

      const pickedValue = Number(card.dataset.cardValue);

      grid.classList.add('picked');
      card.classList.add('flipped','selected-card');

      [...grid.querySelectorAll('.chopao-card')].forEach(other=>{
        other.disabled = true;
        if(other !== card) other.classList.add('not-selected');
      });

      setTimeout(()=>{
        eliminateWrongAnswers(pickedValue);
        closeBtn.classList.remove('hidden');
      },650);
    };

    grid.appendChild(card);
  });

  overlay.classList.remove('hidden');
}

document.getElementById('cardsBtn').onclick = openCards;

document.getElementById('cardsCloseBtn').onclick = ()=>{
  document.getElementById('cardsOverlay').classList.add('hidden');
};

document.getElementById('newPlayerBtn').onclick=async()=>{
  document.getElementById('overlay').classList.add('hidden');
  playerNo++;
  localStorage.setItem('chopao_player_no',String(playerNo));
  current=0;
  questionHistory=[];
  resetLifelines();
  await loadQuestion(1,true,true);
};

document.getElementById('newSessionBtn').onclick=async()=>{
  const ok=confirm('Iniciar uma NOVA SESSÃO? Isso libera novamente todas as perguntas para esta nova noite/evento.');
  if(!ok) return;

  sessionId=null;
  localStorage.removeItem('chopao_session_id');
  localUsed=new Set();
  localStorage.setItem('chopao_used_ids','[]');
  playerNo=1;
  localStorage.setItem('chopao_player_no','1');

  await ensureSession();
  current=0;
  questionHistory=[];
  resetLifelines();
  await loadQuestion(1,true,true);
};

(async function init(){
  try{
    resetLifelines();
    if(supabaseClient){
      setStatus('CONECTANDO SUPABASE...');
      await ensureSession();
      setStatus('SUPABASE • SESSÃO ATIVA',true);
    }else{
      await ensureLocalBank();
      await ensureSession();
      setStatus('BANCO LOCAL • 150 PERGUNTAS');
    }
    appReady = true;
    startGameBtn.disabled = false;
    startGameBtn.textContent = 'INICIAR O JOGO';
    startStatus.textContent = 'ABERTURA PRONTA';
  }catch(err){
    console.error(err);
    setStatus('ERRO NO BANCO');
    alert('Falha ao iniciar o banco de perguntas: '+(err.message||err));
  }
})();
