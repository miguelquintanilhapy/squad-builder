# SquadBuilder --- Direção de UI/UX

## Briefing visual para evolução da interface

> **Escopo deste documento:** exclusivamente UI/UX visual e experiência
> de uso da interface existente.
>
> **Fora do escopo por enquanto:** novas funcionalidades de produto,
> novas regras de negócio, novos módulos, novos recursos de análise ou
> expansão do escopo funcional.
>
> **Objetivo:** evoluir a interface atual do SquadBuilder de um
> protótipo funcional e bem organizado para uma interface com aparência
> de produto SaaS B2B maduro, sofisticado, técnico e confiável --- sem
> perder a simplicidade.

------------------------------------------------------------------------

# 1. Contexto e diagnóstico

O SquadBuilder já possui uma base visual boa:

-   paleta sóbria;
-   verde escuro como cor de destaque;
-   tipografia legível;
-   componentes relativamente consistentes;
-   bastante espaço em branco;
-   linguagem visual limpa;
-   boa organização vertical;
-   ausência de elementos decorativos desnecessários.

O problema principal **não é falta de beleza**.

O problema é que a interface ainda transmite uma sensação de **protótipo
funcional / dashboard administrativo simples**, apesar de o produto
apresentar informações relativamente sofisticadas.

A interface atualmente tende a apresentar o conteúdo assim:

**seção → borda → tabela/card → divisor → próxima seção → borda →
tabela/card**

Isso deixa muitos elementos com peso visual semelhante.

A evolução desejada é:

**hierarquia → agrupamento → foco → contexto → interação**

Em outras palavras:

> A interface precisa parecer menos uma página que "exibe informações" e
> mais uma ferramenta profissional que conduz o usuário pela informação.

------------------------------------------------------------------------

# 2. Direção visual desejada

A referência estética deve ficar próxima da categoria:

**Linear + ferramentas modernas de planejamento B2B + software de
engenharia**

Não copiar visualmente nenhuma dessas ferramentas.

Usar apenas os princípios:

-   alta clareza;
-   hierarquia forte;
-   densidade de informação controlada;
-   superfícies discretas;
-   poucos elementos competindo pela atenção;
-   tipografia expressiva;
-   estados interativos claros;
-   navegação contextual;
-   sensação de ferramenta profissional;
-   consistência sistemática.

O resultado desejado não é um "SaaS genérico bonito".

Deve parecer uma ferramenta criada para profissionais de tecnologia e
gestão de projetos.

------------------------------------------------------------------------

# 3. Problema central de hierarquia visual

## Estado atual

Muitos elementos possuem aproximadamente o mesmo peso:

-   títulos;
-   tabelas;
-   cards;
-   divisores;
-   valores;
-   textos auxiliares.

Isso faz com que o usuário tenha que descobrir sozinho o que é mais
importante.

## Estado desejado

A interface deve deixar explícito:

### Nível 1 --- informação principal

Números e decisões centrais.

### Nível 2 --- contexto

Títulos de seção e informações complementares.

### Nível 3 --- detalhes

Descrições, metadata, premissas e textos auxiliares.

### Nível 4 --- suporte

Hints, labels secundários e informações menos importantes.

Não aumentar simplesmente o tamanho de tudo.

A hierarquia deve vir da combinação de:

-   tamanho;
-   peso tipográfico;
-   contraste;
-   posição;
-   espaçamento;
-   agrupamento;
-   superfície;
-   cor semântica.

A documentação atual do Atlassian Design System reforça exatamente esse
princípio: tamanho, peso e cor devem criar níveis de hierarquia,
enquanto o espaçamento deve ajudar o usuário a entender relações
semânticas entre elementos.

Referências: -
https://atlassian.design/foundations/typography/applying-typography -
https://atlassian.design/foundations/spacing

------------------------------------------------------------------------

# 4. Reduzir a dependência de bordas

Este é um dos pontos mais importantes.

A interface atual utiliza muitas linhas horizontais e bordas para
separar conteúdo.

Isso produz uma aparência de sistema administrativo tradicional.

## Direção

Usar prioritariamente:

1.  espaço;
2.  agrupamento;
3.  contraste de superfície;
4.  tipografia;
5.  bordas apenas quando realmente ajudam.

### Evitar

``` text
────────────────────────
Seção
────────────────────────
conteúdo
────────────────────────
próxima seção
────────────────────────
```

### Preferir

