'use strict';
// O carro da família: chega, dá problema, pega fogo... e o guincho leva embora.

async function espirrarExtintor(a, seg) {
  const p = a.p, fim = Motor.tempo + seg;
  while (Motor.tempo < fim) {
    const b = p.bico || p.mao;
    for (let i = 0; i < 4; i++) {
      Particulas.add({ x: b.x, y: b.y, vx: p.dir * rand(120, 200), vy: rand(-30, 40), vida: 0.6, tipo: 'fumaca', cor: 'rgba(245,245,245,0.8)', tam: rand(2, 4), cresce: 10 });
    }
    await Motor.esperar(0.08);
  }
}

registrarHistoria({
  id: 'carro', nome: 'Problema no Carro', peso: 2,
  pode: () => !Carro.visivel || Carro.estado === 'ok',
  async rodar() {
    const motorista = pick([Ratao, Brasa]);
    const M = motorista === Ratao ? R : B;
    const outro = motorista === Ratao ? B : R;
    if (!Carro.visivel) {
      motorista.oculto = true;
      Carro.motorista = motorista;
      Carro.visivel = true;
      Carro.estado = 'ok';
      Carro.x = Vista.x0 - 90; Carro.px = Carro.x;
      await outro.andar(LOCAL.porta + 40);
      await h.tween(Carro, { x: LOCAL.carro }, 3.5, Ease.out);
    } else {
      await M.andar(Carro.x);
      motorista.oculto = true;
      Carro.motorista = motorista;
      Particulas.texto(Carro.x, CHAO - 70, 'vrum... vrum...', '#fff', 16);
      await h.esperar(1.2);
    }
    Carro.fumaca = true;
    Particulas.texto(Carro.x + 40, CHAO - 64, 'POF! POF!', '#fff', 20);
    await h.esperar(1.2);
    motorista.oculto = false;
    motorista.x = Carro.x + 2;
    Carro.motorista = null;
    await M.falar(pick(['Ih... tá saindo fumaça!', 'Esse carro de novo...']));

    await h.juntos(R.andar(Carro.x + 72), B.andar(Carro.x + 100));
    R.virar(-1); B.virar(-1);
    await B.falar('Abre o capô, Ratão.');
    await h.tween(Carro, { capo: 1 }, 0.6);
    Carro.fumaca = false;
    for (let i = 0; i < 8; i++) Particulas.fumaca(Carro.x + 42, CHAO - 32, 'rgba(90,90,90,0.6)', 4);
    R.pose('olharCapo');
    B.pose('pensar');
    await B.falar(pick(['Deve ser a vela. Ou o platinado.', 'No meu tempo era só dar um tapa no motor.']));
    await R.falar('Pai, carro de hoje nem tem platinado!');
    Ratao.acessorio = 'chave';
    R.pose('consertarAgachado');
    await h.esperar(2);
    R.pose('parado');
    await R.falar('Pronto! Liga aí, pai!');

    await B.andar(Carro.x);
    Brasa.oculto = true;
    Carro.motorista = Brasa;
    await h.esperar(0.6);
    Particulas.texto(Carro.x, CHAO - 70, 'vrum...', '#fff', 16);
    await h.esperar(0.8);

    if (chance(0.3)) {
      // desta vez funcionou!
      Particulas.texto(Carro.x, CHAO - 70, 'VRUUUM!', '#ffe066', 22);
      await h.tween(Carro, { capo: 0 }, 0.5);
      Brasa.oculto = false;
      Brasa.x = Carro.x + 2;
      Carro.motorista = null;
      Ratao.acessorio = null;
      R.pose('comemorar');
      await R.falar('Funcionou!! Sou um gênio da mecânica!');
      await B.falar('Milagre. Vou até acender uma vela.');
      return;
    }

    Particulas.texto(Carro.x + 40, CHAO - 70, 'POF... FUUUSH!', '#ffa41b', 20);
    Particulas.faiscas(Carro.x + 42, CHAO - 30, 16);
    await h.tween(Carro, { fogo: 1 }, 1.2);
    R.exclamar('!!');
    await R.fugir(Carro.x + 170);
    R.gritar('FOGO!! FOGO NO CARRO!!');
    Brasa.oculto = false;
    Brasa.x = Carro.x + 2;
    Carro.motorista = null;
    B.gritar('SOCORRO!!');
    await h.juntos(B.fugir(Carro.x - 70), (async () => { await R.fugir(Carro.x + 120); await R.fugir(Carro.x + 180); })());
    R.calar(); B.calar();
    await B.falar('O EXTINTOR, RATÃO!', 1.3);
    await R.correr(LOCAL.porta + 15);
    R.pose('abaixar');
    await h.esperar(0.5);
    Ratao.acessorio = 'extintor';
    await R.correr(Carro.x + 95);
    // primeiro, pro lado errado...
    R.virar(1);
    B.x = Carro.x + 140; B.virar(-1);
    R.pose('extintor');
    B.pose('assustado');
    await h.juntos(espirrarExtintor(R, 1.4), B.falar('EM MIM NÃO, RATÃO!!', 1.3));
    Brasa.chamuscado = Math.max(Brasa.chamuscado, 0.2);
    R.virar(-1);
    await h.juntos(espirrarExtintor(R, 3), h.tween(Carro, { fogo: 0 }, 3));
    Carro.estado = 'queimado';
    Ratao.acessorio = null;
    Ratao.chamuscado = 0.5;
    R.pose('triste');
    B.pose('maoNaTesta');
    await h.esperar(1);
    await B.falar('...vamos de ônibus.');
    await R.falar('Pelo menos o rádio... não, o rádio também foi.');
  },
});

registrarHistoria({
  id: 'guincho', nome: 'Chama o Guincho', peso: 6,
  pode: () => Carro.visivel && Carro.estado === 'queimado',
  async rodar() {
    await h.juntos(B.andar(Carro.x + 100), R.andar(Carro.x + 130));
    B.virar(-1); R.virar(-1);
    await B.falar('O guincho chegou.');
    const g = h.add(new Guincho());
    Particulas.texto(Vista.x0 + 60, CHAO - 70, 'pi... pi... pi...', '#fff', 16, 2.5);
    await h.tween(g, { x: Carro.x - 128 }, 3.5, Ease.out);
    await h.esperar(0.8);
    await h.tween(Carro, { rot: 0.1 }, 0.8);
    B.pose('acenar'); R.pose('acenar');
    const dx = Vista.x0 - 260 - g.x;
    await h.juntos(h.tween(g, { x: g.x + dx }, 4, Ease.in), h.tween(Carro, { x: Carro.x + dx }, 4, Ease.in), B.falar('Adeus, Brasinha...', 2.5));
    await R.falar('Era um bom carro.');
    await B.falar('Era um PÉSSIMO carro. Mas era nosso.');
    Object.assign(Carro, { visivel: false, estado: 'ok', rot: 0, capo: 0, fogo: 0, x: LOCAL.carro, cor: pick(CORES_CARRO) });
  },
});
