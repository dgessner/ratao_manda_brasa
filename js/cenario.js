'use strict';
// Cenário: relógio, céu (sol, lua, estrelas, nuvens), morros e vizinhança ao fundo e o gramado.

const W = 960, H = 540;
const HORIZONTE = 300;
const CHAO = 440;
const chaoY = () => CHAO;

// Posições fixas do terreno
const LOCAL = {
  carro: 205, casaX0: 150, casaX1: 460, garagem: 206, quadro: 271, porta: 315, tomada: 345,
  cano: 455, registro: 440, churrasqueira: 487, piscinaX0: 545, piscinaX1: 770,
  espreguicadeira: 815, lavajato: 865, muroX0: 760,
};

const Vista = { x0: 0, y0: 0, x1: W, y1: H, w: W, h: H };

// ------------------------------------------------------------------ Relógio
const Relogio = {
  offset: 0,
  alvo: 0,
  horaFixa: Params.has('hora') ? parseFloat(Params.get('hora')) : null,
  dataFixa: Params.get('data'),

  data() {
    if (this.dataFixa) {
      const [a, m, d] = this.dataFixa.split('-').map(Number);
      if (a && m && d) return new Date(a, m - 1, d, 12);
    }
    return new Date();
  },
  hora() {
    let h;
    if (this.horaFixa != null && !isNaN(this.horaFixa)) h = this.horaFixa;
    else { const d = new Date(); h = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600; }
    return (((h + this.offset) % 24) + 24) % 24;
  },
  avancar(h = 1) { this.alvo += h; },
  atualizar(dt) { this.offset += (this.alvo - this.offset) * Math.min(1, dt * 1.5); },
  periodo() {
    const h = this.hora();
    if (h >= 6.5 && h < 18.3) return 'dia';
    if (h >= 19.3 || h < 5.3) return 'noite';
    return 'crepusculo';
  },
  faseLua() {
    const ref = Date.UTC(2000, 0, 6, 18, 14);
    const dias = (this.data().getTime() - ref) / 86400000;
    return ((dias / 29.530588) % 1 + 1) % 1;
  },
};

// [hora, cor do topo, cor do horizonte, luz]
const CEU = [
  [0, '#070b24', '#1b2350', 0],
  [4.8, '#0a0f2e', '#1f2856', 0],
  [5.6, '#2a2f66', '#b86a7a', 0.25],
  [6.5, '#4f7fc4', '#ffc08a', 0.7],
  [8, '#3d8ee0', '#aee0f7', 1],
  [16.5, '#3a88dc', '#bfe6f7', 1],
  [17.7, '#4a6cc0', '#ffcf8a', 0.8],
  [18.5, '#3b3a7a', '#ff7a52', 0.5],
  [19.3, '#1a1d4a', '#6a3f6e', 0.2],
  [20.3, '#070b24', '#1b2350', 0],
  [24, '#070b24', '#1b2350', 0],
];

