# RedeNeural JS — NEAT

Implementação de NEAT (NeuroEvolution of Augmenting Topologies) em JavaScript puro para uso em jogos e simulações.

## Arquivos

- `RedeNeural.js` — Classes `GNo`, `GCx`, `Genoma` (forward pass via ordenação topológica)
- `AlgoritmoGenetico.js` — Classe `NEAT` (especiação, crossover por innovation number, mutações estruturais)
- `Variaveis.js` — Constantes e estatísticas globais
- `VisualizadorRede.js` — Visualizador de grafo arbitrário em Canvas
- `FuncoesAuxiliares.js` — Utilitários (`calcMelhor`, `calcMedia`)
- `InputsRedeNeural.js` — Normalização de entradas para jogos
- `index.html` — Teste funcional com Flappy Bird 5→2

## Uso básico

```html
<script src="RedeNeural.js"></script>
<script src="AlgoritmoGenetico.js"></script>
```

```js
const neat = new NEAT(5, 2, 150);
neat.inicializar();

neat.avaliarPopulacao(genoma => {
    const saidas = genoma.calcSaida([0.1, -0.3, 0.5, 0.2, -0.8]);
    return simularJogo(saidas);
});

neat.evoluir();

const stats = neat.getEstatisticas();
console.log(stats.geracao, stats.numEspecies, stats.melhorFitness);
```

## API

### NEAT

| Método | Descrição |
|---|---|
| `new NEAT(nEnt, nSaid, tamPop)` | Construtor |
| `inicializar()` | Cria população mínima (bias+entradas→saídas) |
| `avaliarPopulacao(fn)` | Chama `fn(genoma)` → retorna fitness |
| `evoluir()` | Especiação → fitness ajustado → crossover/mutação |
| `getMelhorFitness()` | Maior fitness da população atual |
| `getMelhorGenoma()` | Genoma com maior fitness |
| `getIndividuo(i)` | Genoma por índice |
| `getEstatisticas()` | `{geracao, numEspecies, melhorFitness, mediaFitness, tamPop}` |
| `salvarMelhor()` | Retorna objeto JSON do melhor genoma |
| `carregarGenoma(dados)` | Reconstrói `Genoma` a partir de JSON |

### Genoma

| Método | Descrição |
|---|---|
| `calcSaida(ents)` | Forward pass, retorna array de saídas |
| `copiarDaSaida()` | Retorna ativações dos nós de saída |
| `salvar()` | Serializa para JSON |
| `Genoma.carregar(dados)` | Desserializa de JSON |

## Exemplo Flappy Bird

```js
class Passaro {
    constructor(genoma) {
        this.g   = genoma;
        this.pts = 0;
    }

    update(jY, jVY, cX, cAlt, dist) {
        const ents  = InputsRedeNeural.procFlappy({ jogadorY: jY, jogadorVelocidadeY: jVY, proximoCanoX: cX, proximoCanoAlturaAbertura: cAlt, distanciaProximoCano: dist });
        const saids = this.g.calcSaida(ents);
        if (saids[0] > saids[1]) this.pular();
        this.pts++;
    }
}

const neat = new NEAT(5, 2, 150);
neat.inicializar();

for (let ger = 0; ger < 100; ger++) {
    neat.avaliarPopulacao(g => {
        const p = new Passaro(g);
        return simularPartida(p);
    });
    neat.evoluir();
    console.log(`Ger ${ger}:`, neat.getEstatisticas());
}
```

## Salvar e carregar melhor genoma

```js
const dadosSalvos = neat.salvarMelhor();
localStorage.setItem('melhor', JSON.stringify(dadosSalvos));

const dadosLidos = JSON.parse(localStorage.getItem('melhor'));
const g = neat.carregarGenoma(dadosLidos);
const saidas = g.calcSaida([0.1, -0.3, 0.5, 0.2, -0.8]);
```

## Visualização

```js
const viz = new VisualizadorRede(document.getElementById('canvas'));
viz.atualizar(neat.getMelhorGenoma(), [0.1, -0.3, 0.5, 0.2, -0.8]);
```

Cores dos nós: verde=entrada, laranja=bias, azul=oculto, vermelho=saída.
Conexões tracejadas cinza = desativadas. Azul = peso positivo, vermelho = negativo.
