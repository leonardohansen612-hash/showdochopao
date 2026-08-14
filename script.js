
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

async function loadQuestion(level=current+1, pushHistory=true){
  try{
    answers.forEach(a=>{a.disabled=true; a.className='answer';});
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

document.getElementById('correctBtn').onclick=()=>{
  if(!currentQuestion) return;
  answers[currentQuestion.correctIndex].classList.add('correct');
  showOverlay('correct');
};

document.getElementById('wrongBtn').onclick=()=>{
  if(!currentQuestion) return;
  if(selected!==null) answers[selected].classList.add('wrong');
  answers[currentQuestion.correctIndex].classList.add('correct');
  showOverlay('wrong');
};

document.getElementById('stopBtn').onclick=()=>showOverlay('stop');

document.getElementById('continueBtn').onclick=async()=>{
  document.getElementById('overlay').classList.add('hidden');
  if(current<14){
    current++;
    await loadQuestion(current+1);
  }else{
    resetTimer();
  }
};

document.getElementById('nextBtn').onclick=async()=>{
  if(current<14){
    current++;
    await loadQuestion(current+1);
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
  if(!currentQuestion) return;
  const wrong=[0,1,2,3]
    .filter(i=>i!==currentQuestion.correctIndex)
    .sort(()=>Math.random()-.5)
    .slice(0,2);
  wrong.forEach(i=>answers[i].classList.add('disabled'));
};

document.getElementById('swapBtn').onclick=async()=>{
  await loadQuestion(current+1);
};

document.getElementById('pubBtn').onclick=()=>{
  alert('Ajuda do público: podemos implementar a votação real em uma próxima etapa.');
};

document.getElementById('newPlayerBtn').onclick=async()=>{
  document.getElementById('overlay').classList.add('hidden');
  playerNo++;
  localStorage.setItem('chopao_player_no',String(playerNo));
  current=0;
  questionHistory=[];
  await loadQuestion(1);
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
  await loadQuestion(1);
};

(async function init(){
  try{
    if(supabaseClient){
      setStatus('CONECTANDO SUPABASE...');
      await ensureSession();
      setStatus('SUPABASE • SESSÃO ATIVA',true);
    }else{
      await ensureLocalBank();
      await ensureSession();
      setStatus('BANCO LOCAL • 150 PERGUNTAS');
    }
    await loadQuestion(1);
  }catch(err){
    console.error(err);
    setStatus('ERRO NO BANCO');
    alert('Falha ao iniciar o banco de perguntas: '+(err.message||err));
  }
})();
