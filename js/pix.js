/* Pix "copia e cola" estático (padrão BR Code do Banco Central), com valor. Sem servidor. */
(function () {
  "use strict";
  const campo = (id, valor) => id + String(valor.length).padStart(2, "0") + valor;
  const limpar = (s, max) =>
    String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9 ]/g, "").trim().toUpperCase().slice(0, max);

  function crc16(texto) {
    const bytes = new TextEncoder().encode(texto);
    let crc = 0xffff;
    for (const b of bytes) {
      crc ^= b << 8;
      for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
  }

  /** centavos: inteiro; retorna o código copia e cola */
  /** txid: identificador do pagamento (letras e números, até 25); sem ele usa "***" */
  function gerar({ chave, nome, cidade, centavos, descricao, txid }) {
    const id = String(txid || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";
    const conta = campo("00", "br.gov.bcb.pix") + campo("01", String(chave).trim()) + (descricao ? campo("02", limpar(descricao, 40)) : "");
    const corpo =
      campo("00", "01") +
      campo("26", conta) +
      campo("52", "0000") +
      campo("53", "986") +
      (centavos > 0 ? campo("54", (centavos / 100).toFixed(2)) : "") +
      campo("58", "BR") +
      campo("59", limpar(nome, 25) || "RECEBEDOR") +
      campo("60", limpar(cidade, 15) || "BRASIL") +
      campo("62", campo("05", id)) +
      "6304";
    return corpo + crc16(corpo);
  }

  window.PixBR = { gerar, crc16 };
})();
