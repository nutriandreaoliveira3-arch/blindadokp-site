---
name: skil-topclaudia-generic
description: "SKILL PREMIUM — segunda skill da SKILL BLINDADA PRO. Gera carrosséis Instagram 1080x1350 em HTML prontos pra virar PNG, usando as fotos do próprio comprador (anexadas direto na conversa). Sem Canva, sem redimensionar, sem ajuste manual de layout."
---

# CARROSSEL VISUAL — SKILL TOPCLAUDIA (VERSÃO PREMIUM)

## O QUE ESTA SKILL FAZ

Esta é a segunda skill do pacote SKILL BLINDADA PRO — só pra quem comprou a versão Premium. Ela cuida da parte visual: transforma o texto do carrossel (gerado com `/CARROSSEL` na skill-blindada-pro) numa peça pronta, com foto, no layout certo.

Fluxo completo do comprador:
1. `/CARROSSEL` (skill-blindada-pro) → recebe a estrutura dos 9 slides (texto).
2. `/CARROSSEL VISUAL` (esta skill) → recebe os 9 arquivos HTML prontos, com as próprias fotos.
3. Comprador converte cada HTML em PNG (ferramenta simples, fora da skill) e posta no Instagram.

Esta skill nunca gera PNG sozinha — ela entrega HTML. A conversão final é manual, porque o ambiente do comprador não tem o mesmo acesso técnico da criadora (sem automação de servidor, sem Google Drive).

---

## IDENTIDADE DA MARCA (perguntar uma vez, guardar pro resto da conversa)

Antes do primeiro carrossel da conversa, pergunte ao comprador (uma pergunta de cada vez, fechada):

1. Qual o nome/marca que aparece na assinatura dos slides?
2. Tem @ do Instagram pra incluir? (opcional)
3. Qual o CTA padrão do slide 9? (ex: "Comenta [PALAVRA]", "Manda mensagem", outro)
4. Qual dos 6 temas de cor quer usar? (mostre a lista da seção "Paleta de cores" abaixo; se não souber, use o Tema 1 — Dourado Premium — como padrão)

Guarde essas respostas e reutilize em todos os carrosséis seguintes da mesma conversa, sem perguntar de novo. Se o comprador voltar em outra conversa e colar essas informações, use-as direto. Se ele quiser trocar de tema no meio da conversa, é só pedir — não precisa refazer a identidade toda.

---

## REGRA ABSOLUTA — SEM CANVA

**Nunca usar Canva para carrosséis.**
O fluxo é: HTML → (comprador converte pra PNG fora da skill) → posta.
Sem redimensionar. Sem ajuste manual de layout. Sem Canva.

---

## PALETA DE CORES — 6 TEMAS PRONTOS (escolha 1 na identidade de marca)

Os templates abaixo usam 5 "variáveis" de cor. Pra aplicar um tema, troque cada valor pelo da coluna correspondente — os nomes de classe/CSS não mudam, só as cores.

| Tema | Fundo | Título/texto principal | Destaque/acento | Texto secundário (rgba) | Assinatura (rgba) |
|---|---|---|---|---|---|
| **1 — Dourado Premium** (padrão) | `#1C1C1C` | `#FFFFFF` | `#C9A227` | `rgba(255,255,255,.88)` | `rgba(255,255,255,.55)` |
| **2 — Rosé Elegante** | `#221A1C` | `#FDF6F5` | `#D9A5A0` | `rgba(253,246,245,.85)` | `rgba(253,246,245,.55)` |
| **3 — Verde Bem-Estar** | `#142019` | `#F3FBF6` | `#7FB77E` | `rgba(243,251,246,.85)` | `rgba(243,251,246,.55)` |
| **4 — Azul Clínico** | `#101B24` | `#F2F8FC` | `#4FA3D1` | `rgba(242,248,252,.85)` | `rgba(242,248,252,.55)` |
| **5 — Terracota Aconchegante** | `#221510` | `#FBF3EC` | `#C97B4A` | `rgba(251,243,236,.85)` | `rgba(251,243,236,.55)` |
| **6 — Branco Editorial** (fundo claro) | `#FFFFFF` | `#1C1C1C` | `#B8862F` | `rgba(28,28,28,.75)` | `rgba(28,28,28,.5)` |

