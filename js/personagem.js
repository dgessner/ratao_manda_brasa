'use strict';
// Personagens articulados desenhados por código: o Ratão e o pai dele, o Manda Brasa.
// Coordenadas locais: pés em (0,0), olhando para +x. Ângulos: 0 = para baixo, positivo = para a frente.
// No quadro do tronco inclinado o ângulo global é (a - incl).

const Render = { baseInv: new DOMMatrix() };

function paraMundo(ctx, x, y) {
  const m = Render.baseInv.multiply(ctx.getTransform());
  const p = m.transformPoint(new DOMPoint(x, y));
  return { x: p.x, y: p.y };
}

const VISUAL_RATAO = {
  esc: 1.05, barriga: 5, bunda: 5, cabeca: 'rato', barrigaDeFora: true, sapato: 'tenis',
  cores: {
    pele: '#f0c29a', peleT: '#dba47a', peleSombra: '#d19a70', cabelo: '#3b2a1e',
    camisa: '#d64545', camisaT: '#b53434', manga: '#c93d3d',
    calca: '#2f5f9e', calcaT: '#264d80', sapato: '#f4f4f4',
    mascara: '#8e9097', mascaraT: '#6f7178', orelhaIn: '#f3a6b5', focinho: '#f08da0', olho: '#1b1b1b',
  },
};
const VISUAL_BRASA = {
  esc: 1.0, barriga: 8, bunda: 3, cabeca: 'velho', barrigaDeFora: false, sapato: 'chinelo',
  cores: {
    pele: '#eab38c', peleT: '#d49a70', peleSombra: '#c98d65', cabelo: '#f3f3f3', barba: '#ececec',
    camisa: '#7fb3d5', camisaT: '#6597b8', manga: '#76a9ca',
    calca: '#c9b28a', calcaT: '#a8926c', sapato: '#3b3b3b', olho: '#2b1b10', oculos: '#2d2d2d',
  },
};

let C = {};
let RAIOX = false;

class Personagem {
  constructor(nome, visual, x) {
    Object.assign(this, {
      nome, visual, x, y: CHAO, dir: 1,
      pose: 'parado', tPose: rand(0, 3), offY: 0, rot: 0,
      soltoDoChao: false, oculto: false,
      acessorio: null, alcance: 0.5,
      fala: null, tonto: 0, chamuscado: 0, choque: 0, vermelho: 0, molhado: 0,
      mao: { x, y: CHAO - 30 }, cabeca: { x, y: CHAO - 55 },
    });
  }
  setPose(p) { if (this.pose !== p) { this.pose = p; this.tPose = 0; } }
  atualizar(dt) {
    this.tPose += dt;
    if (!this.soltoDoChao) this.y = CHAO + this.offY;
    if (this.fala) this.fala.t += dt;
    if (this.tonto > 0) this.tonto -= dt;
    if (this.choque > 0) {
      this.choque -= dt;
      if (chance(dt * 25)) Particulas.add({ x: this.cabeca.x + rand(-18, 18), y: this.cabeca.y + rand(-10, 45), vx: rand(-40, 40), vy: rand(-40, 40), vida: 0.25, cor: pick(['#fff59d', '#9be7ff']), tam: 1.6 });
    }
    if (this.chamuscado > 0) {
      this.chamuscado = Math.max(0, this.chamuscado - dt / 90);
      if (this.chamuscado > 0.3 && chance(dt * 2)) Particulas.fumaca(this.cabeca.x, this.cabeca.y - 12, 'rgba(90,90,90,0.4)', 2);
    }
    if (this.vermelho > 0) this.vermelho = Math.max(0, this.vermelho - dt / 12);
    if (this.molhado > 0) {
      this.molhado = Math.max(0, this.molhado - dt * 0.05);
      if (chance(this.molhado * dt * 12)) Particulas.add({ x: this.cabeca.x + rand(-9, 9), y: this.cabeca.y + rand(0, 30), vy: 20, g: 300, vida: 0.5, cor: '#9fd3ff', tam: 1.5 });
    }
  }
  resetar() {
    this.setPose('parado');
    this.offY = 0; this.rot = 0;
    this.soltoDoChao = false; this.oculto = false;
    this.acessorio = null;
    this.fala = null; this.tonto = 0; this.choque = 0;
    this.y = CHAO;
  }
}

const Ratao = new Personagem('Ratão', VISUAL_RATAO, 400);
const Brasa = new Personagem('Manda Brasa', VISUAL_BRASA, 520);
const PERSONAGENS = [Brasa, Ratao];

// ------------------------------------------------------------------ poses
function poseBase() {
  return {
    hy: 0, incl: 0, cab: 0,
    pF: [0.08, 0.04], pT: [-0.08, -0.04],
    bF: [0.15, 0.1], bT: [-0.12, -0.06],
    olhos: 'aberto', boca: null, sobr: 0, deitado: false,
  };
}
function sentar(p) { p.hy = 13; p.pF = [1.94, 0.35]; p.pT = [1.8, 0.25]; p.bF = [0.8, 1.3]; p.bT = [0.6, 1.1]; }
function ajoelhar(p) { p.hy = 11; p.pF = [1.57, 0]; p.pT = [0.3, -1.57]; p.incl = 0.25; }
function pernasAndando(p, t, freq = 9) {
  const s = Math.sin(t * freq);
  p.pF = [s * 0.45, s * 0.45 - 0.15 - Math.max(0, -s) * 0.3];
  p.pT = [-s * 0.45, -s * 0.45 - 0.15 - Math.max(0, s) * 0.3];
  p.hy = -Math.abs(Math.cos(t * freq)) * 1.5 + 0.5;
  return s;
}
const G = (p, a) => a + p.incl;

