'use strict';
// Lazer (que sempre dá errado): churrasco, bomba na piscina e noite no quintal.

registrarHistoria({
  id: 'churrasco', nome: 'Manda Brasa!', peso: 2,
  async rodar() {
    await h.juntos(B.andar(LOCAL.churrasqueira + 30), R.andar(LOCAL.churrasqueira + 82));
    B.virar(-1); R.virar(-1);
    await B.falar('Hoje tem churrasco! Não é à toa que me chamam de Manda Brasa!');
    Brasa.acessorio = 'jornal';
    B.pose('abanar');
    await h.tween(Casa, { brasa: 0.3 }, 3);
    await B.falar('Tá demorando pra pegar...');
    await R.falar('Joga um alcoolzinho, pai!');
    B.pose('parado');
    await B.falar('Só um pouquinho...');
    Brasa.acessorio = 'garrafa';
    B.pose('segurar');
    await h.esperar(0.8);
    Casa.brasa = 1.8;
    Particulas.texto(LOCAL.churrasqueira, CHAO - 90, 'FUUUSH!', '#ffa41b', 26);
    for (let i = 0; i < 12; i++) Particulas.fumaca(LOCAL.churrasqueira + rand(-10, 30), CHAO - rand(40, 70), 'rgba(60,60,60,0.55)', 4);
    Brasa.chamuscado = 0.8;
    Brasa.acessorio = null;
    B.pose('assustado');
    h.tween(Casa, { brasa: 0.9 }, 2);
    await h.esperar(1.6);
    B.pose('parado');
    await R.falar('Pai... cadê a sua sobrancelha?');
    B.pose('maoNaTesta');
    await B.falar('...era só charme mesmo.');
    Brasa.acessorio = 'pegador';
    B.pose('segurar');
    await h.esperar(2);
    B.pose('mostrar');
    await B.falar('Olha a picanha saindo!');
    R.pose('comemorar');
    await R.falar('Isso que é pai!');
    Brasa.acessorio = null;
    await h.tween(Casa, { brasa: 0 }, 3);
  },
});

registrarHistoria({
  id: 'bomba', nome: 'Bombaaa!', peso: 2, quando: DIA,
  async rodar() {
    await B.andar(LOCAL.espreguicadeira + 26);
    B.virar(1);
    Brasa.soltoDoChao = true;
    Brasa.y = CHAO - 16;
    Brasa.acessorio = 'jornal';
    B.pose('deitadoLendo');
    await B.pensar('Enfim... paz e sossego.');
    await R.andar(470);
    R.virar(1);
    await R.falar('Pai! Olha isso!');
    R.gritar('BOMBAAAAAA!!');
    await R.correr(PISCINA.x0 - 6);
    R.calar();
    await R.cairNaPiscina(650, 'bomba', 45);
    for (let i = 0; i < 40; i++) {
      Particulas.add({ x: 650 + rand(-20, 20), y: PISCINA.agua, vx: rand(80, 230), vy: -rand(150, 300), g: 380, vida: 1.3, cor: pick(['#e8f6ff', '#9fd3ff']), tam: rand(1.5, 3) });
    }
    await h.esperar(0.8);
    Brasa.molhado = 1;
    Brasa.acessorio = null;
    Brasa.soltoDoChao = false;
    B.pose('furioso');
    await B.falar('RATÃÃÃO!! MEU JORNAL!!', 1.6);
    await R.falar('Dez! Nota dez!');
    await R.sairDaPiscina(PISCINA.x1 + 16);
    R.virar(1);
    await R.falar('...foi mal, pai.');
  },
});

registrarHistoria({
  id: 'noite', nome: 'Noite no Quintal', peso: 2, quando: ['noite'],
  async rodar() {
    await h.juntos(B.andar(520), R.andar(490));
    B.virar(1); R.virar(1);
    B.pose('sentado'); R.pose('sentado');
    await h.esperar(1);
    if (!Casa.energia) {
      await R.falar('Pelo menos as estrelas não precisam de luz.');
      await B.falar('Nem de disjuntor.');
    }
    await B.falar(pick(['Na minha época, a gente não tinha piscina. Tinha mangueira.', 'Sabe, Ratão... você é um bom filho.']));
    await R.falar(pick(['Valeu, pai.', 'Mesmo com o muro?']));
    await B.falar(pick(['...mesmo com o muro.', 'Não força.']));
    R.pose('dormirSentado');
    await R.dormir(3);
    B.pose('dormirSentado');
    await h.juntos(R.dormir(4), B.dormir(4));
  },
});