Todos os elementos derivados de cor (badge bg, cards bg/borda, box de solução, borda de foto, box de CTA) usam a cor de **destaque** do tema escolhido — nos templates abaixo eles aparecem como `#C9A227` (Tema 1); pros outros 5 temas, troque `#C9A227` pelo destaque da linha correspondente em todo o HTML (incluindo dentro de `rgba(201,162,39,X)`, que é `#C9A227` em rgba — recalcule o rgba equivalente do novo destaque mantendo a mesma opacidade `X`).

**Como escolher:** pergunte na identidade de marca (seção acima) qual tema o comprador quer, ou sugira com base na área dele — Tema 4 (Azul Clínico) combina com médicos/psicólogos, Tema 3 (Verde Bem-Estar) com nutrição/bem-estar, Tema 2 (Rosé) e Tema 5 (Terracota) com estética/atendimento mais acolhedor, Tema 1 (Dourado) e Tema 6 (Branco Editorial) são neutros pra qualquer área.

**Atenção no Tema 6 (fundo claro):** ele inverte a lógica dos outros 5 — texto escuro em vez de claro. Troque `#1C1C1C` (fundo) por `#FFFFFF`, `#FFFFFF` (texto) por `#1C1C1C`, e toda cor `rgba(255,255,255,X)` do texto secundário/assinatura por `rgba(28,28,28,X)` com a mesma opacidade.

O comprador também pode customizar a cor livremente além dos 6 temas prontos (ver seção "Personalizações" abaixo) — isso não quebra o layout, só muda a aparência.

---

## TIPOGRAFIA (padrão — pode ser customizada)

```
Título principal h1/h2:   90px   Georgia bold       #FFFFFF
Subtítulo / intro:        52px   Arial regular      rgba(255,255,255,.88)
Corpo dos itens li:       44px   Arial regular      rgba(255,255,255,.92)
Solução texto:            40px   Arial regular      rgba(255,255,255,.95)
Badge / tag topo:         28px   Arial bold         #1C1C1C  bg #C9A227
Cards título:             30px   Arial bold         #C9A227
Cards corpo:              38px   Arial regular      rgba(255,255,255,.88)
Assinatura rodapé:        28px   Arial regular      rgba(255,255,255,.55)
CTA (palavra-chave):     110px   Georgia bold       #C9A227
Instrução CTA:             38px   Arial regular      rgba(255,255,255,.88)
```

### Tamanhos de fonte seguros (nunca ultrapassar — evita corte de texto)

| Elemento       | Máximo seguro |
|----------------|---------------|
| H1 capa        | 84px          |
| H2 conteúdo    | 76px          |
| Intro          | 42px          |
| Bullets        | 38px          |
| Cards corpo    | 34px          |
| CTA (palavra)  | 96px          |
| Instrução CTA  | 34px          |
| Assinatura     | 24px          |

---

## FORMATO E LAYOUT

- **Dimensão:** 1080 × 1350 px (vertical Instagram)
- **Fundo:** cor de fundo padrão em todos os slides
- **Estrutura base:** foto + conteúdo, layout varia conforme a seção "Layouts" abaixo
- **Foto:** object-fit cover, sempre nítida, sem distorcer
- **Todos os 9 slides têm foto do comprador** — sem exceção

---

## FOTOS — COMO FUNCIONA (sem Google Drive, sem banco de imagens)

Diferente da versão interna usada pela criadora, esta skill **não tem acesso a nenhum banco de fotos**. As fotos vêm sempre do próprio comprador:

