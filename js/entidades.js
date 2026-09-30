'use strict';
// Partículas e entidades temporárias das histórias.
// Camadas: -1 céu, 2 atrás dos personagens, 3 na frente, 4 ar.

// ------------------------------------------------------------------ partículas
const Particulas = {
  lista: [],
  add(p) {
    this.lista.push(Object.assign({ vx: 0, vy: 0, g: 0, vida: 1, t: 0, tam: 3, cor: '#fff', tipo: 'circulo', rot: 0, vr: 0, alfa: 1, cresce: 0 }, p));
  },
  atualizar(dt) {
    for (const p of this.lista) {
      p.t += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.tam += p.cresce * dt;
    }
    this.lista = this.lista.filter((p) => p.t < p.vida);
  },
  desenhar(ctx) {
    for (const p of this.lista) {
      const a = p.alfa * (1 - clamp((p.t - p.vida * 0.6) / (p.vida * 0.4), 0, 1));
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.cor;
      switch (p.tipo) {
        case 'texto':
          ctx.font = `bold ${p.tam}px "Patrick Hand", "Comic Sans MS", cursive`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(30,30,40,0.85)';
          ctx.strokeText(p.texto, 0, 0);
          ctx.fillText(p.texto, 0, 0);
          break;
        case 'quadrado': ctx.fillRect(-p.tam / 2, -p.tam / 2, p.tam, p.tam); break;
        case 'estrela': desenharEstrela(ctx, 0, 0, p.tam); break;
        default: elipse(ctx, 0, 0, p.tam, p.tam); ctx.fill();
      }
      ctx.restore();
    }
  },
  texto(x, y, texto, cor = '#fff', tam = 20, vida = 1.4) { this.add({ x, y, vy: -22, vida, tipo: 'texto', texto, cor, tam }); },
  exclamar(x, y, texto = '!') { this.add({ x, y, vy: -12, vida: 1.1, tipo: 'texto', texto, cor: '#ffe14d', tam: 28 }); },
  zzz(x, y) { this.add({ x, y, vx: rand(10, 18), vy: -rand(14, 22), vida: 2.2, tipo: 'texto', texto: 'z', cor: '#e8f0ff', tam: 12, cresce: 5 }); },
  fumaca(x, y, cor = 'rgba(200,200,200,0.5)', tam = 3) {
    this.add({ x: x + rand(-2, 2), y, vx: rand(-4, 8) + Cenario.vento * 60, vy: -rand(18, 30), vida: rand(1.5, 2.5), tipo: 'fumaca', cor, tam, cresce: 4 });
  },
  poeira(x, y, n = 6) {
    for (let i = 0; i < n; i++) this.add({ x, y, vx: rand(-60, 60), vy: -rand(30, 90), g: 300, vida: 0.7, cor: pick(['#c2945f', '#a67c4d', '#d9b88a']), tam: rand(1, 2), tipo: 'quadrado' });
  },
  faiscas(x, y, n = 12) {
    for (let i = 0; i < n; i++) this.add({ x, y, vx: rand(-120, 120), vy: -rand(40, 160), g: 400, vida: rand(0.3, 0.6), cor: pick(['#fff59d', '#ffd43b', '#9be7ff']), tam: rand(1, 1.8) });
  },
  palavrao(x, y) {
    this.add({ x, y, vx: rand(-15, 15), vy: -30, vida: 1.6, tipo: 'texto', texto: pick(['#@$%&!', '*!#@%!', '$#*@!!', '@#%&!!']), cor: '#ff5a5a', tam: 20 });
  },
  respingo(x, y, n = 14, forca = 1) {
    for (let i = 0; i < n; i++) this.add({ x: x + rand(-8, 8) * forca, y, vx: rand(-60, 60) * forca, vy: -rand(90, 200) * forca, g: 420, vida: rand(0.5, 0.9), cor: pick(['#e8f6ff', '#9fd3ff', '#ffffff']), tam: rand(1.3, 2.8) * forca });
  },
  brilhos(x, y, n = 8) {
    for (let i = 0; i < n; i++) this.add({ x: x + rand(-40, 40), y: y + rand(-30, 10), vy: -rand(10, 30), vida: 1.2, tipo: 'estrela', cor: pick(['#fff3a0', '#ffffff', '#ffd43b']), tam: rand(1.5, 3), vr: rand(-3, 3) });
  },
};

