class VisualizadorRede {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx    = canvas.getContext('2d');
        this.r      = 12;
    }

    _hRnd(id, salt) {
        const x = Math.sin(id * 127.1 + salt * 311.7) * 43758.5453;
        return x - Math.floor(x);
    }

    _posNos(genoma, area) {
        const ents  = genoma.nos.filter(n => n.tp === 'ent');
        const bias  = genoma.nos.filter(n => n.tp === 'bias');
        const oculs = genoma.nos.filter(n => n.tp === 'ocul');
        const saids = genoma.nos.filter(n => n.tp === 'said');

        const pos = new Map();
        const mg  = this.r * 3;
        const W   = area.width  - 2 * mg;
        const H   = area.height - 2 * mg;
        const xL  = area.x + mg;
        const xR  = area.x + mg + W;

        ents.forEach((n, i) => {
            pos.set(n.id, { x: xL, y: area.y + mg + (i + 1) * H / (ents.length + 1) });
        });

        bias.forEach(n => {
            pos.set(n.id, { x: xL, y: area.y + area.height - mg * 0.8 });
        });

        oculs.forEach(n => {
            const rx = this._hRnd(n.id, 1);
            const ry = this._hRnd(n.id, 2);
            pos.set(n.id, {
                x: xL + W * 0.18 + rx * W * 0.64,
                y: area.y + mg + ry * H
            });
        });

        saids.forEach((n, i) => {
            pos.set(n.id, { x: xR, y: area.y + mg + (i + 1) * H / (saids.length + 1) });
        });

        return pos;
    }

    _desCxs(genoma, pos) {
        const ctx = this.ctx;
        for (const cx of genoma.cxs) {
            const p1 = pos.get(cx.orig);
            const p2 = pos.get(cx.dest);
            if (!p1 || !p2) continue;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            if (!cx.ativ) {
                ctx.strokeStyle = 'rgba(180,180,180,0.18)';
                ctx.setLineDash([4, 4]);
                ctx.lineWidth   = 1;
            } else {
                const al = Math.min(Math.abs(cx.w) * 0.28 + 0.13, 0.80);
                ctx.strokeStyle = `rgba(55,55,55,${al.toFixed(2)})`;
                ctx.setLineDash([]);
                ctx.lineWidth   = Math.max(1, Math.min(Math.abs(cx.w) * 1.8, 4));
            }
            ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
    }

    _desNos(genoma, pos) {
        const ctx = this.ctx;
        const est = {
            ent:  { fill: '#ffffff', stroke: '#555555', lw: 3,   tc: '#333333' },
            bias: { fill: '#ff9900', stroke: '#cc5500', lw: 2.5, tc: '#ffffff' },
            ocul: { fill: '#d8d8d8', stroke: '#222222', lw: 2,   tc: '#222222' },
            said: { fill: '#ffffff', stroke: '#ff7700', lw: 3,   tc: '#333333' }
        };

        for (const n of genoma.nos) {
            const p = pos.get(n.id);
            if (!p) continue;
            const e = est[n.tp] ?? { fill: '#aaa', stroke: '#333', lw: 1, tc: '#333' };

            ctx.beginPath();
            ctx.arc(p.x, p.y, this.r, 0, 2 * Math.PI);
            ctx.fillStyle = e.fill;
            ctx.fill();
            ctx.strokeStyle = e.stroke;
            ctx.lineWidth   = e.lw;
            ctx.stroke();

            ctx.font         = '9px Arial';
            ctx.fillStyle    = e.tc;
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(n.atv.toFixed(1), p.x, p.y);
        }
    }

    _desInfo(genoma, area) {
        const ctx = this.ctx;
        const atv = genoma.cxs.filter(c => c.ativ).length;
        const fit = typeof genoma.fit === 'number' ? genoma.fit.toFixed(0) : genoma.fit;
        const inf = [
            `Nos: ${genoma.nos.length}`,
            `Cx: ${atv}/${genoma.cxs.length}`,
            `Fit: ${fit}`,
            `Esp: ${genoma.espId}`
        ];
        ctx.font         = '11px Arial';
        ctx.fillStyle    = '#444';
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'alphabetic';
        inf.forEach((t, i) => ctx.fillText(t, area.x + i * 70, area.y + area.height + 18));
    }

    desenharGenoma(genoma, area = null) {
        if (!area) area = { x: 20, y: 20, width: this.canvas.width - 40, height: this.canvas.height - 80 };
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const pos = this._posNos(genoma, area);
        this._desCxs(genoma, pos);
        this._desNos(genoma, pos);
        this._desInfo(genoma, area);
    }

    atualizar(genoma, ents) {
        genoma.calcSaida(ents);
        this.desenharGenoma(genoma);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VisualizadorRede };
}
