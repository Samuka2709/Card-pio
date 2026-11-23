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
1. Importe o arquivo `modelo-planilha.csv` no Google Planilhas (Arquivo > Importar), na conta do restaurante.
2. Clique em Compartilhar > Acesso geral > "Qualquer pessoa com o link" > papel **Leitor**. Nunca "Editor".
3. Copie o link da planilha e cole em `planilha.url` no `config.js`. O cardápio converte o link sozinho.
- Colunas: id, categoria, nome, descricao, preco (ex.: 32,90), preco_original, disponivel (sim/não), foto (link https), destaque, mais_pedido, selos (separados por |).
- Um id que já existe no `config.js` atualiza o produto e mantém as opções (tamanhos, adicionais). Um id novo cria um produto simples, sem opções.
- Categoria nova na planilha vira uma categoria nova no cardápio.
- As alterações aparecem quando o cliente abre ou recarrega o cardápio (o Google não guarda cópia em cache).
- Se a planilha falhar, o cardápio usa a última cópia salva no celular ou o `config.js`.

- Colunas opcionais de tradução: nome_en, descricao_en, nome_es, descricao_es.

### Aba "Avisos" (aviso do dia, feriados e horários)
1. Na mesma planilha, crie uma aba chamada exatamente **Avisos** e importe nela o `modelo-avisos.csv` (Arquivo > Importar > Inserir nova página).
2. Colunas: **chave** e **valor** (a coluna "como usar" é só explicação).
- `aviso`: texto da faixa no topo do cardápio. Apague para tirar. `aviso_en` e `aviso_es` são as versões traduzidas.
- `fechado`: "não" (normal), "sim" (fechado até mudar de novo, os pedidos ficam bloqueados) ou datas como `25/12, 01/01` (feriados e folgas; datas sem ano valem todo ano).
- `domingo` a `sabado`: horário do dia, ex.: `18:00-23:00`, `11:30-15:00, 18:00-23:00` ou `fechado`. Vazio usa o horário do `config.js`.
- Se a aba não existir, o cardápio ignora os avisos e segue normal.
- Avisos em outra planilha: cole o link dela em `planilha.avisos` no `config.js` (a demonstração usa uma planilha separada, "Cardápio - Avisos (teste)").

### Segurança da planilha
- Só quem é dono ou foi adicionado como editor (com login do Google) consegue alterar. Quem tem o link só consegue ver.
- O link da planilha fica visível no código do site. Por isso, deixe nesse arquivo apenas os dados do cardápio. Custos, fornecedores e anotações vão em outro arquivo.
- Confira de vez em quando em Compartilhar que o acesso geral continua como **Leitor**.
- O cardápio aceita da planilha só fotos com endereço https, ignora preços negativos ou acima de R$ 10.000 e corta textos longos demais. Todo texto é exibido como texto, sem executar código.
- Como qualquer site, o pedido é montado no celular do cliente. O restaurante deve conferir itens e total da mensagem antes de confirmar.

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

## "Peça também" no carrinho
- `sugestoes` no `config.js`: ids dos produtos sugeridos, em ordem (ex.: bebidas e sobremesas). Na planilha, a coluna `sugestao` (sim) também inclui o item.
- Aparecem até 3, sem repetir o que já está no pedido nem itens indisponíveis.
- Item sem escolha obrigatória entra com um toque. Item com sabor ou tamanho obrigatório abre o detalhe por cima do carrinho.

## Comprovante do Pix
- O site não tem acesso ao comprovante (ele fica no app do banco do cliente, e o link do WhatsApp só leva texto).
- Depois de enviar um pedido com Pix, aparece o lembrete "Não esqueça o comprovante do Pix" com o botão "Enviar comprovante no WhatsApp", que abre a conversa com o código do pedido e o valor. O cliente só anexa a imagem.

## Avaliação no Google
- `estabelecimento.avaliacaoUrl`: link de avaliação do Perfil da Empresa no Google (no painel do Google: "Pedir avaliações" > copiar link).
- O botão "Avaliar no Google" aparece depois do envio do pedido, na próxima visita (junto de "Pedir de novo") e no rodapé. Sem link, nada aparece.

## Inglês e espanhol
- `idiomas: ["pt", "en", "es"]` no `config.js` mostra os botões PT, EN e ES no canto da capa. Com `["pt"]`, os botões somem.
- Celular configurado em inglês ou espanhol já abre nesse idioma. A escolha fica salva no celular. Link direto: `?lang=en`.
- Textos da interface (botões, carrinho, avisos) já vêm traduzidos em `js/idiomas.js`.
- Pratos: `en: { nome, descricao }` e `es: { ... }` em cada produto, ou as colunas `nome_en`, `descricao_en`, `nome_es`, `descricao_es` da planilha.
- Categorias, opções, formas de pagamento e tipos de atendimento: glossário em `traducoes` no `config.js` (português exatamente como aparece → tradução).
- Descrição e "Bom saber" do estabelecimento: `estabelecimento.en` e `estabelecimento.es`.
- O que não tiver tradução aparece em português. A mensagem do WhatsApp sempre chega em português, com a linha "Idioma do cliente".

## Prévia ao compartilhar o link
- A imagem e o texto que aparecem no WhatsApp ficam no topo do `index.html` (tags `og:`) e em `img/compartilhar.jpg` (1200x630, até 300 KB).
- Para outro cliente, troque o título, a descrição, o endereço do site e a imagem. O endereço da imagem precisa ser completo (https://...).
- O WhatsApp guarda a prévia por um tempo. Para testar uma prévia nova, envie o link com algo no final, por exemplo `?p=2`.

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
Painel administrativo, estoque, pagamento online e histórico de pedidos. Os dados já estão separados da interface, então `config.js` pode ser trocado por uma chamada a uma API.
