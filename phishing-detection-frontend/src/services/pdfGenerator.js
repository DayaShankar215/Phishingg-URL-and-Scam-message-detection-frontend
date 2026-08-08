// services/pdfGenerator.js
import jsPDF from "jspdf";
import "jspdf-autotable";

/**
 * Download PDF from scan data
 */
export const downloadPDF = (scanData, type) => {
  const doc = generatePDFReport(scanData, type);
  const fileName = `security_report_${scanData.reference || Date.now()}.pdf`;
  doc.save(fileName);
};

const MARGIN = 18;
const BOTTOM_RESERVE = 16; // space reserved for the footer

/**
 * Roughly estimate the height (mm) an autoTable with the given rows will need.
 */
const estimateTableHeight = (rows, widths) => {
  const usable = 210 - MARGIN * 2;
  const fixedCols = widths.reduce((acc, w) => (w === "auto" ? acc : acc + w), 0);
  const autoColW = usable - fixedCols;
  let total = 8 + 8 + 4; // head + cell padding + footer gap
  rows.forEach((row) => {
    let rowLines = 1;
    row.forEach((cell, idx) => {
      const w = widthInMm(widths[idx]);
      const colW = w === "auto" ? autoColW : w;
      const approxChars = Math.max(10, Math.floor(colW / 1.4));
      rowLines = Math.max(rowLines, Math.ceil(String(cell || "").length / approxChars));
    });
    total += rowLines * 5 + 8;
  });
  return total;
};

const widthInMm = (w) => {
  if (w === "auto") return "auto";
  if (typeof w === "string" && w.toLowerCase() === "auto") return "auto";
  return w;
};

/**
 * Build user-facing safety recommendation text by risk level.
 */
const buildRecommendation = (riskScore, isMessage) => {
  if (riskScore > 70) {
    return isMessage
      ? "DO NOT engage with this message. Block the sender immediately. Never click links, reply, or call any numbers provided. Report this as spam to your carrier."
      : "DO NOT proceed to this website. Report this URL to security authorities immediately. This is a confirmed phishing attempt designed to steal your credentials.";
  } else if (riskScore > 30) {
    return isMessage
      ? "Be cautious. Do not share personal information, click suspicious links, or call unknown numbers. Verify the sender through official channels."
      : "Exercise extreme caution. Verify the website's authenticity through official channels before entering any personal information or credentials.";
  }
  return isMessage
    ? "This message appears safe. However, always verify unexpected requests, especially those asking for personal information or money transfers."
    : "You can safely proceed. However, always verify the URL matches the official website before entering sensitive information.";
};

const getRiskScore = (prediction) => {
  if (!prediction) return 50;
  const upper = String(prediction).toUpperCase().trim();
  switch (upper) {
    case "PHISHING":
    case "DANGEROUS":
    case "MALICIOUS":
      return 85;
    case "SCAM":
    case "SUSPICIOUS":
    case "WARNING":
      return 55;
    case "SAFE":
    case "LEGITIMATE":
      return 15;
    default:
      return 50;
  }
};

const getRiskInfo = (score) => {
  if (score > 70) {
    return { label: "HIGH RISK", color: [200, 40, 40] };
  } else if (score > 30) {
    return { label: "MEDIUM RISK", color: [200, 160, 30] };
  }
  return { label: "LOW RISK", color: [16, 185, 129] };
};

/**
 * Build a clean PDF report from scan data.
 */
