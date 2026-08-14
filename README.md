# Show do Chopão — V10 • Banco de 150 perguntas

## O que esta versão faz
- 150 perguntas cadastradas.
- 15 níveis de dificuldade.
- Pergunta 1 sempre usa nível 1; pergunta 15 sempre usa nível 15.
- Sorteio aleatório dentro de cada nível.
- Nenhuma pergunta se repete dentro da mesma sessão/noite.
- As quatro alternativas são embaralhadas a cada exibição.
- Botão TROCA PERGUNTA busca outra questão inédita do mesmo nível.
- Botão NOVO PARTICIPANTE volta à pergunta 1 sem liberar perguntas já usadas.
- Botão NOVA SESSÃO libera o banco inteiro para um novo evento.
- Funciona sem Supabase usando o banco local `questions.json`.
- Quando configurado, usa Supabase para manter o histórico da sessão no banco.

## Distribuição
Nível 1: 20
Nível 2: 18
Nível 3: 16
Nível 4: 14
Nível 5: 12
Níveis 6 e 7: 10 cada
Níveis 8, 9 e 10: 8 cada
Níveis 11 e 12: 6 cada
Níveis 13 e 14: 5 cada
Nível 15: 4

Total: 150.

## Supabase
Arquivos prontos:
- `supabase/01_schema.sql`
- `supabase/02_seed_150_questions.sql`
- `config.js`

Depois de criar o projeto no Supabase, rode os dois SQLs nessa ordem e preencha `config.js` com URL + chave pública anon/publishable.
Nunca use a chave `service_role` no site.