``` text
Seção

conteúdo


Próxima seção

conteúdo
```

A separação deve ser percebida pelo ritmo visual, não por linhas em
todos os lugares.

O Atlassian Design System recomenda utilizar whitespace e agrupamento
para comunicar relações e alerta que elevação/bordas excessivas podem
gerar ruído visual.

Referências: - https://atlassian.design/foundations/spacing -
https://atlassian.design/foundations/elevation/

------------------------------------------------------------------------

# 5. Espaçamento e ritmo visual

O layout atual possui bastante espaço em branco, mas o espaço nem sempre
cria uma hierarquia clara.

O objetivo não é simplesmente "diminuir espaços".

É criar **ritmo**.

Usar uma escala consistente de espaçamento.

Uma boa referência é trabalhar com uma base de 8px:

-   4px --- microajustes;
-   8px --- relações muito próximas;
-   12px;
-   16px;
-   24px;
-   32px;
-   48px;
-   64px.

Não usar dezenas de valores arbitrários.

O espaçamento deve indicar relações:

``` text
Título
↓ 8–12px
Descrição

↓ 24–32px

Próximo grupo
```

Enquanto uma nova seção deve possuir uma separação maior.

A documentação do Atlassian Design System usa uma escala baseada em 8px
e recomenda variar o espaço para criar agrupamento, ritmo visual e
pontos de atenção.

Referência: https://atlassian.design/foundations/spacing

------------------------------------------------------------------------

# 6. Layout e largura de conteúdo

A interface deve ter uma sensação mais controlada.

Evitar que todo o conteúdo pareça simplesmente ocupar uma grande largura
disponível.

O resultado deve possuir:

-   container principal consistente;
-   largura máxima definida;
-   alinhamento vertical rigoroso;
-   margens laterais equilibradas;
-   grids previsíveis;
-   colunas com proporções claras.

A sensação desejada é de uma ferramenta construída sobre um sistema de
layout, não de elementos posicionados individualmente.

## Importante

Todos os blocos devem compartilhar os mesmos eixos.

Por exemplo:

``` text
┌───────────────────────────────────────────────┐
│ Header                                        │
│                                               │
│ Título                                        │
│                                               │
│ Conteúdo                                      │
│                                               │
│ Próxima seção                                 │
│                                               │
└───────────────────────────────────────────────┘
```

Não criar pequenas diferenças de alinhamento entre seções.

------------------------------------------------------------------------

# 7. Landing / tela inicial

A tela inicial atual possui uma composição limpa e um bom título, mas há
um vazio excessivo.

O problema não é o espaço em branco em si.

O problema é que o espaço não parece estar construindo uma composição
visual intencional.

A tela deve continuar minimalista, mas precisa ter mais **presença de
produto**.

## Direção

Manter:

-   grande headline;
-   foco central;
-   CTA principal;
-   fundo limpo.

Melhorar:

-   largura e quebra do headline;
-   relação entre headline, descrição e CTA;
-   peso visual do CTA;
-   tratamento do fundo;
-   proporção vertical da composição;
-   sensação de "entrada em uma ferramenta".

Não transformar a landing em uma página de marketing cheia de cards,
ilustrações ou métricas.

------------------------------------------------------------------------

# 8. Header / navegação

O header atual é excessivamente simples para uma aplicação.

Ele parece mais um header institucional.

A direção deve ser de **application UI**.

Visualmente:

``` text
[ logo ] SquadBuilder

                           [ ações/contexto ]
```

Quando estiver dentro do resultado, deve existir uma noção clara de
contexto.

Exemplo conceitual:

``` text
SquadBuilder / Entregas locais
```

Isso não significa adicionar novas funcionalidades.

É apenas uma melhoria de orientação visual.

O usuário precisa saber:

> Onde estou?

> Em qual projeto estou?

> Qual é o contexto desta tela?

A navegação deve ser discreta, mas claramente pertencente a uma
aplicação.

------------------------------------------------------------------------

# 9. Tipografia

A tipografia atual é boa, mas a hierarquia pode ser mais agressiva.

O produto trabalha com números importantes.

Esses números devem possuir uma presença visual muito maior.

## Sugestão de escala

### Display

48--64px

Uso: - headline principal; - grande valor de resultado quando
apropriado.

### H1

32--40px

### H2

24--28px

### H3

18--20px

### Body

14--16px

### Metadata

12--13px

Não aplicar essas medidas cegamente.

A escala deve ser coerente com o contexto.

