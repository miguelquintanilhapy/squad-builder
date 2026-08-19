# Ajustes visuais e de UX — SquadBuilder

Quero que você faça **todos os ajustes abaixo**, sem redesignar a estrutura inteira. A interface atual já está boa; o objetivo é **refinar hierarquia, espaçamento, microcopy, estados e percepção de produto profissional**.

## 1. Header

* Manter o header minimalista atual.
* Manter o logo **SquadBuilder** no lado esquerdo.
* No lado direito, trocar:

  > Copiloto de dimensionamento de squads

  por:

  > **Copiloto para dimensionamento de squads**
* Na tela de resultado, manter o resumo no canto superior direito:

  > **6 pessoas · R$ 51.500/mês · 3 a 4 meses**
* Se possível, deixar esse resumo persistente/sticky enquanto o usuário navega pelo resultado.
* Não adicionar elementos decorativos ao header.

---

## 2. Hero

### Manter exatamente a ideia da headline

> **Descreva o produto.**
> **Receba o squad.**

* Não adicionar uma segunda frase de impacto.
* Não colocar outra headline abaixo.
* Manter o bastante espaço em branco do hero.

### Alterar o subtítulo atual

Atual:

> Escreva em texto corrido, sem formulário. O SquadBuilder dimensiona o time, o custo mensal e o prazo — o ponto de equilíbrio antes de qualquer contratação.

Substituir por:

> **Descreva o produto em texto livre. O SquadBuilder dimensiona o time, estima o custo e projeta o prazo antes da contratação.**

* Manter centralizado.
* Manter largura limitada para não virar uma linha muito longa.
* Aproximar um pouco o botão do subtítulo, sem eliminar o espaço do hero.

### Botão

Manter:

> **Montar meu squad →**

* Não mudar para "Começar", "Calcular" etc.
* Manter aparência atual.
* Garantir hover e focus bem definidos.

---

# 3. Área de entrada

## Título

Manter:

> **O que você está construindo?**

## Campo de texto

Melhorar o placeholder/exemplo para ensinar o usuário a fornecer contexto.

Usar:

> **Ex.: Quero criar um app de entregas locais com cadastro de clientes e entregadores, pagamentos online, rastreamento em tempo real e um painel administrativo. O MVP deve estar pronto em até 4 meses.**

* O exemplo deve desaparecer quando o usuário começar a escrever.
* Manter o textarea grande.
* Não transformar em formulário tradicional com vários campos.

## Contador

Corrigir obrigatoriamente o bug em que aparece:

> `0 caracteres`

mesmo quando existe texto.

O contador deve atualizar em tempo real.

Exemplo:

> **372 caracteres**

## Validação mínima

Não usar:

> Faltam 20 caracteres pra liberar

Substituir por:

> **Mínimo de 20 caracteres**

Quando estiver abaixo do mínimo, usar uma mensagem mais natural:

> **Adicione mais alguns detalhes para gerar o squad.**

Não usar tom de erro grave.

## Texto inferior direito do textarea

Trocar:

> Quanto mais concreto, menos chute

por:

> **Quanto mais contexto, mais precisa a estimativa.**

---

# 4. Prazo alvo e teto mensal

Manter os dois campos:

> **Prazo alvo**
> **Teto mensal**

Melhorar os placeholders.

Prazo:

> **Ex.: 4**

Teto:

> **Ex.: 35000**

Se forem campos opcionais, deixar isso claro de maneira discreta:

> **Opcional**

ou:

> **Defina limites para orientar a recomendação.**

Não deixar os campos parecendo quebrados quando vazios.

---

# 5. Botão "Recalcular"

Manter:

> **Recalcular →**

Criar estados claros:

### Estado normal

> **Recalcular →**

### Estado carregando

> **Calculando squad...**

### Estado de erro

> **Tentar novamente**

* Enquanto estiver calculando, desabilitar o botão.
* Não permitir múltiplos cálculos simultâneos.
* O loading deve ser visualmente claro, mas discreto.

---

# 6. "Dev. ver com dados de exemplo"

Atualmente aparece:

> Dev. ver com dados de exemplo (sem chamar a API)

Isso parece ferramenta interna e não deveria aparecer para usuário final.

### Em produção

Remover completamente.

### Se quiser manter para desenvolvimento

Trocar por:

> **Carregar exemplo**

Mas deixar disponível apenas em ambiente de desenvolvimento.

---

# 7. Espaçamento entre entrada e "O que entendemos"

Existe espaço vertical demais entre:

> formulário → recalcular → O que entendemos

Reduzir esse espaço em aproximadamente **30–40%**.

A página deve passar a sensação de continuidade:

> Entrada
> ↓
> Leitura do escopo
> ↓
> Resultado

Sem parecer que existe uma seção faltando entre elas.

---

# 8. "O que entendemos"

Manter:

