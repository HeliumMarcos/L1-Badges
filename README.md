# L1-Badges — Nuvio TV

Importação de badges com imagens transparentes. URL pública:

`https://raw.githubusercontent.com/HeliumMarcos/L1-Badges/main/badges.json`

No Nuvio Android TV/Google TV, atualize/reimporte essa URL na configuração de
badges. Uma importação já salva pode manter a versão anterior até ser atualizada.
Não importe ao mesmo tempo outra lista equivalente para evitar badges repetidos.
Os nomes dos menus variam conforme a versão do aplicativo.

## Coleção metálica — publicação por famílias

A URL principal passa a usar as novas imagens em `Badges/v2/` à medida que
cada família é concluída e revisada. IDs e grupos anteriores são preservados.
Além das novas URLs, a separação Dolby abaixo altera somente os cinco filtros
individuais e desativa os quatro combos. As outras expressões são preservadas. As imagens anteriores continuam
no repositório e a lista anterior está em `badges-legacy.json`.

Os PNGs para TV mantêm transparência, têm até 960×240 pixels e são
redimensionados/compactados localmente com autorização do usuário.
As imagens grandes selecionadas ficam em `Originals/metallic-v2/`.
O progresso e o brief de cada uma das 76 imagens estão em
`design/metallic-v2.json`. Prata/cromo e dourado seguem o DTS-HD aprovado;
cores oficiais são preservadas em marcas como TrueHD e nas plataformas.
As artes metálicas são geradas pela ferramenta de imagens integrada, uma por badge.
Disney+ usa diretamente o PNG aprovado e enviado pelo usuário: letras brancas
e arco azul/turquesa, sem recriar ou alterar o desenho. O original é preservado
sem mudanças; somente a versão para TV tem as margens transparentes removidas
antes do redimensionamento e da compactação. Essa otimização é reproduzível com
`node scripts/optimize-metallic.cjs stream-disney.png`, usando `sharp`.
Na família Dolby, o usuário autorizou reutilizar o cabeçalho aprovado por
processamento local: símbolo duplo-D e palavra DOLBY são idênticos nos oito
badges, mudando somente o texto dourado. O original aprovado e as camadas
ficam em `Originals/references/` e `Originals/dolby-labels/`; as versões
anteriores estão preservadas em `Originals/variants/`.

As imagens Dolby padronizadas usam `Badges/v2/dolby-unified/`, uma URL nova
para evitar aproveitar imagens anteriores em cache. Com `sharp` disponível,
`node scripts/validate-dolby.cjs` compara os pixels dos cabeçalhos nos
oito originais e nas oito versões otimizadas. Para remontar usando as
camadas salvas: `node scripts/compose-dolby.cjs --rebuild`, seguido de
`node scripts/optimize-metallic.cjs` com os oito nomes da família.

Estado da coleção: **76 imagens concluídas e publicadas**: 75 metálicas, incluindo
Movies Anywhere, e a imagem Disney+ fornecida pelo usuário. Todas usam novas URLs
em `Badges/v2/`; as artes e a lista anteriores continuam preservadas.
O 4K usa o modelo sem moldura do 8K em `Badges/v2/4k-matched/`.

## Dolby — badges separados

Dolby Vision, Dolby Atmos, Dolby Digital, Dolby Digital Plus e TrueHD aparecem
individualmente, mesmo quando o arquivo reúne essas tecnologias. Por exemplo,
`2160p DV HDR10 DDP5.1 Atmos` mostra Vision, HDR10, Digital Plus, 5.1 e Atmos,
além da resolução, sem imagens combinadas. Atmos não presume DD+, TrueHD ou
canais, e Dolby Vision não oculta o codec de áudio.

Os quatro filtros `vis-*` permanecem na lista com `isEnabled: false` para
preservar seus IDs e desativá-los ao reimportar. Suas imagens e originais
continuam arquivados, mas não são exibidos. Há **75 filtros cadastrados,
71 ativos**. Reimporte a URL principal no Nuvio para aplicar essa mudança.

## Movies Anywhere — MA

Adicionado um filtro novo no grupo Streaming, totalizando **75 filtros**.
Reconhece `MA`, `Movies Anywhere` e `MoviesAnywhere` no trecho técnico do
nome, além do campo `📺 MA` entregue pelo Stream Helium. Ignora `MA` dentro
de `DTS-HD MA` e não confunde o filme `Ma (2019)` nem subtítulos de episódios.
Plataforma e Master Audio podem coexistir no mesmo arquivo.

