'use strict';
// O cachorro do Ratão: o atropelamento, a coluna travada (com ambulância), o hospital,
// a cadeira de rodas e a volta a andar. Ratao.saude decide quais histórias podem ser sorteadas.

// leva o cachorro em linha reta até x (sem esperar, devolve a promessa)
function cachorroAte(x, vel = 40) {
  const C = Cachorro;
  C.dir = x >= C.x ? 1 : -1;
  C.setPose(vel > 90 ? 'correr' : 'andar');
  return h.tween(C, { x }, Math.max(0.05, Math.abs(x - C.x) / vel), Ease.linear).then(() => C.setPose('parado'));
}

// cadeira de rodas vazia (quando o Ratão levanta dela)
class CadeiraVazia extends Entidade {
  constructor(x, dir) { super({ camada: 2, x, dir, rodaCadeira: 0, px: x }); }
  atualizar(dt) { super.atualizar(dt); this.rodaCadeira += (this.x - this.px) / 11; this.px = this.x; }
  desenhar(ctx) {
    ctx.save();
    ctx.translate(this.x, CHAO);
    ctx.scale(this.dir * 1.05, 1.05);
    desenharCadeira(ctx, this);
    ctx.restore();
  }
}

registrarHistoria({
  id: 'atropelado', nome: 'Olha o Cachorro!', peso: 1.5,
  async rodar() {
    await h.juntos(R.andar(400), B.andar(330));
    h.encarar();
    // cada pergunta do pai tem a sua resposta
    const [pergunta, resposta] = pick([
      ['Ratão, você deu comida pro cachorro?', 'Dei, pai! Duas vezes. Ou três...'],
      ['Ratão, esse cachorro não para quieto!', 'Ele tá só gastando energia, pai.'],
    ]);
    await B.falar(pergunta);
    await R.falar(resposta);
    // lá vem ele, a mil por hora
    Cachorro.assumir();
    Cachorro.visivel = true;
    Cachorro.x = Vista.x1 + 40;
    B.olharPara(Cachorro);
    B.exclamar('!');
    await cachorroAte(Ratao.x + 12, 210);
    Particulas.texto(Ratao.x, Ratao.cabeca.y - 30, 'POF!', '#fff', 24);
    Particulas.poeira(Ratao.x, CHAO, 10);
    const fuga = cachorroAte(Vista.x0 - 60, 210);
    R.pose('assustado');
    await h.juntos(R.arco(Ratao.x - 30, CHAO, 26, 0.6), h.tween(Ratao, { rot: -1.4 }, 0.6));
    Ratao.rot = 0;
    Ratao.soltoDoChao = false;
    R.pose('caido');
    Ratao.tonto = 2.5;
    await fuga;
    B.pose('rir');
    await B.falar(pick(['KKKKK! Atropelado pelo cachorro!', 'KKKK! Foi um caminhão de pelo!']), 2);
    await R.falar('Esse cachorro tá precisando de regime...');
    R.pose('parado');
  },
});

