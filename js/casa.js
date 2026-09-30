'use strict';
// A casa do Ratão: 2 andares, piscina, muro, quadro de luz, cano, churrasqueira,
// espreguiçadeira, lava-jato e o carro. O estado (luz, muro, cano, carro...) fica salvo no navegador.

const CHAVE_SAVE = 'ratao_manda_brasa_v1';
const PISCINA = { x0: LOCAL.piscinaX0, x1: LOCAL.piscinaX1, agua: CHAO + 6, fundo: CHAO + 48 };
const NADO = CHAO + 52; // y dos pés de quem está boiando na piscina
const ROOF = { x0: 138, x1: 472, apice: 305, base: CHAO - 180, topo: CHAO - 228 };
const telhadoY = (x) => (x < ROOF.apice
  ? lerp(ROOF.base, ROOF.topo, (x - ROOF.x0) / (ROOF.apice - ROOF.x0))
  : lerp(ROOF.topo, ROOF.base, (x - ROOF.apice) / (ROOF.x1 - ROOF.apice)));
const ANTENA_X = 418;
const naPiscina = (x) => x > PISCINA.x0 && x < PISCINA.x1;

const Casa = {
  t: 0,
  energia: true,
  muro: 1,           // altura do trecho do muro que cai (0..1)
  muroPintado: true,
  muroQueda: 0,      // animação da queda (0..1)
  entulho: 0,        // entulho do muro no chão (0..1)
  tremorMuro: 0,
  cano: 'ok',        // ok | estourado | fita
  registroAberto: true,
  antena: 0,         // inclinação da antena
  sujeira: 0.8,      // sujeira do piso em volta da piscina
  brasa: 0,          // fogo da churrasqueira
  quadroAberto: false,
  faiscaQuadro: 0,
  janelas: [true, false, true, true],
  manchas: [],

  iniciar() {
    for (let i = 0; i < 26; i++) {
      const lado = chance(0.4) ? rand(LOCAL.casaX1 + 50, PISCINA.x0 - 4) : rand(PISCINA.x1 + 4, 900);
      this.manchas.push({ x: lado, y: CHAO - 3 + rand(0, 10), r: rand(3, 8) });
    }
  },

  atualizar(dt) {
    this.t += dt;
    if (this.faiscaQuadro > 0) {
      this.faiscaQuadro -= dt;
      if (chance(dt * 30)) Particulas.faiscas(LOCAL.quadro + rand(-6, 6), CHAO - 68, 3);
    }
    if (this.cano === 'estourado' && this.registroAberto) {
      for (let i = 0; i < 3; i++) {
        Particulas.add({ x: LOCAL.cano + 2, y: CHAO - 76 + rand(-2, 2), vx: rand(90, 170), vy: rand(-110, -40), g: 420, vida: 0.9, cor: pick(['#bfe6ff', '#e8f6ff', '#8fcaf0']), tam: rand(1.2, 2.2) });
      }
    }
    if (this.brasa > 0.05 && chance(dt * 4 * this.brasa)) Particulas.fumaca(LOCAL.churrasqueira, CHAO - 118, 'rgba(120,120,120,0.35)', 3);
    Lavajato.atualizar(dt);
    Carro.atualizar(dt);
  },

  // ---------------------------------------------------------------- persistência
  salvar() {
    const dados = {
      energia: this.energia, muro: this.muro, muroPintado: this.muroPintado, entulho: this.entulho,
      cano: this.cano, antena: this.antena, sujeira: this.sujeira,
      carro: Carro.visivel ? Carro.estado : null, carroCor: Carro.cor, lavajatoNaPiscina: Lavajato.naPiscina,
    };
    try { localStorage.setItem(CHAVE_SAVE, JSON.stringify(dados)); } catch (e) { /* sem armazenamento */ }
  },
  carregar() {
    if (Params.has('novo')) return;
    try {
      const d = JSON.parse(localStorage.getItem(CHAVE_SAVE) || 'null');
      if (!d) return;
      Object.assign(this, { energia: d.energia, muro: d.muro, muroPintado: d.muroPintado, entulho: d.entulho, cano: d.cano, antena: d.antena, sujeira: d.sujeira });
      if (d.carro) { Carro.visivel = true; Carro.estado = d.carro; Carro.cor = d.carroCor || Carro.cor; Carro.x = LOCAL.carro; }
      if (d.lavajatoNaPiscina) Lavajato.cairNaPiscina(true);
    } catch (e) { /* save corrompido */ }
  },

  cor_(c) { return rgb(Cenario.escurecer(c)); },
  janelaAcesa(i) { return this.energia && Cenario.luz < 0.55 && this.janelas[i % this.janelas.length]; },

  // ---------------------------------------------------------------- desenho
  desenharFundo(ctx) {
    this.desenharMuro(ctx);
    this.desenharCasa(ctx);
    this.desenharChurrasqueira(ctx);
    this.desenharPiscinaFundo(ctx);
    this.desenharEspreguicadeira(ctx);
    this.desenharSujeira(ctx);
    if (!Lavajato.naPiscina) Lavajato.desenhar(ctx);
    Carro.desenhar(ctx);
  },

  desenharMuro(ctx) {
    const topo = CHAO - 52, x0 = LOCAL.casaX1, x1 = Vista.x1 + 10;
    // copas das árvores do vizinho
    ctx.fillStyle = this.cor_('#4d8f40');
    for (const [x, r] of [[520, 22], [690, 28], [860, 20]]) { elipse(ctx, x, topo - 10, r, r * 0.8); ctx.fill(); }
    const cor = this.cor_('#e8d8b8'), capa = this.cor_('#cdbb98');
    const xm = LOCAL.muroX0;
    ctx.fillStyle = cor;
    ctx.fillRect(x0, topo, xm - x0, CHAO - topo);
    ctx.fillStyle = capa;
    ctx.fillRect(x0 - 2, topo - 3, xm - x0 + 2, 4);
    // trecho que cai
    const alturaTotal = CHAO - topo;
    ctx.save();
    ctx.translate(xm, CHAO);
    if (this.tremorMuro > 0) ctx.rotate(Math.sin(this.t * 30) * 0.012 * this.tremorMuro);
    const h = alturaTotal * this.muro * (1 - this.muroQueda);
    if (this.muroQueda > 0) {
      ctx.transform(1, 0, -0.5 * this.muroQueda, 1, 0, 0);
    }
    if (h > 0.5) {
      if (this.muroPintado && this.muro >= 1) {
        ctx.fillStyle = this.muroQueda > 0 ? this.cor_('#b8a888') : cor;
        ctx.fillRect(0, -h, x1 - xm, h);
        ctx.fillStyle = capa;
        ctx.fillRect(-2, -h - 3, x1 - xm + 2, 4);
      } else {
        for (let y = 0, f = 0; y < h; y += 7, f++) {
          for (let x = (f % 2) * -8; x < x1 - xm; x += 16) {
            ctx.fillStyle = this.cor_(((x + f) / 16) % 2 ? '#b5532f' : '#a84a2a');
            ctx.fillRect(Math.max(0, x), -Math.min(h, y + 7), 15, Math.min(6.2, h - y));
          }
        }
      }
    }
    ctx.restore();
    if (this.entulho > 0) {
      ctx.save();
      ctx.globalAlpha = this.entulho;
      for (let i = 0; i < 26; i++) {
        const x = xm + 6 + ((i * 37) % 120), y = CHAO - 4 - ((i * 13) % 11);
        ctx.fillStyle = this.cor_(i % 3 ? '#b5532f' : '#d8c8a8');
        ctx.save(); ctx.translate(x, y); ctx.rotate((i % 5) * 0.4); ctx.fillRect(-6, -2.5, 12, 5); ctx.restore();
      }
      ctx.restore();
    }
  },

  desenharCasa(ctx) {
    const x0 = LOCAL.casaX0, x1 = LOCAL.casaX1;
    const c = (x) => this.cor_(x);
    // paredes
    ctx.fillStyle = c('#f2e2c0'); ctx.fillRect(x0, CHAO - 95, x1 - x0, 95);
    ctx.fillStyle = c('#ead3a6'); ctx.fillRect(x0, CHAO - 180, x1 - x0, 80);
    ctx.fillStyle = c('#ffffff'); ctx.fillRect(x0 - 6, CHAO - 101, x1 - x0 + 12, 6);
    // telhado
    ctx.fillStyle = c('#b5533c');
    ctx.beginPath(); ctx.moveTo(ROOF.x0, ROOF.base); ctx.lineTo(ROOF.apice, ROOF.topo); ctx.lineTo(ROOF.x1, ROOF.base); ctx.fill();
    ctx.strokeStyle = c('#8f3e2b'); ctx.lineWidth = 1;
    for (let k = 1; k < 5; k++) {
      const y = lerp(ROOF.base, ROOF.topo, k / 5);
      const xa = lerp(ROOF.x0, ROOF.apice, k / 5), xb = lerp(ROOF.x1, ROOF.apice, k / 5);
      linha(ctx, xa, y, xb, y);
    }
    // caixa d'água
    ctx.fillStyle = c('#2f7fc1'); retArred(ctx, 190, telhadoY(206) - 22, 32, 24, 4); ctx.fill();
    ctx.fillStyle = c('#236199'); ctx.fillRect(188, telhadoY(206) - 24, 36, 4);
    // antena
    const ax = ANTENA_X, ay = telhadoY(ax);
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(this.antena);
    ctx.strokeStyle = c('#8d9096'); ctx.lineWidth = 1.6;
    linha(ctx, 0, 0, 0, -40);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) linha(ctx, -12 + i * 2, -38 + i * 7, 12 - i * 2, -38 + i * 7);
    ctx.restore();
    // garagem
    ctx.fillStyle = c('#b9bcc2'); ctx.fillRect(162, CHAO - 72, 88, 72);
    ctx.fillStyle = c('#9ea2a9');
    for (let y = CHAO - 70; y < CHAO; y += 6) ctx.fillRect(162, y, 88, 1.2);
    // porta
    ctx.fillStyle = c('#7a4a26'); ctx.fillRect(300, CHAO - 64, 30, 64);
    ctx.fillStyle = c('#e0b64a'); elipse(ctx, 325, CHAO - 32, 1.5, 1.5); ctx.fill();
    // arandela
    ctx.fillStyle = c('#444'); ctx.fillRect(339, CHAO - 76, 6, 8);
    ctx.fillStyle = this.energia && Cenario.luz < 0.6 ? '#fff3c4' : c('#e8e2cf');
    elipse(ctx, 342, CHAO - 66, 3, 3.5); ctx.fill();
    // janelas
    const janelas = [[360, CHAO - 78, 70, 38], [175, CHAO - 165, 50, 37], [275, CHAO - 165, 60, 37], [375, CHAO - 165, 60, 37]];
    janelas.forEach(([x, y, w, hh], i) => {
      ctx.fillStyle = c('#ffffff'); ctx.fillRect(x - 3, y - 3, w + 6, hh + 6);
      ctx.fillStyle = this.janelaAcesa(i) ? '#ffd98a' : c('#8fc3df');
      ctx.fillRect(x, y, w, hh);
      if (!this.janelaAcesa(i)) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath(); ctx.moveTo(x + 5, y + hh); ctx.lineTo(x + 14, y); ctx.lineTo(x + 21, y); ctx.lineTo(x + 12, y + hh); ctx.fill();
      }
      ctx.strokeStyle = c('#ffffff'); ctx.lineWidth = 2;
      linha(ctx, x + w / 2, y, x + w / 2, y + hh);
    });
    // quadro de luz
    const qx = LOCAL.quadro;
    ctx.fillStyle = c('#9ea2a9'); ctx.fillRect(qx - 9, CHAO - 80, 18, 24);
    if (this.quadroAberto) {
      ctx.fillStyle = c('#2c2f33'); ctx.fillRect(qx - 7, CHAO - 78, 14, 20);
      ctx.fillStyle = c('#e9e9e9');
      for (let i = 0; i < 4; i++) ctx.fillRect(qx - 5 + i * 3, CHAO - 72, 2, 6);
      ctx.fillStyle = c('#b9bcc2'); ctx.fillRect(qx - 20, CHAO - 80, 11, 24);
    } else {
      ctx.strokeStyle = c('#7d828a'); ctx.lineWidth = 0.8; ctx.strokeRect(qx - 7, CHAO - 78, 14, 20);
      ctx.fillStyle = c('#ffd43b'); ctx.fillRect(qx - 3, CHAO - 76, 6, 2.5);
    }
    // tomada externa
    ctx.fillStyle = c('#f4f4f4'); ctx.fillRect(LOCAL.tomada - 4, CHAO - 34, 8, 9);
    ctx.fillStyle = c('#555'); ctx.fillRect(LOCAL.tomada - 2, CHAO - 31, 1.2, 3); ctx.fillRect(LOCAL.tomada + 1, CHAO - 31, 1.2, 3);
    // cano
    const cx = LOCAL.cano;
    ctx.fillStyle = c('#d9d9d2'); ctx.fillRect(cx - 2.5, CHAO - 180, 5, 172);
    ctx.fillStyle = c('#b8b8b0'); ctx.fillRect(cx - 4, CHAO - 120, 8, 3); ctx.fillRect(cx - 4, CHAO - 40, 8, 3);
    if (this.cano === 'fita') { ctx.fillStyle = c('#aeb3ba'); ctx.fillRect(cx - 4, CHAO - 80, 8, 9); }
    if (this.cano === 'estourado') { ctx.fillStyle = c('#555'); ctx.fillRect(cx + 1, CHAO - 78, 3, 4); }
    // registro e torneira
    ctx.fillStyle = c('#c92a2a'); elipse(ctx, cx, CHAO - 16, 4, 4); ctx.fill();
    ctx.fillStyle = c('#9aa0a8'); ctx.fillRect(cx, CHAO - 30, 7, 3);
  },

  desenharChurrasqueira(ctx) {
    const x = LOCAL.churrasqueira, c = (v) => this.cor_(v);
    ctx.fillStyle = c('#b5532f'); ctx.fillRect(x - 17, CHAO - 58, 34, 58);
    ctx.fillStyle = c('#9c4527'); ctx.fillRect(x - 9, CHAO - 115, 18, 57);
    ctx.fillStyle = c('#7d7d78'); ctx.fillRect(x - 12, CHAO - 119, 24, 5);
    ctx.fillStyle = c('#2a1a14'); ctx.fillRect(x - 13, CHAO - 50, 26, 16);
    ctx.strokeStyle = c('#999'); ctx.lineWidth = 0.8;
    for (let i = 0; i < 6; i++) linha(ctx, x - 12 + i * 5, CHAO - 42, x - 12 + i * 5, CHAO - 36);
    ctx.strokeStyle = c('#8a3a1f'); ctx.lineWidth = 0.6;
    for (let y = CHAO - 52; y < CHAO; y += 6) linha(ctx, x - 17, y, x + 17, y);
  },

  desenharPiscinaFundo(ctx) {
    const { x0, x1, fundo } = PISCINA;
    const c = (v) => this.cor_(v);
    ctx.fillStyle = c('#bfe6f5'); ctx.fillRect(x0, CHAO - 4, x1 - x0, fundo - CHAO + 4);
    ctx.strokeStyle = c('#9fd0e6'); ctx.lineWidth = 0.7;
    for (let x = x0; x < x1; x += 10) linha(ctx, x, CHAO, x, fundo);
    for (let y = CHAO; y < fundo; y += 10) linha(ctx, x0, y, x1, y);
    ctx.fillStyle = c('#f4f4f0');
    ctx.fillRect(x0 - 6, CHAO - 5, 8, 6); ctx.fillRect(x1 - 2, CHAO - 5, 8, 6);
    // escadinha
    ctx.strokeStyle = c('#c8ccd2'); ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(x1 - 14, fundo - 8); ctx.lineTo(x1 - 14, CHAO - 10); ctx.quadraticCurveTo(x1 - 14, CHAO - 16, x1 - 6, CHAO - 14); ctx.lineTo(x1 - 4, CHAO - 4); ctx.stroke();
  },

  desenharAgua(ctx) {
    const { x0, x1, agua, fundo } = PISCINA;
    if (Lavajato.naPiscina) Lavajato.desenhar(ctx);
    const noite = 1 - Cenario.luz;
    const g = ctx.createLinearGradient(0, agua, 0, fundo);
    g.addColorStop(0, rgb(Cenario.escurecer('#38b6e0', 0.6), 0.62));
    g.addColorStop(1, rgb(Cenario.escurecer('#1c7fb5', 0.6), 0.75));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x0, fundo);
    for (let x = x0; x <= x1; x += 6) ctx.lineTo(x, agua + Math.sin(x * 0.12 + this.t * 3) * 1.1);
    ctx.lineTo(x1, fundo);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,${0.55 - noite * 0.3})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 6) ctx.lineTo(x, agua + Math.sin(x * 0.12 + this.t * 3) * 1.1);
    ctx.stroke();
    // cáusticas
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    for (let i = 0; i < 8; i++) {
      const x = x0 + ((i * 37 + this.t * 8) % (x1 - x0)), y = agua + 12 + (i % 3) * 9;
      ctx.beginPath(); ctx.arc(x, y, 5, 0.3, 2.4); ctx.stroke();
    }
  },

  desenharEspreguicadeira(ctx) {
    const x = LOCAL.espreguicadeira, c = (v) => this.cor_(v);
    ctx.strokeStyle = c('#8d9096'); ctx.lineWidth = 1.5;
    linha(ctx, x - 24, CHAO - 12, x - 24, CHAO); linha(ctx, x + 26, CHAO - 12, x + 26, CHAO);
    ctx.fillStyle = c('#f4f4f4');
    ctx.fillRect(x - 28, CHAO - 15, 58, 4);
    ctx.save(); ctx.translate(x - 26, CHAO - 13); ctx.rotate(-0.6); ctx.fillRect(-20, -2, 20, 4); ctx.restore();
    ctx.fillStyle = c('#2f7fc1');
    for (let i = 0; i < 5; i++) ctx.fillRect(x - 24 + i * 11, CHAO - 15, 5, 4);
  },

  desenharSujeira(ctx) {
    if (this.sujeira <= 0.02) return;
    for (const m of this.manchas) {
      ctx.fillStyle = `rgba(110,85,50,${0.35 * this.sujeira})`;
      elipse(ctx, m.x, m.y, m.r, m.r * 0.35); ctx.fill();
    }
  },

  desenharLuzes(ctx) {
    const noite = 1 - Cenario.luz;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (this.energia && Cenario.luz < 0.6) {
      const g = ctx.createRadialGradient(342, CHAO - 66, 2, 342, CHAO - 66, 70);
      g.addColorStop(0, `rgba(255,220,150,${0.35 * noite})`); g.addColorStop(1, 'rgba(255,220,150,0)');
      ctx.fillStyle = g; ctx.fillRect(272, CHAO - 136, 140, 140);
      const { x0, x1, agua, fundo } = PISCINA;
      const gp = ctx.createRadialGradient((x0 + x1) / 2, fundo - 10, 5, (x0 + x1) / 2, fundo - 10, 140);
      gp.addColorStop(0, `rgba(90,220,255,${0.4 * noite})`); gp.addColorStop(1, 'rgba(90,220,255,0)');
      ctx.fillStyle = gp; ctx.fillRect(x0, agua - 20, x1 - x0, fundo - agua + 20);
    }
    if (this.brasa > 0.02) {
      const x = LOCAL.churrasqueira, y = CHAO - 42;
      for (const [cor, w, hh] of [['#ff5a1f', 11, 16], ['#ffa41b', 8, 11], ['#ffe066', 4, 6]]) {
        const al = hh * this.brasa * (1 + 0.2 * Math.sin(this.t * 13 + w));
        ctx.fillStyle = cor;
        ctx.beginPath(); ctx.moveTo(x - w, y + 6); ctx.quadraticCurveTo(x - w, y - al * 0.5, x + Math.sin(this.t * 9) * 2, y - al); ctx.quadraticCurveTo(x + w, y - al * 0.5, x + w, y + 6); ctx.fill();
      }
    }
    ctx.restore();
    Carro.desenharLuz(ctx);
  },
};