## Regra

Não deixar:

-   título;
-   subtítulo;
-   descrição;
-   metadata

com pesos visualmente semelhantes.

O usuário precisa conseguir escanear a página rapidamente apenas olhando
tamanho e peso.

A documentação do Atlassian Design System recomenda text styles e tokens
para estabelecer hierarquia consistente, além de enfatizar que headings
ajudam usuários a escanear e compreender a estrutura da página.

Referências: -
https://atlassian.design/foundations/typography/applying-typography -
https://atlassian.design/foundations/typography/product-typefaces-and-scale

------------------------------------------------------------------------

# 10. Números e dados

Os números são parte central da identidade do SquadBuilder.

Não devem parecer simplesmente valores dentro de uma tabela.

Exemplo atual conceitual:

``` text
Custo mensal
R$ 34.500
```

Direção desejada:

``` text
R$ 34.500
/mês
```

O valor deve ser imediatamente escaneável.

O label deve ser secundário.

Valores importantes devem possuir:

-   maior tamanho;
-   peso forte;
-   alinhamento consistente;
-   contraste suficiente;
-   espaço adequado ao redor.

Não utilizar números grandes indiscriminadamente.

O tamanho deve comunicar importância.

------------------------------------------------------------------------

# 11. Cards e superfícies

Os cards atuais possuem bastante borda.

Isso deixa todos os blocos com o mesmo peso.

## Direção

Criar três níveis de superfície:

### Default

Conteúdo normal.

### Subtle / Sunken

Área de agrupamento ou contexto.

### Raised

Somente para o elemento que realmente precisa chamar atenção.

Não transformar toda seção em card.

O princípio deve ser:

> uma superfície só existe quando ela possui uma função visual.

Não usar sombras fortes.

Não utilizar glassmorphism.

Não utilizar gradientes decorativos.

Não utilizar cartões flutuantes em excesso.

O Atlassian Design System recomenda reservar superfícies elevadas para
situações em que elas realmente criam hierarquia e alerta que excesso de
elevação gera ruído.

Referência: https://atlassian.design/foundations/elevation/

------------------------------------------------------------------------

# 12. Border radius

O produto deve possuir um sistema consistente.

Sugestão:

-   6px--8px para cards;
-   6px--8px para inputs;
-   6px--8px para botões;
-   radius maior apenas quando houver uma razão visual;
-   pills apenas para badges/chips.

Evitar deixar cada componente com um raio diferente.

O objetivo é que o usuário perceba uma família visual consistente.

------------------------------------------------------------------------

# 13. Inputs

O textarea é uma das primeiras interações do produto e atualmente possui
aparência bastante próxima de um textarea HTML tradicional.

Ele precisa parecer mais intencional.

## Direção visual

O campo deve possuir:

-   label clara;
-   descrição contextual;
-   área de escrita confortável;
-   foco visual muito bem definido;
-   contador discreto;
-   placeholder bem escrito;
-   estado de hover;
-   estado de focus;
-   estado de erro;
-   estado desabilitado.

O focus deve ser claramente perceptível sem ser agressivo.

Não usar apenas uma mudança quase imperceptível de border.

------------------------------------------------------------------------

# 14. Botões

O CTA atual funciona, mas a linguagem de botões pode ganhar mais
personalidade.

Criar uma hierarquia clara:

### Primary

Ação principal.

### Secondary

Ação alternativa.

### Tertiary / Ghost

Ações de suporte.

### Destructive

Ações potencialmente destrutivas.

Não transformar tudo em botão preenchido.

A interface deve possuir apenas uma ação visualmente dominante por
contexto.

## Estados obrigatórios

Todo componente interativo deve possuir:

-   default;
-   hover;
-   active;
-   focus;
-   disabled;
-   loading quando aplicável.

------------------------------------------------------------------------

# 15. Chips e badges

Os chips atuais são úteis, mas parecem um pouco genéricos.

Eles devem ter uma função visual clara.

Diferenciar:

### Chip selecionável

``` text
[ Entregas com motos ]
```

### Badge informativo

``` text
Média
```

### Status

``` text
● Baixo
```

Não utilizar a mesma linguagem para tudo.

A forma deve comunicar função.

------------------------------------------------------------------------

# 16. Cor

A paleta atual é uma das partes mais acertadas.

O verde escuro funciona bem com o preto/azul-marinho.

Não trocar a identidade.

O que falta é criar um sistema semântico.

