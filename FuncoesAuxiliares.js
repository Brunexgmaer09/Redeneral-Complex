class FuncoesAuxiliares {
    static rndVal() {
        return Math.random() * 2 - 1;
    }

    static calcMelhor(res) {
        if (!res.length) return 0;
        return Math.max(...res);
    }

    static calcMedia(res) {
        if (!res.length) return 0;
        return res.reduce((a, b) => a + b, 0) / res.length;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FuncoesAuxiliares };
}
