'use strict';
// Manutenção da casa: curto-circuito, luz, cano, muro, caixa d'água e o famoso lava-jato.

async function religarLuz() {
  const noite = Cenario.luz < 0.5;
  await h.juntos(B.andar(LOCAL.quadro + 16), R.andar(LOCAL.quadro + 48));
  B.virar(-1); R.virar(-1);
  if (noite) { Ratao.acessorio = 'lanterna'; R.pose('lanterna'); }
  await B.falar(pick(['Deixa que eu resolvo. É só o disjuntor.', 'Na minha época a gente consertava tudo com um grampo.']));
  Casa.quadroAberto = true;
  Brasa.alcance = 0.4;
  B.pose('consertar');
  await h.esperar(1.6);
  if (chance(0.5)) {
    Brasa.choque = 1.4;
    B.pose('choque');
    Particulas.texto(Brasa.cabeca.x, Brasa.cabeca.y - 36, 'BZZZZT!', '#9be7ff', 22);
    Particulas.faiscas(LOCAL.quadro, CHAO - 48, 18);
    await h.esperar(1.4);
    Brasa.choque = 0;
    Brasa.chamuscado = 0.7;
    Brasa.tonto = 2.2;
    B.pose('tonto');
    await h.esperar(1.5);
    await R.falar('Pai? Tá vivo?');
    B.pose('parado');
    await B.falar('...tô ótimo. Nunca estive melhor.');
  }
  Casa.energia = true;
  Casa.quadroAberto = false;
  Particulas.texto(LOCAL.quadro, CHAO - 76, 'tlec!', '#fff', 16);
  Ratao.acessorio = null;
  R.pose('comemorar');
  await R.falar(pick(['Voltou a luz!', 'Salve o disjuntor!']));
  B.pose('maosNaCintura');
  await B.falar('E nada de ligar tudo junto de novo, ouviu?');
}

registrarHistoria({
  id: 'curto', nome: 'Curto-Circuito', peso: 2,
  pode: () => Casa.energia,
  async rodar() {
    await h.juntos(R.andar(LOCAL.tomada + 14), B.andar(420));
    R.virar(-1);
    await R.falar(pick(['Vou ligar o ventilador, a TV e a caixa de som. Tudo no mesmo benjamim!', 'Esse T aguenta, pai. Confia!']));
    B.olharPara(Ratao);
    await B.falar('Ratão... isso não vai prestar.');
    Ratao.alcance = 0.2;
    R.pose('consertar');
    await h.esperar(1);
    Particulas.faiscas(LOCAL.tomada, CHAO - 30, 22);
    Particulas.texto(LOCAL.tomada, CHAO - 56, 'BZZZT!', '#9be7ff', 22);
    Ratao.choque = 1.1;
    R.pose('choque');
    Casa.faiscaQuadro = 1.2;
    await h.esperar(1.1);
    Ratao.choque = 0;
    Ratao.chamuscado = 0.6;
    Ratao.tonto = 2;
    Casa.energia = false;
    Particulas.texto(LOCAL.quadro, CHAO - 110, 'TUUUM...', '#ddd', 18);
    R.pose('tonto');
    await h.esperar(1.5);
    B.pose('maosNaCintura');
    await B.falar('RATÃÃÃO!!', 1.2);
    R.pose('parado');
    await R.falar('...acho que caiu a luz.');
    await religarLuz();
  },
});

registrarHistoria({
  id: 'religar', nome: 'Cadê a Luz?', peso: 8,
  pode: () => !Casa.energia,
  async rodar() {
    B.pose('olharCima');
    await B.falar(pick(['Tá tudo apagado ainda...', 'Ratão! Cadê a luz dessa casa?']));
    R.pose('cocar');
    await R.falar('Deve ser o disjuntor, pai.');
    await religarLuz();
  },
});