1. Antes de gerar o primeiro carrossel, peça ao comprador **9 a 12 fotos próprias** (retrato, boa iluminação, variedade de ângulos/roupas/cenários).
2. O comprador anexa as fotos direto na conversa.
3. Use as fotos anexadas, na ordem/variedade que fizer sentido pro tema do carrossel.
4. **Nunca** repetir a mesma foto em slides consecutivos (slide N ≠ slide N+1) — pode repetir no mesmo carrossel se não for consecutiva.
5. **Nunca** usar foto de banco de imagem, stock photo, ou de qualquer pessoa que não seja o próprio comprador.
6. Capa (slide 1) e CTA (slide 9) — priorizar as fotos de maior autoridade/impacto entre as anexadas.

Se o comprador não anexar fotos suficientes, peça o que falta antes de gerar — nunca invente ou substitua por imagem genérica.

---

## ESTRUTURA DOS 9 SLIDES

| Slide | Tipo            | Conteúdo                                      |
|-------|-----------------|-----------------------------------------------|
| 1     | CAPA            | Tag + H1 grande + subtítulo + assinatura      |
| 2     | TEXTO + CARDS   | H2 + intro + 3 cards informativos             |
| 3     | FOTO + ITENS    | Badge erro + H2 + lista bullets + solução     |
| 4     | TEXTO + CARDS   | H2 + intro + 3 cards informativos             |
| 5     | FOTO + ITENS    | Badge erro + H2 + lista bullets + solução     |
| 6     | TEXTO + CARDS   | H2 + intro + 3 cards informativos             |
| 7     | FOTO + ITENS    | Badge erro + H2 + lista bullets + solução     |
| 8     | TEXTO + CARDS   | H2 + intro + 4 cards (o que funciona)         |
| 9     | CTA             | Tag + H2 + resultado + box CTA + assinatura   |

---

## TEMPLATES HTML

### TEMPLATE A — FOTO + ITENS (slides 3, 5, 7)

```html
<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1350px;overflow:hidden;background:#1C1C1C;font-family:Georgia,serif;}
.slide{width:1080px;height:1350px;display:flex;}
.foto{width:340px;min-width:340px;height:1350px;overflow:hidden;border-right:5px solid #C9A227;}
.foto img{width:100%;height:100%;object-fit:cover;object-position:center top;}
.dir{flex:1;min-width:0;overflow:hidden;display:flex;flex-direction:column;justify-content:center;padding:40px 38px;}
.dir *{word-wrap:break-word;overflow-wrap:break-word;max-width:100%;}
.badge{display:inline-block;background:#C9A227;color:#1C1C1C;font:700 28px/1 Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;padding:10px 20px;margin-bottom:22px;}
h2{font:700 76px/1.0 Georgia,serif;color:#FFF;margin-bottom:20px;}
h2 span{color:#C9A227;}
ul{list-style:none;margin-bottom:18px;}
ul li{font:400 38px/1.4 Arial,sans-serif;color:rgba(255,255,255,.92);padding:10px 0 10px 30px;border-bottom:1px solid rgba(255,255,255,.1);position:relative;}
ul li::before{content:'';position:absolute;left:0;top:24px;width:14px;height:14px;background:#C9A227;border-radius:50%;}
.sol{background:rgba(201,162,39,.1);border:1px solid rgba(201,162,39,.5);padding:18px 22px;margin-top:6px;}
.sol-t{font:700 28px/1 Arial,sans-serif;letter-spacing:.15em;color:#C9A227;text-transform:uppercase;margin-bottom:8px;}
.sol-d{font:400 34px/1.35 Arial,sans-serif;color:rgba(255,255,255,.95);}
.sol-d span{color:#C9A227;}
.ass{font:400 24px/1 Arial,sans-serif;letter-spacing:.1em;color:rgba(255,255,255,.55);text-transform:uppercase;margin-top:18px;}
.ass b{color:rgba(201,162,39,.8);}
</style></head><body><div class="slide">
<div class="foto"><img src="[FOTO_DO_COMPRADOR]"/></div>
<div class="dir">
  <div class="badge">[BADGE ex: Erro 1 de 5]</div>
  <h2>[TITULO] <span>[TITULO_EM_DESTAQUE]</span></h2>
  <ul>
    <li>[ITEM 1]</li>
    <li>[ITEM 2]</li>
    <li>[ITEM 3]</li>
  </ul>
  <div class="sol">
    <div class="sol-t">✓ Solução</div>
    <div class="sol-d"><span>[PALAVRA_CHAVE]</span> [resto da solução]</div>
  </div>
  <div class="ass"><b>[MARCA]</b></div>
</div></div></body></html>
```

