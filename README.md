# Show do Chopão — V12 • Auxílios por jogador

- 50/50: 1 uso por jogador.
- Público: 1 uso por jogador; apenas sinaliza para a plateia levantar as plaquinhas.
- Trocar pergunta: 2 usos por jogador.
- Cartas: 1 uso por jogador.
  - As 4 cartas têm a logo do Show do Chopão no verso.
  - Os valores 0, 1, 2 e 3 são embaralhados aleatoriamente.
  - A carta escolhida vira e elimina automaticamente a quantidade correspondente de respostas erradas.

Ao RECOMEÇAR ou iniciar NOVO PARTICIPANTE, todos os auxílios são restaurados.
As perguntas já usadas na sessão continuam bloqueadas.


## V12.1 — correção das cartas
O embaralhamento foi refeito com Fisher-Yates e `crypto.getRandomValues`.
Em cada abertura existem obrigatoriamente quatro valores, exatamente uma vez cada:
0, 1, 2 e 3.
Apenas a posição das cartas muda aleatoriamente.
O valor revelado é lido diretamente da carta clicada.

## V12.2 — Abertura e vinhetas de perguntas
- Nova tela inicial com botão **INICIAR O JOGO**.
- Na primeira inicialização do jogo, exibe o Texuguinho apresentador com luzes animadas e toca a abertura completa.
- A primeira pergunta só aparece quando o áudio de abertura termina.
- Todas as trocas de pergunta posteriores tocam a vinheta curta, incluindo avanço normal, Trocar Pergunta, Novo Participante, Recomeçar e Nova Sessão.
- A abertura completa não se repete durante a mesma execução da página.


## V12.3 — correção de áudio
- Carregamento explícito dos MP3 antes da reprodução.
- Reprodução vinculada ao clique em INICIAR O JOGO.
- Volume e mute normalizados.
- Mensagem de diagnóstico quando o navegador bloquear ou não carregar o áudio.
- Cache-busting nos arquivos de áudio.


## V12.4 - audio embutido
Os dois audios MP3 foram incorporados diretamente no index.html como data URLs, eliminando dependencia de servir arquivos .mp3 pelo /assets na Vercel.


V12.16: frames embutidos divididos em múltiplos JS com ~8 MB cada para upload pelo GitHub web sem exceder 25 MB por arquivo.


V12.17: frames embutidos divididos em arquivos JS de aproximadamente 1,5 MB cada para máxima compatibilidade com upload web do GitHub.


V12.18: corrigido index.html para carregar os 32 arquivos de frames em ordem antes do script.js.