registrarHistoria({
  id: 'cano', nome: 'Estourou o Cano', peso: 1.8,
  pode: () => Casa.cano !== 'estourado',
  async rodar() {
    const tinhaFita = Casa.cano === 'fita';
    await h.juntos(R.andar(505), B.andar(395));
    await h.esperar(0.8);
    Particulas.texto(LOCAL.cano, CHAO - 98, 'POW!', '#fff', 24);
    Casa.cano = 'estourado';
    Casa.registroAberto = true;
    R.olharPara(LOCAL.cano); B.olharPara(LOCAL.cano);
    R.exclamar('!!'); B.exclamar('!!');
    await B.falar(tinhaFita ? 'A fita não aguentou! Tampa aí, Ratão!' : 'O CANO! Tampa aí, Ratão!', 1.6);
    await R.correr(LOCAL.cano + 13);
    R.virar(-1);
    Ratao.alcance = 0.55;
    R.pose('consertar');
    Ratao.molhado = 1;
    B.gritar('Vou fechar o registro!');
    await h.juntos(R.falar('Tá espirrando na minha cara!!', 2), B.correr(LOCAL.registro - 14));
    B.calar();
    B.virar(1);
    B.pose('consertarAgachado');
    await h.esperar(1.2);
    if (chance(0.45)) {
      await B.falar('...é pra esquerda ou pra direita?');
      await R.falar('QUALQUER UMA, PAI!!', 1.3);
    }
    Casa.registroAberto = false;
    await h.esperar(0.5);
    B.pose('parado');
    R.pose('chacoalhar');
    await h.esperar(1);
    Ratao.acessorio = 'fita';
    R.pose('consertar');
    await h.esperar(1.8);
    Casa.cano = 'fita';
    Casa.registroAberto = true;
    Ratao.acessorio = null;
    R.pose('orgulhoso');
    await R.falar('Silver tape. Resolve tudo.');
    B.pose('maoNaTesta');
    await B.pensar('Isso não dura uma semana.');
  },
});

registrarHistoria({
  id: 'muro', nome: 'Cai o Muro', peso: 1.5,
  pode: () => Casa.muro >= 1 && Casa.entulho === 0,
  async rodar() {
    await h.juntos(B.andar(LOCAL.muroX0 - 18), R.andar(LOCAL.muroX0 + 40));
    B.virar(1); R.virar(-1);
    await B.falar('Esse muro tá meio torto, hein, Ratão?');
    await R.falar(pick(['Que nada, pai! Tá firme!', 'Esse muro aguenta até terremoto!']));
    R.virar(1);
    Ratao.alcance = 0.5;
    R.pose('martelar');
    Particulas.texto(LOCAL.muroX0 + 58, CHAO - 50, 'toc toc', '#fff', 14);
    await h.esperar(1);
    R.pose('orgulhoso');
    await R.falar('Viu? Firmeza total.');
    await h.tween(Casa, { tremorMuro: 1 }, 1.2);
    R.pose('assustado'); B.pose('assustado');
    await h.tween(Casa, { muroQueda: 1 }, 0.6, Ease.in);
    Casa.muro = 0; Casa.muroQueda = 0; Casa.tremorMuro = 0; Casa.entulho = 1; Casa.muroPintado = false;
    for (let i = 0; i < 25; i++) Particulas.fumaca(rand(LOCAL.muroX0, LOCAL.muroX0 + 120), CHAO - rand(0, 25), 'rgba(190,170,130,0.5)', rand(3, 7));
    Particulas.texto(LOCAL.muroX0 + 60, CHAO - 80, 'CATAPLOFT!', '#fff', 26);
    await h.esperar(1.2);
    R.virar(-1);
    await B.furia(3);
    await B.falar('RATÃÃÃO!!', 1.2);
    R.pose('cocar');
    await R.falar('Foi o vento, pai!');
    await B.falar('QUE VENTO?!', 1.2);
  },
});