const generatePDFReport = (scanData, type) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;
  let y = MARGIN;

  const isMessage = type === "message";
  const riskScore = getRiskScore(scanData.prediction || scanData.overallPrediction);
  const riskInfo = getRiskInfo(riskScore);

  // Message scans sometimes stored the message text into `url` (legacy
  // fallback). Never render a duplicate URL row in that case.
  const showUrl = Boolean(scanData.url) && scanData.url !== scanData.message;

  /** Start a new page if there isn't enough vertical room for `needed`. */
  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - BOTTOM_RESERVE) {
      doc.addPage();
      y = MARGIN;
    }
  };

  /** Wrap text to width, keeping it inside its box. */
  const wrapText = (text, fontSize, maxWidth, maxLines = null) => {
    doc.setFontSize(fontSize);
    let lines = doc.splitTextToSize(String(text || ""), maxWidth);
    if (maxLines && lines.length > maxLines) {
      lines = lines.slice(0, maxLines - 1).concat([lines[maxLines - 1] + "..."]);
    }
    return lines;
  };

  /** Draw wrapped lines starting at x/startY with a fixed line height. */
  const writeWrappedLines = (lines, x, startY, lineHeight) => {
    let cursor = startY;
    lines.forEach((line) => {
      doc.text(line, x, cursor);
      cursor += lineHeight;
    });
  };

  /** Draw a small colored banner used as the section heading. */
  const drawBanner = (title, fill, color) => {
    doc.setFillColor(fill[0], fill[1], fill[2]);
    doc.roundedRect(MARGIN, y, contentWidth, 10, 4, 4, "F");

    doc.setFontSize(10);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont("helvetica", "bold");
    doc.text(title, MARGIN + 8, y + 8);
    y += 14;
  };

  // ============================================================
  // HEADER
  // ============================================================
  doc.setFillColor(102, 126, 234);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("SECURESHIELD", MARGIN, 25);

  doc.setFontSize(7);
  doc.setTextColor(200, 215, 255);
  const ref = scanData.reference || "N/A";
  const shortRef = ref.length > 30 ? ref.substring(0, 27) + "..." : ref;
  doc.text(`Report ID: ${shortRef}`, pageWidth - MARGIN - 55, 18);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - MARGIN - 55, 26);

  y = 48;

  // ============================================================
  // SCAN SUMMARY
  // ============================================================
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 80);
  doc.setFont("helvetica", "bold");
  doc.text("SCAN SUMMARY", MARGIN, y);
  y += 6;

  const cardHeight = 62;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(MARGIN, y, contentWidth, cardHeight, 4, 4, "F");
  doc.setDrawColor(220, 220, 235);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, contentWidth, cardHeight, 4, 4, "S");

  const prediction = scanData.prediction || scanData.overallPrediction || "N/A";
  const scanTypeLabel = isMessage ? "Message Scan" : "URL Scan";

  // Risk Score
  doc.setFontSize(28);
  doc.setTextColor(riskInfo.color[0], riskInfo.color[1], riskInfo.color[2]);
  doc.setFont("helvetica", "bold");
  doc.text(`${riskScore}%`, MARGIN + 12, y + 28);

  // Risk level
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(riskInfo.label, MARGIN + 55, y + 25);

  // Prediction text
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 100);
  doc.setFont("helvetica", "normal");
  doc.text(`Prediction: ${prediction}`, MARGIN + 55, y + 35);

  // Risk bar
  const barX = MARGIN + 12;
  const barY = y + 6;
  const barHeight = 4;
  doc.setFillColor(235, 235, 245);
  doc.roundedRect(barX, barY, contentWidth - 24, barHeight, 2, 2, "F");
  const fillWidth = Math.min((riskScore / 100) * (contentWidth - 24), contentWidth - 24);
  doc.setFillColor(riskInfo.color[0], riskInfo.color[1], riskInfo.color[2]);
  doc.roundedRect(barX, barY, fillWidth, barHeight, 2, 2, "F");

  // Scan type bottom left of card
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 80);
  doc.setFont("helvetica", "normal");
  doc.text(`Scan Type: ${scanTypeLabel}`, MARGIN + 12, y + 52);

  y = y + cardHeight + 10;

  // ============================================================
  // SCAN DETAILS (table)
  // ============================================================
  const detailsRows = [];
  if (scanData.reference) detailsRows.push(["Reference", scanData.reference]);
  if (scanData.scanType) detailsRows.push(["Scan Type", scanData.scanType]);
  if (showUrl) detailsRows.push(["URL", scanData.url]);
  if (scanData.message && scanData.message !== scanData.url) {
    detailsRows.push(["Message", scanData.message]);
  }
  if (scanData.overallPrediction) detailsRows.push(["Overall Prediction", scanData.overallPrediction]);
  if (scanData.messagePrediction) detailsRows.push(["Message Prediction", scanData.messagePrediction]);
  if (scanData.prediction && !scanData.overallPrediction) detailsRows.push(["Prediction", scanData.prediction]);
  if (scanData.scannedAt) {
    detailsRows.push(["Scanned At", new Date(scanData.scannedAt).toLocaleString()]);
  }

  ensureSpace(cardHeight / 2);

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 80);
  doc.setFont("helvetica", "bold");
  doc.text("SCAN DETAILS", MARGIN, y);
  y += 5;

  doc.autoTable({
    startY: y,
    head: [["Field", "Value"]],
    body: detailsRows,
    theme: "plain",
    headStyles: {
      fillColor: [240, 242, 245],
      textColor: [40, 40, 60],
      fontSize: 8,
      fontStyle: "bold",
      halign: "left",
    },
    styles: { fontSize: 8, cellPadding: 4, lineColor: [230, 230, 240], lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: "bold", textColor: [60, 60, 80] },
      1: { cellWidth: "auto" },
    },
    margin: { left: MARGIN, right: MARGIN },
  });

  y = doc.lastAutoTable.finalY + 8;

  // ============================================================
  // PHISHING INDICATORS (single section for both URL & message scans)
  // ============================================================
  const phishingReasons = scanData.phishingReasons || scanData.messagePhishingReasons || [];
  if (phishingReasons.length > 0) {
    const bannerTitle = isMessage ? "MESSAGE PHISHING INDICATORS" : "PHISHING INDICATORS";
    const rows = phishingReasons.map((reason, i) => [i + 1, reason]);

    ensureSpace(14 + estimateTableHeight(rows, [12, "auto"]));
    drawBanner(bannerTitle, [254, 242, 242], [180, 40, 40]);

    doc.autoTable({
      startY: y,
      head: [["#", "Reason"]],
      body: rows,
      theme: "plain",
      showHead: "everyPage",
      headStyles: {
        fillColor: [252, 235, 235],
        textColor: [180, 40, 40],
        fontSize: 8,
        fontStyle: "bold",
      },
      styles: { fontSize: 7.5, cellPadding: 4, lineColor: [240, 220, 220], lineWidth: 0.1 },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: "auto" },
      },
      margin: { left: MARGIN, right: MARGIN },
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  // ============================================================
  // LEGITIMATE INDICATORS
  // ============================================================
  const legitimateReasons = scanData.legitimateReasons || scanData.messageLegitimateReasons || [];
  if (legitimateReasons.length > 0) {
    const title = isMessage ? "MESSAGE LEGITIMATE INDICATORS" : "LEGITIMATE INDICATORS";
    const rows = legitimateReasons.map((reason, i) => [i + 1, reason]);

    ensureSpace(14 + estimateTableHeight(rows, [12, "auto"]));
    drawBanner(title, [240, 250, 245], [30, 130, 70]);

    doc.autoTable({
      startY: y,
      head: [["#", "Reason"]],
      body: rows,
      theme: "plain",
      showHead: "everyPage",
      headStyles: {
        fillColor: [235, 248, 240],
        textColor: [30, 130, 70],
        fontSize: 8,
        fontStyle: "bold",
      },
      styles: { fontSize: 7.5, cellPadding: 4, lineColor: [220, 240, 230], lineWidth: 0.1 },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: "auto" },
      },
      margin: { left: MARGIN, right: MARGIN },
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  // ============================================================
  // URLS FOUND (message scans only)
  // ============================================================
  const urlsFound = scanData.urlsFound || [];
  if (urlsFound.length > 0) {
    const rows = urlsFound.map((url, i) => {
      const result = scanData.urlResults?.[i];
      return [i + 1, url, result?.prediction || "N/A"];
    });

    ensureSpace(14 + estimateTableHeight(rows, [12, "auto", 30]));
    drawBanner("URLS FOUND IN MESSAGE", [255, 247, 235], [180, 120, 30]);

    doc.autoTable({
      startY: y,
      head: [["#", "URL", "Prediction"]],
      body: rows,
      theme: "plain",
      showHead: "everyPage",
      headStyles: {
        fillColor: [252, 242, 230],
        textColor: [120, 80, 20],
        fontSize: 8,
        fontStyle: "bold",
      },
      styles: { fontSize: 7.5, cellPadding: 4, lineColor: [240, 230, 220], lineWidth: 0.1 },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: "auto" },
        2: { cellWidth: 30 },
      },
      margin: { left: MARGIN, right: MARGIN },
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  // ============================================================
  // ANALYSIS CONCLUSION (dynamic height, never overflows)
  // ============================================================
  if (scanData.conclusion) {
    const boxWidth = contentWidth - 16;
    const lines = wrapText(scanData.conclusion, 8, boxWidth);
    const lineH = 3.7;
    const boxHeight = Math.max(20, lines.length * lineH + 16);

    ensureSpace(boxHeight + 8);

    doc.setFillColor(250, 251, 253);
    doc.roundedRect(MARGIN, y, contentWidth, boxHeight, 4, 4, "F");
    doc.setDrawColor(220, 220, 235);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, y, contentWidth, boxHeight, 4, 4, "S");

    doc.setFontSize(10);
    doc.setTextColor(40, 40, 60);
    doc.setFont("helvetica", "bold");
    doc.text("ANALYSIS CONCLUSION", MARGIN + 8, y + 7);

    doc.setFontSize(8);
    doc.setTextColor(60, 60, 80);
    doc.setFont("helvetica", "normal");
    writeWrappedLines(lines, MARGIN + 8, y + 16, lineH);
    y = y + boxHeight + 8;
  }

  // ============================================================
  // SECURITY RECOMMENDATION (dynamic height, never overflows)
  // ============================================================
  const recommendation = buildRecommendation(riskScore, isMessage);
  const recBoxWidth = contentWidth - 16;
  const recLines = wrapText(recommendation, 8, recBoxWidth);
  const recLineH = 3.7;
  const recBoxHeight = Math.max(20, recLines.length * recLineH + 16);

  ensureSpace(recBoxHeight + 8);

  doc.setFillColor(245, 247, 250);
  doc.roundedRect(MARGIN, y, contentWidth, recBoxHeight, 4, 4, "F");
  doc.setDrawColor(200, 200, 220);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, contentWidth, recBoxHeight, 4, 4, "S");

  doc.setFontSize(10);
  doc.setTextColor(40, 40, 60);
  doc.setFont("helvetica", "bold");
  doc.text("SECURITY RECOMMENDATION", MARGIN + 8, y + 7);

  doc.setFontSize(8);
  doc.setTextColor(60, 60, 80);
  doc.setFont("helvetica", "normal");
  writeWrappedLines(recLines, MARGIN + 8, y + 15, recLineH);
  y = y + recBoxHeight + 10;

  // ============================================================
  // FOOTER - all pages
  // ============================================================
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setDrawColor(220, 220, 235);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, pageHeight - 12, pageWidth - MARGIN, pageHeight - 12);

    doc.setFontSize(7);
    doc.setTextColor(160, 160, 180);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Page ${i} of ${pageCount}  •  SecureShield AI Security  •  ${new Date().getFullYear()}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: "center" }
    );
  }

  return doc;
};

export default {
  downloadPDF,
};