## Sugestão conceitual

### Brand / Primary

Verde SquadBuilder.

### Neutral

Cinzas frios e quase branco.

### Positive

Verde de sucesso.

### Warning

Amarelo/âmbar.

### Danger

Vermelho.

### Informative

Azul.

A cor deve ser utilizada com parcimônia.

Não usar verde em todos os elementos apenas porque é a cor da marca.

Além disso, significado não deve depender exclusivamente de cor.

Referência: https://atlassian.design/foundations

------------------------------------------------------------------------

# 17. Background

O cinza atual funciona, mas contribui para uma aparência de dashboard
genérico.

Testar uma base mais neutra e refinada:

``` text
#FAFAF9
```

ou

``` text
#F7F8FA
```

com superfícies claras.

O importante não é escolher exatamente essas cores.

O importante é estabelecer:

``` text
Background
↓
Surface
↓
Raised Surface
↓
Overlay
```

em vez de usar uma única cor de fundo para tudo.

------------------------------------------------------------------------

# 18. Tabelas

As tabelas precisam parecer parte de uma ferramenta moderna, não uma
planilha.

Reduzir:

-   bordas pesadas;
-   linhas excessivas;
-   excesso de centralização;
-   texto pequeno demais.

Melhorar:

-   alinhamento numérico;
-   hierarquia entre nome e descrição;
-   padding consistente;
-   hover por linha;
-   cabeçalho mais discreto;
-   destaque de valores importantes.

Exemplo:

``` text
Dev Mobile Pleno                 100%       R$ 8.000
Descrição secundária

Dev Front-end Pleno              100%       R$ 7.000
Descrição secundária
```

O nome deve dominar.

A descrição deve recuar visualmente.

Os valores devem alinhar em uma coluna previsível.

------------------------------------------------------------------------

# 19. Gráficos e visualizações

A visualização atual de alocação é limpa, mas visualmente simples.

O principal problema não é "falta de gráfico".

É que a representação possui pouco contraste de informação.

Quando várias linhas são iguais e ocupam toda a duração, o gráfico não
cria muita diferenciação.

A evolução visual deve buscar uma linguagem de timeline/Gantt moderna:

-   linhas mais leves;
-   grid temporal discreto;
-   barras com hierarquia;
-   labels claros;
-   milestones visualmente distintos;
-   hover contextual;
-   relações visuais entre períodos.

Não adicionar novos dados ou funcionalidades neste momento.

Apenas melhorar a representação visual dos dados já existentes.

------------------------------------------------------------------------

# 20. Risk Score

O Risk Score atual é funcional, mas visualmente parece um número
acompanhado de uma barra.

Ele pode ser tratado como uma peça visual importante.

Exemplo conceitual:

``` text
RISCO DO PROJETO

20
/100

BAIXO

Baixo ─────────────── Alto
       ▲
       20
```

A barra deve possuir escala visual clara.

O número deve dominar.

O status deve ser facilmente escaneável.

Os fatores devem ter uma hierarquia secundária.

Não exagerar em gráficos circulares ou gauges decorativos.

------------------------------------------------------------------------

# 21. Microinterações

A interface atual parece bastante estática.

Adicionar microinterações discretas para aumentar a sensação de produto.

Exemplos:

-   hover em cards interativos;
-   mudança suave de superfície;
-   focus states;
-   seleção de chips;
-   transições curtas entre estados;
-   pequenas animações em valores recalculados;
-   skeleton/loading visual quando necessário;
-   feedback visual de ações.

As animações devem ser rápidas e funcionais.

Evitar:

-   animações longas;
-   elementos voando pela tela;
-   parallax;
-   efeitos decorativos;
-   excesso de motion.

Motion deve explicar mudança de estado, não chamar atenção para si.

------------------------------------------------------------------------

# 22. Hover e estados interativos

Atualmente alguns elementos parecem estáticos.

O usuário precisa conseguir distinguir visualmente:

-   texto estático;
-   elemento clicável;
-   elemento selecionado;
-   elemento editável;
-   elemento desabilitado.

Criar um sistema consistente de estados.

Exemplo:

``` text
Default
   ↓
Hover
   ↓
Pressed
   ↓
Selected
```

A mudança não precisa ser grande.

Pode ser:

-   background;
-   border;
-   shadow;
-   contraste;
-   ícone;
-   underline.

Mas deve ser perceptível.

------------------------------------------------------------------------

# 23. Ícones