Exemplo: `Filme (2026) MA 2160p WEB-DL DTS-HD MA 7.1 H.265.mkv` recebe
Movies Anywhere e DTS-HD Master Audio separadamente. O badge é inspirado
no [símbolo do site oficial](https://moviesanywhere.com/logo.png), com cromo
e detalhes metálicos azul/violeta. A referência está preservada em
`Originals/references/movies-anywhere-official.png`.

As expressões foram verificadas também em Java Pattern, usado pelo Nuvio:
`jjs -scripting scripts/validate-java-patterns.js -- badges.json`.

## Ampliação de 12/10/2026

- DTS-HD HR separado de DTS-HD MA e da família DTS-HD.
- PCM/LPCM, MP3, Vorbis/Ogg; VVC/H.266, VP9 e MPEG-2; HLG.
- 576p, 1080i e 8K/4320p; DVD sem presumir DVD RIP.
- Canais 1.0, 2.1, 3.0, 4.0, 4.1, 5.0, 6.0, 6.1, 5.1.2 e 7.1.4.
- Contagens explícitas como `10ch`. `8ch` não é automaticamente chamado 7.1:
  só a quantidade não informa a disposição nem a presença de LFE.
- Nomes concatenados, incluindo `DTS-HD.HR7.1`, `DTS-HD.MA7.1`, `FLAC2.0`,
  `Opus2.0`, `MP32.0` e `Vorbis2.0`.
- `DTS-X` e `DTS:X`; Atmos não substitui o codec-base.
- Regras específicas não ativam também a variante genérica de DTS-HD nem
  encurtam um layout 7.1.4 para 7.1. Fontes UHD Blu-ray não significam
  automaticamente uma resolução 2160p quando o nome informa 1080p.

Os 50 filtros anteriores e suas imagens foram preservados; a lista passa a
74 filtros naquela etapa. Os combos de Dolby Vision agora estão desativados,
conforme a seção de badges separados acima.

Exemplo confirmado nos testes, tanto no nome original quanto no título
formatado pelo Stream Helium:

```
O Caçador e a Rainha do Gelo (2016) 2160p BluRay Remux HDR10 DTS-HD.HR7.1 H.265 tt2381991.mkv
```

Resultado: **4K, Blu-ray, REMUX, HDR10, DTS-HD High Resolution, 7.1 e HEVC**.
Não recebe DTS-HD MA, Atmos ou Dolby Vision.

## Imagens

As imagens existentes não foram modificadas. Foram adicionados 24 PNGs:

- DTS-HD High Resolution: gerado com a ferramenta de imagens, usando
  `Badges/dts_hd.png` como referência de estilo, com transparência preservada.
- Marcadores tipográficos: novas ilustrações simples produzidas pelo código
  em `scripts/render-simple-badges.cjs`, seguindo os wordmarks brancos AAC/FLAC
  e os ícones de alto-falante da coleção. Não são edições dos PNGs existentes.

Brief da imagem gerada: badge horizontal transparente; texto principal
“dts-HD”, subtítulo “HIGH RESOLUTION AUDIO”; branco/prata e HD dourado;
sem “Master Audio”, números de canais ou fundo opaco.

Para reproduzir os marcadores simples, instale `@napi-rs/canvas` no ambiente
de desenvolvimento e execute `node scripts/render-simple-badges.cjs`.
O script recusa sobrescrever arquivos sem `--regenerate`, que só deve ser
usado para os arquivos gerados por ele.

## Verificação

`python -m unittest discover -s tests -v`

Os testes verificam JSON, expressões, arquivos de imagem, transparência das
novas imagens e casos reais. Os badges são identificação do que está escrito
no nome do arquivo, não uma inspeção do vídeo. Exibir VVC/H.266, HDR ou áudio
imersivo não faz uma TV sem suporte passar a decodificá-los.

Esquema e candidatos conferidos no código oficial do
[Nuvio TV](https://github.com/NuvioMedia/NuvioTV/blob/dev/app/src/main/java/com/nuvio/tv/core/streams/StreamBadgeRules.kt).