registrarHistoria({
  id: 'coluna', nome: 'A Coluna do Ratão', peso: 1.2,
  async rodar() {
    await h.juntos(R.andar(330), B.andar(450));
    // o cachorro sai pela porta e senta
    Cachorro.assumir();
    Cachorro.visivel = true;
    Cachorro.x = LOCAL.porta;
    await cachorroAte(368);
    Cachorro.dir = -1;
    Cachorro.setPose('sentado');
    R.virar(1);
    await R.falar('Vem cá, gordinho! Vem no colo!');
    B.olharPara(Ratao);
    await B.falar('Ratão, esse cachorro pesa mais que você!');
    await R.falar('Que nada, pai! É só pelo!');
    await R.andar(353);
    R.virar(1);
    R.pose('abaixar');
    await h.esperar(0.9);
    Cachorro.dono = Ratao;
    await R.pensar('Upa...', 1.4);
    R.pose('carregar');
    await h.esperar(0.7);
    // CREC
    Particulas.texto(Ratao.x - 6, Ratao.cabeca.y - 6, 'CREC!', '#ffe14d', 26);
    R.pose('travado');
    Ratao.vermelho = 1;
    await h.esperar(0.5);
    // o cachorro pula do colo e vai embora
    Cachorro.dono = null;
    Cachorro.y = CHAO;
    const foi = cachorroAte(Vista.x1 + 60, 120);
    await R.falar('AAAAI!! MINHA COLUNA!!', 1.6);
    R.pose('dorCostas');
    Particulas.texto(Ratao.x - 20, CHAO - 30, 'TUM!', '#fff', 18);
    await h.juntos(foi, B.correr(Ratao.x + 34));
    B.virar(-1);
    await B.falar('Ratão! Não se mexe!');
    await R.falar('Nem se eu quisesse, pai...');
    // liga pra ambulância
    Brasa.acessorio = 'celular';
    B.pose('selfie');
    await B.falar('Alô? Ambulância? Meu filho travou carregando o cachorro!', 2.6);
    await B.falar('Não, o cachorro tá ótimo.');
    Brasa.acessorio = null;
    B.pose('parado');
    await B.andar(Ratao.x - 95);
    B.virar(1);
    const amb = h.add(new Ambulancia());
    await h.tween(amb, { x: Ratao.x + 72 + 64 }, 3.5, Ease.out);
    await h.esperar(0.5);
    amb.porta = 1;
    Particulas.texto(amb.traseira, CHAO - 70, 'clac', '#fff', 14);
    // os socorristas descem
    const [S1, S2] = SOCORRISTAS;
    const s1 = ator(S1), s2 = ator(S2);
    for (const s of SOCORRISTAS) { s.oculto = false; s.x = amb.traseira - 2; s.y = CHAO; s.soltoDoChao = false; }
    await h.juntos(s1.andar(Ratao.x + 12), s2.andar(Ratao.x - 66, 60));
    s1.virar(-1); s2.virar(1);
    await s1.falar('Calma, senhor. Somos profissionais.');
    await s2.falar('No três! Um... dois... TRÊS!');
    // primeira tentativa
    s1.pose('carregar'); s2.pose('carregar');
    Ratao.soltoDoChao = true;
    await h.tween(Ratao, { y: CHAO - 16 }, 0.6);
    s1.pose('carregarAndando'); s2.pose('carregarAndando');
    await h.juntos(...[S1, S2, Ratao].map((p) => h.tween(p, { x: p.x + 22 }, 1, Ease.linear)));
    S2.dir = 1;
    s2.exclamar('!');
    Particulas.texto(S2.x, S2.cabeca.y - 24, 'OPS!', '#fff', 18);
    await h.tween(Ratao, { y: CHAO }, 0.25, Ease.in);
    Particulas.texto(Ratao.x - 25, CHAO - 30, 'POF!', '#fff', 22);
    Particulas.poeira(Ratao.x - 25, CHAO, 8);
    Ratao.tonto = 2;
    s1.pose('assustado'); s2.pose('assustado');
    await R.falar('AAAAAAAI!!', 1.3);
    await s1.falar('Escorregou! Desculpa, desculpa!');
    B.pose('maoNaTesta');
    await B.falar('Profissionais, é?');
    // segunda tentativa: agora vai
    B.pose('parado');
    s1.pose('carregar'); s2.pose('carregar');
    await s2.falar('Agora vai. Um, dois... TRÊS!');
    await h.tween(Ratao, { y: CHAO - 16 }, 0.6);
    s1.pose('carregarAndando'); s2.pose('carregarAndando');
    const dx = amb.traseira + 6 - S1.x;
    await h.juntos(...[S1, S2, Ratao].map((p) => h.tween(p, { x: p.x + dx }, dx / 32, Ease.linear)));
    S1.oculto = true;
    await h.tween(Ratao, { x: Ratao.x + 62 }, 0.9, Ease.linear);
    Ratao.oculto = true;
    Ratao.soltoDoChao = false;
    await s2.andar(amb.traseira + 6);
    S2.oculto = true;
    amb.porta = 0;
    Particulas.texto(amb.traseira, CHAO - 70, 'clac', '#fff', 14);
    Ratao.saude = 'hospital';
    Ratao.hospitalFalta = 1;
    Ratao.x = Vista.x0 - 60;
    B.pose('acenar');
    await h.juntos(h.tween(amb, { x: Vista.x1 + 220 }, 4, Ease.in), B.falar('Vai com Deus, filho! Eu cuido do cachorro!', 2.5));
    B.pose('parado');
    await B.pensar('Esse cachorro precisa de regime... e o Ratão, de academia.');
    amb.morto = true;
  },
});

