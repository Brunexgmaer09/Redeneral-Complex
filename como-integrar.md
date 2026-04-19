# Como integrar o NEAT em qualquer jogo

Este guia ensina o padrão exato usado no Flappy Bird para integrar o NEAT em qualquer jogo.
A ideia é sempre a mesma — só muda o que você coloca como entradas, saídas e fitness.

---

## O padrão em 4 passos

```
1. Definir entradas  →  o que a rede "vê" do jogo
2. Definir saídas    →  que ação a rede toma
3. Definir fitness   →  como medir se foi bem
4. Loop de evolução  →  inicializar → avaliar → evoluir → repetir
```

---

## Passo 1 — Incluir os arquivos

```html
<script src="RedeNeural.js"></script>
<script src="AlgoritmoGenetico.js"></script>
<script src="VisualizadorRede.js"></script>  <!-- opcional -->
```

---

## Passo 2 — Inicializar o NEAT

```js
// new NEAT(nEntradas, nSaidas, tamanhoPopulacao)
const neat = new NEAT(5, 2, 200);
neat.inicializar();
```

O NEAT cria 200 genomas com a topologia mínima: `bias + entradas → saídas`.
Nenhum nó oculto no começo — ele cresce sozinho conforme aprende.

---

## Passo 3 — Criar os agentes (um por genoma)

```js
function novaGeracao() {
    agentes = neat.pop.map(g => ({
        g,           // genoma NEAT (a "mente" do agente)
        x: 100,      // estado do jogo
        y: 300,
        vivo: true,
        pts: 0
    }));
    // reiniciar estado do jogo...
}
```

---

## Passo 4 — Loop do jogo

A cada frame, para cada agente vivo:

```js
function tick() {
    for (const ag of agentes) {
        if (!ag.vivo) continue;

        // 1. Montar entradas normalizadas
        const ent = montarEntradas(ag);

        // 2. Calcular saída da rede
        const saida = ag.g.calcSaida(ent);

        // 3. Aplicar ação no jogo
        aplicarAcao(ag, saida);

        // 4. Atualizar física/estado
        atualizarAgente(ag);

        // 5. Checar morte
        if (morreu(ag)) ag.vivo = false;
        else ag.pts++;
    }

    // Quando todos morrerem: evoluir
    const vivos = agentes.filter(a => a.vivo).length;
    if (vivos === 0 || fr >= LIMITE_FRAMES) {
        for (const ag of agentes) ag.g.fit = calcularFitness(ag);
        neat.evoluir();
        novaGeracao();
    }
    fr++;
}
```

---

## Como definir as ENTRADAS

**Regra de ouro: normalize tudo para o range [-1, 1] ou [0, 1].**

A rede não entende pixels ou metros — só entende números pequenos e consistentes.

```js
// Fórmula de normalização
function norm(v, min, max) {
    return ((v - min) / (max - min)) * 2 - 1;
}
```

### Quais entradas escolher?

Use informações que **um jogador humano usaria para tomar a decisão**:

| Tipo de info | Exemplo |
|---|---|
| Posição do agente | `norm(y, 0, alturaJogo)` |
| Velocidade do agente | `norm(vy, -velMax, velMax)` |
| Distância ao obstáculo | `norm(distX, 0, larguraJogo)` |
| Posição do objetivo | `norm(alvoY, 0, alturaJogo)` |
| Estado do ambiente | `norm(vida, 0, vidaMax)` |

**Flappy Bird usou:**
```js
const ent = [
    norm(b.y,    0,    560),   // altura do pássaro
    norm(b.vy,  -13,   13),    // velocidade vertical
    norm(dx,    -50,  420),    // distância horizontal ao cano
    norm(dy,   -280,  280),    // distância vertical ao centro do gap
    norm(pc.cy,  0,   560)     // altura absoluta do gap
];
```

---

## Como definir as SAÍDAS

A rede retorna um array com `nSaidas` valores entre 0 e 1 (sigmoid).

### Padrão mais comum — comparar saídas

```js
const saida = ag.g.calcSaida(entradas);

// 2 saídas: fazer ação ou não
if (saida[0] > saida[1]) agente.pular();

// 3 saídas: esquerda / parado / direita
const idx = saida.indexOf(Math.max(...saida));
if      (idx === 0) agente.moverEsquerda();
else if (idx === 2) agente.moverDireita();

// Saída contínua (movimento suave)
agente.vx = (saida[0] - 0.5) * 2 * velMax;  // mapeia [0,1] para [-velMax, velMax]
```

---

## Como definir o FITNESS

O fitness é **o número que diz o quão bem o agente foi**. Deve crescer com o tempo se
o agente estiver fazendo a coisa certa.

```js
// Simples: tempo sobrevivido
ag.g.fit = ag.pts;

// Com bônus por objetivo
ag.g.fit = ag.pts + ag.coinsColetados * 200;

// Com penalidade
ag.g.fit = ag.pts - ag.danoRecebido * 50;

// Distância percorrida
ag.g.fit = ag.x - xInicial;
```

**Dica importante:** não use fitness negativo no início — dificulta o aprendizado.
Se precisar penalizar, some uma constante base:
```js
ag.g.fit = Math.max(0, ag.pts - penalidade + 100);
```

