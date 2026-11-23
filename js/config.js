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
    pagamentos: ["Pix", "Cartão de crédito", "Cartão de débito", "Dinheiro"],
    informacoes: [
      "Entregamos em um raio de até 5 km. Tempo médio de 40 a 60 minutos.",
      "Pedidos aceitos até 30 minutos antes do fechamento."
    ]
  },

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
      id: "burger-duplo", categoria: "hamburgueres", nome: "Duplo Cheddar",
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
      id: "burger-veg", categoria: "hamburgueres", nome: "Vegetariano",
      descricao: "Hambúrguer de grão-de-bico e legumes, folhas, tomate e maionese de ervas.",
      preco: 3490, disponivel: false,
      foto: unsplash("1520072959219-c595dc870360", 320, 320), legendaFoto: "hambúrguer com tomate e folhas"
    },
    {
      id: "pizza-margherita", categoria: "pizzas", nome: "Margherita",
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
      id: "pizza-calabresa", categoria: "pizzas", nome: "Calabresa",
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
      id: "batata", categoria: "porcoes", nome: "Batatas fritas",
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
      id: "suco", categoria: "bebidas", nome: "Suco natural de laranja",
      descricao: "500 ml, espremido na hora, sem açúcar.", preco: 1090,
      foto: unsplash("1600271886742-f049cd451bba", 320, 320), legendaFoto: "copo de suco de laranja"
    },
    {
      id: "brownie", categoria: "sobremesas", nome: "Brownie com calda",
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