registrarHistoria({
  id: 'consertarMuro', nome: 'Levantando o Muro', peso: 6,
  pode: () => Casa.muro < 1,
  async rodar() {
    await h.juntos(B.andar(LOCAL.muroX0 + 18), R.andar(LOCAL.muroX0 + 75));
    B.virar(1); R.virar(-1);
    await B.falar('Bora levantar esse muro. E dessa vez ninguém encosta!');
    if (Casa.entulho > 0) {
      R.pose('abaixar'); B.pose('abaixar');
      await h.tween(Casa, { entulho: 0 }, 2);
    }
    Casa.muroPintado = false;
    Brasa.acessorio = 'colher';
    Brasa.alcance = 0.3;
    B.pose('consertar');
    const falas = [['B', 'Tá torto, Ratão!'], ['R', 'Tá nada, pai!'], ['B', 'Passa o prumo aí.'], ['R', 'O que é prumo?']];
    for (let i = 0; i < 4; i++) {
      Ratao.acessorio = 'tijolos';
      const obra = h.tween(Casa, { muro: (i + 1) / 4 }, 2, Ease.linear);
      Brasa.alcance = 0.3 + i * 0.15;
      const [quem, txt] = falas[i];
      await h.juntos(obra, (quem === 'B' ? B : R).falar(txt, 1.8));
      Particulas.texto(LOCAL.muroX0 + 40 + i * 15, CHAO - 20 - i * 10, 'toc', '#fff', 13, 0.7);
    }
    Ratao.acessorio = null;
    Brasa.acessorio = null;
    Casa.muroPintado = true;
    B.pose('orgulhoso');
    await B.falar('Pronto! Esse agora dura cem anos.');
    R.virar(1);
    R.pose('martelar');
    await h.tween(Casa, { tremorMuro: 0.6 }, 0.5);
    R.pose('assustado'); B.pose('assustado');
    await h.esperar(1);
    await h.tween(Casa, { tremorMuro: 0 }, 0.5);
    await h.juntos(R.falar('...ufa.'), B.falar('NÃO. ENCOSTA.', 1.5));
  },
});

// sobe (ou desce) a escada encostada na garagem até a beira do telhado, perto da caixa d'água
const ESCADA_CAIXA = 164;
async function subirNaCaixa(a) {
  const p = a.p;
  await a.andar(ESCADA_CAIXA + 8);
  a.virar(-1);
  p.soltoDoChao = true;
  a.pose('escalar');
  await h.tween(p, { y: CHAO - 184, x: ESCADA_CAIXA - 10 }, 2.6, Ease.linear);
  a.virar(1);
  a.pose('andar');
  const o = { _k: 0, get k() { return this._k; }, set k(v) { this._k = v; p.x = lerp(ESCADA_CAIXA - 10, CAIXA.luva - 21, v); p.y = telhadoY(p.x); } };
  await h.tween(o, { k: 1 }, 0.8, Ease.linear);
  a.pose('parado');
}
async function descerDaCaixa(a) {
  const p = a.p;
  a.virar(-1);
  a.pose('andar');
  const o = { _k: 0, get k() { return this._k; }, set k(v) { this._k = v; p.x = lerp(CAIXA.luva - 21, ESCADA_CAIXA - 10, v); p.y = telhadoY(p.x); } };
  await h.tween(o, { k: 1 }, 0.8, Ease.linear);
  a.pose('escalar');
  await h.tween(p, { y: CHAO, x: ESCADA_CAIXA + 8 }, 2.2, Ease.linear);
  p.soltoDoChao = false;
  a.pose('parado');
}