> **O que entendemos**

Manter:

> **Leitura do escopo**

Alterar:

> Inferido do seu texto. Clique para corrigir — o squad recalcula na hora.

para:

> **Inferido do seu texto. Clique para corrigir e recalcular.**

Mais curto e direto.

---

# 9. Cards de classificação

Manter os quatro grupos:

* Tipo de produto
* Plataforma
* Estágio
* Complexidade

### Estados dos chips

Padronizar:

* selecionado → fundo verde escuro + texto claro;
* não selecionado → fundo branco + borda;
* hover → fundo levemente destacado;
* focus → outline visível;
* disabled → aparência claramente desabilitada.

Não usar cores diferentes sem necessidade.

O verde deve significar principalmente:

> **selecionado**

e não "correto".

---

# 10. Squad recomendado

Manter:

> **Squad recomendado**

Não alterar a headline.

## Alerta de teto

Atual:

> Squad atual custa R$ 51.500/mês, R$ 6.500 acima do teto de R$ 45.000. Renegocie o prazo ou tire um papel de suporte pra caber — use o chat de negociação abaixo.

Está muito comprido.

Substituir por:

> **O squad está R$ 6.500/mês acima do teto definido. Ajuste a composição ou negocie o escopo abaixo.**

* Manter o alerta em amarelo/âmbar.
* Não deixar o alerta visualmente mais importante que o próprio resultado.
* O alerta deve parecer uma recomendação, não uma falha.

---

# 11. Cards de resultado

Manter os quatro cards:

* Squad sugerido
* Custo mensal
* Prazo estimado
* Custo acumulado no período

Não adicionar mais cards.

### Squad sugerido

Manter:

> **6 pessoas**
> 6 papéis

### Custo mensal

Manter:

> **R$ 51.500 /mês**

### Prazo

Manter:

> **3–4 meses**

### Custo acumulado

Manter:

> **R$ 154.500 – R$ 206.000**

Trocar o texto:

> ao longo de 3 a 4 meses

por:

> **estimado para o período**

Isso deixa o card mais limpo.

---

# 12. Curva de alocação

Manter a estrutura atual.

Ela está visualmente boa e não precisa de redesign.

## Adicionar legenda

Adicionar uma legenda discreta próxima ao título:

> **Alocação: Integral · Parcial · Fora do período**

Usar os mesmos estilos visuais das barras.

O objetivo é o usuário entender imediatamente o significado de:

* verde;
* âmbar/marrom;
* bege.

Não depender apenas de interpretação visual.

## Meses

Pode manter:

> M1 · M2 · M3

Não precisa trocar para "Mês 1", pois o formato atual é mais compacto.

## Cargos

Pode manter:

> 1x Dev Mobile Pleno
> 1x Dev Front-end Pleno
> 1x Dev Back-end Pleno

Não é necessário mudar para "Desenvolvedor..." porque a versão atual é mais compacta.

Apenas garantir consistência entre todos os cargos.

---

# 13. Composição

Manter:

> **Composição**

Manter as colunas:

> Papel | Alocação | Custo/mês | Total no período

## Descrições

Encurtar as descrições.

Exemplo atual:

> Cobre a demanda de desenvolvimento mobile estimada para o escopo.

Trocar por:

> **Cobre o desenvolvimento mobile previsto no escopo.**

Outro:

> Garante cobertura de testes e reduz bugs em produção antes do usuário encontrá-los.

Trocar por:

> **Garante cobertura de testes antes da produção.**

Fazer isso para todas as descrições.

A tabela precisa ser rapidamente escaneável.

---

# 14. Rodapé da composição

Manter:

> **5 pessoas no squad**

> **4 a 5 meses**

> **R$ 34.500/mês**

Adicionar uma observação discreta:

> **Estimativa baseada nas premissas atuais.**

---

# 15. Risk Score

Manter a estrutura:

> **23 /100**
> **Risco baixo**

Essa apresentação está boa.

## Título

Trocar:

> Por que esse risco?

por:

> **O que gera esse risco?**

## Fatores

Em vez de:

> +15 Base pela complexidade do escopo.

usar:

> **+15 · Complexidade do escopo**

E embaixo:

> **+5 · Pagamentos e compliance**

Depois uma explicação curta:

> Transações financeiras exigem atenção adicional à segurança.

Não transformar cada fator em parágrafo grande.

---

# 16. Premissas

Esse bloco está muito textual.

Manter as informações, mas reorganizar.

Usar:

> **Premissas**

Depois:

> Modelo de contratação: **PJ**
> Plataforma: **iOS + Android + Web**

E transformar os custos detalhados em seção secundária:

> **Ver custos de referência ▾**

Ao abrir:

> Dev Mobile — R$ 8.000/mês
> Dev Front-end — R$ 7.000/mês
> Dev Back-end — R$ 7.500/mês
> Designer UX/UI — R$ 6.000/mês
> QA — R$ 6.000/mês
> Tech Lead — R$ 17.000/mês

