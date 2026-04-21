class NEAT {
    constructor(nEnt, nSaid, tamPop = 150) {
        this.nEnt   = nEnt;
        this.nSaid  = nSaid;
        this.tamPop = tamPop;
        this.pop    = [];
        this.espec  = [];
        this.ger    = 0;
        this._iCtr  = 0;
        this._iMap  = new Map();
        this._nCtr  = 0;
        this._eCtr  = 0;
        this._sMap  = new Map();
        this._C1      = 1.0;
        this._C2      = 1.0;
        this._C3      = 0.4;
        this._dt      = 3.0;
        this._dtMin   = 0.3;
        this._espAlvo = Math.max(4, Math.round(Math.sqrt(tamPop / 8)));
        this._maxEst  = 8;
        this._txMutW  = 0.72;
        this._pPerW   = 0.97;
        this._sdMutW  = 0.3;
        this._txAddCx = 0.06;
        this._txAddNo = 0.03;
        this._txTog   = 0.01;
        this._compFit = true;
        this._nElite  = 6;
        this._pSurv   = 0.25;
        this._pCross  = 0.75;
        this._torK    = 7;
    }

    _inn(orig, dest) {
        const k = `${orig}-${dest}`;
        if (!this._iMap.has(k)) this._iMap.set(k, ++this._iCtr);
        return this._iMap.get(k);
    }

    static _gaussRnd(mu = 0, sd = 1) {
        let u, v;
        do { u = Math.random(); } while (u === 0);
        do { v = Math.random(); } while (v === 0);
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * sd + mu;
    }

    _novoG() {
        const g = new Genoma();
        const bId = ++this._nCtr;
        g.nos.push(new GNo(bId, 'bias', 'lin'));

        const eIds = [];
        for (let i = 0; i < this.nEnt; i++) {
            const id = ++this._nCtr;
            g.nos.push(new GNo(id, 'ent', 'lin'));
            eIds.push(id);
        }

        const sIds = [];
        for (let i = 0; i < this.nSaid; i++) {
            const id = ++this._nCtr;
            g.nos.push(new GNo(id, 'said', 'sig'));
            sIds.push(id);
        }

        for (const src of [bId, ...eIds]) {
            for (const dst of sIds) {
                g.cxs.push(new GCx(src, dst, Math.random() * 4 - 2, this._inn(src, dst)));
            }
        }
        return g;
    }

    inicializar() {
        this._iCtr = 0;
        this._iMap.clear();
        this._nCtr = 0;
        this._eCtr = 0;
        this._sMap.clear();
        this._dt   = 3.0;
        this.pop   = [];
        this.espec = [];
        this.ger   = 0;

        const base = this._novoG();
        for (let i = 0; i < this.tamPop; i++) {
            const g = new Genoma();
            for (const n of base.nos) g.nos.push(new GNo(n.id, n.tp, n.fn));
            for (const cx of base.cxs) {
                const nc = new GCx(cx.orig, cx.dest, Math.random() * 4 - 2, cx.inn);
                g.cxs.push(nc);
            }
            this.pop.push(g);
        }
    }

    _clon(g) {
        const c = new Genoma();
        c.nos    = g.nos.map(n => new GNo(n.id, n.tp, n.fn));
        c.cxs    = g.cxs.map(cx => { const nc = new GCx(cx.orig, cx.dest, cx.w, cx.inn); nc.ativ = cx.ativ; return nc; });
        c.fit    = g.fit;
        c.fitAdj = g.fitAdj;
        c.espId  = g.espId;
        return c;
    }

    _distComp(g1, g2) {
        const m1 = new Map(g1.cxs.map(c => [c.inn, c]));
        const m2 = new Map(g2.cxs.map(c => [c.inn, c]));
        const mx1 = g1.cxs.length ? Math.max(...g1.cxs.map(c => c.inn)) : 0;
        const mx2 = g2.cxs.length ? Math.max(...g2.cxs.map(c => c.inn)) : 0;
        const lim = Math.min(mx1, mx2);

        let match = 0, sumW = 0, disj = 0, exc = 0;
        for (const inn of new Set([...m1.keys(), ...m2.keys()])) {
            if (m1.has(inn) && m2.has(inn)) {
                match++;
                sumW += Math.abs(m1.get(inn).w - m2.get(inn).w);
            } else if (inn <= lim) {
                disj++;
            } else {
                exc++;
            }
        }

        const N = Math.max(g1.cxs.length, g2.cxs.length);
        const n = N < 20 ? 1 : N;
        const W = match > 0 ? sumW / match : 0;
        return this._C1 * exc / n + this._C2 * disj / n + this._C3 * W;
    }

    _especiar() {
        for (const e of this.espec) e.mems = [];

        for (const g of this.pop) {
            let ok = false;
            for (const e of this.espec) {
                if (this._distComp(g, e.rep) < this._dt) {
                    e.mems.push(g);
                    g.espId = e.id;
                    ok = true;
                    break;
                }
            }
            if (!ok) {
                const ne = { id: ++this._eCtr, rep: g, mems: [g], melhorFit: -Infinity, estag: 0 };
                g.espId = ne.id;
                this.espec.push(ne);
            }
        }

        this.espec = this.espec.filter(e => e.mems.length > 0);
        for (const e of this.espec) {
            e.rep = e.mems[Math.floor(Math.random() * e.mems.length)];
        }

        const ratio = this.espec.length / this._espAlvo;
        if      (ratio < 0.5) this._dt = Math.max(this._dtMin, this._dt - 0.05);
        else if (ratio < 0.8) this._dt = Math.max(this._dtMin, this._dt - 0.02);
        else if (ratio > 3.0) this._dt += 0.08;
        else if (ratio > 1.5) this._dt += 0.04;
        else if (ratio > 1.1) this._dt += 0.01;
    }

    _ajFit() {
        for (const e of this.espec) {
            const sz = e.mems.length;
            const dv = this._compFit ? Math.sqrt(sz) : 1;
            let mF = -Infinity;
            for (const g of e.mems) {
                g.fitAdj = g.fit / dv;
                if (g.fit > mF) mF = g.fit;
            }
            if (mF > e.melhorFit) { e.melhorFit = mF; e.estag = 0; }
            else                  { e.estag++; }
        }
    }

    _cross(p1, p2) {
        const f  = new Genoma();
        const vs = new Set();
        for (const n of p1.nos) { vs.add(n.id); f.nos.push(new GNo(n.id, n.tp, n.fn)); }

        const m1  = new Map(p1.cxs.map(c => [c.inn, c]));
        const m2  = new Map(p2.cxs.map(c => [c.inn, c]));
        const all = new Set([...m1.keys(), ...m2.keys()]);

        for (const inn of all) {
            const c1 = m1.get(inn);
            const c2 = m2.get(inn);
            let cx;
            if (c1 && c2) {
                const src = Math.random() < 0.5 ? c1 : c2;
                cx = new GCx(src.orig, src.dest, src.w, src.inn);
                cx.ativ = (!c1.ativ || !c2.ativ) ? Math.random() < 0.25 : true;
            } else if (c1) {
                cx = new GCx(c1.orig, c1.dest, c1.w, c1.inn);
                cx.ativ = c1.ativ;
            } else {
                continue;
            }
            f.cxs.push(cx);
        }
        return f;
    }

    _mutPesos(g) {
        for (const cx of g.cxs) {
            if (Math.random() < this._txMutW) {
                if (Math.random() < this._pPerW) cx.w += NEAT._gaussRnd(0, this._sdMutW);
                else                             cx.w  = Math.random() * 4 - 2;
                cx.w = Math.max(-8, Math.min(8, cx.w));
            }
        }
    }

    _temCiclo(g, orig, dest) {
        const vis = new Set();
        const q   = [dest];
        while (q.length) {
            const id = q.shift();
            if (id === orig) return true;
            if (vis.has(id)) continue;
            vis.add(id);
            for (const cx of g.cxs) {
                if (cx.ativ && cx.orig === id) q.push(cx.dest);
            }
        }
        return false;
    }

    _mutAddCx(g) {
        if (Math.random() > this._txAddCx) return;
        const srcs  = g.nos.filter(n => n.tp !== 'said');
        const dests = g.nos.filter(n => n.tp !== 'ent' && n.tp !== 'bias');
        for (let t = 0; t < 20; t++) {
            const orig = srcs[Math.floor(Math.random() * srcs.length)];
            const dest = dests[Math.floor(Math.random() * dests.length)];
            if (orig.id === dest.id) continue;
            if (g.cxs.find(c => c.orig === orig.id && c.dest === dest.id)) continue;
            if (this._temCiclo(g, orig.id, dest.id)) continue;
            g.cxs.push(new GCx(orig.id, dest.id, Math.random() * 4 - 2, this._inn(orig.id, dest.id)));
            return;
        }
    }

    _mutAddNo(g) {
        if (Math.random() > this._txAddNo) return;
        const atv = g.cxs.filter(c => c.ativ);
        if (!atv.length) return;

        const cx = atv[Math.floor(Math.random() * atv.length)];
        cx.ativ  = false;

        const sk = `s${cx.inn}`;
        if (!this._sMap.has(sk)) this._sMap.set(sk, ++this._nCtr);
        const nid = this._sMap.get(sk);

        if (!g.nos.find(n => n.id === nid)) {
            g.nos.push(new GNo(nid, 'ocul', 'relu'));
        }
        if (!g.cxs.find(c => c.orig === cx.orig && c.dest === nid)) {
            g.cxs.push(new GCx(cx.orig, nid, 1, this._inn(cx.orig, nid)));
        }
        if (!g.cxs.find(c => c.orig === nid && c.dest === cx.dest)) {
            g.cxs.push(new GCx(nid, cx.dest, cx.w, this._inn(nid, cx.dest)));
        }
    }

    _mutToggle(g) {
        if (Math.random() > this._txTog || !g.cxs.length) return;
        const cx = g.cxs[Math.floor(Math.random() * g.cxs.length)];
        cx.ativ  = !cx.ativ;
    }

    _tor(mems, k = this._torK) {
        let best = null;
        for (let i = 0; i < k; i++) {
            const c = mems[Math.floor(Math.random() * mems.length)];
            if (!best || c.fit > best.fit) best = c;
        }
        return best;
    }

    avaliarPopulacao(fn) {
        for (const g of this.pop) g.fit = fn(g);
    }

    evoluir() {
        this._especiar();
        this._ajFit();

        if (this.espec.length > 1) {
            const best = this.espec.reduce((a, b) => a.melhorFit > b.melhorFit ? a : b);
            this.espec = this.espec.filter(e => e.estag < this._maxEst || e === best);
        }

        const viva = this.pop.filter(g => this.espec.some(e => e.id === g.espId));
        const minA = viva.reduce((mn, g) => Math.min(mn, g.fitAdj), Infinity);
        const shft = minA < 0 ? -minA + 1e-6 : 1e-6;
        const totA = viva.reduce((s, g) => s + g.fitAdj + shft, 0) || 1;

        const nova = [];

        for (const e of this.espec) {
            const eAdj = e.mems.reduce((s, g) => s + g.fitAdj + shft, 0);
            let quota = Math.max(1, Math.round((eAdj / totA) * this.tamPop));
            const srt = [...e.mems].sort((a, b) => b.fit - a.fit);

            if (e.mems.length >= 3 && nova.length < this.tamPop) {
                const nEl = Math.min(this._nElite, srt.length);
                for (let ei = 0; ei < nEl && nova.length < this.tamPop; ei++) {
                    nova.push(this._clon(srt[ei]));
                    quota = Math.max(0, quota - 1);
                }
            }

            const surv = srt.slice(0, Math.max(1, Math.floor(srt.length * this._pSurv)));

            for (let i = 0; i < quota && nova.length < this.tamPop; i++) {
                const p1 = this._tor(surv);
                let filho;
                if (surv.length > 1 && Math.random() < this._pCross) {
                    const p2   = this._tor(surv);
                    const [f1, f2] = p1.fit >= p2.fit ? [p1, p2] : [p2, p1];
                    filho = this._cross(f1, f2);
                } else {
                    filho = this._clon(p1);
                }
                this._mutPesos(filho);
                this._mutAddCx(filho);
                this._mutAddNo(filho);
                this._mutToggle(filho);
                filho.espId = e.id;
                nova.push(filho);
            }
        }

        while (nova.length < this.tamPop) {
            const e  = this.espec[Math.floor(Math.random() * this.espec.length)];
            if (!e.mems.length) continue;
            const f  = this._clon(this._tor(e.mems));
            this._mutPesos(f);
            f.espId = e.id;
            nova.push(f);
        }

        this.pop = nova.slice(0, this.tamPop);
        this.ger++;
    }

    getMelhorFitness() {
        return this.pop.reduce((mx, g) => Math.max(mx, g.fit), -Infinity);
    }

    getMelhorGenoma() {
        return this.pop.reduce((best, g) => g.fit > best.fit ? g : best);
    }

    getIndividuo(i) { return this.pop[i]; }

    getEstatisticas() {
        const fits = this.pop.map(g => g.fit);
        return {
            geracao:       this.ger,
            numEspecies:   this.espec.length,
            melhorFitness: Math.max(...fits),
            mediaFitness:  fits.reduce((a, b) => a + b, 0) / fits.length,
            tamPop:        this.pop.length
        };
    }

    salvarMelhor() {
        return this.getMelhorGenoma().salvar();
    }

    carregarGenoma(dados) {
        return Genoma.carregar(dados);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NEAT };
}
