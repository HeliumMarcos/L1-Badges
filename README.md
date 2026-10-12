# L1-Badges — Nuvio TV

Importação de badges com imagens transparentes. URL pública:

`https://raw.githubusercontent.com/HeliumMarcos/L1-Badges/main/badges.json`

No Nuvio Android TV/Google TV, atualize/reimporte essa URL na configuração de
badges. Uma importação já salva pode manter a versão anterior até ser atualizada.
Não importe ao mesmo tempo outra lista equivalente para evitar badges repetidos.
Os nomes dos menus variam conforme a versão do aplicativo.

## Coleção metálica — publicação por famílias

A URL principal passa a usar as novas imagens em `Badges/v2/` à medida que
cada família é concluída e revisada. Somente as URLs das imagens mudam;
IDs, expressões e grupos são preservados. As imagens anteriores continuam
no repositório e a lista anterior está em `badges-legacy.json`.

Os PNGs para TV mantêm transparência, têm até 960×240 pixels e são
redimensionados/compactados localmente com autorização do usuário.
As imagens grandes selecionadas ficam em `Originals/metallic-v2/`.
O progresso e o brief de cada uma das 75 imagens estão em
`design/metallic-v2.json`. Prata/cromo e dourado seguem o DTS-HD aprovado;
cores oficiais são preservadas em marcas como TrueHD e nas plataformas.
As artes são geradas pela ferramenta de imagens integrada, uma por badge.

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
74 filtros. Os combos de Dolby Vision continuam usando as imagens existentes.

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