const POSES = {
  parado(p, t) { p.hy = Math.sin(t * 2) * 0.4; p.bF[1] += Math.sin(t * 2) * 0.05; },
  andar(p, t) { const s = pernasAndando(p, t); p.bF = [-s * 0.4, -s * 0.4 + 0.3]; p.bT = [s * 0.4, s * 0.4 + 0.3]; },
  correr(p, t) {
    const s = Math.sin(t * 15);
    p.incl = 0.22;
    p.pF = [s * 0.8 + 0.1, s * 0.8 - 0.5 - Math.max(0, -s) * 0.6];
    p.pT = [-s * 0.8 + 0.1, -s * 0.8 - 0.5 - Math.max(0, s) * 0.6];
    p.bF = [G(p, -s * 0.9), G(p, -s * 0.9 + 1.4)]; p.bT = [G(p, s * 0.9), G(p, s * 0.9 + 1.4)];
    p.hy = -Math.abs(Math.cos(t * 15)) * 3 + 2;
    p.boca = 'o';
  },
  correrApavorado(p, t) { POSES.correr(p, t); p.bF = [2.6 + Math.sin(t * 20) * 0.3, 2.9]; p.bT = [2.5, 2.8 + Math.sin(t * 20) * 0.3]; p.olhos = 'susto'; p.boca = 'aberta'; },
  carregar(p, t) { POSES.parado(p, t); p.bF = [1.2, 1.65]; p.bT = [1.1, 1.55]; },
  carregarAndando(p, t) { pernasAndando(p, t, 8); p.bF = [1.2, 1.65]; p.bT = [1.1, 1.55]; p.incl = -0.05; },
  segurar(p, t) { POSES.parado(p, t); p.bF = [1.2, 1.5]; },
  consertar(p, t, z) {
    POSES.parado(p, t);
    const a = z.alcance, ga = lerp(0.8, 2.6, a), s = Math.sin(t * 10) * 0.18;
    p.incl = lerp(0.4, 0, clamp(a * 2, 0, 1));
    p.bF = [G(p, ga), G(p, ga + 0.3 + s)]; p.bT = [G(p, ga - 0.2), G(p, ga + 0.1 - s)];
    p.cab = lerp(0.25, -0.25, a); p.sobr = 1;
  },
  consertarAgachado(p, t) {
    ajoelhar(p);
    const s = Math.sin(t * 12);
    p.bF = [G(p, 1.1 + s * 0.25), G(p, 1.4 + s * 0.3)]; p.bT = [G(p, 0.9), G(p, 1.3)];
    p.cab = 0.25; p.sobr = 1;
  },
  olharCapo(p, t) { p.incl = 0.55; p.hy = 2; p.bF = [G(p, 0.9), G(p, 1.2)]; p.bT = [G(p, 0.8), G(p, 1.1)]; p.cab = 0.2; p.sobr = 1; },
  jato(p, t, z) {
    p.pF = [0.35, 0.2]; p.pT = [-0.35, -0.3];
    p.bF = [1.35, 1.5]; p.bT = [1.25, 1.45];
    p.incl = -0.05;
  },
  jatoForte(p, t) {
    const s = Math.sin(t * 30) * 0.12;
    p.pF = [0.6, 0.5]; p.pT = [-0.2, -0.1];
    p.incl = -0.35 + s;
    p.bF = [G(p, 1.3 + s), G(p, 1.45 + s)]; p.bT = [G(p, 1.2 - s), G(p, 1.4)];
    p.olhos = 'susto'; p.boca = 'aberta';
  },
  olharBico(p, t) { POSES.parado(p, t); p.bF = [1.0, 2.3]; p.bT = [0.9, 2.1]; p.cab = 0.15; p.sobr = 1; },
  lanterna(p, t) { POSES.parado(p, t); p.bF = [1.4, 1.5]; },
  abanar(p, t) { POSES.parado(p, t); p.bF = [1.2, 1.4 + Math.sin(t * 16) * 0.4]; p.incl = 0.15; },
  extintor(p, t) { p.pF = [0.35, 0.2]; p.pT = [-0.35, -0.3]; p.bF = [1.2, 1.4 + Math.sin(t * 8) * 0.1]; p.bT = [1.0, 1.3]; p.boca = 'aberta'; },
  choque(p, t) {
    const j = Math.sin(t * 60) * 0.15;
    p.bF = [2.2 + j, 2.5 - j]; p.bT = [-2.2 - j, -2.5 + j];
    p.pF = [0.45 + j, 0.4]; p.pT = [-0.45 - j, -0.4];
    p.olhos = 'susto'; p.boca = 'aberta'; p.hy = -2;
  },
  orgulhoso(p, t) { p.incl = -0.1 + Math.sin(t * 1.5) * 0.02; p.bF = [0.9, -0.6]; p.bT = [-0.9, 0.6]; p.olhos = 'feliz'; p.boca = 'sorriso'; },
  maosNaCintura(p, t) { POSES.orgulhoso(p, t); p.olhos = 'bravo'; p.boca = null; p.incl = 0.05; },
  furioso(p, t) {
    const s = Math.sin(t * 18);
    p.incl = s * 0.05;
    p.bF = [2.7, 3.1 + s * 0.4]; p.bT = [2.5, 2.9 - s * 0.4];
    p.olhos = 'bravo'; p.boca = 'aberta';
  },
  apontar(p, t) { POSES.parado(p, t); p.bF = [1.5, 1.6]; p.boca = 'aberta'; },
  acenar(p, t) { POSES.parado(p, t); p.bF = [2.6, 2.6 + Math.sin(t * 12) * 0.5]; p.boca = 'aberta'; p.cab = -0.1; },
  comemorar(p, t) { p.bF = [2.8, 3.0]; p.bT = [2.6, 2.9]; p.boca = 'sorriso'; p.olhos = 'feliz'; p.hy = -Math.abs(Math.sin(t * 8)) * 1.5; },
  rir(p, t) { POSES.parado(p, t); p.incl = 0.15 + Math.abs(Math.sin(t * 10)) * 0.08; p.bF = [G(p, 0.5), G(p, 1.2)]; p.bT = [G(p, 0.4), G(p, 1.1)]; p.olhos = 'feliz'; p.boca = 'aberta'; },
  maoNaTesta(p, t) { POSES.parado(p, t); p.bF = [1.9, 3.5]; p.olhos = 'fechado'; p.cab = 0.15; p.boca = 'triste'; },
  sentado(p, t) { sentar(p); p.hy += Math.sin(t * 2) * 0.3; },
  ler(p, t) { sentar(p); p.bF = [0.9, 2.2]; p.bT = [0.8, 2.1]; p.cab = 0.12; },
  deitado(p, t) {
    p.deitado = true;
    p.pF = [0.03, 0]; p.pT = [0.35, -0.2];
    p.bF = [3.4, 4.8]; p.bT = [3.3, 4.7];
    p.cab = -0.3;
  },
  deitadoLendo(p, t) { POSES.deitado(p, t); p.bF = [2.4, 2.7]; p.bT = [2.3, 2.6]; p.cab = -0.5; },
  dormir(p, t) {
    p.deitado = true; p.olhos = 'fechado';
    p.pF = [0.03, 0]; p.pT = [-0.03, 0];
    p.bF = [0.25, 0.9]; p.bT = [-0.05, 0.1];
    p.boca = Math.sin(t * 1.5) > 0.4 ? 'o' : null;
  },
  dormirSentado(p, t) { sentar(p); p.cab = 0.35 + Math.sin(t * 1.2) * 0.04; p.olhos = 'fechado'; p.incl = 0.1; p.bF = [1.0, 1.5]; },
  pular(p) { p.pF = [0.9, -0.2]; p.pT = [0.6, -0.5]; p.bF = [2.6, 2.9]; p.bT = [2.3, 2.7]; p.hy = 3; p.boca = 'aberta'; },
  bomba(p) { p.hy = 10; p.pF = [2.0, 0.2]; p.pT = [1.9, 0.1]; p.bF = [1.3, 2.4]; p.bT = [1.2, 2.3]; p.incl = 0.2; p.boca = 'aberta'; p.olhos = 'feliz'; },
  agachar(p) { p.hy = 8; p.pF = [1.2, -0.3]; p.pT = [1.0, -0.4]; p.incl = 0.3; p.bF = [G(p, 0.6), G(p, 0.4)]; p.bT = [G(p, 0.4), G(p, 0.3)]; },
  abaixar(p) { p.incl = 0.9; p.hy = 4; p.pF = [0.45, -0.2]; p.pT = [0.2, -0.3]; p.bF = [G(p, 0.35), G(p, 0.25)]; p.bT = [G(p, 0.2), G(p, 0.1)]; },
  pensar(p, t) { POSES.parado(p, t); p.bF = [0.6, 3.0]; p.bT = [0.9, 2.2]; p.cab = -0.15 + Math.sin(t * 0.8) * 0.05; },
  olharLonge(p, t) { POSES.parado(p, t); p.bF = [1.5, 3.4]; p.cab = -0.05; },
  olharCima(p, t) { POSES.parado(p, t); p.cab = -0.5; p.bF = [1.5, 3.4]; },
  martelar(p, t) { POSES.parado(p, t); const s = Math.sin(t * 10); p.bF = [1.9 + s * 0.5, 2.4 + s * 0.9]; p.bT = [1.4, 1.7]; p.cab = -0.2; },
  escalar(p, t) {
    const s = Math.sin(t * 6);
    p.bF = [2.8 + s * 0.25, 3.0]; p.bT = [2.6 - s * 0.25, 2.9];
    p.pF = [0.7 + s * 0.4, -0.2]; p.pT = [0.7 - s * 0.4, -0.2];
    p.cab = -0.2;
  },
  irritado(p, t) { p.incl = 0.08; p.bF = [2.7, 3.1 + Math.sin(t * 14) * 0.35]; p.olhos = 'bravo'; p.boca = 'aberta'; },
  triste(p, t) { p.incl = 0.18; p.cab = 0.3; p.bF = [G(p, 0.05), G(p, 0.02)]; p.bT = [G(p, -0.02), G(p, 0)]; p.boca = 'triste'; p.sobr = -1; },
  assustado(p) { p.bF = [2.4, 2.9]; p.bT = [2.2, 2.7]; p.olhos = 'susto'; p.boca = 'aberta'; p.incl = -0.15; },
  caido(p, t) {
    sentar(p);
    p.incl = -0.7;
    p.pF = [2.3, 1.8]; p.pT = [2.1, 1.5];
    p.bF = [G(p, -0.6), G(p, -0.5)]; p.bT = [G(p, -0.7), G(p, -0.6)];
    p.olhos = 'x'; p.boca = 'o';
  },
  tonto(p, t) {
    POSES.parado(p, t);
    p.incl = Math.sin(t * 4) * 0.12; p.cab = Math.sin(t * 4 + 1) * 0.2;
    p.olhos = 'x'; p.boca = 'o';
    p.bF = [0.3 + Math.sin(t * 4) * 0.2, 0.2]; p.bT = [-0.3, -0.2];
  },
  tossir(p, t) { p.incl = 0.3 + Math.abs(Math.sin(t * 8)) * 0.15; p.bF = [G(p, 0.6), G(p, 2.9)]; p.bT = [G(p, 0.1), G(p, 0.1)]; p.boca = 'o'; p.olhos = 'fechado'; },
  chacoalhar(p, t) {
    p.incl = Math.sin(t * 25) * 0.15; p.cab = Math.sin(t * 25 + 1) * 0.2;
    p.bF = [1.2 + Math.sin(t * 25) * 0.2, 1.3]; p.bT = [1.0, 1.2];
    p.olhos = 'fechado';
  },
  espreguicar(p) { p.bF = [3.0, 3.1]; p.bT = [2.9, 3.05]; p.incl = -0.12; p.olhos = 'fechado'; p.boca = 'aberta'; },
  cocar(p, t) { POSES.parado(p, t); p.bF = [2.6, 4.3 + Math.sin(t * 15) * 0.2]; p.cab = 0.08; p.sobr = 1; },
  mostrar(p, t) { POSES.parado(p, t); p.bF = [2.2, 2.6]; p.olhos = 'feliz'; p.boca = 'sorriso'; },
  selfie(p, t) { POSES.parado(p, t); p.bF = [2.2, 2.2]; p.olhos = 'feliz'; p.boca = 'sorriso'; p.cab = -0.1; },
  nadar(p, t) {
    p.incl = 0.5;
    const s = (t * 5) % TAU;
    p.bF = [s, s + 0.3]; p.bT = [(s + Math.PI) % TAU, (s + Math.PI) % TAU + 0.3];
    p.pF = [-0.2 + Math.sin(t * 8) * 0.3, -0.3]; p.pT = [-0.2 - Math.sin(t * 8) * 0.3, -0.3];
    p.cab = -0.4;
  },
  boiar(p, t) {
    const s = Math.sin(t * 4);
    p.bF = [1.3 + s * 0.4, 1.5 + s * 0.3]; p.bT = [1.1 - s * 0.4, 1.3 - s * 0.3];
    p.pF = [0.2 + s * 0.2, 0]; p.pT = [-0.2 - s * 0.2, 0];
  },
};