Adicionar iconografia com parcimônia.

Não utilizar emojis como ícones principais da aplicação.

Preferir uma biblioteca consistente, como Lucide, caso já faça sentido
para o projeto.

Os ícones devem:

-   possuir tamanho consistente;
-   ter alinhamento óptico;
-   utilizar a mesma linguagem;
-   possuir significado claro;
-   nunca substituir texto quando o significado não for óbvio.

A iconografia deve complementar a interface, não decorar.

------------------------------------------------------------------------

# 24. Densidade

O produto precisa encontrar um equilíbrio entre:

**minimalismo** e **densidade profissional**.

Atualmente algumas áreas possuem espaço demais, enquanto outras possuem
muitos elementos separados por linhas.

A direção desejada:

> menos vazio desperdiçado + mais espaço intencional.

Não transformar a interface em uma dashboard compacta.

O usuário deve conseguir escanear muito conteúdo sem sentir que está
olhando para uma planilha.

------------------------------------------------------------------------

# 25. Responsividade

A interface deve manter a hierarquia em diferentes larguras.

Não apenas "encolher".

Definir comportamentos para:

-   desktop grande;
-   notebook;
-   tablet;
-   mobile.

Em telas menores:

-   grids devem quebrar;
-   cards devem reorganizar;
-   tabelas devem preservar informação importante;
-   títulos devem reduzir de forma controlada;
-   paddings devem diminuir;
-   elementos secundários podem desaparecer visualmente quando
    necessário.

A hierarquia deve permanecer.

------------------------------------------------------------------------

# 26. Acessibilidade visual

Mesmo sendo uma ferramenta B2B, a interface deve seguir princípios
básicos de acessibilidade.

Garantir:

-   contraste adequado;
-   focus state visível;
-   tamanho de texto legível;
-   áreas clicáveis confortáveis;
-   hierarquia semântica de headings;
-   cor não sendo o único indicador de estado;
-   labels claros;
-   estados de erro compreensíveis.

A documentação do Atlassian Design System também relaciona tipografia,
contraste, headings e semântica à acessibilidade e escaneabilidade.

Referência:
https://atlassian.design/foundations/typography/applying-typography

------------------------------------------------------------------------

# 27. Design system do próprio SquadBuilder

Antes de continuar adicionando componentes, consolidar uma pequena
linguagem visual própria.

Criar tokens para:

## Color

``` text
--color-bg
--color-surface
--color-surface-raised
--color-text-primary
--color-text-secondary
--color-border
--color-brand
--color-success
--color-warning
--color-danger
--color-info
```

## Spacing

``` text
4
8
12
16
24
32
48
64
```

## Radius

``` text
6
8
999
```

## Typography

Definir estilos para:

``` text
display
h1
h2
h3
body
body-small
label
caption
```

## Shadows

Poucos níveis:

``` text
none
subtle
raised
overlay
```

Não escolher valores individualmente em cada componente.

Design tokens são uma boa referência para isso: representam decisões
repetíveis de cor, tipografia, espaçamento, elevação e outros atributos
visuais.

Referência: https://atlassian.design/foundations/tokens/design-tokens/

------------------------------------------------------------------------

# 28. Princípios visuais que devem guiar a implementação

## 1. Menos borda, mais hierarquia

Não separar tudo com linhas.

## 2. Menos caixas, mais agrupamento

Nem todo conteúdo precisa estar dentro de um card.

## 3. Mais contraste entre importância

Informação principal deve parecer principal.

## 4. Espaçamento intencional

Espaço deve comunicar relação.

## 5. Números importantes devem dominar

O usuário deve encontrar rapidamente os valores principais.

## 6. Uma ação dominante por contexto

Não transformar todas as ações em primary buttons.

## 7. Interação deve ser perceptível

Hover, focus e selected states precisam existir.

## 8. Motion deve ter propósito

Animação comunica mudança, não decoração.

## 9. Consistência acima de criatividade

O mesmo componente deve parecer o mesmo componente em toda a aplicação.

## 10. Profissional, não "SaaS genérico"

Evitar tendências visuais apenas porque estão na moda.

------------------------------------------------------------------------

# 29. O que NÃO fazer

Não transformar o SquadBuilder em:

-   dashboard cheio de gráficos;
-   interface com glassmorphism;
-   interface com gradientes exagerados;
-   landing page cheia de ilustrações;
-   coleção de cards arredondados;
-   sistema com sombras pesadas;
-   interface com dezenas de cores;
-   "AI UI" cheia de brilhos e estrelas;
-   clone visual do Linear;
-   interface excessivamente minimalista que esconda informações.

