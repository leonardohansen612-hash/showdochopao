# Show do Chopão — V9 Fluido

Esta versão remove o sistema de escala fixa 1920x1080, que estava encolhendo toda a interface e criando grandes faixas laterais em telas ultrawide/baixas.

## O que mudou
- layout agora usa 100% da largura e 100% da altura reais da tela;
- sem prancheta fixa e sem `transform: scale()`;
- logo fica presa a uma área própria e não pode invadir a pergunta;
- texugo usa bem mais da altura disponível;
- escada, pergunta, respostas e botões se adaptam com `clamp()`, `vw` e `vh`;
- regra específica para telas muito largas;
- regra específica para telas baixas;
- mantém os PNGs transparentes aprovados.

Suba todos os arquivos deste ZIP na raiz do repositório GitHub/Vercel.