// ------------------------------------------------------------------ desenho
function membro(ctx, x, y, ang, l1, l2, w, cor1, cor2) {
  const x1 = x + Math.sin(ang[0]) * l1, y1 = y + Math.cos(ang[0]) * l1;
  const x2 = x1 + Math.sin(ang[1]) * l2, y2 = y1 + Math.cos(ang[1]) * l2;
  ctx.lineWidth = w;
  ctx.strokeStyle = cor2 || cor1;
  linha(ctx, x1, y1, x2, y2);
  ctx.strokeStyle = cor1;
  linha(ctx, x, y, x1, y1);
  if (RAIOX) {
    ctx.strokeStyle = '#f5f5ff'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  return { x1, y1, x2, y2 };
}

function perna(ctx, v, x, y, ang, tras) {
  const pele = tras ? C.peleSombra : C.pele;
  const m = membro(ctx, x, y, ang, 11, 11, 4.8, pele);
  // pé
  if (v.sapato === 'tenis') {
    ctx.fillStyle = C.sapato;
    retArred(ctx, m.x2 - 3.5, m.y2 - 3.2, 9.5, 5, 2.2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(m.x2 - 3.5, m.y2 + 0.8, 9.5, 1);
  } else {
    ctx.fillStyle = pele; elipse(ctx, m.x2 + 2, m.y2 - 0.8, 3.6, 1.8); ctx.fill();
    ctx.fillStyle = C.sapato; ctx.fillRect(m.x2 - 2.5, m.y2 + 0.4, 9, 1.4);
  }
  // bermuda
  ctx.strokeStyle = tras ? C.calcaT : C.calca;
  ctx.lineWidth = 8.5;
  linha(ctx, x, y, lerp(x, m.x1, 0.85), lerp(y, m.y1, 0.85));
}

function braco(ctx, x, y, ang, tras) {
  const pele = tras ? C.peleSombra : C.pele;
  const m = membro(ctx, x, y, ang, 10, 10, 4.5, pele);
  ctx.strokeStyle = tras ? C.camisaT : C.manga;
  ctx.lineWidth = 6.5;
  linha(ctx, x, y, lerp(x, m.x1, 0.45), lerp(y, m.y1, 0.45));
  ctx.fillStyle = pele;
  elipse(ctx, m.x2, m.y2, 2.8, 2.8); ctx.fill();
  return m;
}

function tronco(ctx, v) {
  const b = v.barriga, bu = v.bunda;
  // bunda
  ctx.fillStyle = C.calca;
  elipse(ctx, -5 - bu * 0.35, -2.5, 4 + bu * 0.55, 4 + bu * 0.45); ctx.fill();
  // tronco com barriga
  ctx.fillStyle = C.camisa;
  ctx.beginPath();
  ctx.moveTo(-5.5, -22);
  ctx.lineTo(4, -22);
  ctx.quadraticCurveTo(7.5, -21.5, 7.5, -16);
  ctx.quadraticCurveTo(8 + b * 1.35, -8, 6 + b * 0.2, 0);
  ctx.lineTo(-6.5, 0);
  ctx.quadraticCurveTo(-8, -11, -5.5, -22);
  ctx.fill();
  if (RAIOX) {
    ctx.strokeStyle = '#f5f5ff'; ctx.lineWidth = 1;
    linha(ctx, -1, -21, -1, 0);
    for (let y = -18; y < -6; y += 3.5) linha(ctx, -5, y, 5, y);
    return;
  }
  if (v.barrigaDeFora) {
    ctx.fillStyle = C.pele;
    elipse(ctx, 3.5 + b * 0.45, -2, b * 0.75 + 2, 2.6); ctx.fill();
    ctx.fillStyle = C.peleT;
    elipse(ctx, 5 + b * 0.6, -2, 0.7, 0.6); ctx.fill();
  } else {
    // botões da camisa do Brasa
    ctx.fillStyle = '#f4f4f4';
    for (let y = -18; y < -2; y += 4.5) { elipse(ctx, 6 + b * 0.8 * Math.sin(((y + 22) / 22) * Math.PI), y, 0.7, 0.7); ctx.fill(); }
  }
  ctx.fillStyle = C.calca;
  retArred(ctx, -7.5, -2.5, 14 + b * 0.35, 4.5, 2); ctx.fill();
}

function olho(ctx, x, y, tipo) {
  ctx.fillStyle = C.olho;
  ctx.strokeStyle = C.olho;
  ctx.lineWidth = 1.1;
  switch (tipo) {
    case 'fechado': linha(ctx, x - 1.6, y + 0.3, x + 1.6, y + 0.3); break;
    case 'feliz': ctx.beginPath(); ctx.arc(x, y + 0.8, 1.6, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); break;
    case 'x': linha(ctx, x - 1.4, y - 1.4, x + 1.4, y + 1.4); linha(ctx, x - 1.4, y + 1.4, x + 1.4, y - 1.4); break;
    case 'susto':
      ctx.fillStyle = '#fff'; elipse(ctx, x, y, 2.2, 2.4); ctx.fill();
      ctx.lineWidth = 0.6; ctx.stroke();
      ctx.fillStyle = C.olho; elipse(ctx, x + 0.5, y, 0.9, 0.9); ctx.fill(); break;
    default: elipse(ctx, x, y, 1.2, 1.5); ctx.fill();
  }
}

function boca(ctx, p, x, y) {
  if (p.boca === 'o' || p.boca === 'aberta') {
    ctx.fillStyle = '#3a1a0c';
    elipse(ctx, x, y, 1.5, p.boca === 'aberta' ? 2.3 : 1.4); ctx.fill();
  } else if (p.boca === 'sorriso') {
    ctx.strokeStyle = '#3a1a0c'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x - 0.2, y - 1.4, 2.1, 0.3, Math.PI - 0.6); ctx.stroke();
  } else if (p.boca === 'triste') {
    ctx.strokeStyle = '#3a1a0c'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x - 0.2, y + 1.8, 2, Math.PI + 0.5, TAU - 0.3); ctx.stroke();
  } else {
    ctx.strokeStyle = '#7a3a2a'; ctx.lineWidth = 0.9;
    linha(ctx, x - 1.3, y, x + 1.3, y);
  }
}