registrarHistoria({
  id: 'caixa', nome: "A Caixa d'Água", peso: 2,
  async rodar() {
    const torneira = LOCAL.cano + 16;
    await h.juntos(B.andar(torneira), R.andar(395));
    B.virar(-1);
    Brasa.alcance = 0.2;
    B.pose('consertar');
    Particulas.texto(LOCAL.cano + 4, CHAO - 44, 'nhec', '#fff', 13, 0.8);
    await h.esperar(1);
    Particulas.add({ x: LOCAL.cano + 7, y: CHAO - 27, vy: 10, g: 300, vida: 0.8, cor: '#bfe6ff', tam: 1.4 });
    await h.esperar(0.9);
    B.pose('parado');
    B.olharPara(Ratao);
    await B.falar(pick(['Ratão! Acabou a água da casa!', 'Ué... cadê a água? Ratão!']));
    await R.falar("Deve ser a caixa d'água, pai. Deixa comigo!");
    await B.falar('Cuidado aí em cima, hein.');
    // pega a escada e sobe
    const esc = h.add(new Escada(ESCADA_CAIXA, 186));
    await h.juntos(subirNaCaixa(R), B.andar(ESCADA_CAIXA + 36));
    B.virar(-1);
    B.pose('olharCima');
    await R.falar('Tá quase vazia! Deve ser a boia...');
    // mexe... e começa a vazar
    Ratao.alcance = 0.35;
    R.pose('consertar');
    await h.esperar(1.6);
    Particulas.texto(CAIXA.luva, CAIXA.canoY - 20, 'ploc!', '#fff', 15);
    Casa.caixaVaz = 0.5;
    R.pose('parado');
    R.exclamar('!');
    await h.esperar(0.8);
    await B.falar('Que barulho foi esse?');
    await R.falar(pick(['Nada não, pai!', 'Tá tudo sob controle!']));
    // aperta com a chave: vaza mais
    Ratao.acessorio = 'chave';
    R.pose('consertar');
    await h.esperar(1.4);
    Particulas.texto(CAIXA.luva, CAIXA.canoY - 22, 'PSSSH!', '#e8f6ff', 18);
    await h.tween(Casa, { caixaVaz: 1 }, 0.4);
    // e a água cai bem em cima do pai
    await h.esperar(0.6);
    Brasa.molhado = 1;
    B.pose('assustado');
    await B.falar('Tá chovendo aqui embaixo, Ratão!', 1.8);
    B.pose('maosNaCintura');
    await R.falar('É só um vazamentinho, pai!');
    // troca a peça: piora
    await R.falar('Vou trocar essa luva aqui. Tenho uma igualzinha!');
    R.pose('consertar');
    await h.esperar(1.4);
    Particulas.texto(CAIXA.luva, CAIXA.canoY - 22, 'crec!', '#fff', 15);
    Casa.caixaPeca = true;
    await h.esperar(0.5);
    Particulas.texto(CAIXA.luva, CAIXA.canoY - 26, 'FSSSHHH!', '#e8f6ff', 22);
    await h.tween(Casa, { caixaVaz: 1.8 }, 0.4);
    Ratao.molhado = 1;
    R.pose('assustado');
    await R.falar('PIOROU!!', 1.3);
    await B.falar('Igualzinha, é?');
    // silver tape
    Ratao.acessorio = 'fita';
    R.pose('consertar');
    await h.esperar(1.8);
    Casa.caixaFita = true;
    await h.tween(Casa, { caixaVaz: 0.12 }, 0.6);
    Ratao.acessorio = null;
    R.pose('irritado');
    Particulas.palavrao(Ratao.cabeca.x, Ratao.cabeca.y - 30);
    await R.falar(pick(['Ah, quer saber? Fica assim mesmo!', 'Chega! Silver tape e pronto!']));
    await descerDaCaixa(R);
    Particulas.texto(CAIXA.luva, CAIXA.canoY - 14, 'plic...', '#bfe6ff', 13);
    await h.esperar(1.2);
    Particulas.texto(CAIXA.luva, CAIXA.canoY - 14, 'ploc...', '#bfe6ff', 13);
    B.pose('maoNaTesta');
    await B.falar('Ratão... tá pingando.');
    R.virar(1);
    R.pose('maosNaCintura');
    await R.falar('Pinga só um pouquinho. Nem dá pra ver!');
    // o pai resolve
    await h.juntos(B.falar('Sai da frente. Deixa que eu vejo.'), R.andar(ESCADA_CAIXA + 70));
    R.virar(-1);
    await subirNaCaixa(B);
    B.pose('olharCima');
    await B.falar('Luva laranja? Onde você achou isso?');
    Brasa.acessorio = 'chave';
    Brasa.alcance = 0.3;
    B.pose('consertar');
    await h.esperar(2.4);
    Particulas.texto(CAIXA.luva, CAIXA.canoY - 22, 'tlec!', '#fff', 15);
    Casa.caixaFita = false;
    Casa.caixaPeca = false;
    Casa.caixaVaz = 0;
    Brasa.acessorio = null;
    B.pose('orgulhoso');
    await B.falar('Pronto. Era só a boia travada.');
    await descerDaCaixa(B);
    esc.morto = true;
    B.olharPara(Ratao);
    await R.falar('Mas eu tinha deixado quase pronto!');
    B.pose('maosNaCintura');
    await B.falar(pick(['Quase pronto tava a enchente.', 'Da próxima vez, sobe só pra olhar. SÓ OLHAR!']));
  },
});

