# Ratão & Manda Brasa

Página web animada no espírito dos screen savers dos anos 90.

### ▶ [Assistir agora: dgessner.github.io/ratao_manda_brasa](https://dgessner.github.io/ratao_manda_brasa/)

Dicas: `F` tela cheia · `N` próxima história · para ver uma história específica, use por exemplo [`?historia=lavajato`](https://dgessner.github.io/ratao_manda_brasa/?historia=lavajato).

O **Ratão** e o pai dele, o **Manda Brasa**, moram numa casa de 2 andares com piscina e passam o dia consertando tudo o que quebra. E quebrando de novo.

Tudo é desenhado por código em Canvas 2D, sem imagens e sem build. Para rodar localmente, abra o `index.html` no navegador. Funciona direto pelo `file://`.

## Como funciona
- A casa tem **estado**: luz, muro, cano, carro, sujeira do piso e o lava-jato. Ele fica salvo no navegador, e um estrago puxa o conserto. Sem luz, aparece "Cadê a Luz?"; muro no chão, "Levantando o Muro"; carro torrado, "Chama o Guincho"; lava-jato na piscina, "Pescando o Lava-Jato".
- Os dois personagens agem juntos ou em paralelo, cada um com o seu balão de fala.
- O céu segue o relógio real. À noite as janelas, a arandela e a piscina acendem, a não ser que tenha faltado luz.

## Histórias
| Manutenção | Carro | Lazer |
|---|---|---|
| Curto-Circuito (choque em raio-X) | Problema no Carro: fumaça, capô, "liga aí, pai!", **fogo**, extintor (primeiro no pai) | Manda Brasa!: churrasco com álcool, adeus sobrancelha |
| Cadê a Luz? (quadro de luz, às vezes choque no pai) | Chama o Guincho | Bombaaa!: pulo na piscina molhando o pai |
| Estourou o Cano (espirra na cara, registro, silver tape) | | Noite no Quintal |
| Cai o Muro / Levantando o Muro | | Selfie na Piscina |
| A Antena (acerta o canal... e cai do telhado na piscina) | | |
| **O Lava-Jato**: sem pressão → pressão demais → funciona → cai na piscina → falta luz → olha o bico e toma um banho | | |
| Pescando o Lava-Jato | | |

## Controles
`N` próxima história · `F` ou duplo clique tela cheia · `P`/espaço pausa · `T` adianta 1 hora · `H` esconde o HUD.

## Parâmetros de URL (para testes)
`?hora=21` · `?historia=lavajato` (repete sempre a mesma) · `?novo` (ignora o estado salvo) · `?vel=4` · `?avancar=30`.

## Adicionando historinhas
Em `js/historias/extras.js` (que já tem um modelo comentado) ou num arquivo novo em `js/historias/`, incluído no `index.html`:

```js
registrarHistoria({
  id: 'pizza', nome: 'Pizza de Domingo', quando: NOITE, peso: 1,
  pode: () => Casa.energia,
  async rodar() {
    await h.juntos(R.andar(400), B.andar(470));
    h.encarar();
    await B.falar('Ratão, pede uma pizza!');
    Ratao.acessorio = 'celular';
    R.pose('celular');   // qualquer pose de POSES
    await R.falar('Alô? Uma grande de calabresa!');
    await B.furia(2);    // pula de raiva
  },
});
```

**Atores:** `R` (Ratão) e `B` (Manda Brasa) têm `andar(x)`, `correr(x)`, `fugir(x)`, `falar(txt)`, `pensar(txt)`, `gritar(txt)`/`calar()`, `exclamar()`, `pular()`, `furia(n)`, `dormir(seg)`, `arco(x, y)`, `cairNaPiscina(x)`, `sairDaPiscina()`, `pose(nome)`, `virar(dir)`, `olharPara(x ou personagem)`.
**Geral (`h`):** `esperar(seg)`, `juntos(...)`, `tween(obj, props, seg)`, `quando(() => cond)`, `add(entidade)`, `encarar()`.
**Personagens (`Ratao`, `Brasa`):** `acessorio` (chave, martelo, lanterna, fita, pistola, extintor, balde, jornal, pegador, garrafa, celular, refri, tijolos, colher), `chamuscado`, `choque`, `molhado`, `tonto`, `vermelho`, `oculto`.
**Casa:** `Casa.energia`, `muro`, `cano`, `sujeira`, `brasa`, `antena`, além de `Lavajato` e `Carro` (com `fogo`, `capo`, `estado`, `motorista`).

## Estrutura
```
index.html
js/util.js, js/motor.js         utilitários e motor de roteiro (esperar, tween, abortar)
js/cenario.js                   relógio, céu, morros, gramado
js/personagem.js                classe Personagem + visuais do Ratão e do Manda Brasa
js/casa.js                      casa, piscina, muro, quadro, cano, churrasqueira, lava-jato, carro
js/entidades.js                 partículas, escada, raio, guincho
js/historias/base.js            registrarHistoria(), atores R e B, comportamento à toa
js/historias/manutencao.js      luz, cano, muro, antena, lava-jato
js/historias/carro.js           carro e guincho
js/historias/lazer.js           churrasco, piscina, noite
js/historias/extras.js          modelo + historinhas novas
js/principal.js                 loop, sorteio, HUD, teclado, salvar
```
