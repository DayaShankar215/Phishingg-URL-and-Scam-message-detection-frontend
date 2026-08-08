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
 * Generate clean PDF report from scan data
 */
const generatePDFReport = (scanData, type) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  let y = margin;

  // ============================================================
  // HEADER 
  // ============================================================
  doc.setFillColor(102, 126, 234);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('SECURESHIELD', margin, 25);

  doc.setFontSize(7);
  doc.setTextColor(200, 215, 255);
  const ref = scanData.reference || 'N/A';
  const shortRef = ref.length > 30 ? ref.substring(0, 27) + '...' : ref;
  doc.text(`Report ID: ${shortRef}`, pageWidth - margin - 55, 18);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin - 55, 26);

  y = 48;

  // Divider
  doc.setDrawColor(200, 200, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ============================================================
  // SCAN SUMMARY
  // ============================================================
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 80);
  doc.setFont('helvetica', 'bold');
  doc.text('SCAN SUMMARY', margin, y);
  y += 6;

  // Card background
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 55, 4, 4, 'F');
  doc.setDrawColor(220, 220, 235);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 55, 4, 4, 'S');

  // Risk Score
  const riskScore = getRiskScore(scanData.prediction || scanData.overallPrediction);
  const riskInfo = getRiskInfo(riskScore);

  doc.setFontSize(28);
  doc.setTextColor(riskInfo.color[0], riskInfo.color[1], riskInfo.color[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`${riskScore}%`, margin + 12, y + 25);

  doc.setFontSize(13);
  doc.setTextColor(riskInfo.color[0], riskInfo.color[1], riskInfo.color[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(riskInfo.label, margin + 55, y + 22);

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 100);
  doc.setFont('helvetica', 'normal');
  const prediction = scanData.prediction || scanData.overallPrediction || 'N/A';
  doc.text(`Prediction: ${prediction}`, margin + 55, y + 32);

  // Risk Bar
  const barX = margin + 12;
  const barY = y + 6;
  const barWidth = pageWidth - (margin * 2) - 24;
  const barHeight = 4;
  doc.setFillColor(235, 235, 245);
  doc.roundedRect(barX, barY, barWidth, barHeight, 2, 2, 'F');
  const fillWidth = Math.min((riskScore / 100) * barWidth, barWidth);
  doc.setFillColor(riskInfo.color[0], riskInfo.color[1], riskInfo.color[2]);
  doc.roundedRect(barX, barY, fillWidth, barHeight, 2, 2, 'F');

  // Scan Type
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 80);
  doc.setFont('helvetica', 'normal');
  const scanTypeLabel = type === 'message' ? 'Message Scan' : 'URL Scan';
  doc.text(`Scan Type: ${scanTypeLabel}`, margin + 12, y + 50);

  y = y + 55 + 10;

  // ============================================================
  // SCAN DETAILS
  // ============================================================
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 80);
  doc.setFont('helvetica', 'bold');
  doc.text('SCAN DETAILS', margin, y);
  y += 5;

  const detailsData = [];
  if (scanData.reference) detailsData.push(['Reference', scanData.reference]);
  if (scanData.scanType) detailsData.push(['Scan Type', scanData.scanType]);
  if (scanData.url) detailsData.push(['URL', scanData.url]);
  if (scanData.message) detailsData.push(['Message', scanData.message]);
  if (scanData.overallPrediction) detailsData.push(['Overall Prediction', scanData.overallPrediction]);
  if (scanData.messagePrediction) detailsData.push(['Message Prediction', scanData.messagePrediction]);
  if (scanData.prediction && !scanData.overallPrediction) detailsData.push(['Prediction', scanData.prediction]);
  if (scanData.scannedAt) {
    detailsData.push(['Scanned At', new Date(scanData.scannedAt).toLocaleString()]);
  }

  doc.autoTable({
    startY: y,
    head: [['Field', 'Value']],
    body: detailsData,
    theme: 'plain',
    headStyles: {
      fillColor: [240, 242, 245],
      textColor: [40, 40, 60],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    styles: {
      fontSize: 8,
      cellPadding: 4,
      lineColor: [230, 230, 240],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold', textColor: [60, 60, 80] },
      1: { cellWidth: 'auto' },
    },
    margin: { left: margin, right: margin },
  });

  y = doc.lastAutoTable.finalY + 8;

  // ============================================================
  // PHISHING REASONS
  // ============================================================
  const phishingReasons = scanData.phishingReasons || scanData.messagePhishingReasons || [];
  if (phishingReasons.length > 0) {
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(margin, y, pageWidth - (margin * 2), 9, 4, 4, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(180, 40, 40);
    doc.setFont('helvetica', 'bold');
    const title = type === 'message' ? 'MESSAGE PHISHING INDICATORS' : 'PHISHING INDICATORS';
    doc.text(title, margin + 8, y + 7);
    y = y + 9 + 4;

    const phishingData = phishingReasons.map((reason, i) => [i + 1, reason]);

    doc.autoTable({
      startY: y,
      head: [['#', 'Reason']],
      body: phishingData,
      theme: 'plain',
      headStyles: {
        fillColor: [252, 235, 235],
        textColor: [180, 40, 40],
        fontSize: 8,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 4,
        lineColor: [240, 220, 220],
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin },
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  // ============================================================
  // LEGITIMATE REASONS
  // ============================================================
  const legitimateReasons = scanData.legitimateReasons || scanData.messageLegitimateReasons || [];
  if (legitimateReasons.length > 0) {
    doc.setFillColor(240, 250, 245);
    doc.roundedRect(margin, y, pageWidth - (margin * 2), 9, 4, 4, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(30, 130, 70);
    doc.setFont('helvetica', 'bold');
    const title = type === 'message' ? 'MESSAGE LEGITIMATE INDICATORS' : 'LEGITIMATE INDICATORS';
    doc.text(title, margin + 8, y + 7);
    y = y + 9 + 4;

    const legitData = legitimateReasons.map((reason, i) => [i + 1, reason]);

    doc.autoTable({
      startY: y,
      head: [['#', 'Reason']],
      body: legitData,
      theme: 'plain',
      headStyles: {
        fillColor: [235, 248, 240],
        textColor: [30, 130, 70],
        fontSize: 8,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 4,
        lineColor: [220, 240, 230],
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin },
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  // ============================================================
  // URLS FOUND (for message scans)
  // ============================================================
  if (scanData.urlsFound && scanData.urlsFound.length > 0) {
    // Check if we need a new page
    if (y > pageHeight - 60) {
      doc.addPage();
      y = margin;
    }

    doc.setFillColor(255, 247, 235);
    doc.roundedRect(margin, y, pageWidth - (margin * 2), 9, 4, 4, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(180, 120, 30);
    doc.setFont('helvetica', 'bold');
    doc.text('URLS FOUND IN MESSAGE', margin + 8, y + 7);
    y = y + 9 + 4;

    const urlData = scanData.urlsFound.map((url, i) => {
      const result = scanData.urlResults?.[i];
      return [i + 1, url, result?.prediction || 'N/A'];
    });

    doc.autoTable({
      startY: y,
      head: [['#', 'URL', 'Prediction']],
      body: urlData,
      theme: 'plain',
      headStyles: {
        fillColor: [252, 242, 230],
        textColor: [120, 80, 20],
        fontSize: 8,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 4,
        lineColor: [240, 230, 220],
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 30 },
      },
      margin: { left: margin, right: margin },
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  // ============================================================
  // CONCLUSION
  // ============================================================
  if (scanData.conclusion) {
    if (y > pageHeight - 60) {
      doc.addPage();
      y = margin;
    }

    doc.setFillColor(250, 251, 253);
    doc.roundedRect(margin, y, pageWidth - (margin * 2), 28, 4, 4, 'F');
    doc.setDrawColor(220, 220, 235);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, pageWidth - (margin * 2), 28, 4, 4, 'S');

    doc.setFontSize(10);
    doc.setTextColor(40, 40, 60);
    doc.setFont('helvetica', 'bold');
    doc.text('ANALYSIS CONCLUSION', margin + 8, y + 7);

    doc.setFontSize(8);
    doc.setTextColor(60, 60, 80);
    doc.setFont('helvetica', 'normal');
    const conclusionLines = doc.splitTextToSize(scanData.conclusion, pageWidth - (margin * 2) - 16);
    doc.text(conclusionLines, margin + 8, y + 16);
    y = y + 28 + 8;
  }

  // ============================================================
  // RECOMMENDATION
  // ============================================================
  if (y > pageHeight - 50) {
    doc.addPage();
    y = margin;
  }

  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 30, 4, 4, 'F');
  doc.setDrawColor(200, 200, 220);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 30, 4, 4, 'S');

  doc.setFontSize(10);
  doc.setTextColor(40, 40, 60);
  doc.setFont('helvetica', 'bold');
  doc.text('SECURITY RECOMMENDATION', margin + 8, y + 7);

  doc.setFontSize(8);
  doc.setTextColor(60, 60, 80);
  doc.setFont('helvetica', 'normal');

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

  const recLines = doc.splitTextToSize(recommendation, pageWidth - (margin * 2) - 16);
  doc.text(recLines, margin + 8, y + 17);
  y = y + 30 + 10;

  // ============================================================
  // FOOTER - All Pages
  // ============================================================
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setDrawColor(220, 220, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFontSize(7);
    doc.setTextColor(160, 160, 180);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${i} of ${pageCount}  •  SecureShield AI Security  •  ${new Date().getFullYear()}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
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
      color: [200, 40, 40],
    };
  } else if (score > 30) {
    return {
      label: 'MEDIUM RISK',
      color: [200, 160, 30],
    };
  } else {
    return {
      label: 'LOW RISK',
      color: [16, 185, 129],
    };
  }
};

export default {
  downloadPDF,
};