### TEMPLATE B — TEXTO + CARDS (slides 2, 4, 6, 8)

```html
<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1350px;overflow:hidden;background:#1C1C1C;font-family:Georgia,serif;}
.slide{width:1080px;height:1350px;display:flex;}
.foto{width:300px;min-width:300px;height:1350px;overflow:hidden;border-right:5px solid #C9A227;}
.foto img{width:100%;height:100%;object-fit:cover;object-position:center top;}
.dir{flex:1;min-width:0;overflow:hidden;display:flex;flex-direction:column;justify-content:center;padding:42px 44px;}
.dir *{word-wrap:break-word;overflow-wrap:break-word;max-width:100%;}
h2{font:700 76px/1.0 Georgia,serif;color:#FFF;margin-bottom:16px;}
h2 span{color:#C9A227;}
.intro{font:400 42px/1.35 Arial,sans-serif;color:rgba(255,255,255,.88);margin-bottom:22px;}
.card{background:rgba(201,162,39,.08);border-left:6px solid #C9A227;padding:16px 20px;margin-bottom:14px;}
.ct{font:700 30px/1 Arial,sans-serif;letter-spacing:.12em;color:#C9A227;text-transform:uppercase;margin-bottom:6px;}
.cd{font:400 34px/1.35 Arial,sans-serif;color:rgba(255,255,255,.88);}
.linha{width:52px;height:3px;background:#C9A227;margin:18px 0 12px;}
.ass{font:400 24px/1 Arial,sans-serif;letter-spacing:.1em;color:rgba(255,255,255,.55);text-transform:uppercase;}
.ass b{color:rgba(201,162,39,.8);}
</style></head><body><div class="slide">
<div class="foto"><img src="[FOTO_DO_COMPRADOR]"/></div>
<div class="dir">
  <h2>[TITULO] <span>[TITULO_EM_DESTAQUE]</span></h2>
  <div class="intro">[SUBTÍTULO/INTRO]</div>
  <div class="card"><div class="ct">[TÍTULO CARD 1]</div><div class="cd">[TEXTO CARD 1]</div></div>
  <div class="card"><div class="ct">[TÍTULO CARD 2]</div><div class="cd">[TEXTO CARD 2]</div></div>
  <div class="card"><div class="ct">[TÍTULO CARD 3]</div><div class="cd">[TEXTO CARD 3]</div></div>
  <div class="linha"></div>
  <div class="ass"><b>[MARCA]</b> [• @INSTAGRAM, se houver]</div>
</div></div></body></html>
```

### TEMPLATE C — CAPA (slide 1)

```html
<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1350px;overflow:hidden;background:#1C1C1C;font-family:Georgia,serif;}
.slide{width:1080px;height:1350px;display:flex;}
.foto{width:420px;min-width:420px;height:1350px;overflow:hidden;border-right:5px solid #C9A227;}
.foto img{width:100%;height:100%;object-fit:cover;object-position:center top;}
.dir{flex:1;min-width:0;overflow:hidden;display:flex;flex-direction:column;justify-content:center;padding:60px 50px;}
.dir *{word-wrap:break-word;overflow-wrap:break-word;max-width:100%;}
.tag{font:700 32px/1 Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#C9A227;margin-bottom:32px;}
h1{font:700 84px/1.0 Georgia,serif;color:#FFF;margin-bottom:28px;}
h1 span{color:#C9A227;}
.sub{font:400 italic 42px/1.35 Arial,sans-serif;color:rgba(255,255,255,.88);margin-bottom:44px;}
.linha{width:56px;height:4px;background:#C9A227;margin-bottom:24px;}
.ass{font:400 24px/1 Arial,sans-serif;letter-spacing:.12em;color:rgba(255,255,255,.55);text-transform:uppercase;}
.ass b{color:rgba(201,162,39,.8);}
</style></head><body><div class="slide">
<div class="foto"><img src="[FOTO_DO_COMPRADOR]"/></div>
<div class="dir">
  <div class="tag">[MARCA] • [ÁREA/PROFISSÃO]</div>
  <h1><span>[PALAVRA_ÂNCORA]</span> [resto do título]</h1>
  <div class="sub">[SUBTÍTULO — frase de impacto]</div>
  <div class="linha"></div>
  <div class="ass"><b>[MARCA]</b></div>
</div></div></body></html>
```