function cabecaRato(ctx, p, z) {
  // rosto (queixo aparece embaixo da máscara)
  ctx.fillStyle = C.pele;
  elipse(ctx, 0.5, 0, 7.5, 7.5); ctx.fill();
  boca(ctx, p, 6, 5.6);
  // orelha de trás
  ctx.fillStyle = C.mascaraT;
  elipse(ctx, -3.5, -8.5, 5, 5); ctx.fill();
  // máscara
  ctx.fillStyle = C.mascara;
  ctx.beginPath();
  ctx.moveTo(-7, 2.5);
  ctx.quadraticCurveTo(-8.5, -9, 0, -8.8);
  ctx.quadraticCurveTo(7, -8.5, 9, -2.5);
  ctx.quadraticCurveTo(13.5, -0.5, 14, 1.5);
  ctx.quadraticCurveTo(12.5, 3.8, 8, 3.2);
  ctx.quadraticCurveTo(2, 3.8, -7, 2.5);
  ctx.fill();
  // orelha da frente
  ctx.fillStyle = C.mascara;
  elipse(ctx, 1.5, -10.5, 5.5, 5.5); ctx.fill();
  ctx.fillStyle = C.orelhaIn;
  elipse(ctx, 1.8, -10.5, 3.2, 3.4); ctx.fill();
  if (RAIOX) return;
  // buraco do olho
  ctx.fillStyle = '#e8e8e8';
  elipse(ctx, 5, -2.8, 2.6, 2.4); ctx.fill();
  olho(ctx, 5.2, -2.8, p.olhos);
  const s = p.olhos === 'bravo' ? 1.3 : p.sobr;
  ctx.strokeStyle = C.mascaraT; ctx.lineWidth = 1.3;
  linha(ctx, 3, -5.8 - s * 0.6, 7, -6 + s * 0.9);
  // focinho, dentinhos e bigodes
  ctx.fillStyle = C.focinho;
  elipse(ctx, 14, 1.2, 1.9, 1.7); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(9.8, 3.1, 1.3, 1.9); ctx.fillRect(11.2, 3.1, 1.3, 1.9);
  ctx.strokeStyle = 'rgba(40,40,40,0.7)'; ctx.lineWidth = 0.5;
  for (const [dy, dx] of [[-1.5, 6], [0.5, 7], [2.5, 6]]) linha(ctx, 11, 1.5, 11 + dx, 1.5 + dy * 1.6);
}