registrarHistoria({
  id: 'lavajato', nome: 'O Lava-Jato', peso: 2.2,
  pode: () => !Lavajato.naPiscina && Casa.energia,
  async rodar() {
    await h.juntos(R.andar(Lavajato.x + 16), B.andar(470));
    R.virar(-1);
    await R.falar('Hoje esse piso vai brilhar!');
    // empurra a máquina pra perto da piscina
    R.pose('carregarAndando');
    await h.juntos(h.tween(Lavajato, { x: PISCINA.x1 + 20 }, 2.5, Ease.linear), h.tween(Ratao, { x: PISCINA.x1 + 36 }, 2.5, Ease.linear));
    Lavajato.dono = Ratao;
    Ratao.acessorio = 'pistola';
    await R.andar(840);
    R.virar(1);
    Lavajato.ligado = true;
    Lavajato.pressao = 'fraca';
    R.pose('jato');
    await h.esperar(2.2);
    await R.falar('Ué... cadê a pressão?');
    R.pose('olharBico');
    await h.esperar(1);
    R.pose('chacoalhar');
    await h.esperar(0.8);
    R.pose('jato');
    await R.falar('Isso aqui não limpa nem prato!');
    // o pai vem ajudar
    await B.andar(PISCINA.x1 + 6);
    B.virar(1);
    await B.falar('Deixa que eu vejo. Tem que aumentar aqui ó...');
    B.pose('consertarAgachado');
    await h.esperar(1.2);
    Lavajato.pressao = 'forte';
    Particulas.texto(Ratao.x, Ratao.y - 80, 'FSSSHHH!', '#e8f6ff', 22);
    R.pose('jatoForte');
    for (let i = 0; i < 6; i++) {
      Ratao.dir = i % 2 ? 1 : -1;
      if (Ratao.dir < 0) { Brasa.molhado = 1; B.pose('assustado'); }
      await h.juntos(h.tween(Ratao, { x: Ratao.x + rand(-12, 12) }, 0.45), i === 1 ? B.falar('AAAH! DESLIGA ISSO!', 1.2) : h.esperar(0.45));
    }
    Lavajato.ligado = false;
    R.pose('parado');
    R.virar(-1);
    B.pose('maosNaCintura');
    await B.falar('RATÃÃÃO!!', 1.2);
    await R.falar('Mas foi você que aumentou, pai!');
    // conserta
    R.pose('consertarAgachado');
    await h.esperar(1.5);
    Lavajato.pressao = 'normal';
    await R.andar(845);
    R.virar(1);
    Lavajato.ligado = true;
    R.pose('jato');
    await h.juntos(h.tween(Casa, { sujeira: 0 }, 4.5, Ease.linear), R.falar('Agora sim! Olha esse brilho!', 2.5));
    await B.falar('Olha só... ficou bom mesmo.');
    // ...e a máquina cai na piscina
    R.pose('jato');
    await h.juntos(h.tween(Ratao, { x: 880 }, 1.5, Ease.linear), h.tween(Lavajato, { x: PISCINA.x1 - 6, rot: -0.5 }, 1.5, Ease.in));
    Lavajato.cairNaPiscina();
    await h.tween(Lavajato, { y: PISCINA.fundo - 2, x: PISCINA.x1 - 26, rot: 0.4 }, 0.6, Ease.in);
    Particulas.respingo(PISCINA.x1 - 20, PISCINA.agua, 26, 1.2);
    Particulas.texto(PISCINA.x1 - 20, PISCINA.agua - 40, 'TCHIBUM!', '#fff', 22);
    await h.esperar(0.4);
    Particulas.faiscas(PISCINA.x1 - 20, PISCINA.agua, 20);
    Particulas.texto(PISCINA.x1 - 20, PISCINA.agua - 64, 'BZZZT!', '#9be7ff', 20);
    Casa.faiscaQuadro = 1;
    Casa.energia = false;
    Lavajato.ligado = false;
    Particulas.texto(LOCAL.quadro, CHAO - 110, 'TUUUM...', '#ddd', 18);
    B.exclamar('!!');
    R.pose('parado');
    await h.esperar(0.8);
    await R.falar('Ué... parou.');
    R.virar(-1);
    R.pose('olharBico');
    await h.esperar(1.5);
    // a pressão que tinha sobrado vai toda na cara
    Particulas.texto(Ratao.cabeca.x, Ratao.cabeca.y - 30, 'FSSSH!', '#e8f6ff', 20);
    for (let i = 0; i < 30; i++) Particulas.add({ x: Ratao.mao.x, y: Ratao.mao.y, vx: Ratao.dir * rand(-140, -60), vy: -rand(40, 140), g: 300, vida: 0.7, cor: pick(['#e8f6ff', '#bfe6ff']), tam: rand(1.2, 2.4) });
    Ratao.molhado = 1;
    R.pose('assustado');
    await h.esperar(0.8);
    R.pose('chacoalhar');
    await h.esperar(1);
    Lavajato.dono = null;
    Ratao.acessorio = null;
    R.pose('parado');
    B.pose('maoNaTesta');
    await B.falar('...e agora ainda caiu a luz.');
    await R.falar('Foi mal, pai.');
  },
});