// ------------------------------------------------------------------ Ratão no hospital
registrarHistoria({
  id: 'casaQuieta', nome: 'Casa Quieta', peso: 3, saude: 'hospital',
  pode: () => Ratao.hospitalFalta > 0,
  async rodar() {
    await B.andar(LOCAL.espreguicadeira + 26);
    B.virar(1);
    Brasa.soltoDoChao = true;
    Brasa.y = CHAO - 16;
    Brasa.acessorio = 'jornal';
    B.pose('deitadoLendo');
    Cachorro.assumir();
    Cachorro.visivel = true;
    Cachorro.x = Vista.x1 + 40;
    await cachorroAte(LOCAL.espreguicadeira - 58);
    Cachorro.dir = 1;
    Cachorro.setPose('sentado');
    await B.falar('Sem o Ratão, essa casa fica tão... silenciosa.');
    await h.esperar(1);
    await B.pensar('Que maravilha.');
    Cachorro.setPose('ofegar');
    await h.esperar(1.5);
    Ratao.hospitalFalta--;
    Brasa.acessorio = null;
    Brasa.soltoDoChao = false;
  },
});

registrarHistoria({
  id: 'voltaHospital', nome: 'De Volta do Hospital', peso: 10, saude: 'hospital',
  pode: () => Ratao.hospitalFalta <= 0,
  async rodar() {
    // volta já na cadeira de rodas (se a história for interrompida, continua na cadeira)
    Ratao.saude = 'cadeira';
    Ratao.cadeiraFalta = 2;
    Ratao.oculto = false;
    Ratao.x = Vista.x0 - 40;
    await h.juntos(B.andar(450), R.andar(385, 40));
    B.virar(-1);
    await B.falar('Olha quem voltou!');
    await R.falar('O médico disse que foi só um mau jeito. Mas vou ficar uns dias na cadeira.');
    await B.falar('E quem vai cuidar do cachorro?');
    // o cachorro vem correndo matar a saudade
    Cachorro.assumir();
    Cachorro.visivel = true;
    Cachorro.x = LOCAL.porta;
    Cachorro.dir = 1;
    R.virar(-1);
    R.exclamar('!!');
    const vem = cachorroAte(Ratao.x - 20, 150);
    await R.falar('NÃO! Fica longe de mim!', 1.2);
    await vem;
    await h.juntos(R.fugir(525), cachorroAte(500, 120));
    Cachorro.dir = 1;
    Cachorro.setPose('ofegar');
    R.virar(-1);
    B.olharPara(Ratao);
    B.pose('rir');
    await B.falar('Ele só quer carinho, Ratão!');
    await R.falar('Carinho de quinze quilos, pai!');
    await cachorroAte(Vista.x1 + 60);
  },
});

// ------------------------------------------------------------------ Ratão na cadeira de rodas
registrarHistoria({
  id: 'empurraCadeira', nome: 'Empurra, Pai!', peso: 2, saude: 'cadeira',
  async rodar() {
    await R.andar(330);
    R.virar(1);
    await B.andar(Ratao.x - 18);
    B.virar(1);
    await R.falar('Pai, me leva pra ver a piscina?');
    await B.falar('Tá bom, tá bom...');
    B.pose('empurrar');
    await h.juntos(h.tween(Ratao, { x: 430 }, 3, Ease.linear), h.tween(Brasa, { x: 412 }, 3, Ease.linear));
    await R.falar('Mais rápido, pai! Mais rápido!');
    B.pose('empurrar');
    R.pose('comemorar');
    await h.juntos(
      h.tween(Ratao, { x: PISCINA.x0 - 40 }, 1.1, Ease.in), h.tween(Brasa, { x: PISCINA.x0 - 58 }, 1.1, Ease.in),
      R.falar('IUUUHUUU!', 1));
    // o pai cansa e solta... e a cadeira continua
    B.pose('tossir');
    R.pose('assustado');
    await h.tween(Ratao, { x: PISCINA.x0 - 4 }, 1, Ease.out);
    for (let i = 0; i < 3; i++) {
      await h.tween(Ratao, { rot: 0.16 }, 0.25);
      await h.tween(Ratao, { rot: -0.05 }, 0.25);
    }
    R.gritar('PAAAAAI!!');
    await B.correr(Ratao.x - 18);
    B.pose('empurrar');
    R.calar();
    await h.juntos(h.tween(Ratao, { x: Ratao.x - 40, rot: 0 }, 0.8), h.tween(Brasa, { x: Brasa.x - 40 }, 0.8));
    R.pose('parado');
    await R.falar('Ufa...');
    B.pose('maosNaCintura');
    await B.falar('Chega de passeio. Daqui pra frente, eu escolho o caminho.');
    Ratao.cadeiraFalta--;
  },
});