function cabecaVelho(ctx, p, z) {
  // cabelo branco nas laterais/nuca (careca em cima)
  ctx.fillStyle = C.cabelo;
  elipse(ctx, -2.8, 0.5, 6.5, 7); ctx.fill();
  ctx.fillStyle = C.pele;
  elipse(ctx, 0.5, 0, 7.5, 7.5); ctx.fill();
  ctx.fillStyle = C.peleT;
  elipse(ctx, -2.8, 0.8, 1.8, 2.5); ctx.fill();
  ctx.fillStyle = C.cabelo;
  elipse(ctx, -4.5, -3, 3, 4); ctx.fill();
  if (z.chamuscado > 0.45) {
    ctx.beginPath();
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      const r = i % 2 ? 8 : 12.5 + Math.sin(z.tPose * 20 + i) * 0.8;
      ctx.lineTo(0.5 + Math.cos(a) * r, -1 + Math.sin(a) * r);
    }
    ctx.fill();
  }
  if (RAIOX) return;
  // barba branca
  ctx.fillStyle = C.barba;
  ctx.beginPath();
  ctx.moveTo(-3.5, 0);
  ctx.quadraticCurveTo(-5, 10, 2.5, 12);
  ctx.quadraticCurveTo(10, 10.5, 9, 3);
  ctx.quadraticCurveTo(5, 4.5, 1, 3);
  ctx.quadraticCurveTo(-1, 1.5, -3.5, 0);
  ctx.fill();
  boca(ctx, p, 6, 5.8);
  // bigode
  ctx.fillStyle = C.barba;
  ctx.beginPath();
  ctx.moveTo(2, 2.8);
  ctx.quadraticCurveTo(6, 0.4, 10.2, 2.6);
  ctx.quadraticCurveTo(10.5, 5.2, 8.3, 4.4);
  ctx.quadraticCurveTo(6, 3.2, 3, 4.8);
  ctx.quadraticCurveTo(1.4, 4.2, 2, 2.8);
  ctx.fill();
  // nariz
  ctx.fillStyle = C.peleT;
  elipse(ctx, 8.2, -0.2, 2.3, 2); ctx.fill();
  olho(ctx, 4.7, -2.6, p.olhos);
  // óculos
  ctx.strokeStyle = C.oculos; ctx.lineWidth = 0.8;
  elipse(ctx, 4.9, -2.5, 2.6, 2.4); ctx.stroke();
  linha(ctx, 2.3, -2.7, -2.2, -2);
  // sobrancelha branca e grossa
  const s = p.olhos === 'bravo' ? 1.3 : p.sobr;
  ctx.strokeStyle = C.cabelo; ctx.lineWidth = 1.8;
  linha(ctx, 2.5, -5.7 - s * 0.6, 6.8, -6 + s * 0.9);
  ctx.fillStyle = z.vermelho > 0.2 ? `rgba(230,40,40,${0.45 * z.vermelho})` : 'rgba(225,100,90,0.3)';
  elipse(ctx, 4.5, 1.2, 2, 1.3); ctx.fill();
}

