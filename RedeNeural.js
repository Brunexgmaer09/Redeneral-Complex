class GNo {
    constructor(id, tp, fn = 'sig') {
        this.id = id;
        this.tp = tp;
        this.fn = fn;
        this.atv = 0;
    }
}

class GCx {
    constructor(orig, dest, w, inn) {
        this.orig = orig;
        this.dest = dest;
        this.w = w;
        this.ativ = true;
        this.inn = inn;
    }
}

class Genoma {
    constructor() {
        this.nos = [];
        this.cxs = [];
        this.fit = 0;
        this.fitAdj = 0;
        this.espId = -1;
    }

    _ap(fn, x) {
        if (fn === 'sig')  return 1 / (1 + Math.exp(-x));
        if (fn === 'relu') return x > 0 ? x : x * 0.01;
        if (fn === 'tanh') return Math.tanh(x);
        return x;
    }

    calcSaida(ents) {
        const idx = new Map(this.nos.map(n => [n.id, n]));
        const atv = new Map();

        let ei = 0;
        for (const n of this.nos) {
            if (n.tp === 'ent')  atv.set(n.id, ents[ei++] ?? 0);
            else if (n.tp === 'bias') atv.set(n.id, 1);
        }

        const inDeg  = new Map();
        const inAdj  = new Map();
        const outAdj = new Map();

        for (const n of this.nos) {
            outAdj.set(n.id, []);
            if (n.tp !== 'ent' && n.tp !== 'bias') {
                inAdj.set(n.id, []);
                inDeg.set(n.id, 0);
            }
        }

        for (const cx of this.cxs) {
            if (!cx.ativ) continue;
            outAdj.get(cx.orig)?.push(cx);
            if (inAdj.has(cx.dest)) {
                inAdj.get(cx.dest).push(cx);
                const src = idx.get(cx.orig);
                if (src?.tp !== 'ent' && src?.tp !== 'bias') {
                    inDeg.set(cx.dest, inDeg.get(cx.dest) + 1);
                }
            }
        }

        const q = [];
        for (const [id, d] of inDeg) if (d === 0) q.push(id);

        while (q.length) {
            const id = q.shift();
            const n  = idx.get(id);
            let s = 0;
            for (const cx of (inAdj.get(id) ?? [])) {
                s += (atv.get(cx.orig) ?? 0) * cx.w;
            }
            atv.set(id, this._ap(n.fn, s));
            for (const cx of (outAdj.get(id) ?? [])) {
                if (inDeg.has(cx.dest)) {
                    const nd = inDeg.get(cx.dest) - 1;
                    inDeg.set(cx.dest, nd);
                    if (nd === 0) q.push(cx.dest);
                }
            }
        }

        for (const n of this.nos) if (atv.has(n.id)) n.atv = atv.get(n.id);

        return this.nos.filter(n => n.tp === 'said').map(n => atv.get(n.id) ?? 0);
    }

    copiarDaSaida() {
        return this.nos.filter(n => n.tp === 'said').map(n => n.atv);
    }

    salvar() {
        return {
            nos: this.nos.map(n => ({ id: n.id, tp: n.tp, fn: n.fn })),
            cxs: this.cxs.map(c => ({ orig: c.orig, dest: c.dest, w: c.w, ativ: c.ativ, inn: c.inn })),
            fit: this.fit
        };
    }

    static carregar(dados) {
        const g = new Genoma();
        g.nos = dados.nos.map(n => new GNo(n.id, n.tp, n.fn));
        g.cxs = dados.cxs.map(c => {
            const cx = new GCx(c.orig, c.dest, c.w, c.inn);
            cx.ativ = c.ativ;
            return cx;
        });
        g.fit = dados.fit ?? 0;
        return g;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GNo, GCx, Genoma };
}