const Cenario = {
  t: 0,
  hora: 12,
  luz: 1,
  topo: [60, 140, 220],
  base: [170, 220, 245],
  chuva: 0,
  escuro: 0,
  vento: 0,
  flash: 0,
  estrelas: [],
  nuvens: [],
  gotas: [],
  pedrinhas: [],
  arvores: [],
  casinhas: [],

  iniciar() {
    for (let i = 0; i < 170; i++) {
      this.estrelas.push({ x: rand(-400, W + 400), y: 60 + Math.pow(Math.random(), 1.3) * (HORIZONTE - 90), tam: rand(0.7, 2), fase: rand(0, TAU), vel: rand(1, 3) });
    }
    for (let i = 0; i < 7; i++) this.nuvens.push(this.novaNuvem(rand(-200, W + 200)));
    for (let i = 0; i < 300; i++) this.gotas.push({ x: rand(-300, W + 300), y: rand(-50, H), v: rand(420, 560) });
    for (let i = 0; i < 140; i++) {
      this.pedrinhas.push({ x: rand(-300, W + 300), y: CHAO + Math.pow(Math.random(), 1.5) * 120, r: rand(0.6, 2), c: pick(['#9c7650', '#7e5d3d', '#c19a6b', '#8a8a80']) });
    }
    for (let i = 0; i < 9; i++) this.arvores.push({ x: rand(-250, W + 250), y: HORIZONTE + rand(8, 55), r: rand(8, 16) });
    this.arvores.sort((a, b) => a.y - b.y);
    for (let i = 0; i < 7; i++) this.casinhas.push({ x: rand(-200, W + 200), y: HORIZONTE - rand(2, 14), w: rand(10, 18), c: pick(['#e9e2cf', '#f2c9a0', '#cfe0f2', '#f6e3a1']) });
  },

  novaNuvem(x) {
    const s = rand(0.5, 1.3);
    const bolas = [];
    const n = randInt(4, 7);
    for (let i = 0; i < n; i++) bolas.push({ dx: (i - n / 2) * 16 + rand(-5, 5), dy: -Math.sin((i / (n - 1)) * Math.PI) * rand(8, 18), r: rand(13, 22) });
    return { x, y: rand(110, 230), s, v: rand(3, 9), bolas };
  },

  atualizar(dt) {
    this.t += dt;
    this.hora = Relogio.hora();
    let i = 0;
    while (i < CEU.length - 2 && this.hora >= CEU[i + 1][0]) i++;
    const a = CEU[i], b = CEU[i + 1];
    const k = (this.hora - a[0]) / (b[0] - a[0]);
    this.topo = misturar(a[1], b[1], k);
    this.base = misturar(a[2], b[2], k);
    this.luz = lerp(a[3], b[3], k);
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2.5);

    for (const n of this.nuvens) {
      n.x += n.v * (1 + this.vento * 4) * dt;
      if (n.x - 140 * n.s > Vista.x1) Object.assign(n, this.novaNuvem(Vista.x0 - 150), { x: Vista.x0 - 150 });
    }
    if (this.chuva > 0) {
      for (const g of this.gotas) {
        g.y += g.v * dt; g.x += (40 + this.vento * 160) * dt;
        if (g.y > H + 30) { g.y = rand(-60, -10); g.x = rand(Vista.x0 - 150, Vista.x1); }
      }
    }
    // poeira e folhas com vento
    if (this.vento > 0.3 && chance(dt * 12 * this.vento)) {
      Particulas.add({ x: Vista.x0 - 10, y: rand(CHAO - 120, CHAO + 20), vx: rand(160, 260) * this.vento, vy: rand(-20, 20), vida: 5, cor: pick(['#c9a36b', '#6a9a3a', '#b98a5a']), tam: rand(1, 2.2), tipo: 'quadrado', vr: rand(-6, 6) });
    }
  },

  // ---------------------------------------------------------------- céu
  posSol() {
    const p = (this.hora - 5.6) / 13.4;
    if (p < 0 || p > 1) return null;
    return { x: lerp(90, 870, p), y: HORIZONTE + 28 - Math.sin(p * Math.PI) * 190, p };
  },
  posLua() {
    const p = ((this.hora - 18.3 + 24) % 24) / 12.4;
    if (p < 0 || p > 1) return null;
    return { x: lerp(860, 100, p), y: HORIZONTE + 24 - Math.sin(p * Math.PI) * 175, p };
  },

  desenharCeu(ctx) {
    const g = ctx.createLinearGradient(0, Vista.y0, 0, HORIZONTE);
    g.addColorStop(0, rgb(this.topo));
    g.addColorStop(1, rgb(this.base));
    ctx.fillStyle = g;
    ctx.fillRect(Vista.x0, Vista.y0, Vista.w, HORIZONTE - Vista.y0 + 2);

    const noite = 1 - this.luz;
    if (noite > 0.05) {
      for (const e of this.estrelas) {
        if (e.x < Vista.x0 || e.x > Vista.x1) continue;
        const a = noite * (0.6 + 0.4 * Math.sin(this.t * e.vel + e.fase)) * (1 - (e.y / HORIZONTE) * 0.4) * (1 - this.chuva);
        ctx.fillStyle = `rgba(255,255,240,${a})`;
        ctx.fillRect(e.x, e.y, e.tam, e.tam);
      }
    }

    const sol = this.posSol();
    if (sol) {
      const baixo = clamp((sol.y - (HORIZONTE - 120)) / 140, 0, 1);
      const cor = misturar('#fff6c2', '#ff7b3a', baixo);
      const gl = ctx.createRadialGradient(sol.x, sol.y, 5, sol.x, sol.y, 110);
      gl.addColorStop(0, rgb(cor, 0.55 * (1 - this.chuva)));
      gl.addColorStop(1, rgb(cor, 0));
      ctx.fillStyle = gl;
      ctx.fillRect(sol.x - 110, sol.y - 110, 220, 220);
      ctx.fillStyle = rgb(cor, 1 - this.chuva * 0.8);
      elipse(ctx, sol.x, sol.y, 22, 22);
      ctx.fill();
    }

    const lua = this.posLua();
    if (lua) {
      const gl = ctx.createRadialGradient(lua.x, lua.y, 4, lua.x, lua.y, 70);
      gl.addColorStop(0, `rgba(230,235,255,${0.25 * noite})`);
      gl.addColorStop(1, 'rgba(230,235,255,0)');
      ctx.fillStyle = gl;
      ctx.fillRect(lua.x - 70, lua.y - 70, 140, 140);
      this.desenharLua(ctx, lua.x, lua.y, 15, Relogio.faseLua());
    }
    this.desenharNuvens(ctx);
  },

  desenharLua(ctx, x, y, r, fase) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(40,45,80,0.55)';
    elipse(ctx, 0, 0, r, r);
    ctx.fill();
    ctx.scale(-1, 1); // hemisfério sul
    let p = fase;
    if (p >= 0.5) { ctx.scale(-1, 1); p -= 0.5; }
    const k = Math.cos(p * TAU);
    ctx.beginPath();
    ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
    ctx.ellipse(0, 0, Math.max(0.01, Math.abs(k) * r), r, 0, Math.PI / 2, -Math.PI / 2, k > 0);
    ctx.closePath();
    ctx.fillStyle = '#f3f0da';
    ctx.fill();
    ctx.restore();
  },

  corNuvem() {
    let c = misturar('#ffffff', this.base, 0.25);
    const tarde = Math.max(0, 1 - Math.abs(this.hora - 18.3) / 1.2) + Math.max(0, 1 - Math.abs(this.hora - 6) / 1);
    c = misturar(c, '#ffa27a', clamp(tarde, 0, 1) * 0.45);
    c = misturar(c, '#2c3160', (1 - this.luz) * 0.85);
    c = misturar(c, '#6b7280', this.chuva * 0.7);
    return c;
  },

  desenharNuvens(ctx) {
    const c = this.corNuvem();
    const sombra = misturar(c, '#40405a', 0.25);
    const alfa = 0.55 + 0.35 * this.luz + this.chuva * 0.3;
    for (const n of this.nuvens) {
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.scale(n.s, n.s * 0.8);
      ctx.fillStyle = rgb(sombra, alfa);
      for (const b of n.bolas) { elipse(ctx, b.dx, b.dy + 5, b.r, b.r); ctx.fill(); }
      ctx.fillStyle = rgb(c, alfa);
      for (const b of n.bolas) { elipse(ctx, b.dx, b.dy, b.r, b.r * 0.92); ctx.fill(); }
      ctx.restore();
    }
  },

  // ---------------------------------------------------------------- fundo e chão
  escurecer(c, f = 0.75) { return misturar(c, '#10152a', (1 - this.luz) * f); },

  desenharFundo(ctx) {
    // morros distantes
    const morro1 = this.escurecer(misturar(this.base, '#5f8f5a', 0.55), 0.8);
    ctx.fillStyle = rgb(morro1);
    ctx.beginPath();
    ctx.moveTo(Vista.x0, CHAO);
    for (let x = Vista.x0; x <= Vista.x1 + 8; x += 8) ctx.lineTo(x, HORIZONTE - 16 - 12 * Math.sin(x * 0.007 + 1) - 6 * Math.sin(x * 0.019));
    ctx.lineTo(Vista.x1 + 8, CHAO);
    ctx.lineTo(Vista.x0, CHAO);
    ctx.fill();

    for (const c of this.casinhas) {
      if (c.x < Vista.x0 - 20 || c.x > Vista.x1 + 20) continue;
      const y = HORIZONTE - 16 - 12 * Math.sin(c.x * 0.007 + 1) - 6 * Math.sin(c.x * 0.019) + 4;
      ctx.fillStyle = rgb(this.escurecer(c.c, 0.85));
      ctx.fillRect(c.x, y - c.w * 0.6, c.w, c.w * 0.6);
      ctx.fillStyle = rgb(this.escurecer('#b5533c', 0.85));
      ctx.beginPath(); ctx.moveTo(c.x - 2, y - c.w * 0.6); ctx.lineTo(c.x + c.w / 2, y - c.w * 1.05); ctx.lineTo(c.x + c.w + 2, y - c.w * 0.6); ctx.fill();
      if (this.luz < 0.4) { ctx.fillStyle = `rgba(255,214,120,${0.9 * (1 - this.luz)})`; ctx.fillRect(c.x + c.w * 0.35, y - c.w * 0.4, 2.2, 2.2); }
    }

    // campo
    const g = ctx.createLinearGradient(0, HORIZONTE - 20, 0, CHAO);
    g.addColorStop(0, rgb(this.escurecer('#7fae5a')));
    g.addColorStop(1, rgb(this.escurecer('#5d8f3e')));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(Vista.x0, CHAO);
    for (let x = Vista.x0; x <= Vista.x1 + 8; x += 8) ctx.lineTo(x, HORIZONTE + 2 - 8 * Math.sin(x * 0.011 + 2) - 4 * Math.sin(x * 0.03));
    ctx.lineTo(Vista.x1, CHAO);
    ctx.fill();

    // árvores
    for (const a of this.arvores) {
      if (a.x < Vista.x0 - 30 || a.x > Vista.x1 + 30) continue;
      const bal = Math.sin(this.t * 1.5 + a.x) * this.vento * 3;
      ctx.fillStyle = rgb(this.escurecer('#6b4a2b'));
      ctx.fillRect(a.x - 1.5, a.y - a.r * 0.8, 3, a.r * 0.9);
      ctx.fillStyle = rgb(this.escurecer('#3f7a35'));
      elipse(ctx, a.x + bal, a.y - a.r * 1.3, a.r, a.r * 0.9); ctx.fill();
      ctx.fillStyle = rgb(this.escurecer('#4d8f40'));
      elipse(ctx, a.x - a.r * 0.3 + bal, a.y - a.r * 1.5, a.r * 0.55, a.r * 0.5); ctx.fill();
    }
  },

  desenharChao(ctx) {
    // gramado
    const g = ctx.createLinearGradient(0, CHAO - 6, 0, Vista.y1);
    g.addColorStop(0, rgb(this.escurecer('#78b451')));
    g.addColorStop(1, rgb(this.escurecer('#4f8a35')));
    ctx.fillStyle = g;
    ctx.fillRect(Vista.x0, CHAO - 4, Vista.w, Vista.y1 - CHAO + 4);
    // garagem / calçada de concreto
    ctx.fillStyle = rgb(this.escurecer('#b9b6ad'));
    ctx.fillRect(Vista.x0, CHAO - 4, LOCAL.casaX0 + 120 - Vista.x0, 16);
    ctx.fillStyle = rgb(this.escurecer('#a19e95'));
    for (let x = Math.floor(Vista.x0 / 40) * 40; x < LOCAL.casaX0 + 120; x += 40) ctx.fillRect(x, CHAO - 4, 1.2, 16);
    // piso da área da piscina
    ctx.fillStyle = rgb(this.escurecer('#e6dccb'));
    ctx.fillRect(LOCAL.casaX1, CHAO - 4, Vista.x1 - LOCAL.casaX1, 14);
    ctx.fillStyle = rgb(this.escurecer('#cfc4b0'));
    for (let x = LOCAL.casaX1; x < Vista.x1; x += 22) ctx.fillRect(x, CHAO - 4, 1, 14);
    // tufos de grama na frente
    ctx.strokeStyle = rgb(this.escurecer('#3f7a2a'));
    ctx.lineWidth = 1.2;
    for (const p of this.pedrinhas) {
      if (p.x < Vista.x0 || p.x > Vista.x1 || p.y < CHAO + 14) continue;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 1 + Math.sin(this.t * 2 + p.x) * this.vento * 2, p.y - 3 - p.r); ctx.stroke();
    }
  },

  // ---------------------------------------------------------------- clima e noite
  desenharClima(ctx) {
    if (this.chuva > 0.01) {
      ctx.fillStyle = `rgba(40,50,70,${0.28 * this.chuva})`;
      ctx.fillRect(Vista.x0, Vista.y0, Vista.w, Vista.h);
      ctx.strokeStyle = `rgba(200,215,235,${0.45 * this.chuva})`;
      ctx.lineWidth = 1;
      const n = Math.floor(this.gotas.length * this.chuva);
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const g = this.gotas[i];
        ctx.moveTo(g.x, g.y);
        ctx.lineTo(g.x - 2 - this.vento * 5, g.y - 11);
      }
      ctx.stroke();
    }
    const noite = (1 - this.luz) * 0.3 + this.escuro * 0.25;
    if (noite > 0.01) {
      const g = ctx.createLinearGradient(0, HORIZONTE - 140, 0, HORIZONTE);
      g.addColorStop(0, `rgba(8,12,42,${noite * 0.25})`);
      g.addColorStop(1, `rgba(8,12,42,${noite})`);
      ctx.fillStyle = g;
      ctx.fillRect(Vista.x0, Vista.y0, Vista.w, Vista.h);
    }
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(235,240,255,${this.flash * 0.7 * (Math.sin(this.flash * 40) > -0.3 ? 1 : 0.3)})`;
      ctx.fillRect(Vista.x0, Vista.y0, Vista.w, Vista.h);
    }
  },
};
