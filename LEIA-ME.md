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
- O pagamento não é confirmado automaticamente: o estabelecimento confere no app do banco e o cliente envia o comprovante pelo WhatsApp.
- Se a taxa de entrega for `null` (a confirmar), o código não é gerado, porque o valor final ainda não é conhecido.
- Antes de entregar ao cliente, faça um Pix de teste de R$ 0,01 lendo o QR com o app do banco e confira o nome do recebedor.

## Google
Com `demonstracao: false`, a página gera os dados estruturados (schema.org Restaurant, horários e cardápio com preços) a partir do `config.js`. Valide em https://search.google.com/test/rich-results depois de publicar.

## Rodar localmente
`python -m http.server 5173` nesta pasta e abra http://localhost:5173.
Publicação: qualquer hospedagem estática (Netlify, Vercel, GitHub Pages, hospedagem comum).

## Próximas versões (não implementadas)
Painel administrativo, estoque, pagamento online, QR por mesa, histórico e métricas. Os dados já estão separados da interface, então `config.js` pode ser trocado por uma chamada a uma API.
