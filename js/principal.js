'use strict';
// Loop principal, redimensionamento, ciclo de histórias, teclado e HUD.

const tela = document.getElementById('tela');
const ctx = tela.getContext('2d');
const VELOCIDADE = clamp(parseFloat(Params.get('vel')) || 1, 0.1, 20);
const ZOOM = 1.25;
const FOCO = { x: 505, y: 325 };

let escala = 1, ox = 0, oy = 0, dpr = 1;
let pausado = false;

function redimensionar() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cw = window.innerWidth, ch = window.innerHeight;
  tela.width = Math.round(cw * dpr);
  tela.height = Math.round(ch * dpr);
  escala = Math.min(cw / W, ch / H) * ZOOM;
  ox = cw / 2 - FOCO.x * escala;
  oy = ch / 2 - FOCO.y * escala;
  Vista.x0 = -ox / escala;
  Vista.x1 = (cw - ox) / escala;
  Vista.y0 = -oy / escala;
  Vista.y1 = (ch - oy) / escala;
  Vista.w = Vista.x1 - Vista.x0;
  Vista.h = Vista.y1 - Vista.y0;
}

function atualizar(dt) {
  Relogio.atualizar(dt);
  Cenario.atualizar(dt);
  Casa.atualizar(dt);
  Cachorro.atualizar(dt);
  Motor.atualizar(dt);
  for (const p of PERSONAGENS) p.atualizar(dt);
  Particulas.atualizar(dt);
}

function desenhar() {
  ctx.setTransform(dpr * escala, 0, 0, dpr * escala, dpr * ox, dpr * oy);
  Render.baseInv = ctx.getTransform().inverse();
  Cenario.desenharCeu(ctx);
  Motor.desenharCamada(ctx, -1);
  Cenario.desenharFundo(ctx);
  Cenario.desenharChao(ctx);
  Casa.desenharFundo(ctx);
  Cachorro.desenharNaJanela(ctx);
  Motor.desenharCamada(ctx, 2);
  for (const p of PERSONAGENS) {
    // quem está dentro da piscina não pode aparecer abaixo do fundo dela
    const dentro = p.y > PISCINA.borda && naPiscina(p.x);
    if (dentro) { ctx.save(); ctx.beginPath(); ctx.rect(PISCINA.x0, Vista.y0, PISCINA.x1 - PISCINA.x0, PISCINA.fundo - Vista.y0); ctx.clip(); }
    desenharPersonagem(ctx, p);
    if (dentro) ctx.restore();
  }
  Cachorro.desenhar(ctx);
  Casa.desenharAgua(ctx);
  Motor.desenharCamada(ctx, 3);
  Motor.desenharCamada(ctx, 4);
  Particulas.desenhar(ctx);
  Cenario.desenharClima(ctx);
  Casa.desenharLuzes(ctx);
  Motor.desenharLuzes(ctx);
  balaoOcupado.length = 0;
  for (const p of PERSONAGENS) desenharFala(ctx, p);
}

let ultimo = performance.now();
function quadro(agora) {
  const real = Math.min(0.1, (agora - ultimo) / 1000);
  ultimo = agora;
  if (!pausado) {
    let resto = real * VELOCIDADE;
    while (resto > 0) {
      const passo = Math.min(resto, 1 / 30);
      atualizar(passo);
      resto -= passo;
    }
  }
  desenhar();
  atualizarHUD();
  requestAnimationFrame(quadro);
}

// ------------------------------------------------------------------ ciclo de histórias
const ultimas = [];
let pularOcio = false;
const valor = (v) => (typeof v === 'function' ? v() : v);

function escolherHistoria() {
  const forcada = Params.get('historia');
  if (forcada) {
    const f = HISTORIAS.find((x) => x.id === forcada);
    if (f) return f;
  }
  const per = Relogio.periodo();
  const validas = HISTORIAS.filter((x) => x.saude === Ratao.saude && x.quando.includes(per) && x.pode()).map((x) => ({ x, peso: valor(x.peso) })).filter((c) => c.peso > 0);
  let cands = validas.filter((c) => !ultimas.includes(c.x.id));
  if (!cands.length) cands = validas;
  if (!cands.length) return null;
  return sortearComPeso(cands).x;
}

// devolve tudo a um estado consistente depois de uma história (principalmente se foi abortada)
function arrumarDepois(abortada) {
  for (const p of PERSONAGENS) p.resetar();
  for (const s of SOCORRISTAS) { s.oculto = true; s.x = -300; }
  if (Ratao.saude === 'hospital') Ratao.oculto = true;
  if (Cachorro.controlado || Cachorro.dono) Cachorro.liberar();
  Lavajato.ligado = false;
  Lavajato.dono = null;
  if (!Lavajato.naPiscina) { Lavajato.rot = 0; Lavajato.y = CHAO; }
  if (!Maquina.naPiscina) Maquina.tirarDaPiscina();
  Carro.motorista = null;
  Carro.fumaca = false;
  if (Carro.fogo > 0) { Carro.fogo = 0; Carro.estado = 'queimado'; }
  if (Carro.visivel && Carro.estado === 'ok') { Carro.x = LOCAL.carro; Carro.capo = 0; Carro.rot = 0; }
  if (Casa.muroQueda > 0) { Casa.muro = 0; Casa.muroQueda = 0; Casa.entulho = 1; Casa.muroPintado = false; }
  Casa.tremorMuro = 0;
  Casa.quadroAberto = false;
  if (Casa.cano === 'estourado') Casa.cano = 'fita';
  Casa.registroAberto = true;
  Casa.caixaVaz = 0; Casa.caixaPeca = false; Casa.caixaFita = false;
  if (abortada) { Casa.brasa = 0; Cenario.chuva = 0; Cenario.vento = 0; Cenario.escuro = 0; }
  Casa.salvar();
}