function desenharCabeca(ctx, p, z) {
  ctx.save();
  ctx.translate(1, -21);
  ctx.rotate(p.cab);
  ctx.translate(0, -8);
  ctx.fillStyle = C.peleT;
  ctx.fillRect(-2.5, 3, 5, 6);
  if (z.visual.cabeca === 'rato') cabecaRato(ctx, p, z); else cabecaVelho(ctx, p, z);
  if (RAIOX) {
    ctx.strokeStyle = '#f5f5ff'; ctx.lineWidth = 1.2;
    elipse(ctx, 0.5, -0.5, 6, 6.5); ctx.stroke();
    ctx.fillStyle = '#f5f5ff';
    elipse(ctx, 4.5, -1.5, 1.6, 1.8); ctx.fill();
    ctx.fillRect(2, 4.5, 6, 1.5);
  }
  ctx.restore();
}

function desenharAcessorio(ctx, z, p, m) {
  const a = z.acessorio;
  if (!a || RAIOX) return;
  ctx.save();
  ctx.translate(m.x2, m.y2);
  ctx.lineCap = 'round';
  switch (a) {
    case 'chave':
      ctx.rotate(-0.8);
      ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1.8; linha(ctx, 0, 3, 0, -9);
      ctx.beginPath(); ctx.arc(0, -11, 2.5, 0.6, Math.PI * 2 - 0.6); ctx.stroke();
      break;
    case 'martelo':
      ctx.rotate(-0.6);
      ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 1.6; linha(ctx, 0, 3, 0, -10);
      ctx.fillStyle = '#6d7178'; retArred(ctx, -4, -13, 8, 4, 1); ctx.fill();
      break;
    case 'lanterna':
      ctx.fillStyle = '#333'; retArred(ctx, -2, -2, 9, 4, 1.5); ctx.fill();
      ctx.fillStyle = '#ffe9a8'; ctx.fillRect(7, -2, 1.5, 4);
      z.pontaLanterna = paraMundo(ctx, 8.5, 0);
      break;
    case 'fita':
      ctx.fillStyle = '#b9bec5'; elipse(ctx, 0, 0, 4, 4); ctx.fill();
      ctx.fillStyle = '#7d828a'; elipse(ctx, 0, 0, 1.8, 1.8); ctx.fill();
      break;
    case 'pistola':
      ctx.fillStyle = '#2b2b2b'; retArred(ctx, -2, -2.5, 7, 4.5, 1); ctx.fill();
      ctx.fillStyle = '#f1c40f'; ctx.fillRect(-1, 1.5, 2.5, 4);
      ctx.strokeStyle = '#555'; ctx.lineWidth = 1.6; linha(ctx, 5, -0.5, 20, -0.5);
      z.bico = paraMundo(ctx, 21, -0.5);
      break;
    case 'extintor':
      ctx.fillStyle = '#d62828'; retArred(ctx, -3, -3, 7, 13, 2.5); ctx.fill();
      ctx.fillStyle = '#222'; ctx.fillRect(-1, -6, 3, 3);
      ctx.strokeStyle = '#222'; ctx.lineWidth = 1.2; linha(ctx, 1, -5, 9, -7);
      z.bico = paraMundo(ctx, 9, -7);
      break;
    case 'balde':
      ctx.fillStyle = '#3c3f44';
      ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.lineTo(4.5, 10); ctx.lineTo(-4.5, 10); ctx.fill();
      break;
    case 'jornal':
      ctx.rotate(-0.15);
      ctx.fillStyle = '#efeee8'; ctx.fillRect(-2, -12, 13, 15);
      ctx.fillStyle = '#9a9a92';
      for (let i = 0; i < 5; i++) ctx.fillRect(0, -10 + i * 2.8, 9, 1);
      break;
    case 'pegador':
      ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1.2; linha(ctx, 0, 0, 12, -4); linha(ctx, 0, 0, 12, -1);
      break;
    case 'garrafa':
      ctx.fillStyle = '#2f9e44'; retArred(ctx, -2, -8, 4.5, 10, 1.5); ctx.fill(); ctx.fillRect(-0.8, -12, 2, 4);
      break;
    case 'celular':
      ctx.fillStyle = '#222'; retArred(ctx, -1.5, -5, 3.5, 7, 1); ctx.fill();
      ctx.fillStyle = '#6fc3ff'; ctx.fillRect(-0.8, -4, 2, 3.5);
      break;
    case 'refri':
      ctx.fillStyle = '#c92a2a'; retArred(ctx, -2, -6, 4.5, 8, 1); ctx.fill();
      break;
    case 'tijolos':
      for (let i = 0; i < 3; i++) { ctx.fillStyle = '#b5532f'; ctx.fillRect(-6, -4 - i * 4.6, 10, 4.5); }
      break;
    case 'colher':
      ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 1.5; linha(ctx, 0, 0, 0, -4);
      ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.moveTo(-3, -4); ctx.lineTo(3, -4); ctx.lineTo(0, -11); ctx.fill();
      break;
  }
  ctx.restore();
}