---

## Ler as estatísticas

```js
const s = neat.getEstatisticas();
console.log(s.geracao);       // geração atual
console.log(s.numEspecies);   // quantas espécies existem
console.log(s.melhorFitness); // melhor fitness desta geração
console.log(s.mediaFitness);  // média da população
```

---

## Salvar e carregar o melhor genoma

```js
// Salvar
const dados = neat.salvarMelhor();
localStorage.setItem('melhor', JSON.stringify(dados));

// Carregar e usar
const dados = JSON.parse(localStorage.getItem('melhor'));
const g = neat.carregarGenoma(dados);
const saida = g.calcSaida(entradas);
```

---

## Visualizar a rede em tempo real

```js
const viz = new VisualizadorRede(document.getElementById('meuCanvas'));

// No loop de desenho, passar o melhor genoma vivo
const melhor = agentes.filter(a => a.vivo).sort((a,b) => b.pts - a.pts)[0];
if (melhor) viz.desenharGenoma(melhor.g);
```

Cores: **verde** = entrada | **laranja** = bias | **azul** = oculto | **vermelho** = saída
Conexões: **azul** = peso positivo | **vermelho** = peso negativo | **tracejado** = desativada

---

## Exemplos por tipo de jogo

### Jogo de corrida / esquiva (2D lateral)

```js
// 5 entradas
const ent = [
    norm(ag.y,              0, altTela),     // altura do personagem
    norm(ag.vy,           -15, 15),          // velocidade vertical
    norm(obst.x - ag.x,    0, largTela),     // distância ao obstáculo
    norm(obst.y,           0, altTela),      // altura do obstáculo
    norm(obst.largura,    20, 200)           // tamanho do obstáculo
];
// 2 saídas: pular / não pular
```

### Snake / Cobrinha

```js
// 8 entradas (4 direções × distância até parede e até comida)
const ent = [
    norm(dist(cobra, 'cima',    'parede'), 0, altTela),
    norm(dist(cobra, 'baixo',   'parede'), 0, altTela),
    norm(dist(cobra, 'esq',     'parede'), 0, largTela),
    norm(dist(cobra, 'dir',     'parede'), 0, largTela),
    norm(dist(cobra, 'cima',    'comida'), 0, altTela),
    norm(dist(cobra, 'baixo',   'comida'), 0, altTela),
    norm(dist(cobra, 'esq',     'comida'), 0, largTela),
    norm(dist(cobra, 'dir',     'comida'), 0, largTela),
];
// 4 saídas: cima / baixo / esquerda / direita
// const dir = saida.indexOf(Math.max(...saida));
```

### Jogo top-down (perseguição / fuga)

```js
// 6 entradas
const ent = [
    norm(ag.x,           0, largTela),
    norm(ag.y,           0, altTela),
    norm(alvo.x - ag.x, -largTela, largTela),  // vetor direção X ao alvo
    norm(alvo.y - ag.y, -altTela,  altTela),   // vetor direção Y ao alvo
    norm(ag.vx,         -velMax, velMax),
    norm(ag.vy,         -velMax, velMax),
];
// 4 saídas: cima / baixo / esq / dir
// ou 2 saídas contínuas: vx e vy direto
```

### Plataformer (Mario-like)

```js
// 7 entradas
const ent = [
    norm(ag.x,                 0, largTela),
    norm(ag.y,                 0, altTela),
    norm(ag.vy,              -20, 20),
    ag.noChao ? 1 : -1,                          // está no chão? (binário)
    norm(proximoObst.x - ag.x, 0, largTela),
    norm(proximoObst.y,        0, altTela),
    norm(proximoObst.largura, 10, 200),
];
// 3 saídas: andar esq / andar dir / pular
```

---

## Ajuste de performance

Com populações grandes (100-300) rodando a 60fps, pode ser necessário:

```js
// Limitar frames por geração para evitar gerações infinitas
if (vivos === 0 || fr >= 4000) {
    // finalizar geração
}

// Usar velocidade múltipla no loop
function rAF() {
    for (let i = 0; i < vel; i++) tick(); // vel = 1, 3, 6, 12...
    desenhar();
    requestAnimationFrame(rAF);
}
```

---

## Tamanho recomendado de população e entradas

| Complexidade do jogo | População | Entradas | Saídas |
|---|---|---|---|
| Simples (flappy, corrida) | 100-150 | 4-6 | 2 |
| Médio (snake, plataformer) | 150-200 | 6-10 | 3-4 |
| Complexo (top-down, luta) | 200-300 | 8-16 | 4-6 |

Mais entradas não significa necessariamente melhor — entradas irrelevantes atrapalham.
Prefira poucas entradas **bem escolhidas** a muitas entradas.

---

## Checklist de integração

- [ ] Todos os valores de entrada normalizados para [-1, 1]
- [ ] Fitness sempre positivo ou zero
- [ ] Fitness cresce com comportamento desejado
- [ ] Todos os agentes morrem dentro de um limite de frames
- [ ] `ag.g.fit` definido para todos antes de `neat.evoluir()`
- [ ] `neat.evoluir()` chamado uma vez por geração (não por frame)