### TEMPLATE D — CTA (slide 9)

```html
<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1350px;overflow:hidden;background:#1C1C1C;font-family:Georgia,serif;}
.slide{width:1080px;height:1350px;display:flex;}
.foto{width:390px;min-width:390px;height:1350px;overflow:hidden;border-right:5px solid #C9A227;}
.foto img{width:100%;height:100%;object-fit:cover;object-position:center top;}
.dir{flex:1;min-width:0;overflow:hidden;display:flex;flex-direction:column;justify-content:center;padding:58px 46px;}
.dir *{word-wrap:break-word;overflow-wrap:break-word;max-width:100%;}
.tag{font:700 32px/1 Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#C9A227;margin-bottom:24px;}
h2{font:700 76px/1.0 Georgia,serif;color:#FFF;margin-bottom:18px;}
h2 span{color:#C9A227;}
.res{font:400 38px/1.4 Arial,sans-serif;color:rgba(255,255,255,.88);margin-bottom:28px;}
.cta{background:rgba(201,162,39,.12);border:3px solid #C9A227;padding:28px 26px;text-align:center;margin-bottom:24px;}
.cta-p{font:700 96px/1 Georgia,serif;color:#C9A227;display:block;margin-bottom:12px;}
.cta-i{font:400 34px/1.4 Arial,sans-serif;color:rgba(255,255,255,.88);}
.linha{width:56px;height:3px;background:#C9A227;margin-bottom:16px;}
.ass{font:400 24px/1 Arial,sans-serif;letter-spacing:.1em;color:rgba(255,255,255,.55);text-transform:uppercase;}
.ass b{color:rgba(201,162,39,.8);}
</style></head><body><div class="slide">
<div class="foto"><img src="[FOTO_DO_COMPRADOR]"/></div>
<div class="dir">
  <div class="tag">[MARCA] • [ÁREA/PROFISSÃO]</div>
  <h2>[TITULO] <span>[TITULO_EM_DESTAQUE]</span></h2>
  <div class="res">[TEXTO de resultado/prova social — sem prometer resultado clínico específico]</div>
  <div class="cta">
    <span class="cta-p">[CTA_DA_IDENTIDADE_DE_MARCA]</span>
    <div class="cta-i">[instrução do CTA — ex: "Comenta aqui embaixo e eu te mando"]</div>
  </div>
  <div class="linha"></div>
  <div class="ass"><b>[MARCA]</b> • [ÁREA/PROFISSÃO]</div>
</div></div></body></html>
```

---

## LAYOUTS ALTERNATIVOS (L1–L6)

**Regra:** nunca usar o mesmo layout em todos os slides do carrossel — escolher 1 layout dominante e variar nos slides de conteúdo. Sempre manter o CSS anti-overflow abaixo, em qualquer layout.

### CSS ANTI-OVERFLOW — obrigatório em todos os slides

```css
* { margin:0; padding:0; box-sizing:border-box; }
body { width:1080px; height:1350px; overflow:hidden; background:#1C1C1C; }
.slide { width:1080px; height:1350px; display:flex; overflow:hidden; }
.dir {
  flex:1;
  min-width:0;          /* CRÍTICO — impede overflow flex */
  overflow:hidden;
  display:flex;
  flex-direction:column;
  justify-content:center;
}
.dir * { word-wrap:break-word; overflow-wrap:break-word; max-width:100%; }
```

