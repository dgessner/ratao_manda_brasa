'use strict';
// Espaço para novas historinhas. Copie o modelo abaixo, mude o id/nome e escreva o roteiro.
//
// registrarHistoria({
//   id: 'minha_historia',            // único; serve para ?historia=minha_historia
//   nome: 'Título que aparece',      // mostrado na tela quando a história começa
//   quando: SEMPRE,                  // DIA, NOITE ou SEMPRE
//   peso: 1,                         // chance relativa de ser sorteada (pode ser função)
//   pode: () => Casa.energia,        // condição sobre a casa/hora (opcional)
//   async rodar() {
//     await h.juntos(R.andar(400), B.andar(480));  // os dois andam ao mesmo tempo
//     h.encarar();                                 // um olha para o outro
//     await B.falar('Ratão, vem cá!');             // B = Manda Brasa, R = Ratão
//     R.pose('cocar');                             // poses em js/personagem.js (POSES)
//     await R.pensar('Lá vem...');
//     Ratao.acessorio = 'chave';                   // acessórios em desenharAcessorio()
//     await B.furia(3);                            // pula de raiva
//   },
// });

registrarHistoria({
  id: 'selfie', nome: 'Selfie na Piscina', peso: 1.2, quando: DIA,
  async rodar() {
    await h.juntos(R.andar(PISCINA.x0 + 4), B.andar(440));
    R.virar(-1);
    Ratao.acessorio = 'celular';
    R.pose('selfie');
    await R.falar('Só uma selfie pra rede social...');
    await R.falar('Um pouquinho mais pra trás...');
    R.pose('andar');
    await h.tween(Ratao, { x: PISCINA.x0 + 20 }, 0.8, Ease.linear);
    R.exclamar('!');
    await R.cairNaPiscina(PISCINA.x0 + 40, 'assustado', 12);
    Ratao.acessorio = null;
    B.olharPara(Ratao);
    B.pose('rir');
    await B.falar('KKKKKKKK', 1.6);
    await R.falar('Pelo menos o celular é à prova d\'água...');
    await R.pensar('...não era.');
    await R.sairDaPiscina();
  },
});
