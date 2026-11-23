/* Cardápio digital — lógica. Não coloque dados de estabelecimento aqui: use js/config.js (ou a planilha). */
(function () {
  "use strict";

  const C = window.CARDAPIO;
  const $ = (s, el = document) => el.querySelector(s);
  const LS_CHAVE = "cardapio:" + (C?.estabelecimento?.nome || "padrao");
  const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

  if (!C) {
    document.getElementById("cardapio").innerHTML = '<p class="vazio">Não foi possível carregar o cardápio: o arquivo js/config.js está ausente ou com erro.</p>';
    return;
  }

  /* ---------- Utilidades ---------- */
  const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const dinheiro = (c) => fmt.format((c || 0) / 100);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const normalizar = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const lsLer = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  const lsGravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* armazenamento indisponível */ } };

  const ICONES = {
    conversa: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>',
    pino: '<path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    mais: '<path d="M12 5v14M5 12h14"/>',
    menos: '<path d="M5 12h14"/>',
    fechar: '<path d="M6 6l12 12M18 6 6 18"/>',
    busca: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    repetir: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9"/><path d="M20 4v5h-5"/><path d="M20 12a8 8 0 0 1-14 5.3L4 15"/><path d="M4 20v-5h5"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/>'
  };
  const icone = (n) => `<svg class="icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[n]}</svg>`;

  const reservado = (legenda) => `<div class="foto-reservada" role="img" aria-label="Espaço reservado: ${esc(legenda)}">${esc(legenda)}</div>`;
  const foto = (src, alt, legenda, { eager = false, w = 320, h = 320, selo = true } = {}) =>
    src
      ? `<img src="${esc(src)}" alt="${esc(legenda || alt)}" width="${w}" height="${h}" data-legenda="${esc(legenda || alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">` +
        (selo && C.fotosIlustrativas ? '<span class="selo-foto" aria-hidden="true">Imagem ilustrativa</span>' : "")
      : reservado(legenda || alt || "foto");

  // Versão maior da foto para o detalhe (fotos do Unsplash aceitam tamanho na URL)
  const ampliar = (src) => (src && src.includes("images.unsplash.com") ? src.replace(/w=\d+&h=\d+/, "w=900&h=675") : src);

  // Foto que não carrega vira espaço reservado (sem ícone quebrado)
  document.addEventListener("error", (e) => {
    const img = e.target;
    if (img.tagName !== "IMG" || !img.dataset.legenda) return;
    img.nextElementSibling?.classList.contains("selo-foto") && img.nextElementSibling.remove();
    img.outerHTML = reservado(img.dataset.legenda);
  }, true);

  const E = C.estabelecimento || {};
  const ENTREGA = C.entrega || {};
  const BAIRROS = ENTREGA.bairros || [];
  const numeroWhats = String(E.whatsapp || "").replace(/\D/g, "");
  const linkWhats = (texto) => `https://wa.me/${numeroWhats}${texto ? "?text=" + encodeURIComponent(texto) : ""}`;

  // Mesa vinda do QR Code (ex.: ?mesa=5)
  const MESA = (() => {
    const v = new URLSearchParams(location.search).get("mesa");
    return v && /^[\w-]{1,12}$/.test(v) ? v : "";
  })();

  /* ---------- Tema ---------- */
  function aplicarTema() {
    const t = C.tema || {};
    const mapa = { fundo: "--fundo", superficie: "--superficie", texto: "--texto", textoSuave: "--texto-suave", borda: "--borda", primaria: "--primaria", primariaTexto: "--primaria-texto", acento: "--acento" };
    const raiz = document.documentElement.style;
    Object.entries(t.cores || {}).forEach(([k, v]) => mapa[k] && raiz.setProperty(mapa[k], v));
    if (t.fontes?.titulo) raiz.setProperty("--fonte-titulo", t.fontes.titulo);
    if (t.fontes?.texto) raiz.setProperty("--fonte-texto", t.fontes.texto);
    if (t.fontes?.googleFontsUrl) {
      const l = document.createElement("link");
      l.rel = "stylesheet"; l.href = t.fontes.googleFontsUrl;
      document.head.appendChild(l);
    }
    const meta = document.createElement("meta");
    meta.name = "theme-color"; meta.content = t.cores?.fundo || "#ffffff";
    document.head.appendChild(meta);
  }

  /* ---------- Horários ---------- */
  const paraMin = (h) => { const [a, b] = h.split(":").map(Number); return a * 60 + b; };
  const paraHora = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  function turnos(dia) {
    return (C.horarios?.[dia] || []).map(([i, f]) => {
      const ini = paraMin(i); let fim = paraMin(f);
      if (fim <= ini) fim += 1440;
      return { ini, fim, i, f };
    });
  }
  function statusAgora(agora = new Date()) {
    const dia = agora.getDay();
    const min = agora.getHours() * 60 + agora.getMinutes();
    for (const t of turnos(dia)) if (min >= t.ini && min < t.fim) return { aberto: true, texto: `fecha às ${t.f}` };
    for (const t of turnos((dia + 6) % 7)) if (t.fim > 1440 && min + 1440 < t.fim) return { aberto: true, texto: `fecha às ${t.f}` };
    for (let d = 0; d < 7; d++) {
      const dd = (dia + d) % 7;
      const prox = turnos(dd).find((t) => d > 0 || t.ini > min);
      if (prox) {
        const quando = d === 0 ? "hoje" : d === 1 ? "amanhã" : DIAS[dd].toLowerCase();
        return { aberto: false, texto: `abre ${quando} às ${prox.i}` };
      }
    }
    return { aberto: false, texto: "horário não informado" };
  }
  // Horários para agendar: próximo dia com expediente, de 30 em 30 minutos
  function opcoesAgendamento(agora = new Date()) {
    const dia = agora.getDay();
    const min = agora.getHours() * 60 + agora.getMinutes();
    for (let d = 0; d < 7; d++) {
      const dd = (dia + d) % 7;
      const rotulo = d === 0 ? "Hoje" : d === 1 ? "Amanhã" : DIAS[dd];
      const slots = [];
      turnos(dd).forEach((t) => {
        for (let m = t.ini + 30; m <= t.fim - 30; m += 30) if (d > 0 || m > min + 30) slots.push(`${rotulo} às ${paraHora(m)}`);
      });
      if (slots.length) return slots;
    }
    return [];
  }

  /* ---------- Planilha do Google (opcional) ---------- */
  function lerCSV(texto) {
    texto = String(texto).replace(/^﻿/, "");
    const primeira = texto.split(/\r?\n/, 1)[0];
    const sep = primeira.includes(",") || !primeira.includes(";") ? "," : ";";
    const linhas = []; let campo = "", linha = [], aspas = false;
    for (let i = 0; i < texto.length; i++) {
      const ch = texto[i];
      if (aspas) {
        if (ch === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
        else if (ch === '"') aspas = false;
        else campo += ch;
      } else if (ch === '"') aspas = true;
      else if (ch === sep) { linha.push(campo); campo = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && texto[i + 1] === "\n") i++;
        linha.push(campo); campo = "";
        if (linha.some((c) => c.trim())) linhas.push(linha);
        linha = [];
      } else campo += ch;
    }
    linha.push(campo);
    if (linha.some((c) => c.trim())) linhas.push(linha);
    if (!linhas.length) return [];
    const cab = linhas[0].map((h) => normalizar(h).replace(/\s+/g, "_"));
    return linhas.slice(1).map((l) => Object.fromEntries(cab.map((h, i) => [h, (l[i] ?? "").trim()])));
  }
  const paraCentavos = (v) => {
    const s = String(v || "").replace(/[^\d,.-]/g, "");
    if (!s) return null;
    const n = s.includes(",") ? Number(s.replace(/\./g, "").replace(",", ".")) : Number(s);
    return Number.isFinite(n) ? Math.round(n * 100) : null;
  };
  const sim = (v) => ["sim", "s", "x", "1", "true", "verdadeiro"].includes(normalizar(v));
  const slug = (s) => normalizar(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  function aplicarPlanilha(linhas) {
    C.categorias = C.categorias || [];
    const achaCategoria = (v) => {
      const n = normalizar(v);
      let c = C.categorias.find((x) => normalizar(x.id) === n || normalizar(x.nome) === n);
      if (!c && v) { c = { id: slug(v), nome: v.trim() }; C.categorias.push(c); }
      return c?.id;
    };
    const porIdCfg = Object.fromEntries((C.produtos || []).map((p) => [p.id, p]));
    linhas.forEach((l) => {
      const id = l.id || slug(l.nome);
      if (!id) return;
      const dados = {};
      if (l.categoria) dados.categoria = achaCategoria(l.categoria);
      if (l.nome) dados.nome = l.nome;
      if (l.descricao) dados.descricao = l.descricao;
      if (paraCentavos(l.preco) !== null) dados.preco = paraCentavos(l.preco);
      if ("preco_original" in l) dados.precoOriginal = paraCentavos(l.preco_original) || undefined;
      if (l.disponivel) dados.disponivel = sim(l.disponivel);
      if (l.foto) dados.foto = l.foto;
      if (l.destaque) dados.destaque = sim(l.destaque);
      if (l.mais_pedido) dados.maisPedido = sim(l.mais_pedido);
      if (l.selos) dados.selos = l.selos.split(/[|/]/).map((s) => slug(s)).filter(Boolean);
      if (porIdCfg[id]) Object.assign(porIdCfg[id], dados);
      else if (dados.nome && dados.categoria && dados.preco != null) {
        const novo = { id, legendaFoto: dados.nome, ...dados };
        C.produtos.push(novo); porIdCfg[id] = novo;
      }
    });
  }

  async function carregarPlanilha() {
    const url = C.planilha?.url;
    if (!url) return;
    const CACHE = LS_CHAVE + ":planilha";
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 7000);
      const r = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
      clearTimeout(timer);
      if (!r.ok) throw new Error("HTTP " + r.status);
      const texto = await r.text();
      lsGravar(CACHE, texto);
      aplicarPlanilha(lerCSV(texto));
    } catch (erro) {
      console.warn("Planilha indisponível, usando a última cópia salva ou o config.js.", erro);
      const salvo = lsLer(CACHE);
      if (salvo) aplicarPlanilha(lerCSV(salvo));
    }
  }

  /* ---------- Produtos e preços ---------- */
  let produtos = [];
  let porId = {};
  function montarProdutos() {
    produtos = (C.produtos || []).map((p) => ({ disponivel: true, grupos: [], selos: [], ...p }));
    porId = Object.fromEntries(produtos.map((p) => [p.id, p]));
  }

  function precoMinimo(p) {
    let v = p.preco || 0, varia = false;
    for (const g of p.grupos) {
      if ((g.min || 0) < 1) continue;
      const precos = g.opcoes.map((o) => o.preco || 0).sort((a, b) => a - b);
      v += precos.slice(0, g.min).reduce((s, x) => s + x, 0);
      if (precos[0] !== precos[precos.length - 1]) varia = true;
    }
    return { valor: v, aPartir: varia };
  }

  function secoes() {
    return (C.categorias || [])
      .map((c) => ({
        ...c,
        itens: produtos.filter((p) => (c.filtro ? !!p[c.filtro] : p.categoria === c.id))
      }))
      .filter((c) => c.itens.length > 0);
  }

  const NOMES_SELOS = C.selos || {};
  const nomeSelo = (s) => NOMES_SELOS[s] || s.replace(/-/g, " ");
  const htmlSelos = (p) => (p.selos || []).map((s) => `<span class="selo-info">${esc(nomeSelo(s))}</span>`).join("");

  /* ---------- Render: topo ---------- */
  function renderTopo() {
    document.title = `${E.nome || "Cardápio"} | Cardápio e pedidos`;
    $('meta[name="description"]').content = E.descricao || "Cardápio digital com pedido pelo WhatsApp.";
    $("#capa").innerHTML = foto(E.capa, `Ambiente de ${E.nome}`, `Ambiente de ${E.nome}`, { eager: true, w: 1200, h: 480 });
    $("#logo").innerHTML = foto(E.logo, `Logotipo de ${E.nome}`, `Logotipo de ${E.nome}`, { eager: true, w: 160, h: 160, selo: false });
    $("#nome").textContent = E.nome || "";
    $("#descricao").textContent = E.descricao || "";
    $("#aviso-demo").hidden = !C.demonstracao;
    if (MESA) {
      const av = $("#aviso-mesa");
      av.hidden = false;
      av.innerHTML = `Você está na <strong>mesa ${esc(MESA)}</strong>. Monte o pedido e envie pelo WhatsApp para o atendimento.`;
    }

    const bW = $("#btn-whats-topo");
    bW.innerHTML = icone("conversa") + "WhatsApp";
    if (numeroWhats) bW.href = linkWhats(""); else bW.remove();
    const bM = $("#btn-mapa-topo");
    bM.innerHTML = icone("pino") + "Como chegar";
    if (E.mapsUrl) bM.href = E.mapsUrl; else bM.remove();
    atualizarStatus();
    setInterval(atualizarStatus, 60000);
  }
  /* SEO: Open Graph sempre; dados estruturados (schema.org) só com dados reais */
  function renderSEO() {
    const meta = (prop, valor, attr = "property") => {
      if (!valor) return;
      const m = document.createElement("meta");
      m.setAttribute(attr, prop); m.content = valor;
      document.head.appendChild(m);
    };
    meta("og:title", `${E.nome} | Cardápio`);
    meta("og:description", E.descricao);
    meta("og:image", E.capa);
    meta("twitter:card", "summary_large_image", "name");
    if (C.demonstracao) return;

    const DIAS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const horarios = Object.entries(C.horarios || {}).flatMap(([d, ts]) =>
      ts.map(([opens, closes]) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: DIAS_EN[d], opens, closes })));
    const secoesMenu = secoes().filter((c) => !c.filtro).map((c) => ({
      "@type": "MenuSection",
      name: c.nome,
      hasMenuItem: c.itens.map((p) => ({
        "@type": "MenuItem", name: p.nome, description: p.descricao,
        offers: { "@type": "Offer", price: (precoMinimo(p).valor / 100).toFixed(2), priceCurrency: "BRL" }
      }))
    }));
    const dados = {
      "@context": "https://schema.org", "@type": "Restaurant",
      name: E.nome, description: E.descricao, image: E.capa || undefined,
      address: E.endereco ? { "@type": "PostalAddress", streetAddress: E.endereco, addressCountry: "BR" } : undefined,
      telephone: numeroWhats ? "+" + numeroWhats : undefined,
      sameAs: E.instagram ? ["https://instagram.com/" + E.instagram] : undefined,
      hasMap: E.mapsUrl || undefined,
      paymentAccepted: E.pagamentos?.join(", ") || undefined,
      openingHoursSpecification: horarios,
      hasMenu: { "@type": "Menu", hasMenuSection: secoesMenu }
    };
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(dados);
    document.head.appendChild(s);
  }

  function atualizarStatus() {
    const s = statusAgora();
    const el = $("#status");
    el.dataset.aberto = s.aberto;
    el.innerHTML = `<strong>${s.aberto ? "Aberto agora" : "Fechado"}</strong>, ${esc(s.texto)}`;
  }

  /* ---------- Render: cardápio ---------- */
  function cardProduto(p) {
    const { valor, aPartir } = precoMinimo(p);
    const destaque = p.destaque && p.disponivel;
    const selos = [
      !p.disponivel ? '<span class="selo selo-neutro">Indisponível</span>' : "",
      p.precoOriginal && p.disponivel ? '<span class="selo">Promoção</span>' : ""
    ].join("");
    const categoria = (C.categorias || []).find((c) => c.id === p.categoria)?.nome || "";
    const busca = normalizar([p.nome, p.descricao, categoria, ...(p.selos || []).map(nomeSelo)].join(" "));
    return `
      <button type="button" class="produto ${destaque ? "produto-destaque" : ""}" data-produto="${esc(p.id)}"
        data-busca="${esc(busca)}" data-selos="${esc((p.selos || []).join(" "))}"
        ${p.disponivel ? "" : 'aria-disabled="true"'} aria-label="${esc(p.nome)}, ${aPartir ? "a partir de " : ""}${dinheiro(valor)}${p.disponivel ? "" : ", indisponível"}">
        <span class="produto-texto">
          <h3>${esc(p.nome)}</h3>
          <p>${esc(p.descricao)}</p>
          ${p.selos?.length ? `<span class="linha-selos">${htmlSelos(p)}</span>` : ""}
          <span class="linha-preco">
            ${aPartir ? '<span class="a-partir">a partir de</span>' : ""}
            <span class="preco${p.precoOriginal ? " preco-promo" : ""}">${dinheiro(valor)}</span>
            ${p.precoOriginal ? `<span class="preco-antigo">${dinheiro(p.precoOriginal)}</span>` : ""}
            ${selos}
          </span>
        </span>
        <span class="produto-foto">${foto(p.foto, p.nome, p.legendaFoto, destaque ? { w: 800, h: 450 } : {})}</span>
      </button>`;
  }

  const filtro = { texto: "", selos: new Set() };

  function renderCardapio() {
    const lista = secoes();
    const main = $("#cardapio");
    if (!lista.length) {
      main.innerHTML = '<p class="vazio">Nenhum produto cadastrado ainda. Adicione itens no config.js ou na planilha.</p>';
      $("#categorias").hidden = true;
      return;
    }
    const selosUsados = [...new Set(produtos.flatMap((p) => p.selos || []))];
    $("#categorias-trilho").innerHTML = lista
      .map((c) => `<button type="button" class="chip" data-alvo="sec-${esc(c.id)}">${esc(c.nome)}</button>`)
      .join("");
    main.innerHTML = `
      <div class="ferramentas">
        <label class="busca">
          ${icone("busca")}
          <span class="sr">Buscar no cardápio</span>
          <input type="search" id="busca" placeholder="Buscar no cardápio" autocomplete="off" enterkeyhint="search">
        </label>
        ${selosUsados.length ? `<div class="filtros" role="group" aria-label="Filtrar por">
          ${selosUsados.map((s) => `<button type="button" class="filtro" data-selo="${esc(s)}" aria-pressed="false">${esc(nomeSelo(s))}</button>`).join("")}
        </div>` : ""}
      </div>
      <p class="vazio" id="sem-resultado" hidden></p>` +
      lista.map((c) => `
        <section class="secao" id="sec-${esc(c.id)}" aria-labelledby="tit-${esc(c.id)}">
          <h2 id="tit-${esc(c.id)}">${esc(c.nome)}</h2>
          <p class="secao-contagem">${c.itens.length} ${c.itens.length === 1 ? "item" : "itens"}</p>
          <div class="lista">${c.itens.map(cardProduto).join("")}</div>
        </section>`).join("");

    main.addEventListener("click", (e) => {
      const f = e.target.closest("[data-selo]");
      if (f) {
        const s = f.dataset.selo;
        filtro.selos.has(s) ? filtro.selos.delete(s) : filtro.selos.add(s);
        f.setAttribute("aria-pressed", filtro.selos.has(s));
        aplicarFiltro();
        return;
      }
      if (e.target.closest("[data-limpar-filtro]")) { limparFiltro(); return; }
      const b = e.target.closest("[data-produto]");
      if (b && b.getAttribute("aria-disabled") !== "true") abrirProduto(b.dataset.produto, b);
    });
    $("#busca").addEventListener("input", (e) => { filtro.texto = normalizar(e.target.value); aplicarFiltro(); });
    $("#categorias-trilho").addEventListener("click", (e) => {
      const b = e.target.closest("[data-alvo]");
      if (!b) return;
      const alvo = document.getElementById(b.dataset.alvo);
      marcarCategoria(b.dataset.alvo);
      travaSpy = Date.now() + 800;
      alvo.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    });
    iniciarScrollSpy();
  }

  function aplicarFiltro() {
    const termos = filtro.texto.split(/\s+/).filter(Boolean);
    let visiveis = 0;
    document.querySelectorAll(".secao").forEach((sec) => {
      let n = 0;
      sec.querySelectorAll(".produto").forEach((card) => {
        const okTexto = termos.every((t) => card.dataset.busca.includes(t));
        const selos = card.dataset.selos.split(" ");
        const okSelo = [...filtro.selos].every((s) => selos.includes(s));
        card.hidden = !(okTexto && okSelo);
        if (!card.hidden) n++;
      });
      sec.hidden = n === 0;
      visiveis += n;
      const chip = document.querySelector(`.chip[data-alvo="${sec.id}"]`);
      if (chip) chip.hidden = sec.hidden;
    });
    const vazio = $("#sem-resultado");
    const ativo = termos.length || filtro.selos.size;
    vazio.hidden = !ativo || visiveis > 0;
    if (!vazio.hidden) vazio.innerHTML = `Nenhum item encontrado. <button type="button" class="link-acao" data-limpar-filtro>Limpar busca e filtros</button>`;
  }
  function limparFiltro() {
    filtro.texto = ""; filtro.selos.clear();
    $("#busca").value = "";
    document.querySelectorAll("[data-selo]").forEach((b) => b.setAttribute("aria-pressed", "false"));
    aplicarFiltro();
    $("#busca").focus();
  }

  let travaSpy = 0;
  function marcarCategoria(id) {
    document.querySelectorAll(".chip").forEach((c) => {
      const ativo = c.dataset.alvo === id;
      c.setAttribute("aria-current", ativo ? "true" : "false");
      if (ativo) {
        const trilho = $("#categorias-trilho");
        const x = c.offsetLeft - trilho.clientWidth / 2 + c.clientWidth / 2;
        trilho.scrollTo({ left: x, behavior: "smooth" });
      }
    });
  }
  function iniciarScrollSpy() {
    let atual = null;
    const calc = () => {
      if (Date.now() < travaSpy) return;
      const secs = [...document.querySelectorAll(".secao")].filter((s) => !s.hidden);
      const linha = 120;
      let escolhida = secs[0];
      for (const s of secs) if (s.getBoundingClientRect().top <= linha) escolhida = s;
      if (escolhida && escolhida.id !== atual) { atual = escolhida.id; marcarCategoria(atual); }
    };
    let pendente = false;
    addEventListener("scroll", () => { if (!pendente) { pendente = true; requestAnimationFrame(() => { pendente = false; calc(); }); } }, { passive: true });
    calc();
  }

  /* ---------- Rodapé ---------- */
  function renderRodape() {
    const hoje = new Date().getDay();
    const ordem = [1, 2, 3, 4, 5, 6, 0];
    const horas = ordem.map((d) => {
      const t = C.horarios?.[d] || [];
      const txt = t.length ? t.map(([i, f]) => `${i} às ${f}`).join("<br>") : "Fechado";
      return `<li${d === hoje ? ' data-hoje="true"' : ""}${t.length ? "" : ' data-fechado="true"'}>
        <span>${DIAS[d]}${d === hoje ? '<span class="hoje">hoje</span>' : ""}</span><span>${txt}</span></li>`;
    }).join("");
    const st = statusAgora();
    const links = [
      E.mapsUrl ? `<a class="botao botao-claro" href="${esc(E.mapsUrl)}" target="_blank" rel="noopener">${icone("pino")}Como chegar</a>` : "",
      numeroWhats ? `<a class="botao botao-contorno" href="${linkWhats("")}" target="_blank" rel="noopener">${icone("conversa")}WhatsApp</a>` : "",
      E.instagram ? `<a class="botao botao-contorno" href="https://instagram.com/${esc(E.instagram)}" target="_blank" rel="noopener">${icone("instagram")}@${esc(E.instagram)}</a>` : ""
    ].join("");
    const infos = [...(E.informacoes || [])];
    if (ENTREGA.pedidoMinimo) infos.unshift(`Pedido mínimo para entrega: ${dinheiro(ENTREGA.pedidoMinimo)}.`);
    $("#informacoes").innerHTML = `
      <div class="rodape-inner">
        <div class="rodape-marca">
          <div class="rodape-logo">${foto(E.logo, `Logotipo de ${E.nome}`, `Logotipo de ${E.nome}`, { w: 96, h: 96, selo: false })}</div>
          <p class="rodape-nome">${esc(E.nome)}</p>
          <p class="rodape-endereco">${icone("pino")}<span>${esc(E.endereco || "Endereço não informado.")}</span></p>
          ${links ? `<div class="links-rodape">${links}</div>` : ""}
        </div>
        <div class="rodape-bloco">
          <h2>Horários</h2>
          <p class="rodape-status" data-aberto="${st.aberto}"><strong>${st.aberto ? "Aberto agora" : "Fechado agora"}</strong>, ${esc(st.texto)}</p>
          <ul class="horarios">${horas}</ul>
        </div>
        <div class="rodape-bloco">
          ${E.pagamentos?.length ? `<h2>Formas de pagamento</h2><ul class="pagamentos">${E.pagamentos.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
          ${BAIRROS.length ? `<h2>Taxas de entrega</h2><ul class="infos">${BAIRROS.map((b) => `<li>${esc(b.nome)}: ${b.taxa ? dinheiro(b.taxa) : "grátis"}</li>`).join("")}</ul>` : ""}
          ${infos.length ? `<h2>Bom saber</h2><ul class="infos">${infos.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
        </div>
      </div>
      <div class="rodape-base">
        <span>© ${new Date().getFullYear()} ${esc(E.nome)}</span>
        <span>Preços sujeitos a confirmação pelo estabelecimento.${C.creditoFotos && C.fotosIlustrativas ? " " + esc(C.creditoFotos) + "." : ""}</span>
      </div>`;
  }

  /* ---------- Detalhe do produto ---------- */
  const dlgProduto = $("#dlg-produto");
  let estado = null;

  function abrirProduto(id) {
    const p = porId[id];
    if (!p || !p.disponivel) return;
    estado = { p, sel: {}, qtd: 1, obs: "" };
    p.grupos.forEach((g) => (estado.sel[g.id] = []));
    renderProduto();
    dlgProduto.showModal();
    dlgProduto.querySelector(".painel-rolagem").scrollTop = 0;
  }

  function regraTexto(g) {
    const min = g.min || 0, max = g.max || 1;
    if (min >= 1 && max === 1) return "Obrigatório";
    if (min >= 1) return `Escolha de ${min} a ${max}`;
    return max === 1 ? "Opcional" : `Opcional, até ${max}`;
  }

  // Preço unitário e pendências para um produto e uma seleção { grupoId: [opcaoId] }
  function calcular(p, sel) {
    let unit = p.preco || 0;
    const faltas = [];
    let valido = true;
    for (const g of p.grupos) {
      const escolhidas = sel[g.id] || [];
      escolhidas.forEach((oid) => {
        const o = g.opcoes.find((x) => x.id === oid);
        if (o) unit += o.preco || 0; else valido = false;
      });
      if (escolhidas.length < (g.min || 0)) faltas.push(g);
      if (escolhidas.length > (g.max || 1)) valido = false;
    }
    return { unit, faltas, valido };
  }
  function avaliar() {
    const r = calcular(estado.p, estado.sel);
    return { ...r, total: r.unit * estado.qtd };
  }

  function renderProduto() {
    const { p } = estado;
    dlgProduto.innerHTML = `
      <div class="painel-inner">
        <div class="painel-rolagem">
          <div style="position:relative">
            <div class="detalhe-foto">${foto(p.fotoGrande || ampliar(p.foto), p.nome, p.legendaFoto, { eager: true, w: 800, h: 600 })}</div>
            <button type="button" class="fechar fechar-flutuante" data-fechar aria-label="Fechar">${icone("fechar")}</button>
          </div>
          <div class="detalhe-info">
            <h2 id="produto-titulo">${esc(p.nome)}</h2>
            ${p.descricao ? `<p>${esc(p.descricao)}</p>` : ""}
            ${p.selos?.length ? `<div class="linha-selos">${htmlSelos(p)}</div>` : ""}
          </div>
          ${p.grupos.map((g) => `
            <fieldset class="grupo" data-grupo="${esc(g.id)}">
              <legend><span>${esc(g.nome)}</span><span class="grupo-regra" data-obrigatorio="${(g.min || 0) >= 1}">${regraTexto(g)}</span></legend>
              ${g.opcoes.map((o) => `
                <label class="opcao">
                  <input type="${(g.max || 1) === 1 ? "radio" : "checkbox"}" name="g-${esc(g.id)}" value="${esc(o.id)}">
                  <span>${esc(o.nome)}</span>
                  <span class="preco">${o.preco ? "+ " + dinheiro(o.preco) : ""}</span>
                </label>`).join("")}
              ${(g.min || 0) < 1 && (g.max || 1) === 1 ? `<label class="opcao"><input type="radio" name="g-${esc(g.id)}" value="" checked><span>Sem ${esc(g.nome.toLowerCase())}</span><span class="preco"></span></label>` : ""}
            </fieldset>`).join("")}
          <div class="campo">
            <label for="obs">Observações</label>
            <textarea id="obs" maxlength="140" placeholder="Ex.: sem cebola, molho à parte"></textarea>
            <p class="ajuda">Pedidos especiais estão sujeitos à confirmação do estabelecimento.</p>
          </div>
        </div>
        <div class="painel-rodape">
          <p class="erro" id="produto-erro" aria-live="polite"></p>
          <div class="acoes-adicionar">
            <div class="quantidade" role="group" aria-label="Quantidade">
              <button type="button" data-qtd="-1" aria-label="Diminuir quantidade">${icone("menos")}</button>
              <output id="qtd" aria-live="polite">1</output>
              <button type="button" data-qtd="1" aria-label="Aumentar quantidade">${icone("mais")}</button>
            </div>
            <button type="button" class="botao botao-primario botao-bloco" id="btn-adicionar"><span>Adicionar</span><span class="preco" id="preco-modal"></span></button>
          </div>
        </div>
      </div>`;
    atualizarProduto();
  }

  function atualizarProduto() {
    const { unit, total, faltas } = avaliar();
    $("#qtd", dlgProduto).textContent = estado.qtd;
    $('[data-qtd="-1"]', dlgProduto).disabled = estado.qtd <= 1;
    $("#preco-modal", dlgProduto).textContent = faltas.length && total === 0 ? "" : dinheiro(total);
    const btn = $("#btn-adicionar", dlgProduto);
    btn.setAttribute("aria-disabled", faltas.length ? "true" : "false");
    const erro = $("#produto-erro", dlgProduto);
    if (!erro.dataset.alerta) erro.textContent = faltas.length ? `Falta escolher: ${faltas.map((f) => f.nome.toLowerCase()).join(", ")}` : "";
    erro.classList.toggle("pendente", !erro.dataset.alerta);
    estado.p.grupos.forEach((g) => {
      const fs = dlgProduto.querySelector(`[data-grupo="${CSS.escape(g.id)}"]`);
      const n = estado.sel[g.id].length;
      if ((g.min || 0) >= 1) fs.querySelector(".grupo-regra").dataset.ok = n >= g.min;
      if ((g.max || 1) > 1) fs.querySelectorAll('input[type="checkbox"]').forEach((i) => (i.disabled = !i.checked && n >= g.max));
    });
    return unit;
  }

  dlgProduto.addEventListener("change", (e) => {
    const fs = e.target.closest("[data-grupo]");
    if (fs) {
      const g = estado.p.grupos.find((x) => x.id === fs.dataset.grupo);
      estado.sel[g.id] = [...fs.querySelectorAll("input:checked")].map((i) => i.value).filter(Boolean);
      delete $("#produto-erro", dlgProduto).dataset.alerta;
      atualizarProduto();
    }
  });
  dlgProduto.addEventListener("input", (e) => { if (e.target.id === "obs") estado.obs = e.target.value.trim(); });
  dlgProduto.addEventListener("click", (e) => {
    if (e.target === dlgProduto || e.target.closest("[data-fechar]")) return dlgProduto.close();
    const q = e.target.closest("[data-qtd]");
    if (q) { estado.qtd = Math.max(1, Math.min(99, estado.qtd + Number(q.dataset.qtd))); atualizarProduto(); return; }
    if (e.target.closest("#btn-adicionar")) {
      const { faltas } = avaliar();
      if (faltas.length) {
        const erro = $("#produto-erro", dlgProduto);
        erro.dataset.alerta = "1";
        erro.classList.remove("pendente");
        erro.textContent = `Escolha uma opção em "${faltas[0].nome}" para continuar.`;
        dlgProduto.querySelector(`[data-grupo="${CSS.escape(faltas[0].id)}"]`).scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      adicionarItem(estado.p, estado.sel, estado.qtd, estado.obs);
      whatsAberto = false;
      persistir(); renderCarrinho();
      dlgProduto.close();
    }
  });

  /* ---------- Carrinho ---------- */
  const salvo = lsLer(LS_CHAVE) || {};
  let carrinho = Array.isArray(salvo.itens) ? salvo.itens : [];
  const checkout = {
    modalidade: salvo.modalidade || C.modalidades?.[0]?.id || "",
    nome: salvo.nome || "", endereco: salvo.endereco || "", bairro: salvo.bairro || "",
    pagamento: salvo.pagamento || "", pedido: salvo.pedido || "", cupom: salvo.cupom || "", agendamento: ""
  };
  if (MESA && (C.modalidades || []).some((m) => m.id === "mesa")) checkout.modalidade = "mesa";
  let avisoCupom = "";
  let whatsAberto = false;

  // Código curto do pedido (sem 0/O/1/I para não confundir). Vai na mensagem e no identificador do Pix.
  function novoCodigoPedido() {
    const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const n = new Uint32Array(5);
    (window.crypto || {}).getRandomValues ? crypto.getRandomValues(n) : n.forEach((_, i) => (n[i] = Math.random() * 1e9));
    return "PED" + [...n].map((x) => A[x % A.length]).join("");
  }
  function sincronizarCodigoPedido() {
    if (carrinho.length && !checkout.pedido) { checkout.pedido = novoCodigoPedido(); persistir(); }
    if (!carrinho.length && checkout.pedido) { checkout.pedido = ""; persistir(); }
  }

  function persistir() {
    const { agendamento, ...resto } = checkout;
    lsGravar(LS_CHAVE, { itens: carrinho, ...resto });
  }

  // Revalida itens salvos com os preços e opções atuais
  function revalidarCarrinho() {
    carrinho = carrinho.flatMap((i) => {
      const p = porId[i.produtoId];
      if (!p || !p.disponivel || !i.sel) return [];
      const { unit, faltas, valido } = calcular(p, i.sel);
      if (faltas.length || !valido) return [];
      return [{ ...i, nome: p.nome, unit, opcoes: opcoesDe(p, i.sel) }];
    });
  }

  const opcoesDe = (p, sel) => p.grupos.flatMap((g) => (sel[g.id] || []).map((oid) => {
    const o = g.opcoes.find((x) => x.id === oid);
    return { grupo: g.nome, nome: o.nome, preco: o.preco || 0 };
  }));

  function adicionarItem(p, sel, qtd, obs) {
    const { unit } = calcular(p, sel);
    const opcoes = opcoesDe(p, sel);
    const chave = p.id + "|" + opcoes.map((o) => o.grupo + ":" + o.nome).join(",") + "|" + obs;
    const existente = carrinho.find((i) => i.chave === chave);
    if (existente) existente.qtd = Math.min(99, existente.qtd + qtd);
    else carrinho.push({ chave, produtoId: p.id, nome: p.nome, sel: JSON.parse(JSON.stringify(sel)), opcoes, obs, unit, qtd });
  }

  /* Pedir de novo */
  const LS_ULTIMO = LS_CHAVE + ":ultimo";
  function guardarUltimoPedido() {
    lsGravar(LS_ULTIMO, { data: Date.now(), itens: carrinho.map(({ produtoId, sel, qtd, obs, nome }) => ({ produtoId, sel, qtd, obs, nome })) });
  }
  function repetirUltimoPedido() {
    const ultimo = lsLer(LS_ULTIMO);
    if (!ultimo?.itens?.length) return;
    let fora = 0;
    ultimo.itens.forEach((i) => {
      const p = porId[i.produtoId];
      const r = p && p.disponivel ? calcular(p, i.sel || {}) : null;
      if (!r || r.faltas.length || !r.valido) { fora++; return; }
      adicionarItem(p, i.sel || {}, i.qtd, i.obs || "");
    });
    avisoRepetir = fora ? `${fora} ${fora === 1 ? "item do último pedido não está disponível agora" : "itens do último pedido não estão disponíveis agora"}.` : "";
    persistir(); renderCarrinho();
  }
  let avisoRepetir = "";

  /* Cupom */
  const CUPONS = C.cupons || [];
  const acharCupom = (cod) => CUPONS.find((c) => normalizar(c.codigo) === normalizar(cod));
  function calcularCupom(subtotal) {
    const c = checkout.cupom && acharCupom(checkout.cupom);
    if (!c) return null;
    if (c.minimo && subtotal < c.minimo) return { cupom: c, desconto: 0, falta: c.minimo - subtotal };
    const desconto = c.tipo === "percentual" ? Math.round((subtotal * c.valor) / 100) : Math.min(c.valor, subtotal);
    return { cupom: c, desconto, falta: 0 };
  }

  const modalidadeAtual = () => (C.modalidades || []).find((m) => m.id === checkout.modalidade);
  const ehEntrega = () => !!modalidadeAtual()?.pedeEndereco;

  function totais() {
    const subtotal = carrinho.reduce((s, i) => s + i.unit * i.qtd, 0);
    const cup = calcularCupom(subtotal);
    const desconto = cup?.desconto || 0;
    const m = modalidadeAtual();
    let taxa = 0, taxaStatus = "ok";
    if (m?.pedeEndereco && BAIRROS.length) {
      const b = BAIRROS.find((x) => x.nome === checkout.bairro);
      if (b) taxa = b.taxa || 0; else taxaStatus = "bairro";
    } else if (m && m.taxa == null) taxaStatus = "confirmar";
    else if (m) taxa = m.taxa || 0;
    const qtd = carrinho.reduce((s, i) => s + i.qtd, 0);
    return { subtotal, desconto, cup, taxa, taxaStatus, total: subtotal - desconto + taxa, qtd };
  }

  // Fechado: "agendar" (pede horário), "bloquear" (não envia) ou "avisar" (só informa)
  const modoFechado = () => ENTREGA.quandoFechado || "agendar";
  const fechadoAgora = () => !MESA && !statusAgora().aberto;

  function pendencias(t = totais()) {
    if (!numeroWhats) return "O número de WhatsApp do estabelecimento ainda não foi configurado.";
    if (fechadoAgora() && modoFechado() === "bloquear") return `Estamos fechados agora (${statusAgora().texto}). Os pedidos voltam quando abrirmos.`;
    if (fechadoAgora() && modoFechado() === "agendar" && !checkout.agendamento) return "Escolha um horário para agendar o pedido.";
    if (ehEntrega()) {
      if (t.taxaStatus === "bairro") return "Escolha o bairro de entrega.";
      if (!checkout.endereco) return "Informe o endereço de entrega para continuar.";
      const base = t.subtotal - t.desconto;
      if (ENTREGA.pedidoMinimo && base < ENTREGA.pedidoMinimo) return `Pedido mínimo para entrega: ${dinheiro(ENTREGA.pedidoMinimo)}. Faltam ${dinheiro(ENTREGA.pedidoMinimo - base)}.`;
    }
    return "";
  }

  function detalhesItem(i) {
    const porGrupo = {};
    i.opcoes.forEach((o) => (porGrupo[o.grupo] = porGrupo[o.grupo] ? porGrupo[o.grupo] + ", " + o.nome : o.nome));
    return Object.entries(porGrupo).map(([g, v]) => `${g}: ${v}`);
  }

  function mensagem() {
    const t = totais();
    const m = modalidadeAtual();
    const L = [`*Novo pedido: ${E.nome}*`];
    if (checkout.pedido) L.push(`Código do pedido: *${checkout.pedido}*`);
    if (MESA) L.push(`*Mesa ${MESA}*`);
    L.push("");
    carrinho.forEach((i) => {
      L.push(`*${i.qtd}x ${i.nome}*  ${dinheiro(i.unit * i.qtd)}`);
      detalhesItem(i).forEach((d) => L.push(`   ${d}`));
      if (i.obs) L.push(`   Obs.: ${i.obs}`);
    });
    L.push("", `Subtotal: ${dinheiro(t.subtotal)}`);
    if (t.desconto) L.push(`Cupom ${t.cup.cupom.codigo.toUpperCase()}: -${dinheiro(t.desconto)}`);
    if (t.taxaStatus === "confirmar") L.push("Taxa de entrega: a confirmar");
    else if (t.taxaStatus === "bairro") L.push("Taxa de entrega: falta escolher o bairro");
    else if (t.taxa > 0) L.push(`Taxa de entrega${checkout.bairro && ehEntrega() ? ` (${checkout.bairro})` : ""}: ${dinheiro(t.taxa)}`);
    L.push(`*Total: ${dinheiro(t.total)}*${t.taxaStatus === "confirmar" ? " + taxa a confirmar" : ""}`, "");
    if (m) L.push(`Atendimento: ${m.nome}${MESA ? ` (mesa ${MESA})` : ""}`);
    if (fechadoAgora() && checkout.agendamento) L.push(`Agendado para: ${checkout.agendamento}`);
    if (checkout.nome) L.push(`Nome: ${checkout.nome}`);
    if (ehEntrega() && checkout.endereco) L.push(`Endereço: ${checkout.endereco}${checkout.bairro ? `, ${checkout.bairro}` : ""}`);
    if (checkout.pagamento) L.push(`Pagamento: ${checkout.pagamento}`);
    if (escolheuPix() && PIX.chave && t.taxaStatus === "ok") L.push("", "Vou pagar pelo Pix gerado no cardápio e enviar o comprovante nesta conversa.");
    return L.join("\n");
  }

  function htmlVazio(ctx) {
    const ultimo = lsLer(LS_ULTIMO);
    const resumo = ultimo?.itens?.length ? ultimo.itens.map((i) => `${i.qtd}x ${i.nome}`).join(", ") : "";
    return `
      <div class="painel-cabeca"><h2>Seu pedido</h2>${ctx === "modal" ? `<button type="button" class="fechar" data-fechar aria-label="Fechar">${icone("fechar")}</button>` : ""}</div>
      <div class="carrinho-vazio"><strong>Seu pedido está vazio</strong>Escolha um item do cardápio para começar.</div>
      ${resumo ? `
        <div class="ultimo-pedido">
          <p class="ultimo-titulo">Seu último pedido</p>
          <p class="ultimo-itens">${esc(resumo)}</p>
          <button type="button" class="botao botao-bloco" data-repetir>${icone("repetir")}Pedir de novo</button>
        </div>` : ""}`;
  }

  function htmlFechado(ctx) {
    if (!fechadoAgora()) return "";
    const st = statusAgora();
    const modo = modoFechado();
    const opcoes = modo === "agendar" ? opcoesAgendamento() : [];
    return `
      <div class="aviso-fechado">
        <p>${icone("relogio")}<span><strong>Estamos fechados agora</strong>, ${esc(st.texto)}.
        ${modo === "bloquear" ? "Você pode montar o pedido e enviar quando abrirmos." : modo === "agendar" ? "Agende seu pedido para quando abrirmos." : "Seu pedido será atendido quando abrirmos."}</span></p>
        ${opcoes.length ? `
          <div class="campo campo-compacto">
            <label for="ag-${ctx}">Horário do pedido</label>
            <select id="ag-${ctx}" data-campo="agendamento">
              <option value="">Escolha um horário</option>
              ${opcoes.map((o) => `<option ${o === checkout.agendamento ? "selected" : ""}>${esc(o)}</option>`).join("")}
            </select>
          </div>` : ""}
      </div>`;
  }

  function htmlCupom(ctx, t) {
    if (!CUPONS.length) return "";
    if (t.cup) {
      const c = t.cup.cupom;
      return `
        <div class="cupom-aplicado">
          <div><strong>Cupom ${esc(c.codigo.toUpperCase())}</strong>
          <span>${t.cup.falta ? `Vale a partir de ${dinheiro(c.minimo)}. Faltam ${dinheiro(t.cup.falta)}.` : esc(c.descricao || "Desconto aplicado")}</span></div>
          <button type="button" class="link-remover" data-remover-cupom>Remover</button>
        </div>`;
    }
    return `
      <div class="campo cupom">
        <label for="cupom-${ctx}">Cupom de desconto</label>
        <div class="cupom-linha">
          <input id="cupom-${ctx}" data-cupom-input autocomplete="off" autocapitalize="characters" placeholder="Digite o código">
          <button type="button" class="botao" data-aplicar-cupom>Aplicar</button>
        </div>
        ${avisoCupom ? `<p class="erro" role="alert">${esc(avisoCupom)}</p>` : ""}
      </div>`;
  }

  function htmlCarrinho(ctx) {
    if (!carrinho.length) return htmlVazio(ctx);
    const t = totais();
    const m = modalidadeAtual();
    const mods = C.modalidades || [];
    const pagamentos = E.pagamentos || [];
    const pend = pendencias(t);
    return `
      <div class="painel-inner">
        <div class="painel-cabeca"><div><h2>Seu pedido</h2>${checkout.pedido ? `<p class="codigo-pedido">Código ${esc(checkout.pedido)}${MESA ? ` · Mesa ${esc(MESA)}` : ""}</p>` : ""}</div>${ctx === "modal" ? `<button type="button" class="fechar" data-fechar aria-label="Fechar">${icone("fechar")}</button>` : ""}</div>
        <div class="painel-rolagem">
          ${avisoRepetir ? `<p class="aviso-repetir" role="status">${esc(avisoRepetir)}</p>` : ""}
          <ul class="carrinho-itens">
            ${carrinho.map((i, idx) => `
              <li class="item">
                <div class="item-topo">
                  <div>
                    <div class="item-nome">${esc(i.nome)}</div>
                    ${[...detalhesItem(i), i.obs ? "Obs.: " + i.obs : ""].filter(Boolean).map((d) => `<p class="item-detalhes">${esc(d)}</p>`).join("")}
                  </div>
                  <span class="preco">${dinheiro(i.unit * i.qtd)}</span>
                </div>
                <div class="item-acoes">
                  <div class="quantidade" role="group" aria-label="Quantidade de ${esc(i.nome)}">
                    <button type="button" data-item="${idx}" data-delta="-1" aria-label="Diminuir">${icone("menos")}</button>
                    <output>${i.qtd}</output>
                    <button type="button" data-item="${idx}" data-delta="1" aria-label="Aumentar" ${i.qtd >= 99 ? "disabled" : ""}>${icone("mais")}</button>
                  </div>
                  <button type="button" class="link-remover" data-remover="${idx}">Remover</button>
                </div>
              </li>`).join("")}
          </ul>
          ${htmlFechado(ctx)}
          ${mods.length && !MESA ? `
            <h3 class="secao-carrinho-titulo">Como você quer receber</h3>
            <div class="modalidades" role="radiogroup" aria-label="Modalidade de atendimento">
              ${mods.map((x) => `<label><input type="radio" name="mod-${ctx}" value="${esc(x.id)}" ${x.id === checkout.modalidade ? "checked" : ""}><span>${esc(x.nome)}</span></label>`).join("")}
            </div>` : ""}
          <div class="campo">
            <label for="nome-${ctx}">Seu nome (opcional)</label>
            <input id="nome-${ctx}" data-campo="nome" autocomplete="name" value="${esc(checkout.nome)}">
          </div>
          ${m?.pedeEndereco && BAIRROS.length ? `
            <div class="campo">
              <label for="bairro-${ctx}">Bairro</label>
              <select id="bairro-${ctx}" data-campo="bairro">
                <option value="">Escolha o bairro</option>
                ${BAIRROS.map((b) => `<option value="${esc(b.nome)}" ${b.nome === checkout.bairro ? "selected" : ""}>${esc(b.nome)} (${b.taxa ? dinheiro(b.taxa) : "grátis"})</option>`).join("")}
              </select>
              <p class="ajuda">Não achou seu bairro? Fale com a gente pelo WhatsApp.</p>
            </div>` : ""}
          ${m?.pedeEndereco ? `
            <div class="campo">
              <label for="end-${ctx}">Endereço de entrega</label>
              <input id="end-${ctx}" data-campo="endereco" autocomplete="street-address" value="${esc(checkout.endereco)}" placeholder="Rua, número e complemento">
              ${ENTREGA.pedidoMinimo ? `<p class="ajuda">Pedido mínimo para entrega: ${dinheiro(ENTREGA.pedidoMinimo)}.</p>` : ""}
            </div>` : ""}
          ${pagamentos.length ? `
            <div class="campo">
              <label for="pag-${ctx}">Forma de pagamento</label>
              <select id="pag-${ctx}" data-campo="pagamento">
                <option value="">Escolher depois</option>
                ${pagamentos.map((x) => `<option ${x === checkout.pagamento ? "selected" : ""}>${esc(x)}</option>`).join("")}
              </select>
            </div>` : ""}
          ${htmlCupom(ctx, t)}
          <div class="resumo">
            <div><span>Subtotal</span><span>${dinheiro(t.subtotal)}</span></div>
            ${t.desconto ? `<div class="desconto"><span>Desconto (${esc(t.cup.cupom.codigo.toUpperCase())})</span><span>-${dinheiro(t.desconto)}</span></div>` : ""}
            ${m?.pedeEndereco || t.taxaStatus === "confirmar" ? `<div><span>Taxa de entrega</span><span>${t.taxaStatus === "confirmar" ? "A confirmar" : t.taxaStatus === "bairro" ? "Escolha o bairro" : t.taxa ? dinheiro(t.taxa) : "Grátis"}</span></div>` : ""}
            <div class="total"><span>Total</span><span>${dinheiro(t.total)}</span></div>
          </div>
          ${htmlPix(ctx, t)}
          <details class="previa"><summary>Ver mensagem que será enviada</summary><pre data-previa>${esc(mensagem())}</pre></details>
        </div>
        <div class="painel-rodape">
          <p class="erro" data-aviso aria-live="polite">${esc(pend)}</p>
          <a class="botao botao-primario botao-bloco" data-enviar ${!pend ? `href="${linkWhats(mensagem())}" target="_blank" rel="noopener"` : 'aria-disabled="true" role="link"'}>
            ${icone("conversa")}Enviar pedido pelo WhatsApp
          </a>
          ${whatsAberto ? '<p class="retorno" role="status">O WhatsApp foi aberto com o pedido. Envie a mensagem por lá para concluir.</p>' : ""}
          ${ctx === "modal" ? '<button type="button" class="botao botao-bloco" data-fechar style="margin-top:8px;border:0;background:transparent">Continuar escolhendo</button>' : ""}
        </div>
      </div>`;
  }

  /* ---------- Pix com valor exato ---------- */
  const PIX = C.pix || {};
  const escolheuPix = () => /pix/i.test(checkout.pagamento || "");
  function codigoPix(t) {
    if (!PIX.chave || !window.PixBR) return "";
    return window.PixBR.gerar({ chave: PIX.chave, nome: PIX.nomeRecebedor || E.nome, cidade: PIX.cidade, centavos: t.total, txid: checkout.pedido });
  }
  function htmlPix(ctx, t) {
    if (!escolheuPix()) return "";
    let corpo;
    if (!PIX.chave) {
      corpo = '<p class="ajuda">O estabelecimento envia os dados do Pix pelo WhatsApp depois de receber o pedido.</p>';
    } else if (t.taxaStatus === "confirmar") {
      corpo = '<p class="ajuda">A taxa de entrega ainda vai ser confirmada. O estabelecimento envia o Pix com o valor final pelo WhatsApp.</p>';
    } else if (t.taxaStatus === "bairro") {
      corpo = '<p class="ajuda">Escolha o bairro de entrega para gerar o Pix com o valor certo.</p>';
    } else {
      const cod = codigoPix(t);
      corpo = `
        <p class="pix-valor">Pague <strong>${dinheiro(t.total)}</strong> no app do seu banco e depois envie o pedido com o comprovante.</p>
        <div class="pix-qr" data-qr="${esc(cod)}" aria-label="QR Code Pix de ${dinheiro(t.total)}" role="img"></div>
        <label class="pix-rotulo" for="pix-${ctx}">Pix copia e cola</label>
        <textarea class="pix-codigo" id="pix-${ctx}" readonly rows="3">${esc(cod)}</textarea>
        <button type="button" class="botao botao-bloco pix-copiar" data-copiar-pix>Copiar código Pix</button>
        <p class="pix-id">Identificador do Pix: <strong>${esc(checkout.pedido)}</strong>, o mesmo código do pedido.</p>
        <p class="ajuda" data-pix-status aria-live="polite">Recebedor: ${esc(PIX.nomeRecebedor || E.nome)}. Confira o nome no app do banco antes de pagar.</p>`;
    }
    return `<section class="pix" aria-label="Pagamento por Pix"><h3 class="secao-carrinho-titulo">Pagamento por Pix</h3>${corpo}</section>`;
  }

  // Biblioteca de QR Code carregada só quando o Pix aparece
  let qrLib = null;
  function carregarQR() {
    if (window.qrcode) return Promise.resolve();
    qrLib = qrLib || new Promise((ok, falha) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js";
      s.onload = ok; s.onerror = falha;
      document.head.appendChild(s);
    });
    return qrLib;
  }
  function desenharQR() {
    const alvos = document.querySelectorAll("[data-qr]");
    if (!alvos.length) return;
    carregarQR().then(() => {
      alvos.forEach((el) => {
        const q = window.qrcode(0, "M");
        q.addData(el.dataset.qr);
        q.make();
        el.innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
      });
    }).catch(() => alvos.forEach((el) => el.remove()));
  }
  async function copiarPix(botao) {
    const area = botao.parentElement.querySelector(".pix-codigo");
    const status = botao.parentElement.querySelector("[data-pix-status]");
    try { await navigator.clipboard.writeText(area.value); }
    catch { area.select(); document.execCommand("copy"); }
    botao.textContent = "Código copiado";
    if (status) status.textContent = "Código copiado. Abra o app do banco, escolha Pix copia e cola e cole o código.";
    setTimeout(() => (botao.textContent = "Copiar código Pix"), 2500);
  }

  const dlgCarrinho = $("#dlg-carrinho");
  function renderCarrinho() {
    sincronizarCodigoPedido();
    const ativo = document.activeElement;
    const idAtivo = ativo?.id;
    $("#carrinho-lateral").innerHTML = htmlCarrinho("lateral");
    $("#carrinho-modal").innerHTML = htmlCarrinho("modal");
    if (idAtivo && document.getElementById(idAtivo) && ativo.matches("input,select")) {
      const novo = document.getElementById(idAtivo);
      novo.focus();
      if (novo.setSelectionRange && typeof novo.value === "string" && novo.type !== "search") novo.setSelectionRange(novo.value.length, novo.value.length);
    }
    const t = totais();
    const barra = $("#barra-pedido");
    barra.hidden = t.qtd === 0;
    barra.tabIndex = t.qtd ? 0 : -1;
    $("#barra-qtd").textContent = t.qtd;
    $("#barra-total").textContent = dinheiro(t.subtotal - t.desconto);
    barra.setAttribute("aria-label", `Ver pedido: ${t.qtd} ${t.qtd === 1 ? "item" : "itens"}, ${dinheiro(t.subtotal - t.desconto)}`);
    document.documentElement.style.setProperty("--altura-barra", t.qtd ? "84px" : "0px");
    desenharQR();
  }

  function aplicarCupom(botao) {
    const input = botao.closest(".cupom").querySelector("[data-cupom-input]");
    const cod = input.value.trim();
    if (!cod) { avisoCupom = "Digite o código do cupom."; renderCarrinho(); return; }
    if (!acharCupom(cod)) { avisoCupom = `O cupom "${cod.toUpperCase()}" não existe ou expirou.`; renderCarrinho(); return; }
    checkout.cupom = cod; avisoCupom = "";
    persistir(); renderCarrinho();
  }

  function aoInteragirCarrinho(e) {
    if (e.target.closest("[data-fechar]") || e.target === dlgCarrinho) return dlgCarrinho.close();
    const d = e.target.closest("[data-delta]");
    if (d) {
      const i = carrinho[+d.dataset.item];
      i.qtd += +d.dataset.delta;
      if (i.qtd <= 0) carrinho.splice(+d.dataset.item, 1);
      i.qtd = Math.min(99, i.qtd);
      whatsAberto = false; avisoRepetir = ""; persistir(); renderCarrinho(); return;
    }
    const r = e.target.closest("[data-remover]");
    if (r) { carrinho.splice(+r.dataset.remover, 1); whatsAberto = false; avisoRepetir = ""; persistir(); renderCarrinho(); return; }
    if (e.target.closest("[data-repetir]")) { repetirUltimoPedido(); return; }
    const ac = e.target.closest("[data-aplicar-cupom]");
    if (ac) { aplicarCupom(ac); return; }
    if (e.target.closest("[data-remover-cupom]")) { checkout.cupom = ""; persistir(); renderCarrinho(); return; }
    const cp = e.target.closest("[data-copiar-pix]");
    if (cp) { copiarPix(cp); return; }
    const env = e.target.closest("[data-enviar]");
    if (env) {
      if (env.getAttribute("aria-disabled") === "true") { e.preventDefault(); return; }
      whatsAberto = true;
      guardarUltimoPedido();
      setTimeout(renderCarrinho, 0);
    }
  }
  function aoMudarCarrinho(e) {
    if (e.target.matches("[data-cupom-input]")) {
      if (e.type === "keydown") return;
      return;
    }
    if (e.target.name?.startsWith("mod-")) {
      if (e.type === "change") { checkout.modalidade = e.target.value; persistir(); renderCarrinho(); }
      return;
    }
    const campo = e.target.dataset.campo;
    if (!campo) return;
    checkout[campo] = e.target.value.trim();
    persistir();
    if (["pagamento", "bairro", "agendamento"].includes(campo) && e.type === "change") { renderCarrinho(); return; }
    // Sincroniza o mesmo campo no outro painel sem redesenhar (não perde foco nem clique)
    document.querySelectorAll(`[data-campo="${campo}"]`).forEach((el) => { if (el !== e.target) el.value = e.target.value; });
    atualizarEnvio();
  }

  function atualizarEnvio() {
    const pend = pendencias();
    const msg = mensagem();
    document.querySelectorAll("[data-enviar]").forEach((a) => {
      if (!pend) { a.href = linkWhats(msg); a.target = "_blank"; a.rel = "noopener"; a.removeAttribute("aria-disabled"); a.removeAttribute("role"); }
      else { a.removeAttribute("href"); a.setAttribute("aria-disabled", "true"); a.setAttribute("role", "link"); }
    });
    document.querySelectorAll("[data-aviso]").forEach((p) => (p.textContent = pend));
    document.querySelectorAll("[data-previa]").forEach((pre) => (pre.textContent = msg));
  }
  [dlgCarrinho, $("#carrinho-lateral")].forEach((el) => {
    el.addEventListener("click", aoInteragirCarrinho);
    el.addEventListener("change", aoMudarCarrinho);
    el.addEventListener("input", aoMudarCarrinho);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.matches("[data-cupom-input]")) { e.preventDefault(); aplicarCupom(e.target); }
    });
  });
  $("#barra-pedido").addEventListener("click", () => dlgCarrinho.showModal());

  /* ---------- Instalar como app (PWA) ---------- */
  function registrarServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol !== "https:" && location.hostname !== "localhost") return;
    addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch((e) => console.warn("Service worker não registrado", e)));
  }

  /* ---------- Início ---------- */
  async function iniciar() {
    aplicarTema();
    registrarServiceWorker();
    renderTopo();
    if (C.planilha?.url) $("#cardapio").innerHTML = '<p class="carregando" role="status">Carregando o cardápio…</p>';
    await carregarPlanilha();
    montarProdutos();
    revalidarCarrinho();
    renderSEO();
    renderCardapio();
    renderRodape();
    renderCarrinho();
  }
  iniciar();

  // Exposto só para testes no console
  window.__cardapio = { mensagem, totais, statusAgora, pendencias, opcoesAgendamento, lerCSV, get carrinho() { return carrinho; }, get checkout() { return checkout; } };
})();
