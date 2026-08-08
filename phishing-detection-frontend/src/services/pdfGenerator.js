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

/**
 * Generate a clean, minimal, card-based PDF report from scan data
 * (design mirrors a light bordered-card / bullet-list layout)
 */
const generatePDFReport = (scanData, type) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ------------------------------------------------------------
  // Palette — light, minimal, bordered-card style
  // ------------------------------------------------------------
  const palette = {
    ink: [30, 41, 59],          // slate-800 (titles, labels)
    body: [71, 85, 105],        // slate-600 (paragraph / list text)
    subtle: [100, 116, 139],    // slate-500
    faint: [148, 163, 184],     // slate-400 (brand wordmark, meta)
    faintLight: [180, 190, 204],
    border: [226, 232, 240],    // slate-200 (default card border)
    cardBg: [250, 251, 252],    // near-white card background
    white: [255, 255, 255],
    accent: [102, 126, 234],    // #667eea — used sparingly (quote bar)
    danger: [220, 38, 38],
    dangerBg: [254, 242, 242],
    dangerBorder: [252, 200, 200],
    warning: [180, 120, 10],
    warningBg: [255, 247, 235],
    warningBorder: [250, 220, 170],
    success: [21, 128, 61],
    successBg: [240, 253, 244],
    successBorder: [190, 235, 205],
  };

  const setFill = (c) => doc.setFillColor(c[0], c[1], c[2]);
  const setDraw = (c) => doc.setDrawColor(c[0], c[1], c[2]);
  const setText = (c) => doc.setTextColor(c[0], c[1], c[2]);

  const addPageIfNeeded = (needed) => {
    if (y + needed > pageHeight - 20) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // ============================================================
  // HEADER — plain background, gray wordmark, meta lines
  // ============================================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(23);
  setText(palette.faint);
  if (doc.setCharSpace) doc.setCharSpace(0.6);
  doc.text('SECURESHIELD', margin, y + 8);
  if (doc.setCharSpace) doc.setCharSpace(0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setText(palette.faintLight);
  doc.text('AI-Powered Security Report', margin, y + 14);

  doc.setFontSize(8);
  setText(palette.faint);
  const ref = scanData.reference || 'N/A';
  doc.text(`Report ID: ${ref}`, margin, y + 21);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y + 26);

  y = y + 34;

  // ------------------------------------------------------------
  // Shared card helpers
  // ------------------------------------------------------------
  const CARD_PAD_X = 7;
  const TITLE_H = 9;
  const LINE_H = 5.2;

  /** Draws the card shell (border + bg) and title + divider; returns content start Y */
  const startCard = (title, totalHeight, titleColor, borderColor, bg) => {
    addPageIfNeeded(totalHeight + 8);
    const cardY = y;

    setFill(bg || palette.white);
    doc.roundedRect(margin, cardY, contentWidth, totalHeight, 3, 3, 'F');
    setDraw(borderColor || palette.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, cardY, contentWidth, totalHeight, 3, 3, 'S');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    setText(titleColor || palette.ink);
    doc.text(title, margin + CARD_PAD_X, cardY + 8);

    setDraw(palette.border);
    doc.setLineWidth(0.25);
    doc.line(margin + CARD_PAD_X, cardY + 11, margin + contentWidth - CARD_PAD_X, cardY + 11);

    return cardY;
  };

  const endCard = (cardY, totalHeight) => {
    y = cardY + totalHeight + 8;
  };

  // Measures + draws a label/value field list (like the reference .field rows)
  const fieldsCardHeight = (fields) => {
    let h = TITLE_H + 6;
    fields.forEach((f) => {
      const valueWidth = contentWidth - CARD_PAD_X * 2 - 46;
      const lines = doc.splitTextToSize(String(f.value), valueWidth);
      h += Math.max(LINE_H, lines.length * LINE_H) + 3.5;
    });
    return h + 3;
  };

  const drawFieldsCard = (title, fields) => {
    const totalHeight = fieldsCardHeight(fields);
    const cardY = startCard(title, totalHeight, palette.ink, palette.border, palette.cardBg);
    let rowY = cardY + TITLE_H + 8;

    fields.forEach((f) => {
      const valueWidth = contentWidth - CARD_PAD_X * 2 - 46;
      const lines = doc.splitTextToSize(String(f.value), valueWidth);

      doc.setFontSize(8.8);
      doc.setFont('helvetica', 'bold');
      setText(palette.ink);
      doc.text(f.label, margin + CARD_PAD_X, rowY);

      doc.setFontSize(8.8);
      doc.setFont(f.mono ? 'courier' : 'helvetica', f.bold ? 'bold' : 'normal');
      setText(f.color || palette.ink);
      doc.text(lines, margin + contentWidth - CARD_PAD_X, rowY, { align: 'right' });

      rowY += Math.max(LINE_H, lines.length * LINE_H) + 3.5;
    });

    endCard(cardY, totalHeight);
  };

  // Measures + draws a bulleted list card (indicators)
  const bulletCardHeight = (items) => {
    let h = TITLE_H + 6;
    const textWidth = contentWidth - CARD_PAD_X * 2 - 6;
    items.forEach((item) => {
      const lines = doc.splitTextToSize(String(item), textWidth);
      h += lines.length * LINE_H + 1.5;
    });
    return h + 4;
  };

  const drawBulletCard = (title, items, titleColor, borderColor, bulletColor) => {
    const totalHeight = bulletCardHeight(items);
    const cardY = startCard(title, totalHeight, titleColor, borderColor, palette.white);
    let rowY = cardY + TITLE_H + 8;
    const textWidth = contentWidth - CARD_PAD_X * 2 - 6;

    doc.setFontSize(8.6);
    doc.setFont('helvetica', 'normal');

    items.forEach((item) => {
      const lines = doc.splitTextToSize(String(item), textWidth);

      setFill(bulletColor || palette.subtle);
      doc.circle(margin + CARD_PAD_X + 1, rowY - 1.4, 0.7, 'F');

      setText(palette.body);
      doc.text(lines, margin + CARD_PAD_X + 5, rowY);

      rowY += lines.length * LINE_H + 1.5;
    });

    endCard(cardY, totalHeight);
  };

  // ============================================================
  // SCAN SUMMARY
  // ============================================================
  const riskScore = getRiskScore(scanData.prediction || scanData.overallPrediction);
  const riskInfo = getRiskInfo(riskScore);
  const scanTypeLabel = type === 'message' ? 'Message Scan' : 'URL Scan';

  const summaryFields = [];
  summaryFields.push({ label: 'Scan Type:', value: scanTypeLabel });
  if (scanData.overallPrediction || scanData.prediction) {
    summaryFields.push({
      label: 'Classification:',
      value: scanData.overallPrediction || scanData.prediction,
      color: riskInfo.color,
      bold: true,
    });
  }
  if (scanData.reference) {
    summaryFields.push({ label: 'Reference:', value: scanData.reference, mono: true });
  }
  if (scanData.scanType) summaryFields.push({ label: 'Scan Type Detail:', value: scanData.scanType });
  if (scanData.url) summaryFields.push({ label: 'URL:', value: scanData.url, mono: true });
  if (scanData.message) summaryFields.push({ label: 'Message:', value: scanData.message });
  if (scanData.overallPrediction) {
    summaryFields.push({
      label: 'Overall Prediction:',
      value: scanData.overallPrediction,
      color: riskInfo.color,
      bold: true,
    });
  }
  if (scanData.messagePrediction) {
    summaryFields.push({ label: 'Message Prediction:', value: scanData.messagePrediction });
  }
  if (scanData.prediction && !scanData.overallPrediction) {
    summaryFields.push({
      label: 'Prediction:',
      value: scanData.prediction,
      color: riskInfo.color,
      bold: true,
    });
  }
  if (scanData.scannedAt) {
    summaryFields.push({ label: 'Scanned At:', value: new Date(scanData.scannedAt).toLocaleString() });
  }

  drawFieldsCard('SCAN SUMMARY', summaryFields);

  // ============================================================
  // PHISHING REASONS
  // ============================================================
  const phishingReasons = scanData.phishingReasons || scanData.messagePhishingReasons || [];
  if (phishingReasons.length > 0) {
    const title = type === 'message' ? 'MESSAGE PHISHING INDICATORS' : 'PHISHING INDICATORS';
    drawBulletCard(title, phishingReasons, palette.danger, palette.dangerBorder, palette.danger);
  }

  // ============================================================
  // LEGITIMATE REASONS
  // ============================================================
  const legitimateReasons = scanData.legitimateReasons || scanData.messageLegitimateReasons || [];
  if (legitimateReasons.length > 0) {
    const title = type === 'message' ? 'MESSAGE LEGITIMATE INDICATORS' : 'LEGITIMATE INDICATORS';
    drawBulletCard(title, legitimateReasons, palette.success, palette.successBorder, palette.success);
  }

  // ============================================================
  // URLS FOUND (for message scans)
  // ============================================================
  if (scanData.urlsFound && scanData.urlsFound.length > 0) {
    const urlItems = scanData.urlsFound.map((url, i) => {
      const result = scanData.urlResults?.[i];
      const pred = result?.prediction || 'N/A';
      return `${url}  —  ${pred}`;
    });
    drawBulletCard('URLS FOUND IN MESSAGE', urlItems, palette.warning, palette.warningBorder, palette.warning);
  }

  // ============================================================
  // CONCLUSION
  // ============================================================
  if (scanData.conclusion) {
    const textWidth = contentWidth - CARD_PAD_X * 2;
    const lines = doc.splitTextToSize(scanData.conclusion, textWidth);
    const totalHeight = TITLE_H + 8 + lines.length * LINE_H + 4;

    const cardY = startCard('ANALYSIS CONCLUSION', totalHeight, palette.ink, palette.border, palette.cardBg);
    doc.setFontSize(8.8);
    doc.setFont('helvetica', 'normal');
    setText(palette.body);
    doc.text(lines, margin + CARD_PAD_X, cardY + TITLE_H + 8);
    endCard(cardY, totalHeight);
  }

  // ============================================================
  // RECOMMENDATION
  // ============================================================
  let recommendation = '';
  if (riskScore > 70) {
    if (type === 'message') {
      recommendation = 'DO NOT engage with this message. Block the sender immediately. Never click links, reply, or call any numbers provided. Report this as spam to your carrier.';
    } else {
      recommendation = 'DO NOT proceed to this website. Report this URL to security authorities immediately. This is a confirmed phishing attempt designed to steal your credentials.';
    }
  } else if (riskScore > 30) {
    if (type === 'message') {
      recommendation = 'Be cautious. Do not share personal information, click suspicious links, or call unknown numbers. Verify the sender through official channels.';
    } else {
      recommendation = 'Exercise extreme caution. Verify the website\'s authenticity through official channels before entering any personal information or credentials.';
    }
  } else {
    if (type === 'message') {
      recommendation = 'This message appears safe. However, always verify unexpected requests, especially those asking for personal information or money transfers.';
    } else {
      recommendation = 'You can safely proceed. However, always verify the URL matches the official website before entering sensitive information.';
    }
  }

  const recTextWidth = contentWidth - CARD_PAD_X * 2;
  const recLines = doc.splitTextToSize(recommendation, recTextWidth);
  const recHeight = recLines.length * LINE_H + 10;

  addPageIfNeeded(recHeight + 8);
  const recY = y;
  setFill(riskInfo.bg);
  doc.roundedRect(margin, recY, contentWidth, recHeight, 3, 3, 'F');
  setDraw(riskInfo.borderColor);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, recY, contentWidth, recHeight, 3, 3, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  setText(riskInfo.color);
  doc.text(recLines, margin + CARD_PAD_X, recY + 7);
  y = recY + recHeight + 8;

  // ============================================================
  // FOOTER - All Pages
  // ============================================================
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    setDraw(palette.border);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 13, pageWidth - margin, pageHeight - 13);

    doc.setFontSize(7.5);
    setText(palette.faint);
    doc.setFont('helvetica', 'normal');
    doc.text('SecureShield AI Security', margin, pageHeight - 7);

    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  return doc;
};

const getRiskScore = (prediction) => {
  if (!prediction) return 50;
  const upper = prediction.toUpperCase().trim();
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
    return {
      label: 'HIGH RISK',
      color: [220, 38, 38],
      bg: [254, 242, 242],
      borderColor: [252, 165, 165],
    };
  } else if (score > 30) {
    return {
      label: 'MEDIUM RISK',
      color: [180, 120, 10],
      bg: [255, 247, 235],
      borderColor: [252, 211, 121],
    };
  } else {
    return {
      label: 'LOW RISK',
      color: [21, 128, 61],
      bg: [240, 253, 244],
      borderColor: [134, 239, 172],
    };
  }
};

export default {
  downloadPDF,
};