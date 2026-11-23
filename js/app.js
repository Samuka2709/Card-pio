/* Cardápio digital — lógica. Não coloque dados de estabelecimento aqui: use js/config.js. */
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
  const lsLer = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  const lsGravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* armazenamento indisponível */ } };

  const ICONES = {
    conversa: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>',
    pino: '<path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    mais: '<path d="M12 5v14M5 12h14"/>',
    menos: '<path d="M5 12h14"/>',
    fechar: '<path d="M6 6l12 12M18 6 6 18"/>',
    sacola: '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
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
  const numeroWhats = String(E.whatsapp || "").replace(/\D/g, "");
  const linkWhats = (texto) => `https://wa.me/${numeroWhats}${texto ? "?text=" + encodeURIComponent(texto) : ""}`;

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

  /* ---------- Produtos e preços ---------- */
  const produtos = (C.produtos || []).map((p) => ({ disponivel: true, grupos: [], ...p }));
  const porId = Object.fromEntries(produtos.map((p) => [p.id, p]));

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

  /* ---------- Render: topo ---------- */
  function renderTopo() {
    document.title = `${E.nome || "Cardápio"} | Cardápio e pedidos`;
    $('meta[name="description"]').content = E.descricao || "Cardápio digital com pedido pelo WhatsApp.";
    $("#capa").innerHTML = foto(E.capa, `Ambiente de ${E.nome}`, `Ambiente de ${E.nome}`, { eager: true, w: 1200, h: 480 });
    $("#logo").innerHTML = foto(E.logo, `Logotipo de ${E.nome}`, `Logotipo de ${E.nome}`, { eager: true, w: 160, h: 160, selo: false });
    renderSEO();
    $("#nome").textContent = E.nome || "";
    $("#descricao").textContent = E.descricao || "";
    $("#aviso-demo").hidden = !C.demonstracao;

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
    return `
      <button type="button" class="produto ${destaque ? "produto-destaque" : ""}" data-produto="${esc(p.id)}"
        ${p.disponivel ? "" : 'aria-disabled="true"'} aria-label="${esc(p.nome)}, ${aPartir ? "a partir de " : ""}${dinheiro(valor)}${p.disponivel ? "" : ", indisponível"}">
        <span class="produto-texto">
          <h3>${esc(p.nome)}</h3>
          <p>${esc(p.descricao)}</p>
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

  function renderCardapio() {
    const lista = secoes();
    const main = $("#cardapio");
    if (!lista.length) {
      main.innerHTML = '<p class="vazio">Nenhum produto cadastrado ainda. Adicione itens em js/config.js.</p>';
      $("#categorias").hidden = true;
      return;
    }
    $("#categorias-trilho").innerHTML = lista
      .map((c) => `<button type="button" class="chip" data-alvo="sec-${esc(c.id)}">${esc(c.nome)}</button>`)
      .join("");
    main.innerHTML = lista
      .map((c) => `
        <section class="secao" id="sec-${esc(c.id)}" aria-labelledby="tit-${esc(c.id)}">
          <h2 id="tit-${esc(c.id)}">${esc(c.nome)}</h2>
          <p class="secao-contagem">${c.itens.length} ${c.itens.length === 1 ? "item" : "itens"}</p>
          <div class="lista">${c.itens.map(cardProduto).join("")}</div>
        </section>`)
      .join("");

    main.addEventListener("click", (e) => {
      const b = e.target.closest("[data-produto]");
      if (b && b.getAttribute("aria-disabled") !== "true") abrirProduto(b.dataset.produto, b);
    });
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
    const secs = [...document.querySelectorAll(".secao")];
    let atual = null;
    const calc = () => {
      if (Date.now() < travaSpy) return;
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
          ${E.informacoes?.length ? `<h2>Bom saber</h2><ul class="infos">${E.informacoes.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
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

  function avaliar() {
    const { p, sel, qtd } = estado;
    let unit = p.preco || 0;
    const faltas = [];
    for (const g of p.grupos) {
      const escolhidas = sel[g.id];
      escolhidas.forEach((oid) => (unit += g.opcoes.find((o) => o.id === oid)?.preco || 0));
      if (escolhidas.length < (g.min || 0)) faltas.push(g);
    }
    return { unit, total: unit * qtd, faltas };
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
      const { unit, faltas } = avaliar();
      if (faltas.length) {
        const erro = $("#produto-erro", dlgProduto);
        erro.dataset.alerta = "1";
        erro.classList.remove("pendente");
        erro.textContent = `Escolha uma opção em "${faltas[0].nome}" para continuar.`;
        dlgProduto.querySelector(`[data-grupo="${CSS.escape(faltas[0].id)}"]`).scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      adicionarAoCarrinho(unit);
      dlgProduto.close();
    }
  });

  /* ---------- Carrinho ---------- */
  const salvo = lsLer(LS_CHAVE) || {};
  let carrinho = Array.isArray(salvo.itens) ? salvo.itens.filter((i) => porId[i.produtoId]?.disponivel) : [];
  const checkout = { modalidade: salvo.modalidade || C.modalidades?.[0]?.id || "", nome: salvo.nome || "", endereco: salvo.endereco || "", pagamento: salvo.pagamento || "" };
  let whatsAberto = false;

  function persistir() { lsGravar(LS_CHAVE, { itens: carrinho, ...checkout }); }

  function adicionarAoCarrinho(unit) {
    const { p, sel, qtd, obs } = estado;
    const opcoes = p.grupos.flatMap((g) => sel[g.id].map((oid) => {
      const o = g.opcoes.find((x) => x.id === oid);
      return { grupo: g.nome, nome: o.nome, preco: o.preco || 0 };
    }));
    const chave = p.id + "|" + opcoes.map((o) => o.grupo + ":" + o.nome).join(",") + "|" + obs;
    const existente = carrinho.find((i) => i.chave === chave);
    if (existente) existente.qtd = Math.min(99, existente.qtd + qtd);
    else carrinho.push({ chave, produtoId: p.id, nome: p.nome, opcoes, obs, unit, qtd });
    whatsAberto = false;
    persistir(); renderCarrinho();
  }

  const modalidadeAtual = () => (C.modalidades || []).find((m) => m.id === checkout.modalidade);
  function totais() {
    const subtotal = carrinho.reduce((s, i) => s + i.unit * i.qtd, 0);
    const m = modalidadeAtual();
    const taxa = m ? m.taxa : 0;
    return { subtotal, taxa, total: subtotal + (taxa || 0), qtd: carrinho.reduce((s, i) => s + i.qtd, 0) };
  }

  function detalhesItem(i) {
    const porGrupo = {};
    i.opcoes.forEach((o) => (porGrupo[o.grupo] = porGrupo[o.grupo] ? porGrupo[o.grupo] + ", " + o.nome : o.nome));
    return Object.entries(porGrupo).map(([g, v]) => `${g}: ${v}`);
  }

  function mensagem() {
    const t = totais();
    const m = modalidadeAtual();
    const L = [`*Novo pedido: ${E.nome}*`, ""];
    carrinho.forEach((i) => {
      L.push(`*${i.qtd}x ${i.nome}*  ${dinheiro(i.unit * i.qtd)}`);
      detalhesItem(i).forEach((d) => L.push(`   ${d}`));
      if (i.obs) L.push(`   Obs.: ${i.obs}`);
    });
    L.push("", `Subtotal: ${dinheiro(t.subtotal)}`);
    if (m) {
      if (m.taxa === null || m.taxa === undefined) L.push("Taxa de entrega: a confirmar");
      else if (m.taxa > 0) L.push(`Taxa de entrega: ${dinheiro(m.taxa)}`);
    }
    L.push(`*Total: ${dinheiro(t.total)}*${m && m.taxa == null ? " + taxa a confirmar" : ""}`, "");
    if (m) L.push(`Atendimento: ${m.nome}`);
    if (checkout.nome) L.push(`Nome: ${checkout.nome}`);
    if (m?.pedeEndereco && checkout.endereco) L.push(`Endereço: ${checkout.endereco}`);
    if (checkout.pagamento) L.push(`Pagamento: ${checkout.pagamento}`);
    return L.join("\n");
  }

  function htmlCarrinho(ctx) {
    if (!carrinho.length) {
      return `
        <div class="painel-cabeca"><h2>Seu pedido</h2>${ctx === "modal" ? `<button type="button" class="fechar" data-fechar aria-label="Fechar">${icone("fechar")}</button>` : ""}</div>
        <div class="carrinho-vazio"><strong>Seu pedido está vazio</strong>Escolha um item do cardápio para começar.</div>`;
    }
    const t = totais();
    const m = modalidadeAtual();
    const mods = C.modalidades || [];
    const pagamentos = E.pagamentos || [];
    const faltaEndereco = m?.pedeEndereco && !checkout.endereco;
    const podeEnviar = !!numeroWhats && !faltaEndereco;
    return `
      <div class="painel-inner">
        <div class="painel-cabeca"><h2>Seu pedido</h2>${ctx === "modal" ? `<button type="button" class="fechar" data-fechar aria-label="Fechar">${icone("fechar")}</button>` : ""}</div>
        <div class="painel-rolagem">
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
          ${mods.length ? `
            <h3 class="secao-carrinho-titulo">Como você quer receber</h3>
            <div class="modalidades" role="radiogroup" aria-label="Modalidade de atendimento">
              ${mods.map((x) => `<label><input type="radio" name="mod-${ctx}" value="${esc(x.id)}" ${x.id === checkout.modalidade ? "checked" : ""}><span>${esc(x.nome)}</span></label>`).join("")}
            </div>` : ""}
          <div class="campo">
            <label for="nome-${ctx}">Seu nome (opcional)</label>
            <input id="nome-${ctx}" data-campo="nome" autocomplete="name" value="${esc(checkout.nome)}">
          </div>
          ${m?.pedeEndereco ? `
            <div class="campo">
              <label for="end-${ctx}">Endereço de entrega</label>
              <input id="end-${ctx}" data-campo="endereco" autocomplete="street-address" value="${esc(checkout.endereco)}" placeholder="Rua, número, bairro e complemento" aria-describedby="end-ajuda-${ctx}">
              <p class="ajuda" id="end-ajuda-${ctx}">Necessário para pedidos com entrega.</p>
            </div>` : ""}
          ${pagamentos.length ? `
            <div class="campo">
              <label for="pag-${ctx}">Forma de pagamento</label>
              <select id="pag-${ctx}" data-campo="pagamento">
                <option value="">Escolher depois</option>
                ${pagamentos.map((x) => `<option ${x === checkout.pagamento ? "selected" : ""}>${esc(x)}</option>`).join("")}
              </select>
            </div>` : ""}
          <div class="resumo">
            <div><span>Subtotal</span><span>${dinheiro(t.subtotal)}</span></div>
            ${m && m.taxa !== 0 ? `<div><span>Taxa de entrega</span><span>${m.taxa == null ? "A confirmar" : dinheiro(m.taxa)}</span></div>` : ""}
            <div class="total"><span>Total</span><span>${dinheiro(t.total)}</span></div>
          </div>
          <details class="previa"><summary>Ver mensagem que será enviada</summary><pre data-previa>${esc(mensagem())}</pre></details>
        </div>
        <div class="painel-rodape">
          <p class="erro" data-aviso aria-live="polite">${!numeroWhats ? "O número de WhatsApp do estabelecimento ainda não foi configurado." : faltaEndereco ? "Informe o endereço de entrega para continuar." : ""}</p>
          <a class="botao botao-primario botao-bloco" data-enviar ${podeEnviar ? `href="${linkWhats(mensagem())}" target="_blank" rel="noopener"` : 'aria-disabled="true" role="link"'}>
            ${icone("conversa")}Enviar pedido pelo WhatsApp
          </a>
          ${whatsAberto ? '<p class="retorno" role="status">O WhatsApp foi aberto com o pedido. Envie a mensagem por lá para concluir.</p>' : ""}
          ${ctx === "modal" ? '<button type="button" class="botao botao-bloco" data-fechar style="margin-top:8px;border:0;background:transparent">Continuar escolhendo</button>' : ""}
        </div>
      </div>`;
  }

  const dlgCarrinho = $("#dlg-carrinho");
  function renderCarrinho() {
    const ativo = document.activeElement;
    const idAtivo = ativo?.id;
    $("#carrinho-lateral").innerHTML = htmlCarrinho("lateral");
    $("#carrinho-modal").innerHTML = htmlCarrinho("modal");
    if (idAtivo && document.getElementById(idAtivo) && ativo.matches("input,select")) {
      const novo = document.getElementById(idAtivo);
      novo.focus();
      if (novo.setSelectionRange && typeof novo.value === "string") novo.setSelectionRange(novo.value.length, novo.value.length);
    }
    const t = totais();
    const barra = $("#barra-pedido");
    barra.hidden = t.qtd === 0;
    barra.tabIndex = t.qtd ? 0 : -1;
    $("#barra-qtd").textContent = t.qtd;
    $("#barra-total").textContent = dinheiro(t.subtotal);
    barra.setAttribute("aria-label", `Ver pedido: ${t.qtd} ${t.qtd === 1 ? "item" : "itens"}, ${dinheiro(t.subtotal)}`);
    document.documentElement.style.setProperty("--altura-barra", t.qtd ? "84px" : "0px");
  }

  function aoInteragirCarrinho(e) {
    if (e.target.closest("[data-fechar]") || e.target === dlgCarrinho) return dlgCarrinho.close();
    const d = e.target.closest("[data-delta]");
    if (d) {
      const i = carrinho[+d.dataset.item];
      i.qtd += +d.dataset.delta;
      if (i.qtd <= 0) carrinho.splice(+d.dataset.item, 1);
      i.qtd = Math.min(99, i.qtd);
      whatsAberto = false; persistir(); renderCarrinho(); return;
    }
    const r = e.target.closest("[data-remover]");
    if (r) { carrinho.splice(+r.dataset.remover, 1); whatsAberto = false; persistir(); renderCarrinho(); return; }
    const env = e.target.closest("[data-enviar]");
    if (env) {
      if (env.getAttribute("aria-disabled") === "true") { e.preventDefault(); return; }
      whatsAberto = true;
      setTimeout(renderCarrinho, 0);
    }
  }
  function aoMudarCarrinho(e) {
    if (e.target.name?.startsWith("mod-")) {
      if (e.type === "change") { checkout.modalidade = e.target.value; persistir(); renderCarrinho(); }
      return;
    }
    const campo = e.target.dataset.campo;
    if (!campo) return;
    checkout[campo] = e.target.value.trim();
    persistir();
    // Sincroniza o mesmo campo no outro painel sem redesenhar (não perde foco nem clique)
    document.querySelectorAll(`[data-campo="${campo}"]`).forEach((el) => { if (el !== e.target) el.value = e.target.value; });
    atualizarEnvio();
  }

  function atualizarEnvio() {
    const m = modalidadeAtual();
    const faltaEndereco = m?.pedeEndereco && !checkout.endereco;
    const pode = !!numeroWhats && !faltaEndereco;
    const msg = mensagem();
    document.querySelectorAll("[data-enviar]").forEach((a) => {
      if (pode) { a.href = linkWhats(msg); a.target = "_blank"; a.rel = "noopener"; a.removeAttribute("aria-disabled"); a.removeAttribute("role"); }
      else { a.removeAttribute("href"); a.setAttribute("aria-disabled", "true"); a.setAttribute("role", "link"); }
    });
    document.querySelectorAll("[data-aviso]").forEach((p) => {
      p.textContent = !numeroWhats ? "O número de WhatsApp do estabelecimento ainda não foi configurado." : faltaEndereco ? "Informe o endereço de entrega para continuar." : "";
    });
    document.querySelectorAll("[data-previa]").forEach((pre) => (pre.textContent = msg));
  }
  [dlgCarrinho, $("#carrinho-lateral")].forEach((el) => {
    el.addEventListener("click", aoInteragirCarrinho);
    el.addEventListener("change", aoMudarCarrinho);
    el.addEventListener("input", aoMudarCarrinho);
  });
  $("#barra-pedido").addEventListener("click", () => dlgCarrinho.showModal());

  /* ---------- Início ---------- */
  aplicarTema();
  renderTopo();
  renderCardapio();
  renderRodape();
  renderCarrinho();

  // Exposto só para testes no console
  window.__cardapio = { mensagem, totais, statusAgora, get carrinho() { return carrinho; } };
})();