registrarHistoria({
  id: 'ordensMedicas', nome: 'Ordens Médicas', peso: 2, saude: 'cadeira',
  async rodar() {
    await h.juntos(R.andar(420), B.andar(360));
    h.encarar();
    await R.falar('Pai, pega um refri pra mim? Ordens médicas.');
    await B.andar(LOCAL.churrasqueira - 4);
    B.pose('abaixar');
    await h.esperar(0.8);
    Brasa.acessorio = 'refri';
    B.pose('parado');
    await B.andar(Ratao.x + 16);
    B.virar(-1);
    Brasa.acessorio = null;
    Ratao.acessorio = 'refri';
    R.pose('mostrar');
    await R.falar('Valeu! Agora uma almofada... e um ventilador... e um pastel!', 3);
    await B.furia(3);
    await B.falar('EU NÃO SOU GARÇOM, RATÃO!', 1.5);
    await R.falar('O médico falou pra eu não fazer esforço, pai.');
    B.pose('maoNaTesta');
    await B.pensar('O médico não conhece o Ratão.');
    Ratao.acessorio = null;
    Ratao.cadeiraFalta--;
  },
});

registrarHistoria({
  id: 'voltouAndar', nome: 'Andando de Novo!', peso: 10, saude: 'cadeira',
  pode: () => Ratao.cadeiraFalta <= 0,
  async rodar() {
    await h.juntos(R.andar(360), B.andar(440));
    h.encarar();
    await B.falar('E aí, como tá essa coluna?');
    await R.falar('Acho que já dá pra levantar...');
    // levanta devagar e larga a cadeira
    const cad = h.add(new CadeiraVazia(Ratao.x, Ratao.dir));
    Ratao.saude = 'ok';
    R.pose('travado');
    await h.esperar(1);
    R.pose('abaixar');
    await h.esperar(0.8);
    R.pose('parado');
    await R.andar(Ratao.x + 26, 14);
    R.pose('comemorar');
    await R.falar('Olha, pai! Tô andando!');
    B.pose('comemorar');
    await h.juntos(R.pular(), B.falar('É um milagre!'));
    // e o cachorro, morrendo de saudade...
    Cachorro.assumir();
    Cachorro.visivel = true;
    Cachorro.x = LOCAL.porta;
    Cachorro.dir = 1;
    R.virar(-1);
    R.exclamar('!!');
    await R.falar('Ah não... de novo não!', 1.3);
    const vem = cachorroAte(Ratao.x - 14, 160);
    await h.esperar(0.2);
    await h.juntos(R.fugir(Vista.x1 + 50), vem.then(() => cachorroAte(Vista.x1 + 80, 160)));
    B.pose('rir');
    await B.falar('KKKK! Esse aí sarou de vez!');
    await B.andar(cad.x - 18);
    B.virar(1);
    B.pose('empurrar');
    await h.juntos(h.tween(cad, { x: LOCAL.porta + 18 }, 2.2, Ease.linear), h.tween(Brasa, { x: LOCAL.porta }, 2.2, Ease.linear),
      B.falar('Vou guardar essa cadeira... vai que precisa de novo.', 2.2));
    cad.morto = true;
    B.pose('parado');
  },
});
