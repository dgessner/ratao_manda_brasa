'use strict';
// Motor de roteiro: todas as esperas e animações andam no tempo do jogo,
// então pausar/acelerar funciona e uma história pode ser abortada a qualquer momento.

class Abortado extends Error {
  constructor() { super('história abortada'); this.name = 'Abortado'; }
}

window.addEventListener('unhandledrejection', (e) => {
  if (e.reason instanceof Abortado) e.preventDefault();
});

class Entidade {
  constructor(props) {
    this.t = 0;
    this.camada = 3;
    this.morto = false;
    this.alfa = 1;
    Object.assign(this, props);
  }
  atualizar(dt) { this.t += dt; }
  desenhar(ctx) {}
  // desenhado depois da sobreposição noturna (luzes, fogo, janelas)
  desenharLuz(ctx) {}
}

const Motor = {
  tempo: 0,
  esperas: [],
  condicoes: [],
  tweens: [],
  entidades: [],

  esperar(seg) {
    return new Promise((res, rej) => this.esperas.push({ ate: this.tempo + seg, res, rej }));
  },

  quando(fn) {
    return new Promise((res, rej) => this.condicoes.push({ fn, res, rej }));
  },

  tween(obj, props, dur, ease = Ease.inOut) {
    return new Promise((res, rej) => {
      const ini = {};
      for (const k in props) ini[k] = obj[k];
      this.tweens.push({ obj, ini, props, dur, t: 0, ease, res, rej });
    });
  },

  adicionar(e, daHistoria = true) {
    e.daHistoria = daHistoria;
    this.entidades.push(e);
    return e;
  },

  atualizar(dt) {
    this.tempo += dt;

    const tws = this.tweens;
    this.tweens = [];
    for (const tw of tws) {
      tw.t += dt;
      const k = tw.dur > 0 ? clamp(tw.t / tw.dur, 0, 1) : 1;
      const e = tw.ease(k);
      for (const p in tw.props) tw.obj[p] = lerp(tw.ini[p], tw.props[p], e);
      if (k >= 1) tw.res(); else this.tweens.push(tw);
    }

    const es = this.esperas;
    this.esperas = [];
    for (const e of es) {
      if (this.tempo >= e.ate) e.res(); else this.esperas.push(e);
    }

    const cs = this.condicoes;
    this.condicoes = [];
    for (const c of cs) {
      let ok = false;
      try { ok = c.fn(); } catch (err) { c.rej(err); continue; }
      if (ok) c.res(); else this.condicoes.push(c);
    }

    for (const e of this.entidades) e.atualizar(dt);
    this.entidades = this.entidades.filter((e) => !e.morto);
  },

  abortar() {
    const err = new Abortado();
    for (const lista of [this.esperas, this.condicoes, this.tweens]) for (const x of lista) x.rej(err);
    this.esperas = [];
    this.condicoes = [];
    this.tweens = [];
    this.entidades = this.entidades.filter((e) => !e.daHistoria);
  },

  desenharCamada(ctx, camada) {
    for (const e of this.entidades) if (e.camada === camada) e.desenhar(ctx);
  },

  desenharLuzes(ctx) {
    for (const e of this.entidades) e.desenharLuz(ctx);
  },
};