async function ciclo() {
  try { await Motor.esperar(1); } catch (e) { /* ignorado */ }
  for (;;) {
    let abortada = false;
    try {
      if (!pularOcio) await ocioso();
      pularOcio = false;
      const hist = escolherHistoria();
      if (hist) {
        ultimas.push(hist.id);
        if (ultimas.length > 2) ultimas.shift();
        mostrarTitulo(hist.nome);
        await hist.rodar();
      }
    } catch (e) {
      abortada = true;
      if (!(e instanceof Abortado)) { console.error(e); Motor.abortar(); }
    }
    arrumarDepois(abortada);
    try { await Motor.esperar(0.3); } catch (e) { /* ignorado */ }
  }
}

function proximaHistoria() {
  pularOcio = true;
  Motor.abortar();
}

// ------------------------------------------------------------------ HUD
const elHud = document.getElementById('hud');
const elHistoria = document.getElementById('historia');
const elRelogio = document.getElementById('relogio');
const elDias = document.getElementById('dias');
let hudVisivel = true;
let ultimoMovimento = performance.now();
let tituloTimer = null;

function mostrarTitulo(nome) {
  elHistoria.textContent = nome;
  elHistoria.classList.add('visivel');
  clearTimeout(tituloTimer);
  tituloTimer = setTimeout(() => elHistoria.classList.remove('visivel'), 4000);
}

let ultimoTexto = '';
function atualizarHUD() {
  document.body.classList.toggle('ocioso', performance.now() - ultimoMovimento > 3000);
  const hora = Relogio.hora();
  const hh = String(Math.floor(hora)).padStart(2, '0');
  const mm = String(Math.floor((hora % 1) * 60)).padStart(2, '0');
  const txt = `${hh}:${mm}${pausado ? ' · pausado' : ''}`;
  const status = [
    Casa.energia ? 'luz ok' : 'sem luz',
    Casa.muro >= 1 ? 'muro em pé' : 'muro no chão',
    Casa.cano === 'fita' ? 'cano com fita' : 'cano ok',
    Maquina.naPiscina && 'máquina na piscina',
    Carro.visivel ? (Carro.estado === 'queimado' ? 'carro torrado' : 'carro na garagem') : 'sem carro',
    { hospital: 'Ratão no hospital', cadeira: 'Ratão de cadeira de rodas' }[Ratao.saude],
  ].filter(Boolean).join(' · ');
  if (txt + status !== ultimoTexto) {
    ultimoTexto = txt + status;
    elRelogio.textContent = txt;
    elDias.textContent = status;
  }
}

function alternarTelaCheia() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().catch(() => {});
}

window.addEventListener('mousemove', () => { ultimoMovimento = performance.now(); });
window.addEventListener('touchstart', () => { ultimoMovimento = performance.now(); }, { passive: true });
tela.addEventListener('dblclick', alternarTelaCheia);
const elCreditos = document.getElementById('creditos');
document.getElementById('btn-creditos').addEventListener('click', () => elCreditos.showModal());

window.addEventListener('keydown', (e) => {
  ultimoMovimento = performance.now();
  if (elCreditos.open) return;
  switch (e.key.toLowerCase()) {
    case 'n': proximaHistoria(); break;
    case 'f': alternarTelaCheia(); break;
    case 'h': hudVisivel = !hudVisivel; elHud.classList.toggle('escondido', !hudVisivel); break;
    case 'p': case ' ': pausado = !pausado; e.preventDefault(); break;
    case 't': Relogio.avancar(1); break;
  }
});
document.getElementById('btn-proxima').addEventListener('click', proximaHistoria);
document.getElementById('btn-tela').addEventListener('click', alternarTelaCheia);
window.addEventListener('resize', redimensionar);
window.addEventListener('beforeunload', () => Casa.salvar());

// ?avancar=40 simula 40 s de jogo antes de começar (útil para testes/screenshots)
async function avancarRapido(seg) {
  const passo = 1 / 30;
  for (let t = 0; t < seg; t += passo) {
    atualizar(passo);
    desenhar();
    await new Promise((r) => setTimeout(r, 0));
  }
}

(async () => {
  redimensionar();
  Cenario.iniciar();
  Casa.iniciar();
  Casa.carregar();
  ciclo();
  const avancar = parseFloat(Params.get('avancar')) || 0;
  if (avancar > 0) await avancarRapido(avancar);
  requestAnimationFrame((t) => { ultimo = t; quadro(t); });
})();