Não deixar todos esses custos sempre expostos.

---

# 17. Vários "editar"

Atualmente existem vários:

> editar

ao lado de cada custo.

Remover esses links individuais.

Colocar apenas:

> **Editar premissas**

no topo da seção.

Ao clicar, abrir os campos editáveis.

Isso deixa a interface muito menos poluída.

---

# 18. Texto sobre custos

Atual:

> Valores de custo por cargo são estimativas internas de referência, não uma cotação de mercado — ajuste na negociação se não valerem para seu contexto.

Trocar por:

> **Custos são referências internas, não cotações de mercado.**

Se precisar de mais contexto, colocar em tooltip/info icon.

---

# 19. Texto sobre plataforma

Atual:

> Plataforma considerada: iOS + Android + Web Browser.

Padronizar para:

> **Plataformas consideradas: iOS + Android + Web.**

---

# 20. Negociação

Manter a seção:

> **Negociação**

A estrutura atual de duas colunas está boa:

> Histórico/contexto | Trilha de decisões

Não voltar para o layout antigo mais estreito/amassado.

---

# 21. Histórico · contexto

Manter:

> **Histórico · contexto**

Mas fazer o conteúdo priorizar decisões.

Exemplo:

> **VOCÊ**
> Tire o designer, acho desnecessário.

Depois:

> **SQUADBUILDER**
> Remover o designer reduz o custo em R$ 6.000/mês, mas aumenta o risco de usabilidade.

Evitar textos enormes.

O histórico deve permitir entender a negociação rapidamente.

---

# 22. Trilha de decisões

Manter:

> **Trilha de decisões**

Manter:

> **PONTO DE PARTIDA**

Mas trocar:

> Diagnóstico inicial

por:

> **Squad recomendado inicialmente**

Isso é mais explícito.

Manter:

> **AJUSTE SOLICITADO · ATUAL**

e mostrar exatamente o pedido:

> **"Tire o designer, acho desnecessário."**

---

# 23. Campo "Registrar novo ajuste"

Manter o título:

> **Registrar novo ajuste**

Mas melhorar o placeholder.

Atual:

> Ex: "Achei caro. Quero tirar o QA e colocar só 1 Dev Fullstack em 3 meses." (Ctrl/Cmd+Enter envia)

Trocar por:

> **Ex.: "Tire o QA e reduza o custo mantendo o prazo."**

E colocar abaixo, separadamente:

> **Ctrl/Cmd + Enter para enviar**

Não colocar essa instrução dentro do placeholder.

---

# 24. Botão Enviar

Manter:

> **Enviar**

### Estados:

Normal:

> **Enviar**

Processando:

> **Ajustando...**

Desabilitado:

> **Enviar**

com aparência disabled.

Não usar "Recalculando..." na negociação, porque aqui o usuário está fazendo um **ajuste/negociação**.

---

# 25. Impacto da negociação

Trocar o título:

> Impacto vs. versão anterior

por:

> **Impacto do ajuste**

Manter os três indicadores:

### Custo mensal

> ~~R$ 51.500~~
> **R$ 45.500**
> **− R$ 6.000/mês**

### Prazo estimado

> ~~3–4 meses~~
> **3–4 meses**
> **Sem alteração**

### Risk score

> ~~23/100~~
> **30/100**
> **+7 pontos de risco**

A economia deve ficar verde.

Sem alteração deve ficar neutro/cinza.

Aumento de risco deve ficar âmbar.

---

# 26. Explicar o trade-off

Quando o usuário remove um papel, não mostrar apenas os números.

Adicionar uma explicação curta:

> **Economia de R$ 6.000/mês, com aumento de 7 pontos no risco. O prazo permanece inalterado.**

Isso é importante porque o principal valor do SquadBuilder é mostrar **trade-offs**.

---

# 27. Histórico após negociação

Quando uma alteração for feita, registrar:

> **AJUSTE SOLICITADO**
> "Tire o designer, acho desnecessário."

Depois:

> **IMPACTO**
> − R$ 6.000/mês · +7 risco · prazo sem alteração

Isso deixa a negociação auditável.

---

# 28. Cores

Padronizar semanticamente:

### Verde

Usar para:

* seleção;
* resultado positivo;
* economia;
* status de baixo risco.

### Âmbar

Usar para:

* aumento de risco;
* atenção;
* ultrapassar teto;
* trade-offs.

### Cinza

Usar para:

* informação neutra;
* sem alteração;
* elementos secundários.

Não usar vermelho simplesmente porque alguma coisa aumentou.

---

# 29. Espaçamento geral

Fazer um passe geral de espaçamento.

Não aumentar tudo.

O objetivo é ter:

