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
  // Palette
  // ------------------------------------------------------------
  const palette = {
    ink: [30, 41, 59],
    body: [71, 85, 105],
    subtle: [100, 116, 139],
    faint: [148, 163, 184],
    faintLight: [180, 190, 204],
    border: [226, 232, 240],
    cardBg: [250, 251, 252],
    white: [255, 255, 255],
    accent: [102, 126, 234],
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
  // HEADER
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
    if (!items || items.length === 0) return;
    
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
  const prediction = scanData.overallPrediction || scanData.prediction || 'UNKNOWN';
  const riskScore = getRiskScore(prediction);
  const riskInfo = getRiskInfo(riskScore);
  const scanTypeLabel = scanData.scanType || (type === 'message' ? 'Message Scan' : 'URL Scan');

  const summaryFields = [];
  summaryFields.push({ label: 'Scan Type:', value: scanTypeLabel });
  summaryFields.push({
    label: 'Overall Prediction:',
    value: prediction,
    color: riskInfo.color,
    bold: true,
  });
  if (scanData.reference) {
    summaryFields.push({ label: 'Reference:', value: scanData.reference, mono: true });
  }
  if (scanData.message) {
    summaryFields.push({ label: 'Message:', value: scanData.message });
  }
  if (scanData.url) {
    summaryFields.push({ label: 'URL:', value: scanData.url, mono: true });
  }
  if (scanData.messagePrediction) {
    summaryFields.push({ label: 'Message Prediction:', value: scanData.messagePrediction });
  }
  if (scanData.scannedAt) {
    summaryFields.push({ label: 'Scanned At:', value: new Date(scanData.scannedAt).toLocaleString() });
  }

  drawFieldsCard('SCAN SUMMARY', summaryFields);

  // ============================================================
  // MESSAGE LEGITIMATE REASONS
  // ============================================================
  if (scanData.messageLegitimateReasons && scanData.messageLegitimateReasons.length > 0) {
    drawBulletCard(
      'MESSAGE LEGITIMATE INDICATORS', 
      scanData.messageLegitimateReasons, 
      palette.success, 
      palette.successBorder, 
      palette.success
    );
  }

  // ============================================================
  // MESSAGE PHISHING REASONS
  // ============================================================
  if (scanData.messagePhishingReasons && scanData.messagePhishingReasons.length > 0) {
    drawBulletCard(
      'MESSAGE PHISHING INDICATORS', 
      scanData.messagePhishingReasons, 
      palette.danger, 
      palette.dangerBorder, 
      palette.danger
    );
  }

  // ============================================================
  // URLS FOUND
  // ============================================================
  if (scanData.urlsFound && scanData.urlsFound.length > 0) {
    const urlItems = scanData.urlsFound.map((url, index) => {
      const urlResult = scanData.urlResults?.[index];
      const urlPrediction = urlResult?.prediction || 'N/A';
      return `URL ${index + 1}: ${url}  —  Prediction: ${urlPrediction}`;
    });
    drawBulletCard('URLS FOUND IN MESSAGE', urlItems, palette.warning, palette.warningBorder, palette.warning);
  }

  // ============================================================
  // URL LEGITIMATE REASONS (from urlResults)
  // ============================================================
  if (scanData.urlResults && scanData.urlResults.length > 0) {
    scanData.urlResults.forEach((urlResult, index) => {
      if (urlResult.legitimateReasons && urlResult.legitimateReasons.length > 0) {
        const title = `URL ${index + 1} LEGITIMATE INDICATORS`;
        drawBulletCard(title, urlResult.legitimateReasons, palette.success, palette.successBorder, palette.success);
      }
    });
  }

  // ============================================================
  // URL PHISHING REASONS (from urlResults)
  // ============================================================
  if (scanData.urlResults && scanData.urlResults.length > 0) {
    scanData.urlResults.forEach((urlResult, index) => {
      if (urlResult.phishingReasons && urlResult.phishingReasons.length > 0) {
        const title = `URL ${index + 1} PHISHING INDICATORS`;
        drawBulletCard(title, urlResult.phishingReasons, palette.danger, palette.dangerBorder, palette.danger);
      }
    });
  }

  // ============================================================
  // URL CONCLUSION (from urlResults)
  // ============================================================
  if (scanData.urlResults && scanData.urlResults.length > 0) {
    scanData.urlResults.forEach((urlResult, index) => {
      if (urlResult.conclusion) {
        const textWidth = contentWidth - CARD_PAD_X * 2;
        const lines = doc.splitTextToSize(urlResult.conclusion, textWidth);
        const totalHeight = TITLE_H + 8 + lines.length * LINE_H + 4;

        const cardY = startCard(`URL ${index + 1} ANALYSIS CONCLUSION`, totalHeight, palette.ink, palette.border, palette.cardBg);
        doc.setFontSize(8.2);
        doc.setFont('helvetica', 'normal');
        setText(palette.body);
        doc.text(lines, margin + CARD_PAD_X, cardY + TITLE_H + 8);
        endCard(cardY, totalHeight);
      }
    });
  }

  // ============================================================
  // URL PHISHING REASONS (top level for URL scans)
  // ============================================================
  if (type === 'url' && scanData.phishingReasons && scanData.phishingReasons.length > 0) {
    // Check if we already showed these from urlResults
    const hasUrlResultsPhishing = scanData.urlResults?.some(r => r.phishingReasons?.length > 0);
    if (!hasUrlResultsPhishing) {
      drawBulletCard('URL PHISHING INDICATORS', scanData.phishingReasons, palette.danger, palette.dangerBorder, palette.danger);
    }
  }

  // ============================================================
  // URL LEGITIMATE REASONS (top level for URL scans)
  // ============================================================
  if (type === 'url' && scanData.legitimateReasons && scanData.legitimateReasons.length > 0) {
    const hasUrlResultsLegitimate = scanData.urlResults?.some(r => r.legitimateReasons?.length > 0);
    if (!hasUrlResultsLegitimate) {
      drawBulletCard('URL LEGITIMATE INDICATORS', scanData.legitimateReasons, palette.success, palette.successBorder, palette.success);
    }
  }

  // ============================================================
  // MAIN CONCLUSION
  // ============================================================
  const conclusion = scanData.conclusion || scanData.explanation;
  if (conclusion) {
    const textWidth = contentWidth - CARD_PAD_X * 2;
    const lines = doc.splitTextToSize(conclusion, textWidth);
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
  // let recommendation = '';
  // const upperPred = prediction.toUpperCase().trim();
  
  // if (['PHISHING', 'DANGEROUS', 'MALICIOUS'].includes(upperPred) || riskScore > 70) {
  //   if (type === 'message') {
  //     recommendation = '🚫 DO NOT engage with this message. Block the sender immediately. Never click links, reply, or call any numbers provided. Report this as spam to your carrier.';
  //   } else {
  //     recommendation = '🚫 DO NOT proceed to this website. Report this URL to security authorities immediately. This is a confirmed phishing attempt designed to steal your credentials.';
  //   }
  // } else if (['SUSPICIOUS', 'WARNING', 'SCAM'].includes(upperPred) || riskScore > 30) {
  //   if (type === 'message') {
  //     recommendation = '⚠️ Be cautious. Do not share personal information, click suspicious links, or call unknown numbers. Verify the sender through official channels.';
  //   } else {
  //     recommendation = '⚠️ Exercise extreme caution. Verify the website\'s authenticity through official channels before entering any personal information or credentials.';
  //   }
  // } else {
  //   if (type === 'message') {
  //     recommendation = '✅ This message appears safe. However, always verify unexpected requests, especially those asking for personal information or money transfers.';
  //   } else {
  //     recommendation = '✅ You can safely proceed. However, always verify the URL matches the official website before entering sensitive information.';
  //   }
  // }

  const recTextWidth = contentWidth - CARD_PAD_X * 2;
  const recLines = doc.splitTextToSize(recTextWidth);
  const recHeight = recLines.length * LINE_H + 14;


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

/**
 * Get risk score from prediction
 */
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

/**
 * Get risk info for styling
 */
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