// ------------------------------------------------------------------ escada
class Escada extends Entidade {
  constructor(x, h = 78) { super({ camada: 2, x, h }); }
  desenhar(ctx) {
    const c = rgb(Cenario.escurecer('#9c6b3c'));
    ctx.strokeStyle = c; ctx.lineWidth = 2;
    const topo = CHAO - this.h;
    linha(ctx, this.x, CHAO, this.x - 12, topo);
    linha(ctx, this.x + 12, CHAO, this.x, topo);
    ctx.lineWidth = 1.5;
    for (let y = CHAO - 8; y > topo + 3; y -= 9) {
      const k = (CHAO - y) / this.h;
      linha(ctx, this.x - 12 * k, y, this.x + 12 - 12 * k, y);
    }
  }
}

// ------------------------------------------------------------------ raio (tempestade) e laser
class Raio extends Entidade {
  constructor(x1, y1, x2, y2, tipo = 'raio') {
    super({ camada: 4, x1, y1, x2, y2, tipo, vida: tipo === 'raio' ? 0.35 : 0.25 });
    this.pontos = [];
    const n = tipo === 'raio' ? 12 : 1;
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const j = i > 0 && i < n ? rand(-18, 18) : 0;
      this.pontos.push({ x: lerp(x1, x2, k) + j, y: lerp(y1, y2, k) });
    }
  }
  atualizar(dt) { super.atualizar(dt); if (this.t > this.vida) this.morto = true; }
  desenharLuz(ctx) {
    const a = 1 - this.t / this.vida;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const larguras = this.tipo === 'raio' ? [[7, 'rgba(160,190,255,0.35)'], [2.5, 'rgba(255,255,255,1)']] : [[8, 'rgba(255,60,60,0.4)'], [3, 'rgba(255,220,220,1)']];
    for (const [w, cor] of larguras) {
      ctx.globalAlpha = a;
      ctx.strokeStyle = cor;
      ctx.lineWidth = w;
      ctx.beginPath();
      this.pontos.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ------------------------------------------------------------------ guincho
class Guincho extends Entidade {
  constructor() { super({ camada: 2, roda: 0 }); this.x = Vista.x0 - 140; this.px = this.x; }
  get engate() { return this.x + 70; }
  atualizar(dt) {
    super.atualizar(dt);
    this.roda += (this.x - this.px) / 9;
    this.px = this.x;
    if (chance(dt * 3)) Particulas.fumaca(this.x + 66, CHAO - 12, 'rgba(80,80,80,0.35)', 2.5);
  }
  desenhar(ctx) {
    const c = (v) => rgb(Cenario.escurecer(v));
    ctx.save();
    ctx.translate(this.x, CHAO);
    ctx.fillStyle = c('#2c2f33'); ctx.fillRect(-60, -20, 128, 7);
    ctx.fillStyle = c('#e8e8e8'); ctx.fillRect(-20, -30, 84, 10);
    ctx.strokeStyle = c('#555'); ctx.lineWidth = 2.5; linha(ctx, 10, -30, 60, -52); linha(ctx, 60, -52, 70, -24);
    ctx.fillStyle = c('#f59f00');
    ctx.beginPath(); ctx.moveTo(-62, -16); ctx.lineTo(-62, -44); ctx.lineTo(-46, -54); ctx.lineTo(-22, -54); ctx.lineTo(-22, -16); ctx.fill();
    ctx.fillStyle = c('#a8d8ef'); ctx.fillRect(-56, -48, 20, 12);
    ctx.fillStyle = Math.sin(this.t * 10) > 0 ? '#ff922b' : c('#b35900'); ctx.fillRect(-44, -58, 10, 4);
    for (const rx of [-44, 20, 48]) {
      ctx.save(); ctx.translate(rx, -9);
      ctx.fillStyle = '#1c1c1c'; elipse(ctx, 0, 0, 9, 9); ctx.fill();
      ctx.fillStyle = c('#9a9a92'); elipse(ctx, 0, 0, 4, 4); ctx.fill();
      ctx.rotate(this.roda); ctx.strokeStyle = '#444'; ctx.lineWidth = 1.2; linha(ctx, -3.5, 0, 3.5, 0);
      ctx.restore();
    }
    ctx.restore();
  }
}