### LAYOUT 1 — FOTO TOPO (capa impacto máximo)
```css
.slide { flex-direction:column; }
.foto-area { height:810px; position:relative; overflow:hidden; flex-shrink:0; }
.foto-area img { width:100%; height:100%; object-fit:cover; object-position:top center; }
.foto-area::after {
  content:''; position:absolute; bottom:0; left:0; right:0; height:350px;
  background:linear-gradient(to bottom, transparent, #1C1C1C);
}
.conteudo { flex:1; padding:32px 70px 48px; display:flex; flex-direction:column; justify-content:center; overflow:hidden; }
```

### LAYOUT 2 — FOTO LATERAL LARGA (55% esq, gradiente diagonal)
```css
.slide { flex-direction:row; }
.foto { width:580px; min-width:580px; height:1350px; position:relative; overflow:hidden; }
.foto img { width:100%; height:100%; object-fit:cover; object-position:center top; }
.foto::after {
  content:''; position:absolute; top:0; right:0; bottom:0; width:150px;
  background:linear-gradient(to right, transparent, #1C1C1C);
}
.dir { flex:1; min-width:0; padding:65px 50px 65px 10px; overflow:hidden; }
```

### LAYOUT 3 — FOTO RODAPÉ (conteúdo topo, foto emerge do fundo)
```css
.slide { flex-direction:column; }
.conteudo { height:720px; padding:65px 75px 40px; display:flex; flex-direction:column; justify-content:center; flex-shrink:0; overflow:hidden; }
.foto-area { flex:1; position:relative; overflow:hidden; }
.foto-area::before {
  content:''; position:absolute; top:0; left:0; right:0; height:130px; z-index:1;
  background:linear-gradient(to bottom, #1C1C1C, transparent);
}
.foto-area img { width:100%; height:100%; object-fit:cover; object-position:top center; }
```

### LAYOUT 4 — FOTO FULL BACKGROUND (impacto total — melhor para capa e CTA)
```css
.slide { position:relative; }
.foto-bg { position:absolute; inset:0; }
.foto-bg img { width:100%; height:100%; object-fit:cover; object-position:center top; }
.foto-bg::after {
  content:''; position:absolute; inset:0;
  background:linear-gradient(to bottom, rgba(28,28,28,.15) 0%, rgba(28,28,28,.6) 50%, rgba(28,28,28,.97) 100%);
}
.conteudo { position:absolute; bottom:0; left:0; right:0; padding:0 72px 72px; z-index:2; }
```

### LAYOUT 5 — DIAGONAL (texto topo recortado, foto baixo)
```css
.slide { flex-direction:column; }
.topo {
  height:490px; padding:55px 70px 60px; display:flex; flex-direction:column; justify-content:flex-end;
  background:#1C1C1C; flex-shrink:0; position:relative; z-index:2;
  clip-path:polygon(0 0, 100% 0, 100% 82%, 0 100%);
}
.foto-baixo { flex:1; position:relative; overflow:hidden; margin-top:-60px; }
.foto-baixo img { width:100%; height:100%; object-fit:cover; object-position:top center; }
.foto-baixo::before {
  content:''; position:absolute; top:0; left:0; right:0; height:120px; z-index:1;
  background:linear-gradient(to bottom, #1C1C1C, transparent);
}
```

### LAYOUT 6 — EDITORIAL (texto esquerda 60%, foto direita 40%)
```css
.slide { flex-direction:row; }
.dir { width:648px; min-width:648px; padding:75px 60px 75px 70px; display:flex; flex-direction:column; justify-content:center; overflow:hidden; }
.foto { flex:1; height:1350px; overflow:hidden; border-left:5px solid #C9A227; }
.foto img { width:100%; height:100%; object-fit:cover; object-position:center top; }
```

### Layout por tipo de slide (sugestão)
| Slide | Layout preferido |
|-------|-------------------|
| 1 Capa | L4 ou L1 |
| 2 Info | L2 ou L6 |
| 3 Erro | L3 ou L5 |
| 4 Info | L6 ou L2 |
| 5 Erro | L1 ou L4 |
| 6 Info | L3 ou L5 |
| 7 Erro | L2 ou L6 |
| 8 Solução | L4 ou L1 |
| 9 CTA | L4 ou L1 — foto grande, impactante |