O objetivo é:

**sofisticado + técnico + confiável + simples.**

------------------------------------------------------------------------

# 30. Direção estética resumida

Se fosse necessário descrever a direção visual em uma frase:

> **"Uma ferramenta B2B de engenharia moderna, com a clareza do Linear,
> a densidade controlada de ferramentas de planejamento e a sobriedade
> de um software financeiro/enterprise --- mas com identidade própria do
> SquadBuilder."**

Visualmente:

``` text
MINIMALISTA
     +
TÉCNICO
     +
DENSO, MAS NÃO LOTADO
     +
SOFISTICADO
     +
CONFIÁVEL
```

------------------------------------------------------------------------

# 31. Prioridade de implementação visual

## P0 --- fazer primeiro

-   [ ] Redefinir hierarquia visual da página de resultado.
-   [ ] Reduzir drasticamente divisores e bordas.
-   [ ] Criar escala consistente de espaçamento.
-   [ ] Criar hierarquia tipográfica mais forte.
-   [ ] Destacar números importantes.
-   [ ] Melhorar composição do header.
-   [ ] Refinar background e superfícies.
-   [ ] Criar sistema consistente de cards/superfícies.
-   [ ] Melhorar estados de inputs e botões.
-   [ ] Melhorar visualização da timeline existente.

## P1 --- depois

-   [ ] Criar estados completos de hover/focus/pressed/selected.
-   [ ] Refinar chips e badges.
-   [ ] Criar sistema de iconografia.
-   [ ] Adicionar microinterações discretas.
-   [ ] Melhorar densidade das tabelas.
-   [ ] Refinar Risk Score visualmente.
-   [ ] Revisar responsividade.
-   [ ] Consolidar design tokens.

## P2 --- polimento

-   [ ] Ajustes ópticos de espaçamento.
-   [ ] Ajustes de alinhamento.
-   [ ] Refinamento de shadows.
-   [ ] Refinamento de radius.
-   [ ] Motion polish.
-   [ ] Dark mode apenas se fizer sentido posteriormente.
-   [ ] Auditoria visual completa de consistência.

------------------------------------------------------------------------

# 32. Critério de sucesso

Depois da implementação, alguém olhando apenas para screenshots deve
pensar:

> "Isso parece uma ferramenta profissional de software engineering."

e não:

> "Isso parece um formulário com um dashboard."

A interface não precisa ter mais funcionalidades.

Ela precisa **comunicar melhor as funcionalidades que já existem**.

A evolução deve ser predominantemente de:

**hierarquia + layout + tipografia + espaçamento + superfícies +
estados + interação visual + consistência.**

Não adicionar novas features neste ciclo.

------------------------------------------------------------------------

# Referências de design consultadas

### Atlassian Design System

Fundamentos de design, tokens, componentes, acessibilidade e
consistência: https://atlassian.design/foundations
https://atlassian.design/design-system/

### Spacing

Sistema de espaçamento, agrupamento, ritmo visual e hierarquia:
https://atlassian.design/foundations/spacing

### Typography

Hierarquia tipográfica, headings, legibilidade e acessibilidade:
https://atlassian.design/foundations/typography/applying-typography

### Elevation

Superfícies, profundidade, borders, sombras e estados:
https://atlassian.design/foundations/elevation/

### Design Tokens

Padronização de decisões visuais:
https://atlassian.design/foundations/tokens/design-tokens/

------------------------------------------------------------------------

# Instrução final para implementação

Ao aplicar este briefing ao código existente:

1.  **Não reconstruir o produto do zero.**
2.  **Não adicionar novas funcionalidades.**
3.  **Não mudar a lógica de negócio.**
4.  **Não mudar a identidade verde do SquadBuilder sem necessidade.**
5.  **Não copiar Linear ou Atlassian literalmente.**
6.  **Priorizar melhorias visuais perceptíveis.**
7.  **Manter a interface simples.**
8.  **Remover ruído antes de adicionar elementos.**
9.  **Criar consistência por meio de tokens/componentes.**
10. **Após cada mudança, avaliar a tela inteira, não apenas o componente
    isolado.**

O objetivo não é fazer a interface parecer mais "cheia".

O objetivo é fazer a interface parecer **mais intencional**.
