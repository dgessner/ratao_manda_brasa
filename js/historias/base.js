'use strict';
// Base das historinhas: registro, os dois atores (R = Ratão, B = Manda Brasa) e o "à toa".
//
// Para criar uma história nova, chame registrarHistoria({...}) em qualquer arquivo de js/historias/
// (veja o modelo em extras.js) e inclua o <script> no index.html.

const HISTORIAS = [];
const DIA = ['dia', 'crepusculo'];
const NOITE = ['noite', 'crepusculo'];
const SEMPRE = ['dia', 'crepusculo', 'noite'];

function registrarHistoria(def) {
  // saude: em que estado o Ratão precisa estar (ok | hospital | cadeira) para a história ser sorteada
  HISTORIAS.push(Object.assign({ quando: SEMPRE, peso: 1, pode: () => true, saude: 'ok' }, def));
}

// Comandos de roteiro para um personagem
function ator(p) {
  const a = {
    p,
    pose: (nome) => p.setPose(nome),
    virar(d) { p.dir = d; },
    olharPara(alvo) { const x = typeof alvo === 'number' ? alvo : alvo.x; p.dir = x >= p.x ? 1 : -1; },

    async andar(x, vel = 45, pose = 'andar') {
      if (Math.abs(x - p.x) < 1) return;
      p.dir = x > p.x ? 1 : -1;
      p.setPose(pose);
      await Motor.tween(p, { x }, Math.abs(x - p.x) / vel, Ease.linear);
      p.setPose(pose === 'carregarAndando' ? 'carregar' : 'parado');
    },
    correr(x, vel = 115) { return a.andar(x, vel, 'correr'); },
    fugir(x) { return a.andar(x, 125, 'correrApavorado'); },

    async falar(texto, seg) {
      seg = seg ?? clamp(1.3 + texto.length * 0.055, 1.6, 5.5);
      p.fala = { texto, tipo: 'fala', t: 0 };
      await Motor.esperar(seg);
      p.fala = null;
      await Motor.esperar(0.25);
    },
    async pensar(texto, seg) {
      seg = seg ?? clamp(1.5 + texto.length * 0.05, 2, 5.5);
      p.fala = { texto, tipo: 'pensa', t: 0 };
      await Motor.esperar(seg);
      p.fala = null;
      await Motor.esperar(0.25);
    },
    gritar(texto) { p.fala = { texto, tipo: 'fala', t: 0 }; },
    calar() { p.fala = null; },
    exclamar(txt = '!') { Particulas.exclamar(p.cabeca.x, p.cabeca.y - 30, txt); },

    async pular(alt = 18, dur = 0.45) {
      await Motor.tween(p, { offY: -alt }, dur / 2, Ease.out);
      await Motor.tween(p, { offY: 0 }, dur / 2, Ease.in);
    },
    async furia(vezes = 4) {
      p.vermelho = 1;
      p.setPose('furioso');
      for (let i = 0; i < vezes; i++) {
        Particulas.palavrao(p.cabeca.x + rand(-10, 10), p.cabeca.y - 32);
        await a.pular(20, 0.42);
      }
    },
    async dormir(seg) {
      const fim = Motor.tempo + seg;
      while (Motor.tempo < fim) { Particulas.zzz(p.cabeca.x + 4, p.cabeca.y - 14); await Motor.esperar(0.9); }
    },
    // salto em arco até (x, y)
    async arco(x, y, alt = 40, dur = 0.8) {
      const x0 = p.x, y0 = p.y;
      p.soltoDoChao = true;
      const o = { _k: 0, get k() { return this._k; }, set k(v) { this._k = v; p.x = lerp(x0, x, v); p.y = lerp(y0, y, v) - alt * 4 * v * (1 - v); } };
      await Motor.tween(o, { k: 1 }, dur, Ease.linear);
    },
    // cai (ou pula) dentro da piscina
    async cairNaPiscina(x, pose = 'assustado', alt = 35) {
      p.setPose(pose);
      await a.arco(x, PISCINA.agua + 20, alt, 0.7);
      Particulas.respingo(p.x, PISCINA.agua, 26, 1.3);
      Particulas.texto(p.x, PISCINA.agua - 40, pick(['TCHIBUM!', 'SPLASH!']), '#fff', 22);
      p.molhado = 1;
      p.setPose('boiar');
      await Motor.tween(p, { y: NADO }, 0.4, Ease.out);
    },
    async sairDaPiscina(xFinal = PISCINA.x1 + 22) {
      p.soltoDoChao = true;
      p.dir = 1;
      p.setPose('nadar');
      await Motor.tween(p, { x: PISCINA.x1 - 16 }, Math.abs(PISCINA.x1 - 16 - p.x) / 35 + 0.3, Ease.linear);
      p.setPose('escalar');
      await Motor.tween(p, { y: CHAO, x: xFinal }, 1.2, Ease.out);
      p.soltoDoChao = false;
      p.setPose('chacoalhar');
      await Motor.esperar(1);
      p.setPose('parado');
    },
  };
  return a;
}

const R = ator(Ratao);
const B = ator(Brasa);

const h = {
  esperar: (s) => Motor.esperar(s),
  quando: (fn) => Motor.quando(fn),
  tween: (o, p, d, e) => Motor.tween(o, p, d, e),
  add: (e) => Motor.adicionar(e),
  juntos: (...ps) => Promise.all(ps),
  // os dois se encaram
  encarar() { R.olharPara(Brasa); B.olharPara(Ratao); },
};

// ------------------------------------------------------------------ entre uma história e outra
async function ociosoDe(a, min, max) {
  const n = randInt(1, 2);
  for (let i = 0; i < n; i++) {
    switch (pick(['parado', 'andar', 'andar', 'cocar', 'espreguicar', 'olharLonge'])) {
      case 'parado': a.pose('parado'); await h.esperar(rand(1, 2.5)); break;
      case 'andar': await a.andar(rand(min, max)); await h.esperar(rand(0.3, 1)); break;
      case 'cocar': a.pose('cocar'); await h.esperar(1.3); break;
      case 'espreguicar': a.pose('espreguicar'); await h.esperar(1.4); break;
      case 'olharLonge': a.virar(pick([-1, 1])); a.pose('olharLonge'); await h.esperar(1.8); break;
    }
    a.pose('parado');
  }
}

async function ocioso() {
  if (Ratao.saude === 'hospital') { await ociosoDe(B, 280, 530); await ociosoDe(B, 280, 530); return; }
  await h.juntos(ociosoDe(R, 250, 530), ociosoDe(B, 280, 530));
}

function embaralhar(lista) {
  const l = lista.slice();
  for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; }
  return l;
}
