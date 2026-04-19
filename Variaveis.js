class Variaveis {
    static POPULACAO_TAMANHO = 150;
    static N_ENTRADAS        = 5;
    static N_SAIDAS          = 2;

    static GeracaoCompleta       = 0;
    static BestFitnessPopulacao  = [];
    static MediaFitnessPopulacao = [];
    static NumEspecies           = [];

    static MelhorGenoma = null;

    static resetarEstatisticas() {
        this.GeracaoCompleta       = 0;
        this.BestFitnessPopulacao  = [];
        this.MediaFitnessPopulacao = [];
        this.NumEspecies           = [];
        this.MelhorGenoma          = null;
    }

    static adicionarEstatistica(melhorFit, mediaFit, numEsp = 0) {
        this.BestFitnessPopulacao.push(melhorFit);
        this.MediaFitnessPopulacao.push(mediaFit);
        this.NumEspecies.push(numEsp);
        this.GeracaoCompleta++;
    }

    static obterEstatisticas() {
        return {
            geracao:      this.GeracaoCompleta,
            melhorFitness: this.BestFitnessPopulacao,
            mediaFitness:  this.MediaFitnessPopulacao,
            numEspecies:   this.NumEspecies,
            melhorGenoma:  this.MelhorGenoma
        };
    }

    static definirMelhorGenoma(g) {
        this.MelhorGenoma = { dados: g.salvar(), fitness: g.fit };
    }

    static carregarMelhorGenoma() {
        if (this.MelhorGenoma?.dados) return Genoma.carregar(this.MelhorGenoma.dados);
        return null;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Variaveis };
}
