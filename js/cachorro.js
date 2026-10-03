'use strict';
// O cachorro do Ratão: um corgi gordinho que, de vez em quando, passeia pelo cenário
// ou aparece numa das janelas da casa (sorteada a cada vez). As histórias podem assumir o controle dele (Cachorro.controlado).

const Cachorro = {
  x: -200, y: CHAO, dir: 1, pose: 'parado', t: 0, tPose: 0,
  visivel: false, controlado: false, dono: null,   // dono: quem está com ele no colo
  janela: 0,                                          // 0..1, quanto ele aparece na janela
  qualJanela: 0, ladoJanela: 0.3,                     // índice em JANELAS e de que lado do vidro
  fila: [], espera: rand(8, 20),

  setPose(p) { if (this.pose !== p) { this.pose = p; this.tPose = 0; } },

  // ---------------------------------------------------------------- comportamento por conta própria
  atualizar(dt) {
    this.t += dt;
    this.tPose += dt;
    if (this.dono) {
      // no colo: acompanha as mãos de quem segura
      this.x = this.dono.mao.x - this.dono.dir * 4;
      this.y = this.dono.mao.y + 9;
      this.dir = this.dono.dir;
      return;
    }
    if (this.controlado) return;
    if (this.fila.length) { this.executar(dt); return; }
    this.espera -= dt;
    if (this.espera <= 0) this.planejar();
  },

  planejar() {
    this.espera = rand(18, 45);
    if (chance(0.35)) {
      this.qualJanela = randInt(0, JANELAS.length - 1);
      this.ladoJanela = pick([0.27, 0.73]);
      this.fila = [{ tipo: 'janela', t: rand(4, 7) }];
      return;
    }
    // passeio: entra por um lado (ou pela porta), fuça por aí e sai pelo outro
    const daPorta = chance(0.3);
    const ladoEsq = chance(0.5);
    this.x = daPorta ? LOCAL.porta : ladoEsq ? Vista.x0 - 40 : Vista.x1 + 40;
    this.visivel = true;
    const fila = [];
    for (let i = 0, n = randInt(1, 3); i < n; i++) {
      fila.push({ tipo: 'ir', x: rand(180, 880), vel: 38 });
      fila.push({ tipo: 'parar', t: rand(1.5, 4), pose: pick(['parado', 'sentado', 'farejar', 'ofegar']) });
    }
    const correndo = chance(0.3);
    fila.push({ tipo: 'ir', x: chance(0.5) ? Vista.x0 - 60 : Vista.x1 + 60, vel: correndo ? 150 : 40 });
    fila.push({ tipo: 'sumir' });
    this.fila = fila;
  },

  executar(dt) {
    const a = this.fila[0];
    switch (a.tipo) {
      case 'ir': {
        const d = a.x - this.x;
        this.dir = d >= 0 ? 1 : -1;
        this.setPose(a.vel > 90 ? 'correr' : 'andar');
        const passo = a.vel * dt;
        if (Math.abs(d) <= passo) { this.x = a.x; this.fila.shift(); this.setPose('parado'); } else this.x += this.dir * passo;
        break;
      }
      case 'parar':
        this.setPose(a.pose);
        a.t -= dt;
        if (a.t <= 0) this.fila.shift();
        break;
      case 'janela':
        a.t -= dt;
        this.janela = clamp(this.janela + dt * (a.t > 0.6 ? 2.5 : -2.5), 0, 1);
        if (a.t <= 0 && this.janela <= 0) this.fila.shift();
        break;
      case 'sumir':
        this.visivel = false;
        this.fila.shift();
        break;
    }
  },

  // devolve o cachorro ao "modo livre" (fora de cena) depois de uma história
  liberar() {
    this.controlado = false;
    this.dono = null;
    this.fila = [];
    this.janela = 0;
    this.visivel = false;
    this.x = -200;
    this.y = CHAO;
    this.setPose('parado');
    this.espera = rand(10, 30);
  },
  // a história assume o cachorro
  assumir() {
    this.controlado = true;
    this.fila = [];
    this.janela = 0;
    this.dono = null;
  },

  // ---------------------------------------------------------------- desenho
  desenhar(ctx) {
    if (!this.visivel) return;
    const colo = !!this.dono;
    const t = this.tPose;
    const c = (v) => rgb(Cenario.escurecer(v));
    const caramelo = c('#d98a3d'), sela = c('#b8692a'), branco = c('#f6efe4'), brancoT = c('#e2d8c8');
    let bob = 0, incl = 0, pernas = [0, 0, 0, 0], ofega = false, cab = 0;
    switch (colo ? 'colo' : this.pose) {
      case 'andar': {
        const s = Math.sin(t * 12);
        pernas = [s * 0.5, -s * 0.5, -s * 0.5, s * 0.5];
        bob = Math.abs(Math.cos(t * 12)) * 0.8;
        ofega = true;
        break;
      }
      case 'correr': {
        const s = Math.sin(t * 22);
        pernas = [s * 0.9, s * 0.9, -s * 0.9, -s * 0.9];
        bob = Math.abs(Math.cos(t * 22)) * 3;
        incl = s * 0.06;
        ofega = true;
        break;
      }
      case 'sentado': incl = -0.38; ofega = Math.sin(t * 0.7) > -0.3; break;
      case 'farejar': cab = 0.45 + Math.sin(t * 9) * 0.06; break;
      case 'ofegar': ofega = true; bob = Math.sin(t * 14) * 0.4; break;
      case 'colo': pernas = [0.5 + Math.sin(t * 9) * 0.3, 0.6, -0.5 - Math.sin(t * 9) * 0.3, -0.6]; ofega = true; break;
    }
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.dir * 0.95, 0.95);
    if (!colo) {
      ctx.fillStyle = 'rgba(40,40,20,0.2)';
      elipse(ctx, 0, 1, 18, 2.4); ctx.fill();
    }
    ctx.translate(0, -bob);
    // traseira fica no chão quando senta
    if (this.pose === 'sentado' && !colo) { ctx.translate(-12, -6); ctx.rotate(incl); ctx.translate(12, 6); } else ctx.rotate(incl);
    ctx.lineCap = 'round';
    // pernas de trás (do outro lado do corpo)
    const perna = (x, ang, cor) => {
      ctx.strokeStyle = cor; ctx.lineWidth = 4.2;
      linha(ctx, x, -6, x + Math.sin(ang) * 6.5, -6 + Math.cos(ang) * 6.5);
    };
    if (this.pose === 'sentado' && !colo) {
      ctx.fillStyle = brancoT; elipse(ctx, -10, -4, 6, 3); ctx.fill();
    } else {
      perna(-10, pernas[1], brancoT); perna(9, pernas[3], brancoT);
    }
    // corpo
    ctx.fillStyle = caramelo; elipse(ctx, 0, -11, 16, 7.5); ctx.fill();
    ctx.fillStyle = sela; elipse(ctx, -2, -15.5, 10, 3); ctx.fill();
    ctx.fillStyle = branco; elipse(ctx, 2, -6.5, 12, 3.6); ctx.fill();
    // bumbum branco e fofo (corgi não tem rabo)
    ctx.fillStyle = branco; elipse(ctx, -14.5, -11.5, 6, 6.5); ctx.fill();
    ctx.fillStyle = caramelo; elipse(ctx, -12, -15, 4.5, 3); ctx.fill();
    // peito branco
    ctx.fillStyle = branco; elipse(ctx, 12.5, -11, 5.5, 7); ctx.fill();
    // pernas da frente
    if (this.pose === 'sentado' && !colo) { perna(-12, 1.4, branco); perna(10, -0.05, branco); }
    else { perna(-12, pernas[0], branco); perna(11, pernas[2], branco); }
    // cabeça
    ctx.save();
    ctx.translate(15, -19);
    ctx.rotate(cab);
    // orelhas grandes
    for (const [ox, cor] of [[-4.5, sela], [0.5, caramelo]]) {
      ctx.fillStyle = cor;
      ctx.beginPath(); ctx.moveTo(ox - 1.5, -3); ctx.lineTo(ox + 0.5, -13); ctx.lineTo(ox + 4, -3.5); ctx.fill();
      ctx.fillStyle = c('#f1a7a1');
      ctx.beginPath(); ctx.moveTo(ox, -4); ctx.lineTo(ox + 0.8, -10.5); ctx.lineTo(ox + 2.8, -4.2); ctx.fill();
    }
    ctx.fillStyle = caramelo; elipse(ctx, 1.5, -1, 6.8, 6.2); ctx.fill();
    // focinho e listra branca
    ctx.fillStyle = branco;
    elipse(ctx, 6.5, 2, 5, 3.4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(1, -6.5); ctx.lineTo(3.5, -6.5); ctx.lineTo(6, 0); ctx.lineTo(2.5, 0); ctx.fill();
    ctx.fillStyle = '#1b1b1b';
    elipse(ctx, 11, 1, 1.5, 1.2); ctx.fill();
    elipse(ctx, 4.5, -2.5, 1.1, 1.3); ctx.fill();
    ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.arc(8, 3.2, 2.2, 0.2, Math.PI - 0.6); ctx.stroke();
    if (ofega) {
      ctx.fillStyle = c('#e8677a');
      elipse(ctx, 8.2, 6 + Math.sin(this.t * 16) * 0.5, 1.6, 2.6); ctx.fill();
    }
    ctx.restore();
    ctx.restore();
  },

  // a cabeça aparecendo numa janela da casa (desenhada logo depois da casa)
  desenharNaJanela(ctx) {
    if (this.janela <= 0.01) return;
    const [x, y, w, h] = JANELAS[this.qualJanela];
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const sobe = Ease.out(this.janela);
    const cx = x + w * this.ladoJanela, base = y + h + 16 - sobe * 30;
    const c = (v) => rgb(Cenario.escurecer(v));
    ctx.translate(cx, base);
    ctx.rotate(Math.sin(this.t * 2.5) * 0.12);
    ctx.fillStyle = c('#d98a3d'); elipse(ctx, 0, 6, 10, 9); ctx.fill();
    ctx.fillStyle = c('#f6efe4'); elipse(ctx, 0, 9, 6, 7); ctx.fill();
    for (const s of [-1, 1]) {
      ctx.fillStyle = c('#d98a3d');
      ctx.beginPath(); ctx.moveTo(s * 2, -8); ctx.lineTo(s * 8, -24); ctx.lineTo(s * 10, -6); ctx.fill();
      ctx.fillStyle = c('#f1a7a1');
      ctx.beginPath(); ctx.moveTo(s * 4, -8); ctx.lineTo(s * 7.6, -20); ctx.lineTo(s * 8.6, -8); ctx.fill();
    }
    ctx.fillStyle = c('#d98a3d'); elipse(ctx, 0, -6, 9, 8.5); ctx.fill();
    ctx.fillStyle = c('#f6efe4');
    ctx.beginPath(); ctx.moveTo(-1.5, -14); ctx.lineTo(1.5, -14); ctx.lineTo(4, -2); ctx.lineTo(-4, -2); ctx.fill();
    elipse(ctx, 0, 0, 6, 4.5); ctx.fill();
    ctx.fillStyle = '#1b1b1b';
    elipse(ctx, 0, -2, 1.8, 1.3); ctx.fill();
    elipse(ctx, -4, -7, 1.2, 1.4); ctx.fill(); elipse(ctx, 4, -7, 1.2, 1.4); ctx.fill();
    ctx.fillStyle = c('#e8677a'); elipse(ctx, 0, 4 + Math.sin(this.t * 14) * 0.5, 1.8, 2.8); ctx.fill();
    // patinhas no parapeito
    ctx.fillStyle = c('#f6efe4');
    elipse(ctx, -7, 16 - sobe * 2, 3, 2.2); ctx.fill(); elipse(ctx, 7, 16 - sobe * 2, 3, 2.2); ctx.fill();
    ctx.restore();
    // reflexo do vidro e a travessa da janela por cima
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = rgb(Cenario.escurecer('#ffffff')); ctx.lineWidth = 2;
    linha(ctx, x + w / 2, y, x + w / 2, y + h);
  },
};
