/* Cardápio digital — lógica. Não coloque dados de estabelecimento aqui: use js/config.js (ou a planilha). */
(function () {
  "use strict";

  const C = window.CARDAPIO;
  const $ = (s, el = document) => el.querySelector(s);
  const LS_CHAVE = "cardapio:" + (C?.estabelecimento?.nome || "padrao");
  const DIAS_PT = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

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

  /* ---------- Idiomas ---------- */
  // Ordem: ?lang= no link, escolha salva no celular, idioma do celular. A mensagem do WhatsApp fica sempre em português.
  const IDI = window.IDIOMAS || { textos: {}, dias: {}, nomes: {} };
  const IDIOMAS_ATIVOS = (C?.idiomas || ["pt"]).filter((l) => l === "pt" || IDI.textos[l]);
  const LANG = (() => {
    const q = new URLSearchParams(location.search).get("lang");
    const salvo = lsLer("cardapio:idioma");
    const nav = String(navigator.language || "pt").slice(0, 2).toLowerCase();
    return [q, salvo, nav].find((l) => l && IDIOMAS_ATIVOS.includes(l)) || "pt";
  })();
  const GLOSSARIO = (C?.traducoes || {})[LANG] || {};
  // T("texto em português", {variaveis}) → texto no idioma escolhido
  function T(txt, vars) {
    let s = LANG === "pt" ? txt : (IDI.textos[LANG]?.[txt] ?? GLOSSARIO[txt] ?? txt);
    if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
    return s;
  }
  // Campo traduzido de um item: item.en.nome, depois o glossário, depois o português
  const tx = (obj, campo) => {
    const v = obj?.[campo] ?? "";
    if (LANG === "pt") return v;
    return obj?.[LANG]?.[campo] || (typeof v === "string" && GLOSSARIO[v]) || v;
  };
  const DIAS = IDI.dias?.[LANG] || DIAS_PT;
  document.documentElement.lang = { pt: "pt-BR", en: "en", es: "es" }[LANG] || LANG;

  const ICONES = {
    conversa: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>',
    pino: '<path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    mais: '<path d="M12 5v14M5 12h14"/>',
    menos: '<path d="M5 12h14"/>',
    fechar: '<path d="M6 6l12 12M18 6 6 18"/>',
    busca: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    estrela: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9Z"/>',
    repetir: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9"/><path d="M20 4v5h-5"/><path d="M20 12a8 8 0 0 1-14 5.3L4 15"/><path d="M4 20v-5h5"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/>'
  };
  const icone = (n) => `<svg class="icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[n]}</svg>`;

  const reservado = (legenda) => `<div class="foto-reservada" role="img" aria-label="${esc(T("Espaço reservado: {x}", { x: legenda }))}">${esc(legenda)}</div>`;
  const foto = (src, alt, legenda, { eager = false, w = 320, h = 320, selo = true } = {}) =>
    src
      ? `<img src="${esc(src)}" alt="${esc(legenda || alt)}" width="${w}" height="${h}" data-legenda="${esc(legenda || alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">` +
        (selo && C.fotosIlustrativas ? `<span class="selo-foto" aria-hidden="true">${T("Imagem ilustrativa")}</span>` : "")
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
  // Fechamentos vindos da aba Avisos: "sim" (fechado até mudar) ou datas (feriados, folgas)
  const FECHAMENTO = { sempre: false, datas: [] };
  const somaDias = (data, n) => { const d = new Date(data); d.setDate(d.getDate() + n); return d; };
  const ddmm = (d) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  const fechadoNaData = (d) => FECHAMENTO.datas.some((x) => x === ddmm(d) || x === `${ddmm(d)}/${d.getFullYear()}`);
  const turnosNaData = (d) => (fechadoNaData(d) ? [] : turnos(d.getDay()));

  function statusAgora(agora = new Date()) {
    if (FECHAMENTO.sempre) return { aberto: false, texto: T("fechado temporariamente") };
    const min = agora.getHours() * 60 + agora.getMinutes();
    for (const t of turnosNaData(agora)) if (min >= t.ini && min < t.fim) return { aberto: true, texto: T("fecha às {h}", { h: t.f }) };
    for (const t of turnosNaData(somaDias(agora, -1))) if (t.fim > 1440 && min + 1440 < t.fim) return { aberto: true, texto: T("fecha às {h}", { h: t.f }) };
    for (let d = 0; d < 14; d++) {
      const data = somaDias(agora, d);
      const prox = turnosNaData(data).find((t) => d > 0 || t.ini > min);
      if (prox) {
        const quando = d === 0 ? T("hoje") : d === 1 ? T("amanhã") : d < 7 ? DIAS[data.getDay()].toLowerCase() : ddmm(data);
        return { aberto: false, texto: T("abre {q} às {h}", { q: quando, h: prox.i }) };
      }
    }
    return { aberto: false, texto: T("horário não informado") };
  }
  // Horários para agendar: próximo dia com expediente, de 30 em 30 minutos.
  // valor vai na mensagem (português); rotulo aparece para o cliente.
  function opcoesAgendamento(agora = new Date()) {
    if (FECHAMENTO.sempre) return [];
    const min = agora.getHours() * 60 + agora.getMinutes();
    for (let d = 0; d < 14; d++) {
      const data = somaDias(agora, d);
      const pt = d === 0 ? "Hoje" : d === 1 ? "Amanhã" : d < 7 ? DIAS_PT[data.getDay()] : ddmm(data);
      const rot = d === 0 ? T("Hoje") : d === 1 ? T("Amanhã") : d < 7 ? DIAS[data.getDay()] : ddmm(data);
      const slots = [];
      turnosNaData(data).forEach((t) => {
        for (let m = t.ini + 30; m <= t.fim - 30; m += 30) {
          if (d === 0 && m <= min + 30) continue;
          const h = paraHora(m);
          slots.push({ valor: `${pt} às ${h}`, rotulo: T("{d} às {h}", { d: rot, h }) });
        }
      });
      if (slots.length) return slots;
    }
    return [];
  }

  /* ---------- Aba "Avisos" da planilha ---------- */
  const AVISO = {};
  const CHAVES_DIAS = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  // "18:00-23:00", "11h30 às 15h, 18h às 23h", "fechado"
  function lerTurnos(v) {
    const n = normalizar(v);
    if (!n) return null;
    if (/fechad|nao abre|folga/.test(n)) return [];
    const r = [];
    const re = /(\d{1,2})(?:[:h](\d{2}))?\s*h?\s*(?:-|–|as|ate|a)\s*(\d{1,2})(?:[:h](\d{2}))?/g;
    let m;
    while ((m = re.exec(n))) {
      const a = +m[1], b = +(m[2] || 0), c = +m[3], d = +(m[4] || 0);
      if (a > 24 || c > 24 || b > 59 || d > 59) continue;
      const hh = (x, y) => `${String(x % 24).padStart(2, "0")}:${String(y).padStart(2, "0")}`;
      r.push([hh(a, b), hh(c, d)]);
    }
    return r.length ? r : null;
  }
  // "24/11", "25/12/2026", "24/11, 25/12" (datas que o Google converte também chegam como 24/11/2026)
  function lerDatas(v) {
    return [...String(v).matchAll(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/g)].map((m) => {
      const dm = `${m[1].padStart(2, "0")}/${m[2].padStart(2, "0")}`;
      if (!m[3]) return dm;
      return `${dm}/${m[3].length === 2 ? "20" + m[3] : m[3]}`;
    });
  }
  function aplicarAvisos(linhas) {
    const v = {};
    linhas.forEach((l) => { const k = normalizar(l.chave).replace(/\s+/g, "_"); if (k) v[k] = String(l.valor ?? "").trim(); });
    const texto = (s) => String(s || "").replace(/\s+/g, " ").trim().slice(0, 240);
    ["pt", "en", "es"].forEach((l) => { const s = texto(l === "pt" ? v.aviso : v["aviso_" + l]); if (s) AVISO[l] = s; });
    const f = normalizar(v.fechado);
    if (f) {
      FECHAMENTO.sempre = sim(f);
      FECHAMENTO.datas = lerDatas(v.fechado);
    }
    const novos = {};
    CHAVES_DIAS.forEach((k, i) => { const t = lerTurnos(v[k]); if (t) novos[i] = t; });
    if (Object.keys(novos).length) C.horarios = { ...(C.horarios || {}), ...novos };
  }
  function urlAvisos() {
    const p = C.planilha || {};
    if (p.avisos) return urlCSV(p.avisos);
    const m = String(p.url || "").match(/docs\.google\.com\/spreadsheets\/d\/([\w-]+)/);
    return m && !/\/pub/.test(p.url) ? `https://docs.google.com/spreadsheets/d/${m[1]}/gviz/tq?tqx=out:csv&headers=1&sheet=Avisos` : "";
  }
  async function carregarAvisos() {
    const url = urlAvisos();
    if (!url) return;
    const CACHE = LS_CHAVE + ":avisos";
    // Só vale se a aba tiver as colunas chave e valor (o Google devolve a primeira aba quando "Avisos" não existe)
    const valida = (txt) => { const l = lerCSV(txt); return l.length && "chave" in l[0] && "valor" in l[0] ? l : null; };
    try {
      const r = await buscar(url);
      const linhas = valida(r);
      lsGravar(CACHE, linhas ? r : "");
      if (linhas) aplicarAvisos(linhas);
    } catch (erro) {
      const salvo = lsLer(CACHE);
      const linhas = salvo && valida(salvo);
      if (linhas) aplicarAvisos(linhas);
    }
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
      // Proteções: só fotos https, preços entre 0 e R$ 10.000, textos com tamanho limitado
      const preco = (v) => { const c = paraCentavos(v); return c !== null && c >= 0 && c <= 1000000 ? c : null; };
      const texto = (v, max) => String(v).replace(/\s+/g, " ").trim().slice(0, max);
      const dados = {};
      if (l.categoria) dados.categoria = achaCategoria(texto(l.categoria, 40));
      if (l.nome) dados.nome = texto(l.nome, 80);
      if (l.descricao) dados.descricao = texto(l.descricao, 280);
      if (preco(l.preco) !== null) dados.preco = preco(l.preco);
      if ("preco_original" in l) dados.precoOriginal = preco(l.preco_original) || undefined;
      if (l.disponivel) dados.disponivel = sim(l.disponivel);
      if (/^https:\/\/[^\s"'<>]+$/i.test(l.foto || "")) dados.foto = l.foto;
      if (l.destaque) dados.destaque = sim(l.destaque);
      if (l.mais_pedido) dados.maisPedido = sim(l.mais_pedido);
      if (l.sugestao) dados.sugestao = sim(l.sugestao);
      if (l.selos) dados.selos = l.selos.split(/[|/]/).map((s) => slug(s)).filter(Boolean);
      ["en", "es"].forEach((lg) => {
        const tr = {};
        if (l["nome_" + lg]) tr.nome = texto(l["nome_" + lg], 80);
        if (l["descricao_" + lg]) tr.descricao = texto(l["descricao_" + lg], 280);
        if (tr.nome || tr.descricao) dados[lg] = { ...(porIdCfg[id]?.[lg] || {}), ...tr };
      });
      if (porIdCfg[id]) Object.assign(porIdCfg[id], dados);
      else if (dados.nome && dados.categoria && dados.preco != null) {
        const novo = { id, legendaFoto: dados.nome, ...dados };
        C.produtos.push(novo); porIdCfg[id] = novo;
      }
    });
  }

  // Aceita o link normal da planilha (compartilhada como "qualquer pessoa com o link") ou o CSV publicado
  function urlCSV(url) {
    const m = String(url).match(/docs\.google\.com\/spreadsheets\/d\/([\w-]+)/);
    if (!m || /\/pub|output=csv|gviz/.test(url)) return url;
    const gid = (String(url).match(/[#&?]gid=(\d+)/) || [])[1];
    return `https://docs.google.com/spreadsheets/d/${m[1]}/gviz/tq?tqx=out:csv&headers=1${gid ? "&gid=" + gid : ""}`;
  }

  async function buscar(url) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    try {
      const r = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.text();
    } finally { clearTimeout(timer); }
  }

  async function carregarPlanilha() {
    const url = C.planilha?.url && urlCSV(C.planilha.url);
    if (!url) return;
    const CACHE = LS_CHAVE + ":planilha";
    try {
      const texto = await buscar(url);
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
  const nomeSelo = (s) => T(NOMES_SELOS[s] || s.replace(/-/g, " "));
  const htmlSelos = (p) => (p.selos || []).map((s) => `<span class="selo-info">${esc(nomeSelo(s))}</span>`).join("");

  /* ---------- Render: topo ---------- */
  function renderTopo() {
    document.title = `${E.nome || "Cardápio"} | Cardápio e pedidos`;
    $('meta[name="description"]').content = E.descricao || "Cardápio digital com pedido pelo WhatsApp.";
    // Textos fixos do index.html
    document.querySelectorAll("[data-t]").forEach((el) => (el.textContent = T(el.dataset.t)));
    document.querySelectorAll("[data-t-aria]").forEach((el) => el.setAttribute("aria-label", T(el.dataset.tAria)));
    renderIdiomas();
    $("#capa").innerHTML = foto(E.capa, T("Ambiente de {n}", { n: E.nome }), T("Ambiente de {n}", { n: E.nome }), { eager: true, w: 1200, h: 480 });
    $("#logo").innerHTML = foto(E.logo, T("Logotipo de {n}", { n: E.nome }), T("Logotipo de {n}", { n: E.nome }), { eager: true, w: 160, h: 160, selo: false });
    $("#nome").textContent = E.nome || "";
    $("#descricao").textContent = tx(E, "descricao");
    $("#aviso-demo").hidden = !C.demonstracao;
    if (MESA) {
      const av = $("#aviso-mesa");
      av.hidden = false;
      av.innerHTML = T("Você está na <strong>mesa {m}</strong>. Monte o pedido e envie pelo WhatsApp para o atendimento.", { m: esc(MESA) });
    }

    const bW = $("#btn-whats-topo");
    bW.innerHTML = icone("conversa") + "WhatsApp";
    if (numeroWhats) bW.href = linkWhats(""); else bW.remove();
    const bM = $("#btn-mapa-topo");
    bM.innerHTML = icone("pino") + esc(T("Como chegar"));
    if (E.mapsUrl) bM.href = E.mapsUrl; else bM.remove();
    atualizarStatus();
    setInterval(atualizarStatus, 60000);
  }
  /* SEO: Open Graph sempre; dados estruturados (schema.org) só com dados reais */
  function renderSEO() {
    const meta = (prop, valor, attr = "property") => {
      if (!valor || document.head.querySelector(`meta[${attr}="${prop}"]`)) return; // o HTML tem prioridade
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
    el.innerHTML = `<strong>${T(s.aberto ? "Aberto agora" : "Fechado")}</strong>, ${esc(s.texto)}`;
  }

  // Seletor de idioma (só aparece com mais de um idioma em C.idiomas)
  function renderIdiomas() {
    const box = $("#idiomas");
    if (!box || IDIOMAS_ATIVOS.length < 2) return;
    box.hidden = false;
    box.setAttribute("aria-label", T("Idioma"));
    box.innerHTML = IDIOMAS_ATIVOS.map((l) =>
      `<button type="button" lang="${l}" data-idioma="${l}" aria-pressed="${l === LANG}" title="${esc(IDI.nomes?.[l] || l)}">${l.toUpperCase()}</button>`).join("");
    box.addEventListener("click", (e) => {
      const b = e.target.closest("[data-idioma]");
      if (!b || b.dataset.idioma === LANG) return;
      lsGravar("cardapio:idioma", b.dataset.idioma);
      const u = new URL(location.href);
      // Sem armazenamento no celular, o idioma vai no próprio link
      if (lsLer("cardapio:idioma") === b.dataset.idioma) u.searchParams.delete("lang");
      else u.searchParams.set("lang", b.dataset.idioma);
      location.replace(u.href);
    });
  }

  // Aviso do dia (aba Avisos da planilha)
  function renderAviso() {
    const el = $("#aviso-loja");
    const txt = AVISO[LANG] || AVISO.pt;
    if (!el || !txt) return;
    el.hidden = false;
    el.innerHTML = `<span class="sr">${esc(T("Aviso do estabelecimento"))}: </span>${esc(txt)}`;
  }

  /* ---------- Render: cardápio ---------- */
  function cardProduto(p) {
    const { valor, aPartir } = precoMinimo(p);
    const destaque = p.destaque && p.disponivel;
    const selos = [
      !p.disponivel ? `<span class="selo selo-neutro">${T("Indisponível")}</span>` : "",
      p.precoOriginal && p.disponivel ? `<span class="selo">${T("Promoção")}</span>` : ""
    ].join("");
    const cat = (C.categorias || []).find((c) => c.id === p.categoria);
    const nome = tx(p, "nome"), desc = tx(p, "descricao");
    // Busca funciona no idioma escolhido e também em português
    const busca = normalizar([nome, desc, p.nome, p.descricao, tx(cat, "nome"), cat?.nome, ...(p.selos || []).map(nomeSelo)].join(" "));
    return `
      <button type="button" class="produto ${destaque ? "produto-destaque" : ""}" data-produto="${esc(p.id)}"
        data-busca="${esc(busca)}" data-selos="${esc((p.selos || []).join(" "))}"
        ${p.disponivel ? "" : 'aria-disabled="true"'} aria-label="${esc(nome)}, ${aPartir ? esc(T("a partir de")) + " " : ""}${dinheiro(valor)}${p.disponivel ? "" : ", " + esc(T("indisponível"))}">
        <span class="produto-texto">
          <h3>${esc(nome)}</h3>
          <p>${esc(desc)}</p>
          ${p.selos?.length ? `<span class="linha-selos">${htmlSelos(p)}</span>` : ""}
          <span class="linha-preco">
            ${aPartir ? `<span class="a-partir">${T("a partir de")}</span>` : ""}
            <span class="preco${p.precoOriginal ? " preco-promo" : ""}">${dinheiro(valor)}</span>
            ${p.precoOriginal ? `<span class="preco-antigo">${dinheiro(p.precoOriginal)}</span>` : ""}
            ${selos}
          </span>
        </span>
        <span class="produto-foto">${foto(p.foto, nome, LANG === "pt" ? p.legendaFoto : nome, destaque ? { w: 800, h: 450 } : {})}</span>
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
      .map((c) => `<button type="button" class="chip" data-alvo="sec-${esc(c.id)}">${esc(tx(c, "nome"))}</button>`)
      .join("");
    main.innerHTML = `
      <div class="ferramentas">
        <label class="busca">
          ${icone("busca")}
          <span class="sr">${T("Buscar no cardápio")}</span>
          <input type="search" id="busca" placeholder="${esc(T("Buscar no cardápio"))}" autocomplete="off" enterkeyhint="search">
        </label>
        ${selosUsados.length ? `<div class="filtros" role="group" aria-label="${esc(T("Filtrar por"))}">
          ${selosUsados.map((s) => `<button type="button" class="filtro" data-selo="${esc(s)}" aria-pressed="false">${esc(nomeSelo(s))}</button>`).join("")}
        </div>` : ""}
      </div>
      <p class="vazio" id="sem-resultado" hidden></p>` +
      lista.map((c) => `
        <section class="secao" id="sec-${esc(c.id)}" aria-labelledby="tit-${esc(c.id)}">
          <h2 id="tit-${esc(c.id)}">${esc(tx(c, "nome"))}</h2>
          <p class="secao-contagem">${T(c.itens.length === 1 ? "{n} item" : "{n} itens", { n: c.itens.length })}</p>
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
    if (!vazio.hidden) vazio.innerHTML = `${T("Nenhum item encontrado.")} <button type="button" class="link-acao" data-limpar-filtro>${T("Limpar busca e filtros")}</button>`;
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
    const agora = new Date();
    const hoje = agora.getDay();
    const ordem = [1, 2, 3, 4, 5, 6, 0];
    // Mostra a semana que vem pela frente: um feriado cadastrado aparece como "Fechado" no dia dele
    const horas = ordem.map((d) => {
      const data = somaDias(agora, (d - hoje + 7) % 7);
      const t = FECHAMENTO.sempre ? [] : turnosNaData(data);
      const txt = t.length ? t.map((x) => esc(T("{i} às {f}", { i: x.i, f: x.f }))).join("<br>") : T("Fechado");
      return `<li${d === hoje ? ' data-hoje="true"' : ""}${t.length ? "" : ' data-fechado="true"'}>
        <span>${DIAS[d]}${d === hoje ? `<span class="hoje">${T("hoje")}</span>` : ""}</span><span>${txt}</span></li>`;
    }).join("");
    const st = statusAgora();
    const links = [
      E.mapsUrl ? `<a class="botao botao-claro" href="${esc(E.mapsUrl)}" target="_blank" rel="noopener">${icone("pino")}${T("Como chegar")}</a>` : "",
      numeroWhats ? `<a class="botao botao-contorno" href="${linkWhats("")}" target="_blank" rel="noopener">${icone("conversa")}WhatsApp</a>` : "",
      AVALIACAO ? `<a class="botao botao-contorno" href="${esc(AVALIACAO)}" target="_blank" rel="noopener">${icone("estrela")}${T("Avaliar no Google")}</a>` : "",
      E.instagram ? `<a class="botao botao-contorno" href="https://instagram.com/${esc(E.instagram)}" target="_blank" rel="noopener">${icone("instagram")}@${esc(E.instagram)}</a>` : ""
    ].join("");
    const infos = [...(tx(E, "informacoes") || [])];
    if (ENTREGA.pedidoMinimo) infos.unshift(T("Pedido mínimo para entrega: {v}.", { v: dinheiro(ENTREGA.pedidoMinimo) }));
    // Próximos fechamentos (feriados) cadastrados na planilha
    const anoAtual = agora.getFullYear();
    const proximas = FECHAMENTO.datas.filter((x) => {
      const [d, m, a] = x.split("/").map(Number);
      return somaDias(new Date(a || anoAtual, m - 1, d), 1) >= agora;
    });
    if (proximas.length) infos.unshift(T("Fechado nestes dias: {d}.", { d: proximas.map((x) => x.slice(0, 5)).join(", ") }));
    $("#informacoes").innerHTML = `
      <div class="rodape-inner">
        <div class="rodape-marca">
          <div class="rodape-logo">${foto(E.logo, T("Logotipo de {n}", { n: E.nome }), T("Logotipo de {n}", { n: E.nome }), { w: 96, h: 96, selo: false })}</div>
          <p class="rodape-nome">${esc(E.nome)}</p>
          <p class="rodape-endereco">${icone("pino")}<span>${esc(E.endereco || T("Endereço não informado."))}</span></p>
          ${links ? `<div class="links-rodape">${links}</div>` : ""}
        </div>
        <div class="rodape-bloco">
          <h2>${T("Horários")}</h2>
          <p class="rodape-status" data-aberto="${st.aberto}"><strong>${T(st.aberto ? "Aberto agora" : "Fechado agora")}</strong>, ${esc(st.texto)}</p>
          <ul class="horarios">${horas}</ul>
        </div>
        <div class="rodape-bloco">
          ${E.pagamentos?.length ? `<h2>${T("Formas de pagamento")}</h2><ul class="pagamentos">${E.pagamentos.map((x) => `<li>${esc(T(x))}</li>`).join("")}</ul>` : ""}
          ${BAIRROS.length ? `<h2>${T("Taxas de entrega")}</h2><ul class="infos">${BAIRROS.map((b) => `<li>${esc(b.nome)}: ${b.taxa ? dinheiro(b.taxa) : T("grátis")}</li>`).join("")}</ul>` : ""}
          ${infos.length ? `<h2>${T("Bom saber")}</h2><ul class="infos">${infos.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
        </div>
      </div>
      <div class="rodape-base">
        <span>© ${new Date().getFullYear()} ${esc(E.nome)}</span>
        <span>${T("Preços sujeitos a confirmação pelo estabelecimento.")}${C.creditoFotos && C.fotosIlustrativas ? " " + esc(C.creditoFotos) + "." : ""}</span>
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
    if (min >= 1 && max === 1) return T("Obrigatório");
    if (min >= 1) return T("Escolha de {a} a {b}", { a: min, b: max });
    return max === 1 ? T("Opcional") : T("Opcional, até {n}", { n: max });
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
            <div class="detalhe-foto">${foto(p.fotoGrande || ampliar(p.foto), tx(p, "nome"), LANG === "pt" ? p.legendaFoto : tx(p, "nome"), { eager: true, w: 800, h: 600 })}</div>
            <button type="button" class="fechar fechar-flutuante" data-fechar aria-label="${esc(T("Fechar"))}">${icone("fechar")}</button>
          </div>
          <div class="detalhe-info">
            <h2 id="produto-titulo">${esc(tx(p, "nome"))}</h2>
            ${p.descricao ? `<p>${esc(tx(p, "descricao"))}</p>` : ""}
            ${p.selos?.length ? `<div class="linha-selos">${htmlSelos(p)}</div>` : ""}
          </div>
          ${p.grupos.map((g) => `
            <fieldset class="grupo" data-grupo="${esc(g.id)}">
              <legend><span>${esc(tx(g, "nome"))}</span><span class="grupo-regra" data-obrigatorio="${(g.min || 0) >= 1}">${regraTexto(g)}</span></legend>
              ${g.opcoes.map((o) => `
                <label class="opcao">
                  <input type="${(g.max || 1) === 1 ? "radio" : "checkbox"}" name="g-${esc(g.id)}" value="${esc(o.id)}">
                  <span>${esc(tx(o, "nome"))}</span>
                  <span class="preco">${o.preco ? "+ " + dinheiro(o.preco) : ""}</span>
                </label>`).join("")}
              ${(g.min || 0) < 1 && (g.max || 1) === 1 ? `<label class="opcao"><input type="radio" name="g-${esc(g.id)}" value="" checked><span>${esc(T("Sem {g}", { g: tx(g, "nome").toLowerCase() }))}</span><span class="preco"></span></label>` : ""}
            </fieldset>`).join("")}
          <div class="campo">
            <label for="obs">${T("Observações")}</label>
            <textarea id="obs" maxlength="140" placeholder="${esc(T("Ex.: sem cebola, molho à parte"))}"></textarea>
            <p class="ajuda">${T("Pedidos especiais estão sujeitos à confirmação do estabelecimento.")}</p>
          </div>
        </div>
        <div class="painel-rodape">
          <p class="erro" id="produto-erro" aria-live="polite"></p>
          <div class="acoes-adicionar">
            <div class="quantidade" role="group" aria-label="${esc(T("Quantidade"))}">
              <button type="button" data-qtd="-1" aria-label="${esc(T("Diminuir quantidade"))}">${icone("menos")}</button>
              <output id="qtd" aria-live="polite">1</output>
              <button type="button" data-qtd="1" aria-label="${esc(T("Aumentar quantidade"))}">${icone("mais")}</button>
            </div>
            <button type="button" class="botao botao-primario botao-bloco" id="btn-adicionar"><span>${T("Adicionar")}</span><span class="preco" id="preco-modal"></span></button>
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
    if (!erro.dataset.alerta) erro.textContent = faltas.length ? T("Falta escolher: {x}", { x: faltas.map((f) => tx(f, "nome").toLowerCase()).join(", ") }) : "";
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
        erro.textContent = T("Escolha uma opção em \"{g}\" para continuar.", { g: tx(faltas[0], "nome") });
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
    avisoRepetir = fora ? T(fora === 1 ? "{n} item do último pedido não está disponível agora." : "{n} itens do último pedido não estão disponíveis agora.", { n: fora }) : "";
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
  // Sem horário para agendar (ex.: fechado temporariamente), "agendar" vira "bloquear"
  const modoFechado = () => {
    const m = ENTREGA.quandoFechado || "agendar";
    return m === "agendar" && !opcoesAgendamento().length ? "bloquear" : m;
  };
  const fechadoAgora = () => !MESA && !statusAgora().aberto;

  function pendencias(t = totais()) {
    if (!numeroWhats) return T("O número de WhatsApp do estabelecimento ainda não foi configurado.");
    if (fechadoAgora() && modoFechado() === "bloquear") return T("Estamos fechados agora ({s}). Os pedidos voltam quando abrirmos.", { s: statusAgora().texto });
    if (fechadoAgora() && modoFechado() === "agendar" && !checkout.agendamento) return T("Escolha um horário para agendar o pedido.");
    if (ehEntrega()) {
      if (t.taxaStatus === "bairro") return T("Escolha o bairro de entrega.");
      if (!checkout.endereco) return T("Informe o endereço de entrega para continuar.");
      const base = t.subtotal - t.desconto;
      if (ENTREGA.pedidoMinimo && base < ENTREGA.pedidoMinimo) return T("Pedido mínimo para entrega: {v}. Faltam {f}.", { v: dinheiro(ENTREGA.pedidoMinimo), f: dinheiro(ENTREGA.pedidoMinimo - base) });
    }
    return "";
  }

  // Nome e opções do item no idioma do cliente (a mensagem usa os nomes em português)
  const nomeItem = (i) => (porId[i.produtoId] ? tx(porId[i.produtoId], "nome") : i.nome);
  function detalhesTela(i) {
    const p = porId[i.produtoId];
    if (LANG === "pt" || !p || !i.sel) return detalhesItem(i);
    return p.grupos.filter((g) => i.sel[g.id]?.length).map((g) =>
      `${tx(g, "nome")}: ${i.sel[g.id].map((oid) => tx(g.opcoes.find((o) => o.id === oid), "nome")).join(", ")}`);
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
    if (LANG !== "pt") L.push(`Idioma do cliente: ${{ en: "inglês", es: "espanhol" }[LANG] || LANG}`);
    if (escolheuPix() && PIX.chave && t.taxaStatus === "ok") L.push("", "Vou pagar pelo Pix gerado no cardápio e enviar o comprovante nesta conversa.");
    return L.join("\n");
  }

  function htmlVazio(ctx) {
    const ultimo = lsLer(LS_ULTIMO);
    const resumo = ultimo?.itens?.length ? ultimo.itens.map((i) => `${i.qtd}x ${nomeItem(i)}`).join(", ") : "";
    return `
      <div class="painel-cabeca"><h2>${T("Seu pedido")}</h2>${ctx === "modal" ? `<button type="button" class="fechar" data-fechar aria-label="${esc(T("Fechar"))}">${icone("fechar")}</button>` : ""}</div>
      <div class="carrinho-vazio"><strong>${T("Seu pedido está vazio")}</strong>${T("Escolha um item do cardápio para começar.")}</div>
      ${resumo ? `
        <div class="ultimo-pedido">
          <p class="ultimo-titulo">${T("Seu último pedido")}</p>
          <p class="ultimo-itens">${esc(resumo)}</p>
          <button type="button" class="botao botao-bloco" data-repetir>${icone("repetir")}${T("Pedir de novo")}</button>
        </div>
        ${htmlAvaliacao()}` : ""}`;
  }

  /* "Peça também": sugestões no carrinho (config.sugestoes ou coluna "sugestao" da planilha) */
  function listaSugestoes() {
    const ids = [...(C.sugestoes || []), ...produtos.filter((p) => p.sugestao).map((p) => p.id)];
    const noCarrinho = new Set(carrinho.map((i) => i.produtoId));
    return [...new Set(ids)].map((id) => porId[id]).filter((p) => p && p.disponivel && !noCarrinho.has(p.id)).slice(0, 3);
  }
  function htmlSugestoes(ctx) {
    const lista = listaSugestoes();
    if (!lista.length) return "";
    return `
      <section class="sugestoes" aria-labelledby="sug-${ctx}">
        <h3 class="secao-carrinho-titulo" id="sug-${ctx}">${T("Peça também")}</h3>
        <ul class="sugestoes-lista">
          ${lista.map((p) => {
            const { valor, aPartir } = precoMinimo(p);
            const nome = tx(p, "nome");
            return `<li><button type="button" class="sugestao" data-sugestao="${esc(p.id)}" aria-label="${esc(T("Adicionar {n}", { n: nome }))}, ${aPartir ? esc(T("a partir de")) + " " : ""}${dinheiro(valor)}">
              <span class="sugestao-foto">${foto(p.foto, nome, nome, { w: 96, h: 96, selo: false })}</span>
              <span class="sugestao-nome">${esc(nome)}</span>
              <span class="sugestao-preco">${aPartir ? `<small>${T("a partir de")}</small> ` : ""}${dinheiro(valor)}</span>
              <span class="sugestao-mais" aria-hidden="true">${icone("mais")}</span>
            </button></li>`;
          }).join("")}
        </ul>
      </section>`;
  }
  function aceitarSugestao(id) {
    const p = porId[id];
    if (!p || !p.disponivel) return;
    // Com escolha obrigatória (sabor, tamanho), abre o detalhe por cima do carrinho
    if (p.grupos.some((g) => (g.min || 0) >= 1)) { abrirProduto(id); return; }
    adicionarItem(p, {}, 1, "");
    whatsAberto = false; avisoRepetir = T("{n} adicionado ao pedido.", { n: tx(p, "nome") });
    persistir(); renderCarrinho();
  }

  /* Lembrete do comprovante do Pix (o site não tem acesso ao comprovante: o cliente anexa na conversa) */
  function htmlComprovante() {
    if (!escolheuPix() || !PIX.chave || !numeroWhats) return "";
    const texto = `Segue o comprovante do Pix do pedido ${checkout.pedido} (${dinheiro(totais().total)}).`;
    return `
    <div class="lembrete-comprovante" role="note">
      <p><strong>${T("Não esqueça o comprovante do Pix")}</strong>${T("Depois de pagar, envie o comprovante na conversa. O pedido só é preparado depois que o pagamento é conferido.")}</p>
      <a class="botao botao-primario botao-bloco" href="${linkWhats(texto)}" target="_blank" rel="noopener">${icone("conversa")}${T("Enviar comprovante no WhatsApp")}</a>
    </div>`;
  }

  /* Avaliação no Google (estabelecimento.avaliacaoUrl) */
  const AVALIACAO = /^https:\/\/[^\s"'<>]+$/i.test(E.avaliacaoUrl || "") ? E.avaliacaoUrl : "";
  const htmlAvaliacao = () => AVALIACAO ? `
    <div class="avaliacao">
      <p><strong>${T("Gostou? Avalie a gente no Google")}</strong>${T("Sua avaliação ajuda outras pessoas a nos encontrar.")}</p>
      <a class="botao botao-bloco" href="${esc(AVALIACAO)}" target="_blank" rel="noopener">${icone("estrela")}${T("Avaliar no Google")}</a>
    </div>` : "";

  function htmlFechado(ctx) {
    if (!fechadoAgora()) return "";
    const st = statusAgora();
    const modo = modoFechado();
    const opcoes = modo === "agendar" ? opcoesAgendamento() : [];
    return `
      <div class="aviso-fechado">
        <p>${icone("relogio")}<span><strong>${T("Estamos fechados agora")}</strong>, ${esc(st.texto)}.
        ${T(modo === "bloquear" ? "Você pode montar o pedido e enviar quando abrirmos." : modo === "agendar" ? "Agende seu pedido para quando abrirmos." : "Seu pedido será atendido quando abrirmos.")}</span></p>
        ${opcoes.length ? `
          <div class="campo campo-compacto">
            <label for="ag-${ctx}">${T("Horário do pedido")}</label>
            <select id="ag-${ctx}" data-campo="agendamento">
              <option value="">${T("Escolha um horário")}</option>
              ${opcoes.map((o) => `<option value="${esc(o.valor)}" ${o.valor === checkout.agendamento ? "selected" : ""}>${esc(o.rotulo)}</option>`).join("")}
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
          <div><strong>${esc(T("Cupom {c}", { c: c.codigo.toUpperCase() }))}</strong>
          <span>${t.cup.falta ? T("Vale a partir de {v}. Faltam {f}.", { v: dinheiro(c.minimo), f: dinheiro(t.cup.falta) }) : esc(tx(c, "descricao") || T("Desconto aplicado"))}</span></div>
          <button type="button" class="link-remover" data-remover-cupom>${T("Remover")}</button>
        </div>`;
    }
    return `
      <div class="campo cupom">
        <label for="cupom-${ctx}">${T("Cupom de desconto")}</label>
        <div class="cupom-linha">
          <input id="cupom-${ctx}" data-cupom-input autocomplete="off" autocapitalize="characters" placeholder="${esc(T("Digite o código"))}">
          <button type="button" class="botao" data-aplicar-cupom>${T("Aplicar")}</button>
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
        <div class="painel-cabeca"><div><h2>${T("Seu pedido")}</h2>${checkout.pedido ? `<p class="codigo-pedido">${esc(T("Código {c}", { c: checkout.pedido }))}${MESA ? ` · ${esc(T("Mesa {m}", { m: MESA }))}` : ""}</p>` : ""}</div>${ctx === "modal" ? `<button type="button" class="fechar" data-fechar aria-label="${esc(T("Fechar"))}">${icone("fechar")}</button>` : ""}</div>
        <div class="painel-rolagem">
          ${avisoRepetir ? `<p class="aviso-repetir" role="status">${esc(avisoRepetir)}</p>` : ""}
          <ul class="carrinho-itens">
            ${carrinho.map((i, idx) => `
              <li class="item">
                <div class="item-topo">
                  <div>
                    <div class="item-nome">${esc(nomeItem(i))}</div>
                    ${[...detalhesTela(i), i.obs ? T("Obs.: {x}", { x: i.obs }) : ""].filter(Boolean).map((d) => `<p class="item-detalhes">${esc(d)}</p>`).join("")}
                  </div>
                  <span class="preco">${dinheiro(i.unit * i.qtd)}</span>
                </div>
                <div class="item-acoes">
                  <div class="quantidade" role="group" aria-label="${esc(T("Quantidade de {n}", { n: nomeItem(i) }))}">
                    <button type="button" data-item="${idx}" data-delta="-1" aria-label="${esc(T("Diminuir"))}">${icone("menos")}</button>
                    <output>${i.qtd}</output>
                    <button type="button" data-item="${idx}" data-delta="1" aria-label="${esc(T("Aumentar"))}" ${i.qtd >= 99 ? "disabled" : ""}>${icone("mais")}</button>
                  </div>
                  <button type="button" class="link-remover" data-remover="${idx}">${T("Remover")}</button>
                </div>
              </li>`).join("")}
          </ul>
          ${htmlSugestoes(ctx)}
          ${htmlFechado(ctx)}
          ${mods.length && !MESA ? `
            <h3 class="secao-carrinho-titulo">${T("Como você quer receber")}</h3>
            <div class="modalidades" role="radiogroup" aria-label="${esc(T("Modalidade de atendimento"))}">
              ${mods.map((x) => `<label><input type="radio" name="mod-${ctx}" value="${esc(x.id)}" ${x.id === checkout.modalidade ? "checked" : ""}><span>${esc(tx(x, "nome"))}</span></label>`).join("")}
            </div>` : ""}
          <div class="campo">
            <label for="nome-${ctx}">${T("Seu nome (opcional)")}</label>
            <input id="nome-${ctx}" data-campo="nome" autocomplete="name" value="${esc(checkout.nome)}">
          </div>
          ${m?.pedeEndereco && BAIRROS.length ? `
            <div class="campo">
              <label for="bairro-${ctx}">${T("Bairro")}</label>
              <select id="bairro-${ctx}" data-campo="bairro">
                <option value="">${T("Escolha o bairro")}</option>
                ${BAIRROS.map((b) => `<option value="${esc(b.nome)}" ${b.nome === checkout.bairro ? "selected" : ""}>${esc(b.nome)} (${b.taxa ? dinheiro(b.taxa) : T("grátis")})</option>`).join("")}
              </select>
              <p class="ajuda">${T("Não achou seu bairro? Fale com a gente pelo WhatsApp.")}</p>
            </div>` : ""}
          ${m?.pedeEndereco ? `
            <div class="campo">
              <label for="end-${ctx}">${T("Endereço de entrega")}</label>
              <input id="end-${ctx}" data-campo="endereco" autocomplete="street-address" value="${esc(checkout.endereco)}" placeholder="${esc(T("Rua, número e complemento"))}">
              ${ENTREGA.pedidoMinimo ? `<p class="ajuda">${T("Pedido mínimo para entrega: {v}.", { v: dinheiro(ENTREGA.pedidoMinimo) })}</p>` : ""}
            </div>` : ""}
          ${pagamentos.length ? `
            <div class="campo">
              <label for="pag-${ctx}">${T("Forma de pagamento")}</label>
              <select id="pag-${ctx}" data-campo="pagamento">
                <option value="">${T("Escolher depois")}</option>
                ${pagamentos.map((x) => `<option value="${esc(x)}" ${x === checkout.pagamento ? "selected" : ""}>${esc(T(x))}</option>`).join("")}
              </select>
            </div>` : ""}
          ${htmlCupom(ctx, t)}
          <div class="resumo">
            <div><span>${T("Subtotal")}</span><span>${dinheiro(t.subtotal)}</span></div>
            ${t.desconto ? `<div class="desconto"><span>${esc(T("Desconto ({c})", { c: t.cup.cupom.codigo.toUpperCase() }))}</span><span>-${dinheiro(t.desconto)}</span></div>` : ""}
            ${m?.pedeEndereco || t.taxaStatus === "confirmar" ? `<div><span>${T("Taxa de entrega")}</span><span>${t.taxaStatus === "confirmar" ? T("A confirmar") : t.taxaStatus === "bairro" ? T("Escolha o bairro") : t.taxa ? dinheiro(t.taxa) : T("Grátis")}</span></div>` : ""}
            <div class="total"><span>${T("Total")}</span><span>${dinheiro(t.total)}</span></div>
          </div>
          ${htmlPix(ctx, t)}
          <details class="previa"><summary>${T("Ver mensagem que será enviada")}</summary>${LANG !== "pt" ? `<p class="ajuda">${T("A mensagem vai em português para o restaurante entender o pedido.")}</p>` : ""}<pre data-previa>${esc(mensagem())}</pre></details>
          ${whatsAberto ? htmlAvaliacao() : ""}
        </div>
        <div class="painel-rodape">
          <p class="erro" data-aviso aria-live="polite">${esc(pend)}</p>
          <a class="botao botao-primario botao-bloco" data-enviar ${!pend ? `href="${linkWhats(mensagem())}" target="_blank" rel="noopener"` : 'aria-disabled="true" role="link"'}>
            ${icone("conversa")}${T("Enviar pedido pelo WhatsApp")}
          </a>
          ${whatsAberto ? `<p class="retorno" role="status">${T("O WhatsApp foi aberto com o pedido. Envie a mensagem por lá para concluir.")}</p>${htmlComprovante()}` : ""}
          ${ctx === "modal" ? `<button type="button" class="botao botao-bloco" data-fechar style="margin-top:8px;border:0;background:transparent">${T("Continuar escolhendo")}</button>` : ""}
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
      corpo = `<p class="ajuda">${T("O estabelecimento envia os dados do Pix pelo WhatsApp depois de receber o pedido.")}</p>`;
    } else if (t.taxaStatus === "confirmar") {
      corpo = `<p class="ajuda">${T("A taxa de entrega ainda vai ser confirmada. O estabelecimento envia o Pix com o valor final pelo WhatsApp.")}</p>`;
    } else if (t.taxaStatus === "bairro") {
      corpo = `<p class="ajuda">${T("Escolha o bairro de entrega para gerar o Pix com o valor certo.")}</p>`;
    } else {
      const cod = codigoPix(t);
      corpo = `
        <p class="pix-valor">${T("Pague <strong>{v}</strong> no app do seu banco e depois envie o pedido com o comprovante.", { v: dinheiro(t.total) })}</p>
        <div class="pix-qr" data-qr="${esc(cod)}" aria-label="${esc(T("QR Code Pix de {v}", { v: dinheiro(t.total) }))}" role="img"></div>
        <label class="pix-rotulo" for="pix-${ctx}">${T("Pix copia e cola")}</label>
        <textarea class="pix-codigo" id="pix-${ctx}" readonly rows="3">${esc(cod)}</textarea>
        <button type="button" class="botao botao-bloco pix-copiar" data-copiar-pix>${T("Copiar código Pix")}</button>
        <p class="pix-id">${T("Identificador do Pix: <strong>{c}</strong>, o mesmo código do pedido.", { c: esc(checkout.pedido) })}</p>
        <p class="ajuda" data-pix-status aria-live="polite">${esc(T("Recebedor: {n}. Confira o nome no app do banco antes de pagar.", { n: PIX.nomeRecebedor || E.nome }))}</p>`;
    }
    return `<section class="pix" aria-label="${esc(T("Pagamento por Pix"))}"><h3 class="secao-carrinho-titulo">${T("Pagamento por Pix")}</h3>${corpo}</section>`;
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
    botao.textContent = T("Código copiado");
    if (status) status.textContent = T("Código copiado. Abra o app do banco, escolha Pix copia e cola e cole o código.");
    setTimeout(() => (botao.textContent = T("Copiar código Pix")), 2500);
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
    barra.setAttribute("aria-label", T("Ver pedido: {q}, {v}", { q: T(t.qtd === 1 ? "{n} item" : "{n} itens", { n: t.qtd }), v: dinheiro(t.subtotal - t.desconto) }));
    document.documentElement.style.setProperty("--altura-barra", t.qtd ? "84px" : "0px");
    desenharQR();
  }

  function aplicarCupom(botao) {
    const input = botao.closest(".cupom").querySelector("[data-cupom-input]");
    const cod = input.value.trim();
    if (!cod) { avisoCupom = T("Digite o código do cupom."); renderCarrinho(); return; }
    if (!acharCupom(cod)) { avisoCupom = T("O cupom \"{c}\" não existe ou expirou.", { c: cod.toUpperCase() }); renderCarrinho(); return; }
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
    const sg = e.target.closest("[data-sugestao]");
    if (sg) { aceitarSugestao(sg.dataset.sugestao); return; }
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
    if (C.planilha?.url) $("#cardapio").innerHTML = `<p class="carregando" role="status">${T("Carregando o cardápio…")}</p>`;
    await Promise.all([carregarPlanilha(), carregarAvisos()]);
    renderAviso();
    atualizarStatus();
    montarProdutos();
    revalidarCarrinho();
    renderSEO();
    renderCardapio();
    renderRodape();
    renderCarrinho();
  }
  iniciar();

  // Exposto só para testes no console
  window.__cardapio = { LANG, aplicarAvisos, lerTurnos, lerDatas, FECHAMENTO, mensagem, totais, statusAgora, pendencias, opcoesAgendamento, lerCSV, get carrinho() { return carrinho; }, get checkout() { return checkout; } };
})();