registrarHistoria({
  id: 'resgate', nome: 'Pescando o Lava-Jato', peso: 5,
  pode: () => Lavajato.naPiscina,
  async rodar() {
    await h.juntos(B.andar(PISCINA.x0 - 16), R.andar(PISCINA.x0 - 44));
    B.virar(1);
    await B.falar('Ratão, tira aquela máquina da piscina!');
    await R.falar('Mas a água tá gelada!');
    await B.falar('A CONTA de luz é que tá gelada. VAI!');
    await R.cairNaPiscina(PISCINA.x1 - 40, 'bomba', 30);
    R.pose('nadar');
    await h.tween(Ratao, { y: NADO + 14 }, 0.6);
    await h.esperar(1.2);
    await h.tween(Ratao, { y: NADO }, 0.5);
    Lavajato.tirarDaPiscina();
    Particulas.respingo(PISCINA.x1, PISCINA.agua, 10);
    await R.sairDaPiscina();
    R.pose('mostrar');
    await R.falar('Salvei! Só precisa secar uns três dias.');
  },
});

registrarHistoria({
  id: 'maquina', nome: 'A Máquina de Lavar', peso: 2,
  pode: () => !Maquina.naPiscina && Casa.energia,
  async rodar() {
    await h.juntos(B.andar(440), R.andar(LOCAL.maquina - 26));
    R.virar(1); B.virar(1);
    await B.falar('Ratão, bota essa roupa pra lavar que amanhã tem churrasco.');
    Ratao.alcance = 0.35;
    R.pose('consertar');
    Particulas.texto(LOCAL.maquina, CHAO - 44, 'fluf', '#fff', 13);
    await h.esperar(1);
    await R.falar('Sabão... amaciante... e liga!');
    // não liga
    for (let i = 0; i < 3; i++) {
      Particulas.texto(LOCAL.maquina - 4, CHAO - 42 - i * 6, 'tec', '#fff', 12, 0.8);
      await h.esperar(0.5);
    }
    R.pose('cocar');
    await R.falar('Ué... não liga.');
    await B.falar('Essa máquina tem mais idade que você.');
    await R.falar('Deixa comigo, pai!');
    // o conserto
    Ratao.acessorio = 'chave';
    R.pose('consertarAgachado');
    for (const txt of ['clank', 'cronc', 'plim']) {
      await h.esperar(0.9);
      Particulas.texto(LOCAL.maquina + rand(-6, 6), CHAO - 40, txt, '#fff', 14);
    }
    await B.falar('Tirou da tomada antes, né?');
    await R.falar('Precisa não, pai!');
    Particulas.faiscas(LOCAL.maquina - 10, CHAO - 12, 14);
    Particulas.texto(Ratao.x, Ratao.cabeca.y - 30, 'BZT!', '#9be7ff', 18);
    Ratao.choque = 0.6;
    R.pose('choque');
    await h.esperar(0.7);
    Ratao.choque = 0;
    Ratao.chamuscado = 0.35;
    R.pose('consertarAgachado');
    await R.falar('...tô bem! Era só um fiozinho solto.');
    Ratao.acessorio = 'martelo';
    R.pose('martelar');
    Particulas.texto(LOCAL.maquina, CHAO - 46, 'toc toc', '#fff', 14);
    await h.esperar(1.2);
    Ratao.acessorio = null;
    // funciona!
    R.pose('consertar');
    Particulas.texto(LOCAL.maquina - 4, CHAO - 42, 'tec', '#fff', 12, 0.8);
    await h.esperar(0.4);
    Maquina.ligada = true;
    Particulas.texto(LOCAL.maquina, CHAO - 50, 'vrrrrum', '#fff', 15);
    R.pose('orgulhoso');
    await B.falar('Olha só... funcionou!');
    await R.falar('Eu sou um gênio, pai.');
    await h.esperar(1);
    // ...e começa a tremer
    Particulas.texto(LOCAL.maquina, CHAO - 56, 'TUM TUM TUM', '#fff', 16);
    await h.tween(Maquina, { tremor: 1 }, 1.5);
    R.pose('assustado'); B.pose('assustado');
    R.exclamar('!'); B.exclamar('!');
    await R.falar('Pai... ela tá tremendo inteira!', 1.6);
    // sai andando sozinha em direção à piscina
    const andando = (async () => {
      for (let i = 0; i < 9; i++) {
        await h.tween(Maquina, { x: Maquina.x + 9 }, 0.32, Ease.out);
        if (i % 3 === 0) Particulas.texto(Maquina.x, CHAO - 50, pick(['TUM!', 'TOC!', 'BLAM!']), '#fff', 15, 0.8);
      }
    })();
    andando.catch(() => {}); // se a história for interrompida antes do await
    B.gritar('SEGURA ELA, RATÃO!');
    await h.esperar(0.6);
    B.calar();
    await R.correr(Maquina.x - 20);
    R.virar(1);
    R.pose('jatoForte');
    await h.juntos(andando, h.tween(Ratao, { x: LOCAL.maquina + 81 - 20 }, 2.3, Ease.linear));
    await R.falar('Ela é muito forte!', 1.2);
    // tchibum
    R.pose('assustado');
    await h.tween(Maquina, { x: Maquina.x + 14, rot: 0.5 }, 0.4, Ease.in);
    Maquina.cairNaPiscina();
    await h.tween(Maquina, { y: PISCINA.fundo - 5, rot: -0.25 }, 0.6, Ease.in);
    Particulas.respingo(Maquina.x, PISCINA.agua, 30, 1.3);
    Particulas.texto(Maquina.x, PISCINA.agua - 44, 'TCHIBUM!', '#fff', 24);
    await h.esperar(0.4);
    Particulas.faiscas(Maquina.x, PISCINA.agua, 22);
    Particulas.texto(Maquina.x, PISCINA.agua - 68, 'BZZZT!', '#9be7ff', 20);
    Casa.faiscaQuadro = 1;
    Casa.energia = false;
    Particulas.texto(LOCAL.quadro, CHAO - 110, 'TUUUM...', '#ddd', 18);
    await h.esperar(1);
    R.pose('parado');
    await B.andar(Ratao.x - 30);
    B.virar(1);
    B.pose('maoNaTesta');
    await B.falar('Pelo menos a roupa vai sair bem enxaguada.');
    await R.falar('...e a luz caiu de novo, né?');
    await B.falar('RATÃÃÃO!!', 1.2);
  },
});

registrarHistoria({
  id: 'resgateMaquina', nome: 'Pescando a Máquina', peso: 5,
  pode: () => Maquina.naPiscina,
  async rodar() {
    await h.juntos(B.andar(LOCAL.maquina - 44), R.andar(PISCINA.x0 - 6));
    B.virar(1); R.virar(1);
    await B.falar('Ratão, a máquina de lavar ainda tá lá no fundo.');
    await R.falar('Mas ela tá fazendo tanta espuma... parece um ofurô!');
    await B.falar('VAI BUSCAR!', 1.2);
    await R.cairNaPiscina(Maquina.x + 20, 'bomba', 30);
    R.pose('nadar');
    await h.tween(Ratao, { y: NADO + 14 }, 0.6);
    await h.esperar(1.2);
    // empurra a máquina de volta pro lugar
    Maquina.tirarDaPiscina();
    Particulas.respingo(PISCINA.x0 + 10, PISCINA.agua, 14);
    await h.tween(Ratao, { y: NADO }, 0.5);
    await R.sairDaPiscina();
    R.pose('mostrar');
    await R.falar('Prontinho! Lavada por dentro e por fora.');
    B.pose('maoNaTesta');
    await B.pensar('Amanhã eu levo na lavanderia.');
  },
});
