// app.js - gera PDF no estilo da imagem com tabela e área de assinatura

// garante que jsPDF esteja disponível
if (!window.jspdf || !window.jspdf.jsPDF) {
  alert(
    "Erro: jsPDF não carregou. Verifique se o script do jsPDF está presente antes do app.js."
  );
  throw new Error("jsPDF não carregou");
}
const { jsPDF } = window.jspdf;

// formata data yyyy-mm-dd para dd/mm/yyyy
function formatDateInput(val) {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleDateString("pt-BR");
}

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function gerarTextoCorpo(credorNome) {
  return `Eu, ${credorNome}, CPF 793.284.079-15, nos termos do Art. 26 da Lei 9.492 de 10 de setembro de 1997, na qualidade de credor do título abaixo discriminado, autorizo V.S.ª a CANCELAR o protesto do referido título.`;
}

function gerarPDF(dados) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // TÍTULO
  doc.setFont("Times", "Bold");
  doc.setFontSize(16);
  doc.text("CARTA DE ANUÊNCIA", pageWidth / 2, 40, { align: "center" });

  // Parágrafo explicativo (multi-line)
  doc.setFont("Times", "Normal");
  doc.setFontSize(11);
  const corpo = gerarTextoCorpo(dados.credor.nome);
  const corpoLines = doc.splitTextToSize(corpo, pageWidth - 80);
  doc.text(corpoLines, 40, 80);

  // Espaço e linha separadora
  doc.setLineWidth(0.7);
  doc.line(
    40,
    120 + corpoLines.length * 12,
    pageWidth - 40,
    120 + corpoLines.length * 12
  );

  // TABELA CABEÇALHO
  const tableTop = 140 + corpoLines.length * 12;
  const left = 40;
  const colWidths = [80, 110, 80, 70, 120, 90]; // soma ~550
  const headers = [
    "Doc",
    "Nosso Número",
    "Vencimento",
    "Valor",
    "Nome",
    "CNPJ/CPF",
  ];

  // header background (light)
  doc.setFillColor(240, 240, 240);
  doc.rect(
    left,
    tableTop,
    colWidths.reduce((a, b) => a + b, 0),
    20,
    "F"
  );

  // header text
  doc.setFont("Times", "Bold");
  doc.setFontSize(10);
  let x = left;
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], x + 4, tableTop + 14);
    x += colWidths[i];
  }

  // linha da tabela com os dados
  doc.setFont("Times", "Normal");
  doc.setFontSize(10);
  const rowTop = tableTop + 20;
  x = left;
  const values = [
    dados.titulo.doc || "-",
    dados.titulo.nosso || "-",
    dados.titulo.venc || "-",
    dados.titulo.valor || "-",
    dados.titulo.nome || "-",
    dados.titulo.cnpj || "-",
  ];
  for (let i = 0; i < values.length; i++) {
    doc.text(String(values[i]), x + 4, rowTop + 14);
    x += colWidths[i];
  }

  // linha horizontal abaixo da tabela
  doc.line(
    left,
    rowTop + 22,
    left + colWidths.reduce((a, b) => a + b, 0),
    rowTop + 22
  );

  // Cidade e data
  const cidadeDataY = rowTop + 55;
  const dataDisplay = dados.data
    ? formatDateInput(dados.data)
    : new Date().toLocaleDateString("pt-BR");
  const cidadeText = `Cidade: ${dados.cidade || "-"}, ${dataDisplay}`;
  doc.setFontSize(10);
  doc.text(cidadeText, left, cidadeDataY);

  // Área para assinatura (centralizada, mais espaço)
  const signY = cidadeDataY + 70;
  const signCentre = pageWidth / 2;
  const lineWidth = 240;
  doc.setLineWidth(0.6);
  doc.line(
    signCentre - lineWidth / 2,
    signY,
    signCentre + lineWidth / 2,
    signY
  );

  // Nome abaixo da linha (se houver)
  doc.setFontSize(11);
  doc.setFont("Times", "Bold");
  if (dados.assinatura && dados.assinatura !== "") {
    doc.text(dados.assinatura, signCentre, signY + 18, { align: "center" });
    doc.setFont("Times", "Normal");
    doc.setFontSize(10);
    doc.text("CPF: 793.284.079-15", signCentre, signY + 32, {
      align: "center",
    });
  } else {
    // se vazio, exibe apenas label 'Assinatura' centrado abaixo
    doc.setFont("Times", "Normal");
    doc.setFontSize(10);
    doc.text("Assinatura", signCentre, signY + 18, { align: "center" });
  }

  // salva o PDF
  doc.save(
    `Carta_Anuencia_${(dados.devedor.nome || "sem_nome").replace(
      /\s+/g,
      "_"
    )}.pdf`
  );
}

// construir dados a partir do formulário
document.getElementById("btnGerar").addEventListener("click", () => {
  try {
    const devNome = getValue("devNome");
    const devCpf = getValue("devCpf");
    if (!devNome || !devCpf) {
      alert("Preencha nome e CPF do devedor.");
      return;
    }

    const dados = {
      credor: {
        nome: "Sergio Roberto Dolinski",
      },
      devedor: {
        nome: devNome,
        cpf: devCpf,
      },
      titulo: {
        doc: getValue("titulo_doc"),
        nosso: getValue("titulo_nosso"),
        venc: getValue("titulo_venc")
          ? formatDateInput(getValue("titulo_venc"))
          : "",
        valor: getValue("titulo_valor"),
        nome: getValue("titulo_nome"),
        cnpj: getValue("titulo_cnpj"),
      },
      cidade: getValue("cidade"),
      data: getValue("data"),
      assinatura: getValue("assinatura_nome"),
    };

    gerarPDF(dados);
  } catch (err) {
    console.error(err);
    alert("Erro ao gerar PDF: " + err.message);
  }
});

// abre WhatsApp Web com mensagem (sem anexar PDF)
document.getElementById("btnWpp").addEventListener("click", () => {
  const nome = getValue("devNome");
  const cpf = getValue("devCpf");
  if (!nome || !cpf) {
    alert("Preencha nome e CPF do devedor antes de abrir o WhatsApp.");
    return;
  }
  const text = encodeURIComponent(
    `Olá, envio a Carta de Anuência referente ao devedor ${nome} (CPF ${cpf}). Favor verificar.`
  );
  window.open(`https://web.whatsapp.com/send?text=${text}`, "_blank");
});
