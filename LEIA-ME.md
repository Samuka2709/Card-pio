# Cardápio digital — guia de personalização

## Para um novo estabelecimento, edite só `js/config.js`
1. `estabelecimento`: nome, descrição, endereço, link do Google Maps, WhatsApp (só dígitos, com 55 e DDD), Instagram, pagamentos.
2. `horarios`: turnos por dia (0 = domingo). Fim menor que início passa da meia-noite.
3. `modalidades`: taxa em centavos; `null` mostra "a confirmar".
4. `tema`: cores e fontes (Google Fonts).
5. `categorias` e `produtos`. Preços sempre em centavos.
6. Troque `demonstracao` para `false` quando os dados forem reais.
7. A cada atualização publicada, aumente o `?v=1` em `index.html` (ex.: `?v=2`) para os celulares não mostrarem preços antigos guardados em cache.

## Produtos
- `grupos`: variações e adicionais. `min: 1` torna obrigatório; `max: 1` vira escolha única.
- Cada opção soma `preco` ao preço base. Pizza por tamanho: preço base 0 e o valor em cada tamanho.
- `destaque: true` mostra card grande. `maisPedido: true` entra em "Mais pedidos". `precoOriginal` entra em "Promoções".
- `disponivel: false` mostra como indisponível e impede o pedido.
- Categorias sem produtos não aparecem.

## Fotos
- A demonstração usa fotos ilustrativas do Unsplash (licença livre) com o selo "Imagem ilustrativa". Com fotos reais do cliente, troque `fotosIlustrativas` para `false`.
- Coloque as fotos reais em `img/` em WebP (quadradas de 320px para a lista; 800x450 para destaques) e informe o caminho em `foto`. Para o detalhe, `fotoGrande` (900x675) é opcional.
- `legendaFoto` vira o texto alternativo da imagem; descreva o prato.
- Sem foto, ou se a foto não carregar, aparece um espaço reservado com a legenda.

## Pix com valor exato
- Preencha `pix.chave`, `pix.nomeRecebedor` e `pix.cidade` no `config.js` e mantenha "Pix" na lista de `pagamentos`.
- Quando o cliente escolhe Pix no carrinho, aparecem o QR Code e o código copia e cola com o total do pedido.
- Cada pedido recebe um código (ex.: PED7K3AB) que aparece no carrinho, na mensagem do WhatsApp e no identificador do Pix. Para conferir, procure esse código e o valor no comprovante ou no extrato.
- O pagamento não é confirmado automaticamente: o estabelecimento confere no app do banco (vale ligar as notificações de Pix recebido) e o cliente envia o comprovante pelo WhatsApp. Nem todo banco mostra o identificador em Pix de QR fixo.
- Se a taxa de entrega for `null` (a confirmar), o código não é gerado, porque o valor final ainda não é conhecido.
- Antes de entregar ao cliente, faça um Pix de teste de R$ 0,01 lendo o QR com o app do banco e confira o nome do recebedor.

## Planilha do Google (o restaurante edita sem mexer em código)
1. Importe o arquivo `modelo-planilha.csv` no Google Planilhas (Arquivo > Importar).
2. Em Arquivo > Compartilhar > Publicar na web, escolha a aba e o formato CSV e copie o link.
3. Cole o link em `planilha.url` no `config.js`.
- Colunas: id, categoria, nome, descricao, preco (ex.: 32,90), preco_original, disponivel (sim/não), foto (link), destaque, mais_pedido, selos (separados por |).
- Um id que já existe no `config.js` atualiza o produto e mantém as opções (tamanhos, adicionais). Um id novo cria um produto simples, sem opções.
- Categoria nova na planilha vira uma categoria nova no cardápio.
- O Google leva alguns minutos para atualizar o CSV publicado. Se a planilha falhar, o cardápio usa a última cópia salva no celular ou o `config.js`.

## QR Code por mesa
- Abra `qrcodes.html` no site publicado (ex.: https://samuka2709.github.io/Card-pio/qrcodes.html), escolha o número de mesas e imprima.
- Cada QR abre o cardápio com `?mesa=N`: o pedido sai como "Consumo no local, Mesa N", sem pedir endereço nem horário.

## Entrega, horário e cupons
- `entrega.pedidoMinimo`: valor mínimo para entrega (centavos).
- `entrega.bairros`: taxa por bairro. Sem bairros, vale a `taxa` da modalidade Entrega.
- `entrega.quandoFechado`: "agendar" (cliente escolhe um horário do próximo expediente), "bloquear" (não envia) ou "avisar" (só informa).
- `cupons`: percentual ou valor fixo, com valor mínimo opcional. Os códigos ficam visíveis no código do site, então o restaurante deve conferir o desconto no pedido.

## Busca, selos e pedir de novo
- A busca procura no nome, descrição, categoria e selos, sem diferenciar acentos.
- `selos` nos produtos (vegetariano, sem-gluten, apimentado, novo) aparecem nos cards e viram filtros. Os nomes exibidos ficam em `selos` no `config.js`.
- Depois de enviar um pedido, o celular do cliente guarda o pedido e mostra "Pedir de novo" com os preços atuais.

## Instalar como app
- No celular, o navegador oferece "Adicionar à tela inicial". O app abre em tela cheia e mostra a última versão salva se estiver sem internet.
- Para outro cliente, troque o nome em `manifest.webmanifest` e os ícones em `img/icone-*.png`.
- A cada atualização, aumente o `?v=` no `index.html` e o `CACHE`/lista em `sw.js` com o mesmo número.

## Google
Com `demonstracao: false`, a página gera os dados estruturados (schema.org Restaurant, horários e cardápio com preços) a partir do `config.js`. Valide em https://search.google.com/test/rich-results depois de publicar.

## Rodar localmente
`python -m http.server 5173` nesta pasta e abra http://localhost:5173.
Publicação: qualquer hospedagem estática (Netlify, Vercel, GitHub Pages, hospedagem comum).

## Próximas versões (não implementadas)
Painel administrativo, estoque, pagamento online, QR por mesa, histórico e métricas. Os dados já estão separados da interface, então `config.js` pode ser trocado por uma chamada a uma API.