// ------------------------------------------------------------------ lava-jato
const Lavajato = {
  x: LOCAL.lavajato, y: CHAO, rot: 0, naPiscina: false,
  ligado: false, pressao: 'normal', dono: null, anguloJato: 0.55, t: 0,
  cairNaPiscina(instantaneo) {
    this.naPiscina = true;
    if (instantaneo) { this.x = PISCINA.x1 - 30; this.y = PISCINA.fundo - 2; this.rot = 0.4; }
  },
  tirarDaPiscina() { this.naPiscina = false; this.x = LOCAL.lavajato; this.y = CHAO; this.rot = 0; },
  pontaJato() {
    const d = this.dono;
    if (!d || !d.bico) return null;
    const b = d.bico;
    if (this.pressao === 'fraca') return { x: b.x + d.dir * 3, y: b.y + 14 };
    const ang = this.pressao === 'forte' ? 0.05 + Math.sin(this.t * 7) * 0.35 : this.anguloJato;
    const alc = this.pressao === 'forte' ? 150 : 60;
    return { x: b.x + d.dir * Math.cos(ang) * alc, y: Math.min(CHAO, b.y + Math.sin(ang) * alc) };
  },
  atualizar(dt) {
    this.t += dt;
    if (!this.ligado || !this.dono) return;
    const d = this.dono, b = d.bico, p = this.pontaJato();
    if (!b || !p) return;
    if (this.pressao === 'fraca') {
      if (chance(dt * 6)) Particulas.add({ x: b.x, y: b.y, vy: 10, g: 250, vida: 0.6, cor: '#bfe6ff', tam: 1.4 });
    } else {
      const n = this.pressao === 'forte' ? 4 : 2;
      for (let i = 0; i < n; i++) Particulas.add({ x: p.x + rand(-4, 4), y: p.y, vx: rand(-60, 60) + d.dir * 40, vy: -rand(40, 140), g: 420, vida: 0.5, cor: pick(['#e8f6ff', '#bfe6ff']), tam: rand(1, 2) });
    }
  },
  desenhar(ctx) {
    const c = (v) => rgb(Cenario.escurecer(v));
    // mangueira até a pistola
    if (this.dono && !this.naPiscina) {
      const m = this.dono.mao;
      ctx.strokeStyle = c('#222'); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(this.x - 8, this.y - 8);
      ctx.quadraticCurveTo(this.x - 20, CHAO + 2, (this.x + m.x) / 2, CHAO + 1);
      ctx.quadraticCurveTo(m.x, CHAO, m.x, m.y + 2);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    const vib = this.ligado ? Math.sin(this.t * 50) * 0.5 : 0;
    ctx.translate(vib, 0);
    ctx.fillStyle = c('#f2c318'); retArred(ctx, -10, -20, 20, 16, 3); ctx.fill();
    ctx.fillStyle = c('#2b2b2b'); ctx.fillRect(-10, -9, 20, 3);
    ctx.fillStyle = c('#1c1c1c'); elipse(ctx, -6, -3, 3.5, 3.5); ctx.fill(); elipse(ctx, 6, -3, 3.5, 3.5); ctx.fill();
    ctx.strokeStyle = c('#2b2b2b'); ctx.lineWidth = 1.6; linha(ctx, 8, -20, 12, -30);
    if (!this.dono) { ctx.strokeStyle = c('#222'); ctx.lineWidth = 1.3; elipse(ctx, 0, -14, 6, 4); ctx.stroke(); }
    ctx.restore();
    // jato
    if (this.ligado && this.dono && this.dono.bico) {
      const b = this.dono.bico, p = this.pontaJato();
      if (this.pressao !== 'fraca') {
        ctx.strokeStyle = 'rgba(225,245,255,0.85)';
        ctx.lineWidth = this.pressao === 'forte' ? 3.2 : 1.8;
        ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.quadraticCurveTo((b.x + p.x) / 2, (b.y + p.y) / 2 - 3, p.x, p.y); ctx.stroke();
      }
    }
  },
};

// ------------------------------------------------------------------ o carro da família
const CORES_CARRO = ['#2f7fc1', '#c0392b', '#27ae60', '#e1a318', '#8e44ad', '#16a085'];
const Carro = {
  visivel: false, x: LOCAL.carro, y: CHAO, cor: pick(CORES_CARRO), estado: 'ok',
  capo: 0, fogo: 0, fumaca: false, motorista: null, roda: 0, px: LOCAL.carro, rot: 0, t: 0,
  atualizar(dt) {
    this.t += dt;
    this.roda += (this.x - this.px) / 10;
    this.px = this.x;
    if (!this.visivel) return;
    if (this.fumaca && chance(dt * 8)) Particulas.fumaca(this.x + 42, CHAO - 30, 'rgba(80,80,80,0.55)', 3.5);
    if (this.fogo > 0.1 && chance(dt * 10 * this.fogo)) Particulas.fumaca(this.x + rand(0, 50), CHAO - 50, 'rgba(40,40,40,0.55)', 4);
    if (this.estado === 'queimado' && chance(dt * 1.5)) Particulas.fumaca(this.x + rand(-20, 40), CHAO - 30, 'rgba(90,90,90,0.3)', 2);
  },
  desenhar(ctx) {
    if (!this.visivel) return;
    const queimado = this.estado === 'queimado';
    const c = (v) => rgb(Cenario.escurecer(queimado ? misturar(v, '#1c1c1c', 0.8) : v));
    ctx.save();
    ctx.translate(this.x, CHAO);
    ctx.rotate(this.rot);
    // carroceria
    ctx.fillStyle = c(this.cor);
    ctx.beginPath();
    ctx.moveTo(-58, -12); ctx.lineTo(-58, -26); ctx.lineTo(-40, -28); ctx.lineTo(-28, -46); ctx.lineTo(14, -46);
    ctx.lineTo(28, -28); ctx.lineTo(56, -26); ctx.lineTo(58, -12); ctx.closePath();
    ctx.fill();
    // janelas
    ctx.fillStyle = queimado ? '#222' : c('#a8d8ef');
    ctx.beginPath(); ctx.moveTo(-36, -29); ctx.lineTo(-26, -43); ctx.lineTo(-8, -43); ctx.lineTo(-8, -29); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-4, -29); ctx.lineTo(-4, -43); ctx.lineTo(12, -43); ctx.lineTo(23, -29); ctx.fill();
    // silhueta do motorista
    if (this.motorista && !queimado) {
      ctx.fillStyle = 'rgba(30,30,40,0.7)';
      elipse(ctx, 2, -35, 6, 6.5); ctx.fill();
      if (this.motorista === Ratao) { elipse(ctx, -1, -42, 3.5, 3.5); ctx.fill(); elipse(ctx, 4, -43, 3.5, 3.5); ctx.fill(); elipse(ctx, 9, -34, 3, 2); ctx.fill(); }
      else { ctx.fillStyle = 'rgba(240,240,240,0.8)'; elipse(ctx, -2, -34, 3, 4); ctx.fill(); elipse(ctx, 6, -30, 3.5, 3); ctx.fill(); }
    }
    ctx.strokeStyle = c(misturar(this.cor, '#000', 0.3)); ctx.lineWidth = 1;
    linha(ctx, -6, -28, -6, -12);
    ctx.fillStyle = c('#dcdcdc'); ctx.fillRect(-60, -14, 6, 4); ctx.fillRect(54, -14, 6, 4);
    ctx.fillStyle = queimado ? '#333' : '#fff3b0'; ctx.fillRect(54, -24, 4, 4);
    ctx.fillStyle = c('#c0392b'); ctx.fillRect(-58, -24, 3, 4);
    // capô aberto
    if (this.capo > 0) {
      ctx.save();
      ctx.translate(28, -28);
      ctx.rotate(-this.capo * 1.1);
      ctx.fillStyle = c(misturar(this.cor, '#000', 0.15));
      ctx.fillRect(0, -2, 30, 3);
      ctx.restore();
      ctx.fillStyle = c('#3a3a3a'); ctx.fillRect(30, -28, 24, 3);
    }
    // rodas
    for (const rx of [-36, 36]) {
      ctx.save(); ctx.translate(rx, -9);
      ctx.fillStyle = '#1c1c1c'; elipse(ctx, 0, 0, 10, 10); ctx.fill();
      ctx.fillStyle = c('#b9bcc2'); elipse(ctx, 0, 0, 4.5, 4.5); ctx.fill();
      ctx.rotate(this.roda); ctx.strokeStyle = '#555'; ctx.lineWidth = 1.2; linha(ctx, -4, 0, 4, 0);
      ctx.restore();
    }
    ctx.restore();
  },
  desenharLuz(ctx) {
    if (!this.visivel) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (this.fogo > 0.02) {
      const base = { x: this.x + 40, y: CHAO - 28 };
      const r = 70 * this.fogo;
      const g = ctx.createRadialGradient(base.x, base.y, 2, base.x, base.y, r);
      g.addColorStop(0, `rgba(255,150,50,${0.45 * this.fogo})`); g.addColorStop(1, 'rgba(255,120,40,0)');
      ctx.fillStyle = g; ctx.fillRect(base.x - r, base.y - r, r * 2, r * 2);
      for (let i = 0; i < 5; i++) {
        const fx = base.x - 18 + i * 9, al = (18 + (i % 2) * 10) * this.fogo * (1 + 0.25 * Math.sin(this.t * 14 + i * 2));
        for (const [cor, w, k] of [['#ff5a1f', 6, 1], ['#ffa41b', 4, 0.7], ['#ffe066', 2, 0.4]]) {
          ctx.fillStyle = cor;
          ctx.beginPath(); ctx.moveTo(fx - w, base.y); ctx.quadraticCurveTo(fx - w, base.y - al * k * 0.5, fx + Math.sin(this.t * 9 + i) * 2, base.y - al * k); ctx.quadraticCurveTo(fx + w, base.y - al * k * 0.5, fx + w, base.y); ctx.fill();
        }
      }
    }
    if (this.estado !== 'queimado' && Cenario.luz < 0.5 && this.motorista) {
      const g = ctx.createRadialGradient(this.x + 60, CHAO - 22, 2, this.x + 60, CHAO - 22, 90);
      g.addColorStop(0, 'rgba(255,245,200,0.35)'); g.addColorStop(1, 'rgba(255,245,200,0)');
      ctx.fillStyle = g; ctx.fillRect(this.x + 60, CHAO - 112, 90, 180);
    }
    ctx.restore();
  },
};
