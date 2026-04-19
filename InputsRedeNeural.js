class InputsRedeNeural {
    static proc(ents) {
        return [...ents];
    }

    static norm(v, mn, mx) {
        return ((v - mn) / (mx - mn)) * 2 - 1;
    }

    static denorm(vn, mn, mx) {
        return ((vn + 1) / 2) * (mx - mn) + mn;
    }

    static procFlappy(dj) {
        const { jogadorY, jogadorVelocidadeY, proximoCanoX, proximoCanoAlturaAbertura, distanciaProximoCano } = dj;
        return [
            this.norm(jogadorY,                  0,   600),
            this.norm(jogadorVelocidadeY,       -15,    15),
            this.norm(proximoCanoX,              0,   800),
            this.norm(proximoCanoAlturaAbertura, 0,   600),
            this.norm(distanciaProximoCano,      0,   800)
        ];
    }

    static procCorrida(dj) {
        const { jogadorX, jogadorY, obstaculoProximoX, obstaculoProximoY, velocidadeJogo, larguraTela = 800, alturaTela = 600 } = dj;
        return [
            this.norm(jogadorX,         0, larguraTela),
            this.norm(jogadorY,         0, alturaTela),
            this.norm(obstaculoProximoX, 0, larguraTela),
            this.norm(obstaculoProximoY, 0, alturaTela),
            this.norm(velocidadeJogo,   0, 20)
        ];
    }

    static procGen(dados, ranges) {
        if (dados.length !== ranges.length) throw new Error('Tamanho incompativel');
        return dados.map((v, i) => this.norm(v, ranges[i].min, ranges[i].max));
    }

    static clamp(v, mn, mx) {
        return Math.min(Math.max(v, mn), mx);
    }

    static lerp(a, b, t) {
        return a + (b - a) * this.clamp(t, 0, 1);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { InputsRedeNeural };
}