* títulos → espaço confortável;
* título → conteúdo → espaço menor;
* cards → espaçamento consistente;
* seções → bastante espaço;
* elementos dentro dos cards → pouco espaço.

Principal correção:

**reduzir o espaço vazio entre o formulário e "O que entendemos".**

---

# 30. Tipografia

Manter a tipografia atual.

Não trocar fonte.

Apenas ajustar hierarquia:

* H1 → muito forte;
* títulos de seção → fortes;
* métricas → muito fortes;
* labels → menores;
* descrições → cinza e menores;
* observações → ainda menores.

Não deixar textos secundários competindo com números.

---

# 31. Responsividade

Testar obrigatoriamente:

* 1366×768;
* 1440×900;
* 1920×1080;
* notebook menor;
* zoom 100%;
* zoom 125%.

Verificar especialmente:

* header;
* cards de resultado;
* curva de alocação;
* composição;
* Risk Score;
* negociação.

Em telas menores, não deixar a negociação ficar novamente "amassada".

---

# 32. Acessibilidade e estados

Garantir:

* `hover`;
* `focus`;
* `disabled`;
* `loading`;
* `error`;
* `success`.

Garantir foco de teclado visível.

Garantir:

* Enter funcionando onde fizer sentido;
* Ctrl/Cmd + Enter na negociação;
* chips acessíveis pelo teclado;
* botões acessíveis pelo teclado.

Não depender apenas da cor para comunicar estado.

---

# 33. Consistência de nomenclatura

Padronizar o produto inteiro.

Usar sempre:

> **squad**

em vez de alternar entre squad/time/equipe.

Usar:

> **custo mensal**

nos textos.

Usar:

> **R$ X/mês**

nos números.

Usar:

> **prazo estimado**

quando estiver falando do prazo calculado.

Usar:

> **teto mensal**

para o limite financeiro informado pelo usuário.

---

# 34. Textos finais que devem ficar

### Hero

> **Descreva o produto.**
> **Receba o squad.**

> **Descreva o produto em texto livre. O SquadBuilder dimensiona o time, estima o custo e projeta o prazo antes da contratação.**

### Botão

> **Montar meu squad →**

### Input

> **O que você está construindo?**

### Dica

> **Quanto mais contexto, mais precisa a estimativa.**

### Leitura

> **O que entendemos**

> **Leitura do escopo**

> **Inferido do seu texto. Clique para corrigir e recalcular.**

### Resultado

> **Squad recomendado**

### Alerta

> **O squad está R$ 6.500/mês acima do teto definido. Ajuste a composição ou negocie o escopo abaixo.**

### Risco

> **O que gera esse risco?**

### Premissas

> **Premissas**

> **Editar premissas**

> **Ver custos de referência**

> **Custos são referências internas, não cotações de mercado.**

### Negociação

> **Negociação**

> **Histórico · contexto**

> **Trilha de decisões**

> **Impacto do ajuste**

> **Registrar novo ajuste**

### Placeholder da negociação

> **Ex.: "Tire o QA e reduza o custo mantendo o prazo."**

### Loading

> **Calculando squad...**

### Loading da negociação

> **Ajustando...**

---

# 35. O que NÃO fazer

* Não adicionar outra frase de impacto no hero.
* Não adicionar imagens decorativas.
* Não colocar gradientes chamativos.
* Não colocar sombras fortes.
* Não transformar a página em dashboard cheio de cards.
* Não adicionar gráficos desnecessários.
* Não aumentar ainda mais o tamanho da headline.
* Não deixar o Risk Score ocupar mais espaço.
* Não deixar todos os custos de referência expostos.
* Não usar vermelho para qualquer alteração negativa.
* Não voltar ao layout antigo da negociação.
* Não compactar a negociação novamente.
* Não transformar o input inicial em formulário com vários campos.
* Não remover a bastante área em branco do hero.
* Não alterar a estrutura geral das seções.

---

# 36. Resultado esperado

Depois dessas alterações, a experiência deve seguir esta lógica visual:

**1. Descrevo o produto**
↓
**2. O sistema mostra o que entendeu**
↓
**3. Recebo squad + custo + prazo**
↓
**4. Entendo como as pessoas serão alocadas**
↓
**5. Vejo composição e premissas**
↓
**6. Entendo o risco**
↓
**7. Negocio alterações**
↓
**8. Vejo exatamente o impacto da decisão**

O objetivo é que o usuário consiga olhar para a tela e responder rapidamente:

> **"Que squad eu preciso?"**
> **"Quanto vai custar?"**
> **"Quanto tempo leva?"**
> **"Qual é o risco?"**
> **"Se eu cortar alguém, o que eu ganho e o que eu sacrifico?"**

**Não quero um redesign. Quero que a implementação atual seja refinada seguindo exatamente essas orientações, preservando a identidade visual e a estrutura que já existem.**