function paleta(z) {
  const c = {};
  RAIOX = z.choque > 0 && Math.sin(z.tPose * 38) > 0;
  for (const k in z.visual.cores) {
    let v = z.visual.cores[k];
    if (RAIOX) { c[k] = '#1d2148'; continue; }
    if (z.chamuscado > 0 && k !== 'olho') v = misturar(v, '#2a2420', z.chamuscado * 0.7);
    if (z.vermelho > 0 && k.startsWith('pele')) v = misturar(v, '#e03131', z.vermelho * 0.45);
    c[k] = rgb(v);
  }
  return c;
}

function desenharPersonagem(ctx, z) {
  if (z.oculto) return;
  const v = z.visual;
  const p = poseBase();
  (POSES[z.pose] || POSES.parado)(p, z.tPose, z);
  if (p.olhos === 'aberto' && (z.tPose % 3.7) > 3.58) p.olhos = 'fechado';
  if (z.tonto > 0) p.olhos = 'x';
  if (z.vermelho > 0.5 && p.olhos === 'aberto') p.olhos = 'bravo';
  C = paleta(z);

  ctx.save();
  ctx.translate(z.x, z.y);
  ctx.scale(z.dir * v.esc, v.esc);
  if (z.rot) ctx.rotate(z.rot);
  if (p.deitado) { ctx.translate(0, -5); ctx.rotate(-Math.PI / 2); }
  if (!z.soltoDoChao && !p.deitado) {
    ctx.fillStyle = 'rgba(40,40,20,0.2)';
    elipse(ctx, 0, -z.offY + 1, 13, 2.6); ctx.fill();
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const hy = -22 + p.hy;

  perna(ctx, v, -1, hy, p.pT, true);
  ctx.save(); ctx.translate(0, hy); ctx.rotate(p.incl);
  braco(ctx, -1, -18, p.bT, true);
  ctx.restore();
  perna(ctx, v, 1, hy, p.pF, false);

  ctx.save(); ctx.translate(0, hy); ctx.rotate(p.incl);
  tronco(ctx, v);
  desenharCabeca(ctx, p, z);
  const m = braco(ctx, 1 + v.barriga * 0.1, -18, p.bF, false);
  desenharAcessorio(ctx, z, p, m);
  z.mao = paraMundo(ctx, m.x2, m.y2);
  z.cabeca = paraMundo(ctx, 1.5, -29);
  ctx.restore();
  ctx.restore();
  RAIOX = false;

  if (z.tonto > 0) {
    for (let i = 0; i < 4; i++) {
      const a = z.tPose * 5 + (i * TAU) / 4;
      ctx.fillStyle = i % 2 ? '#ffe066' : '#fff';
      desenharEstrela(ctx, z.cabeca.x + Math.cos(a) * 13, z.cabeca.y - 18 + Math.sin(a) * 4, 3.2);
    }
  }
}

function desenharEstrela(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.fill();
}

// ------------------------------------------------------------------ balões
const FONTE_BALAO = '17px "Patrick Hand", "Comic Sans MS", "Comic Neue", cursive';
const balaoOcupado = [];

function desenharFala(ctx, z) {
  const f = z.fala;
  if (!f || z.oculto) return;
  ctx.font = FONTE_BALAO;
  const linhas = quebrarTexto(ctx, f.texto, 210);
  const lh = 19;
  const larg = Math.max(...linhas.map((l) => ctx.measureText(l).width)) + 22;
  const alt = linhas.length * lh + 12;
  const hx = z.cabeca.x, hy = z.cabeca.y;
  const bx = clamp(hx - larg / 2 + z.dir * 16, Vista.x0 + 8, Vista.x1 - larg - 8);
  let by = Math.max(Vista.y0 + 8, hy - 40 - alt);
  // se colidir com o balão do outro personagem, sobe
  for (const o of balaoOcupado) {
    if (bx < o.x + o.w && bx + larg > o.x && by < o.y + o.h && by + alt > o.y) by = Math.max(Vista.y0 + 8, o.y - alt - 8);
  }
  balaoOcupado.push({ x: bx, y: by, w: larg, h: alt });
  const pensa = f.tipo === 'pensa';
  const aparece = Ease.outBack(clamp(f.t / 0.25, 0, 1));

  ctx.save();
  const cx = bx + larg / 2, cy = by + alt / 2;
  ctx.translate(cx, cy);
  ctx.scale(aparece, aparece);
  ctx.translate(-cx, -cy);
  ctx.fillStyle = 'rgba(255,255,255,0.96)';
  ctx.strokeStyle = '#2d2d2d';
  ctx.lineWidth = 2;
  const ponta = clamp(hx, bx + 16, bx + larg - 16);
  if (pensa) {
    retArred(ctx, bx, by, larg, alt, alt / 2);
    ctx.stroke(); ctx.fill();
    for (const [k, r] of [[0.35, 6], [0.65, 4], [0.9, 2.6]]) {
      const x = lerp(ponta, hx + z.dir * 6, k), y = lerp(by + alt + 4, hy - 16, k);
      elipse(ctx, x, y, r, r); ctx.stroke(); ctx.fill();
    }
  } else {
    retArred(ctx, bx, by, larg, alt, 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ponta - 7, by + alt - 1); ctx.lineTo(lerp(ponta, hx, 0.5), hy - 20); ctx.lineTo(ponta + 7, by + alt - 1);
    ctx.stroke();
    retArred(ctx, bx, by, larg, alt, 10);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(ponta - 6, by + alt - 3); ctx.lineTo(lerp(ponta, hx, 0.5), hy - 21.5); ctx.lineTo(ponta + 6, by + alt - 3);
    ctx.fill();
  }
  let resto = pensa ? Infinity : Math.floor(f.t * 32);
  ctx.fillStyle = '#222';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  linhas.forEach((l, i) => {
    if (resto <= 0) return;
    ctx.fillText(l.slice(0, resto), bx + 11, by + 7 + i * lh);
    resto -= l.length + 1;
  });
  ctx.restore();
}
