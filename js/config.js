/*
 * CONFIGURAÇÃO DO ESTABELECIMENTO
 * Este é o único arquivo que muda de um cliente para outro.
 * Preços em CENTAVOS (ex.: 3490 = R$ 34,90).
 * Tudo abaixo é DEMONSTRAÇÃO: nomes, textos, preços e fotos são exemplos.
 */

// Fotos ilustrativas do Unsplash (licença livre). Troque por fotos reais do cliente em img/.
const unsplash = (id, w, h) => `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=70`;

window.CARDAPIO = {
  demonstracao: true,        // mostra o aviso de conteúdo de exemplo; troque para false com dados reais
  fotosIlustrativas: true,   // mostra o selo "Imagem ilustrativa" nas fotos; troque para false com fotos reais
  creditoFotos: "Fotos ilustrativas: Unsplash",

  estabelecimento: {
    nome: "Cozinha Exemplo",
    descricao: "Hambúrgueres na chapa, pizzas de fermentação lenta e porções para dividir. Peça pelo WhatsApp para entrega ou retirada.",
    logo: "img/logo-exemplo.svg",
    capa: unsplash("1763993679664-6afaf7ff043d", 1200, 480),
    endereco: "Rua de Exemplo, 123, Centro, Cidade/UF",
    mapsUrl: "",          // link do Google Maps do estabelecimento
    whatsapp: "",         // só dígitos com DDI e DDD, ex.: "5511999999999"
    instagram: "",        // ex.: "nomedoperfil" (sem @)
    avaliacaoUrl: "",     // link "Pedir avaliações" do Perfil da Empresa no Google (ex.: https://g.page/r/XXXX/review)
    pagamentos: ["Pix", "Cartão de crédito", "Cartão de débito", "Dinheiro"],
    informacoes: [
      "Entregamos em um raio de até 5 km. Tempo médio de 40 a 60 minutos.",
      "Pedidos aceitos até 30 minutos antes do fechamento."
    ],
    // Traduções dos textos acima (opcional)
    en: {
      descricao: "Griddle burgers, slow-fermented pizzas and sharing plates. Order on WhatsApp for delivery or pickup.",
      informacoes: ["We deliver within 5 km. Average time: 40 to 60 minutes.", "Orders accepted until 30 minutes before closing."]
    },
    es: {
      descricao: "Hamburguesas a la plancha, pizzas de fermentación lenta y porciones para compartir. Pide por WhatsApp para entrega o retiro.",
      informacoes: ["Entregamos en un radio de hasta 5 km. Tiempo promedio de 40 a 60 minutos.", "Pedidos aceptados hasta 30 minutos antes del cierre."]
    }
  },

  // Idiomas do cardápio. O cliente troca no canto da capa; celular em inglês ou espanhol já abre no idioma dele.
  // A mensagem do WhatsApp sempre chega em português. Para só português, deixe ["pt"].
  idiomas: ["pt", "en", "es"],

  // Pix com valor exato no carrinho (aparece quando o cliente escolhe "Pix" em pagamentos).
  // Sem chave, o cardápio avisa que o estabelecimento envia o Pix pelo WhatsApp.
  pix: {
    chave: "",            // CPF/CNPJ só dígitos, e-mail, telefone no formato +5511999999999 ou chave aleatória
    nomeRecebedor: "",    // nome do titular da conta, como aparece no banco (até 25 letras)
    cidade: ""            // cidade do titular (até 15 letras)
  },

  // 0 = domingo ... 6 = sábado. Vários turnos por dia. Fim menor que início = passa da meia-noite.
  horarios: {
    0: [["18:00", "23:00"]],
    1: [],
    2: [["11:30", "15:00"], ["18:00", "23:00"]],
    3: [["11:30", "15:00"], ["18:00", "23:00"]],
    4: [["11:30", "15:00"], ["18:00", "23:00"]],
    5: [["11:30", "15:00"], ["18:00", "01:00"]],
    6: [["18:00", "01:00"]]
  },

  // taxa: centavos; null = "a confirmar com o estabelecimento"
  modalidades: [
    { id: "entrega", nome: "Entrega", taxa: 700, pedeEndereco: true },
    { id: "retirada", nome: "Retirada no local", taxa: 0 },
    { id: "mesa", nome: "Consumo no local", taxa: 0 }
  ],

  // Regras de entrega. Com bairros preenchidos, a taxa da entrega vem do bairro escolhido.
  entrega: {
    pedidoMinimo: 3000,            // centavos; 0 = sem mínimo
    quandoFechado: "agendar",      // "agendar" (pede horário), "bloquear" (não envia) ou "avisar" (só informa)
    bairros: [
      { nome: "Centro", taxa: 500 },
      { nome: "Bairro Exemplo 1", taxa: 700 },
      { nome: "Bairro Exemplo 2", taxa: 1000 }
    ]
  },

  // "Peça também": até 3 sugestões no carrinho (ids dos produtos, em ordem). Itens já no pedido ou indisponíveis não aparecem.
  sugestoes: ["refri", "suco", "brownie", "batata"],

  // Cupons. tipo "percentual" (valor = %) ou "fixo" (valor em centavos). minimo = valor mínimo do pedido.
  // Atenção: os códigos ficam visíveis no código do site. Use cupons simples e confira no pedido.
  cupons: [
    { codigo: "BEMVINDO10", tipo: "percentual", valor: 10, minimo: 4000, descricao: "10% de desconto no pedido",
      en: { descricao: "10% off your order" }, es: { descricao: "10% de descuento en el pedido" } }
  ],

  // Planilha do Google: cole o link da planilha compartilhada como "Qualquer pessoa com o link: Leitor"
  // (ou o link CSV de Arquivo > Compartilhar > Publicar na web). Deixe "" para usar só este arquivo.
  // Quando preenchida, a planilha atualiza preços, disponibilidade, fotos e pode incluir produtos novos.
  // Aba "Avisos" na mesma planilha (colunas chave e valor): aviso do dia, fechado em datas e horários da semana.
  // Se os avisos ficarem em outra planilha, cole o link dela em avisos.
  planilha: { url: "https://docs.google.com/spreadsheets/d/1X_od3B9WlCLSFkvdUiEFO9CzgM-GvmaZXd2PrE9bsDc/edit?usp=sharing", avisos: "https://docs.google.com/spreadsheets/d/1wOHL99rRPPdP1KIQDZwJhzToYLuLT_WayS0NPu4L_70/edit?usp=sharing" },

  // Nomes exibidos dos selos usados nos produtos (campo "selos")
  selos: {
    vegetariano: "Vegetariano",
    "sem-gluten": "Sem glúten",
    apimentado: "Apimentado",
    novo: "Novo"
  },

  // Glossário para inglês e espanhol: categorias, opções, formas de pagamento e atendimento.
  // Escreva o português exatamente como está no cardápio. O que não estiver aqui aparece em português.
  traducoes: {
    en: {
      "Mais pedidos": "Most ordered",
      "Promoções": "Deals",
      "Entradas": "Starters",
      "Combos": "Combos",
      "Hambúrgueres": "Burgers",
      "Pizzas": "Pizzas",
      "Porções": "Sides",
      "Bebidas": "Drinks",
      "Sobremesas": "Desserts",
      "Entrega": "Delivery",
      "Retirada no local": "Pickup",
      "Consumo no local": "Dine in",
      "Cartão de crédito": "Credit card",
      "Cartão de débito": "Debit card",
      "Dinheiro": "Cash",
      "Vegetariano": "Vegetarian",
      "Sem glúten": "Gluten-free",
      "Apimentado": "Spicy",
      "Novo": "New",
      "Bebida": "Drink",
      "Refrigerante lata": "Canned soda",
      "Suco natural de laranja": "Fresh orange juice",
      "Água sem gás": "Still water",
      "Ponto da carne": "Doneness",
      "Ao ponto para mal": "Medium rare",
      "Ao ponto": "Medium",
      "Bem passado": "Well done",
      "Adicionais": "Extras",
      "Queijo extra": "Extra cheese",
      "Ovo": "Egg",
      "Cebola caramelizada": "Caramelized onion",
      "Cheddar extra": "Extra cheddar",
      "Tamanho": "Size",
      "Pequena (4 fatias)": "Small (4 slices)",
      "Média (6 fatias)": "Medium (6 slices)",
      "Grande (8 fatias)": "Large (8 slices)",
      "Borda": "Crust",
      "Borda recheada com requeijão": "Cream cheese stuffed crust",
      "Borda de chocolate": "Chocolate crust",
      "Individual": "Single",
      "Para compartilhar": "To share",
      "Molhos": "Sauces",
      "Maionese da casa": "House mayo",
      "Sabor": "Flavor",
      "Acompanhamento": "Side",
      "Bola de sorvete de creme": "Scoop of vanilla ice cream"
    },
    es: {
      "Mais pedidos": "Más pedidos",
      "Promoções": "Promociones",
      "Entradas": "Entradas",
      "Combos": "Combos",
      "Hambúrgueres": "Hamburguesas",
      "Pizzas": "Pizzas",
      "Porções": "Porciones",
      "Bebidas": "Bebidas",
      "Sobremesas": "Postres",
      "Entrega": "Entrega a domicilio",
      "Retirada no local": "Retiro en el local",
      "Consumo no local": "Consumo en el local",
      "Cartão de crédito": "Tarjeta de crédito",
      "Cartão de débito": "Tarjeta de débito",
      "Dinheiro": "Efectivo",
      "Vegetariano": "Vegetariano",
      "Sem glúten": "Sin gluten",
      "Apimentado": "Picante",
      "Novo": "Nuevo",
      "Bebida": "Bebida",
      "Refrigerante lata": "Refresco en lata",
      "Suco natural de laranja": "Jugo de naranja natural",
      "Água sem gás": "Agua sin gas",
      "Ponto da carne": "Punto de la carne",
      "Ao ponto para mal": "Jugoso",
      "Ao ponto": "A punto",
      "Bem passado": "Bien cocido",
      "Adicionais": "Adicionales",
      "Bacon": "Tocino",
      "Queijo extra": "Queso extra",
      "Ovo": "Huevo",
      "Cebola caramelizada": "Cebolla caramelizada",
      "Cheddar extra": "Cheddar extra",
      "Tamanho": "Tamaño",
      "Pequena (4 fatias)": "Pequeña (4 porciones)",
      "Média (6 fatias)": "Mediana (6 porciones)",
      "Grande (8 fatias)": "Grande (8 porciones)",
      "Borda": "Borde",
      "Borda recheada com requeijão": "Borde relleno de queso crema",
      "Borda de chocolate": "Borde de chocolate",
      "Para compartilhar": "Para compartir",
      "Molhos": "Salsas",
      "Maionese da casa": "Mayonesa de la casa",
      "Barbecue": "Barbacoa",
      "Acompanhamento": "Acompañamiento",
      "Bola de sorvete de creme": "Bola de helado de vainilla"
    }
  },

  tema: {
    cores: {
      fundo: "#f2f4ef",
      superficie: "#ffffff",
      texto: "#15201a",
      textoSuave: "#56625a",
      borda: "#dce2d8",
      primaria: "#1f4d3a",        // botões e destaques
      primariaTexto: "#ffffff",
      acento: "#b93c0f"           // selos de promoção
    },
    fontes: {
      googleFontsUrl: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Instrument+Sans:wght@400;500;600&display=swap",
      titulo: "'Bricolage Grotesque', system-ui, sans-serif",
      texto: "'Instrument Sans', system-ui, sans-serif"
    }
  },

  // filtro: categoria "virtual" que reúne produtos marcados com essa propriedade
  categorias: [
    { id: "mais-pedidos", nome: "Mais pedidos", filtro: "maisPedido" },
    { id: "promocoes", nome: "Promoções", filtro: "precoOriginal" },
    { id: "entradas", nome: "Entradas" },
    { id: "combos", nome: "Combos" },
    { id: "hamburgueres", nome: "Hambúrgueres" },
    { id: "pizzas", nome: "Pizzas" },
    { id: "porcoes", nome: "Porções" },
    { id: "bebidas", nome: "Bebidas" },
    { id: "sobremesas", nome: "Sobremesas" }
  ],

  produtos: [
    {
      id: "combo-casa", categoria: "combos", nome: "Combo Casa",
      en: { nome: "Combo House", descricao: "Classic burger, single fries and a drink of your choice. The most ordered combo of the week." },
      es: { nome: "Combo de la Casa", descricao: "Hamburguesa Clásica, papas fritas individuales y una bebida a elección. La combinación más pedida de la semana." },
      descricao: "Hambúrguer Clássico, batatas fritas individuais e uma bebida à sua escolha. A combinação mais pedida da semana.",
      preco: 4290, precoOriginal: 4990, destaque: true, maisPedido: true,
      foto: unsplash("1551782450-a2132b4ba21d", 800, 450), legendaFoto: "hambúrguer com batatas fritas servido em tábua de madeira",
      grupos: [
        { id: "bebida", nome: "Bebida", min: 1, max: 1, opcoes: [
          { id: "refri", nome: "Refrigerante lata", preco: 0 },
          { id: "suco", nome: "Suco natural de laranja", preco: 300 },
          { id: "agua", nome: "Água sem gás", preco: 0 }
        ]}
      ]
    },
    {
      id: "burger-classico", categoria: "hamburgueres", nome: "Clássico",
      en: { nome: "Classic", descricao: "Brioche bun, 160 g beef patty, cheese, lettuce, tomato and house mayo." },
      es: { nome: "Clásica", descricao: "Pan brioche, carne de res de 160 g, queso, lechuga, tomate y mayonesa de la casa." },
      descricao: "Pão brioche, blend bovino de 160 g, queijo prato, alface, tomate e maionese da casa.",
      preco: 3290, maisPedido: true,
      foto: unsplash("1568901346375-23c9450c58cd", 320, 320), legendaFoto: "hambúrguer com queijo, alface e tomate",
      grupos: [
        { id: "ponto", nome: "Ponto da carne", min: 1, max: 1, opcoes: [
          { id: "mal", nome: "Ao ponto para mal", preco: 0 },
          { id: "ponto", nome: "Ao ponto", preco: 0 },
          { id: "bem", nome: "Bem passado", preco: 0 }
        ]},
        { id: "adicionais", nome: "Adicionais", min: 0, max: 3, opcoes: [
          { id: "bacon", nome: "Bacon", preco: 500 },
          { id: "queijo", nome: "Queijo extra", preco: 400 },
          { id: "ovo", nome: "Ovo", preco: 300 },
          { id: "cebola", nome: "Cebola caramelizada", preco: 350 }
        ]}
      ]
    },
    {
      id: "burger-duplo", categoria: "hamburgueres", selos: ["novo"], nome: "Duplo Cheddar",
      en: { nome: "Double Cheddar", descricao: "Two 90 g smash patties, double melted cheddar, pickles and special sauce on a soft bun." },
      es: { nome: "Doble Cheddar", descricao: "Dos smash de 90 g a la plancha, doble cheddar derretido, pepinillos y salsa especial en pan suave." },
      descricao: "Dois smash de 90 g na chapa, cheddar derretido em dobro, picles e molho especial no pão macio.",
      preco: 3990,
      foto: unsplash("1607013251379-e6eecfffe234", 320, 320), legendaFoto: "cheeseburger duplo com picles",
      grupos: [
        { id: "adicionais", nome: "Adicionais", min: 0, max: 2, opcoes: [
          { id: "bacon", nome: "Bacon", preco: 500 },
          { id: "queijo", nome: "Cheddar extra", preco: 400 }
        ]}
      ]
    },
    {
      id: "burger-veg", categoria: "hamburgueres", selos: ["vegetariano"], nome: "Vegetariano",
      en: { nome: "Veggie", descricao: "Chickpea and vegetable patty, greens, tomato and herb mayo." },
      es: { nome: "Vegetariana", descricao: "Hamburguesa de garbanzos y verduras, hojas, tomate y mayonesa de hierbas." },
      descricao: "Hambúrguer de grão-de-bico e legumes, folhas, tomate e maionese de ervas.",
      preco: 3490, disponivel: false,
      foto: unsplash("1520072959219-c595dc870360", 320, 320), legendaFoto: "hambúrguer com tomate e folhas"
    },
    {
      id: "pizza-margherita", categoria: "pizzas", selos: ["vegetariano"], nome: "Margherita",
      en: { nome: "Margherita", descricao: "Italian tomato sauce, fresh mozzarella, basil and olive oil. Slow-fermented dough." },
      es: { nome: "Margarita", descricao: "Salsa de tomate italiana, mozzarella fresca, albahaca y aceite de oliva. Masa de fermentación lenta." },
      descricao: "Molho de tomate italiano, muçarela fresca, manjericão e azeite. Massa de fermentação lenta.",
      preco: 0, maisPedido: true,
      foto: unsplash("1574071318508-1cdbab80d002", 320, 320), legendaFoto: "pizza margherita inteira",
      grupos: [
        { id: "tamanho", nome: "Tamanho", min: 1, max: 1, opcoes: [
          { id: "p", nome: "Pequena (4 fatias)", preco: 3990 },
          { id: "m", nome: "Média (6 fatias)", preco: 5290 },
          { id: "g", nome: "Grande (8 fatias)", preco: 6490 }
        ]},
        { id: "borda", nome: "Borda", min: 0, max: 1, opcoes: [
          { id: "catupiry", nome: "Borda recheada com requeijão", preco: 900 },
          { id: "chocolate", nome: "Borda de chocolate", preco: 1100 }
        ]}
      ]
    },
    {
      id: "pizza-calabresa", categoria: "pizzas", selos: ["apimentado"], nome: "Calabresa",
      en: { nome: "Calabresa", descricao: "Sliced calabresa sausage, red onion, mozzarella and black olives." },
      es: { nome: "Calabresa", descricao: "Calabresa en rodajas, cebolla morada, mozzarella y aceitunas negras." },
      descricao: "Calabresa fatiada, cebola roxa, muçarela e azeitonas pretas.",
      preco: 0,
      foto: unsplash("1628840042765-356cda07504e", 320, 320), legendaFoto: "pizza de calabresa fatiada",
      grupos: [
        { id: "tamanho", nome: "Tamanho", min: 1, max: 1, opcoes: [
          { id: "p", nome: "Pequena (4 fatias)", preco: 3790 },
          { id: "m", nome: "Média (6 fatias)", preco: 4990 },
          { id: "g", nome: "Grande (8 fatias)", preco: 5990 }
        ]}
      ]
    },
    {
      id: "batata", categoria: "porcoes", selos: ["vegetariano", "sem-gluten"], nome: "Batatas fritas",
      en: { nome: "French fries", descricao: "Hand-cut potatoes, crispy outside and soft inside, with salt and rosemary." },
      es: { nome: "Papas fritas", descricao: "Papas cortadas en casa, crujientes por fuera y suaves por dentro, con sal y romero." },
      descricao: "Batatas cortadas na casa, crocantes por fora e macias por dentro, com sal e alecrim.",
      preco: 0,
      foto: unsplash("1630384060421-cb20d0e0649d", 320, 320), legendaFoto: "cesta de batatas fritas",
      grupos: [
        { id: "tamanho", nome: "Tamanho", min: 1, max: 1, opcoes: [
          { id: "ind", nome: "Individual", preco: 1890 },
          { id: "comp", nome: "Para compartilhar", preco: 2990 }
        ]},
        { id: "molhos", nome: "Molhos", min: 0, max: 2, opcoes: [
          { id: "cheddar", nome: "Cheddar", preco: 400 },
          { id: "maionese", nome: "Maionese da casa", preco: 300 },
          { id: "barbecue", nome: "Barbecue", preco: 300 }
        ]}
      ]
    },
    {
      id: "refri", categoria: "bebidas", nome: "Refrigerante lata",
      en: { nome: "Canned soda", descricao: "350 ml, ice cold." },
      es: { nome: "Refresco en lata", descricao: "350 ml, bien frío." },
      descricao: "350 ml, bem gelado.", preco: 700,
      foto: unsplash("1696739696220-8d2e27465662", 320, 320), legendaFoto: "lata de refrigerante",
      grupos: [
        { id: "sabor", nome: "Sabor", min: 1, max: 1, opcoes: [
          { id: "cola", nome: "Cola", preco: 0 },
          { id: "guarana", nome: "Guaraná", preco: 0 },
          { id: "zero", nome: "Cola zero", preco: 0 }
        ]}
      ]
    },
    {
      id: "suco", categoria: "bebidas", selos: ["vegetariano", "sem-gluten"], nome: "Suco natural de laranja",
      en: { nome: "Fresh orange juice", descricao: "500 ml, freshly squeezed, no sugar." },
      es: { nome: "Jugo de naranja natural", descricao: "500 ml, exprimido al momento, sin azúcar." },
      descricao: "500 ml, espremido na hora, sem açúcar.", preco: 1090,
      foto: unsplash("1600271886742-f049cd451bba", 320, 320), legendaFoto: "copo de suco de laranja"
    },
    {
      id: "brownie", categoria: "sobremesas", nome: "Brownie com calda",
      en: { nome: "Brownie with fudge", descricao: "Semi-sweet chocolate brownie with a crisp top and warm chocolate sauce." },
      es: { nome: "Brownie con salsa", descricao: "Brownie de chocolate semiamargo, costra crujiente y salsa caliente de chocolate." },
      descricao: "Brownie de chocolate meio amargo, casquinha crocante e calda quente de chocolate.",
      preco: 1590, precoOriginal: 1890,
      foto: unsplash("1606313564200-e75d5e30476c", 320, 320), legendaFoto: "brownies com calda de chocolate",
      grupos: [
        { id: "extra", nome: "Acompanhamento", min: 0, max: 1, opcoes: [
          { id: "sorvete", nome: "Bola de sorvete de creme", preco: 600 }
        ]}
      ]
    }
  ]
};