---

## PERSONALIZAÇÕES (sem refazer tudo)

O comprador pode ajustar o resultado depois, sem gerar tudo de novo:
- **Mudar cor de destaque** (ex: pra rosa): buscar `#C9A227` e substituir por outra cor.
- **Mudar cor de fundo** (ex: pra branco): buscar `#1C1C1C` e substituir por outra cor.
- **Mudar tamanho de fonte**: buscar o valor em `px` e substituir (respeitando os tamanhos seguros acima).
- **Mudar fonte**: buscar `Georgia` ou `Arial` e substituir.

Onde fazer: abrir o HTML num editor de texto simples → buscar e substituir → salvar → atualizar no navegador.

---

## FLUXO COMPLETO — DO COMANDO AO HTML

Quando o comprador pedir `/CARROSSEL VISUAL`:

1. Se ainda não tiver a identidade de marca da conversa, perguntar (seção "Identidade da marca" acima).
2. Confirmar se já tem o texto dos 9 slides (do `/CARROSSEL` da skill-blindada-pro) ou pedir o tema/conteúdo direto.
3. Confirmar se as fotos já foram anexadas; se não, pedir 9 a 12 fotos do próprio comprador.
4. Montar os 9 HTMLs usando os templates (A/B/C/D) e um layout dominante (L1–L6), preenchendo `[MARCA]`, `[CTA_DA_IDENTIDADE_DE_MARCA]` e as fotos anexadas.
5. Entregar os 9 arquivos HTML.
6. Lembrar o comprador do próximo passo: abrir cada HTML no navegador → converter em PNG (ex: htmltopng.com, ou Print Screen) → postar na ordem 01 a 09.

Esta skill **nunca gera o PNG final sozinha** — isso é feito pelo comprador, fora da conversa, com uma ferramenta simples.

---

## REGRAS DE CONTEÚDO

- Zero palavras em inglês
- Zero nomes de autores externos
- Zero URLs externas nos slides
- Nunca repetir texto do carrossel na legenda — ângulo diferente
- Card 1 = capa forte que para o scroll
- Cards 2–3 = problema que o público reconhece
- Cards 4–8 = conteúdo com dado/solução
- Card 9 = CTA definido na identidade de marca do comprador
- Máximo 7 palavras por linha na capa
- Máximo 3 itens por lista de bullets
- Nunca prometer resultado clínico/de saúde específico nos slides — isso é regra de conformidade ética da skill-blindada-pro e vale aqui também

---

## COMPORTAMENTO OBRIGATÓRIO

**PROIBIDO:**
- Pedir aprovação intermediária de layout
- Usar Canva para carrosséis
- Repetir foto em slides consecutivos
- Usar imagem de banco/stock, ou de qualquer pessoa que não seja o próprio comprador
- Deixar placeholder vazio na entrega final
- Prometer que a skill gera o PNG final sozinha — ela entrega HTML

**OBRIGATÓRIO:**
- Executar do início ao fim sem parar, uma vez com identidade de marca e fotos em mãos
- Entregar os 9 arquivos HTML prontos pra abrir no navegador
- Variar fotos a cada carrossel, sem repetir em slides adjacentes
- Tipografia dentro dos tamanhos seguros
- CTA da identidade de marca sempre no slide 9
- Foto do comprador em todos os 9 slides

---

## LIMITES DA SKILL (uso pessoal do comprador — não é falha, é por design)

- É pra uso do próprio comprador da versão Premium, não pra revenda.
- Não compartilhar o arquivo desta skill com terceiros.
- Mudar o padrão HTML/CSS por conta própria pode quebrar o layout — mudanças de cor/fonte/tamanho (seção "Personalizações") são seguras; mudar a estrutura dos 9 slides ou o CSS anti-overflow não é recomendado.
- Esta skill não gera PNG, não substitui orientação jurídica/de conselho profissional, e não dá conduta clínica — ela só cuida da parte visual do carrossel.
