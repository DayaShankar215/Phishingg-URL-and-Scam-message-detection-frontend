// services/pdfGenerator.js
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { printToFileAsync } from 'expo-print';

/**
 * Escape HTML special characters so dynamic values never break the layout.
 */
const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Download / print PDF from scan data.
 *
 * - Web         => opens the browser print dialog with the report (real PDF via "Save as PDF").
 * - iOS/Android => renders the report with expo-print and shares the generated PDF.
 */
export const downloadPDF = async (scanData, type) => {
  try {
    const html = generatePDFHTML(scanData, type);

    if (Platform.OS === 'web') {
      printWeb(html);
      return { success: true };
    }

    try {
      const { uri } = await printToFileAsync({
        html,
        base64: false,
        width: 595,
        height: 842,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Security Report',
        });
      }

      return { success: true, uri };
    } catch (printError) {
      console.error('Print Error:', printError);
      // Last resort fallback only for native devices when printing unavailable
      const htmlUri = await saveAndShareHTML(html, scanData.reference);
      return { success: true, uri: htmlUri };
    }
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw new Error('Failed to generate PDF report: ' + error.message);
  }
};

/**
 * Web: open the print dialog with only the report content, so the user
 * can "Save as PDF". Produces a real PDF instead of a raw HTML download.
 */
const printWeb = (html) => {
  if (typeof document === 'undefined') return;

  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  document.body.appendChild(frame);

  const frameDoc = frame.contentWindow.document;
  frameDoc.open();
  frameDoc.write(html);
  frameDoc.close();

  frame.contentWindow.focus();
  frame.contentWindow.print();

  // Remove the frame once the user is done with the print dialog
  frame.contentWindow.addEventListener('afterprint', () => {
    if (frame.parentNode) frame.parentNode.removeChild(frame);
  });
  setTimeout(() => {
    if (frame.parentNode) frame.parentNode.removeChild(frame);
  }, 60000);
};

/**
 * Save and share HTML using LEGACY FileSystem API (native fallback only)
 */
const saveAndShareHTML = async (html, reference) => {
  try {
    const fileName = `security_report_${reference || Date.now()}.html`;

    const directory = FileSystem.documentDirectory || FileSystem.cacheDirectory;
    const fileUri = `${directory}${fileName}`;

    console.log('[PDF] Saving HTML to:', fileUri);

    await FileSystem.writeAsStringAsync(fileUri, html, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('File was not created successfully');
    }

    console.log('[PDF] File saved, size:', fileInfo.size);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/html',
        dialogTitle: 'Security Report',
      });
    }
    return fileUri;
  } catch (error) {
    console.error('HTML Share Error:', error);
    throw error;
  }
};

/**
 * Extract phishing and legitimate indicators from conclusion text
 * This handles the case where the API returns scores embedded in the conclusion
 */
const extractIndicatorsFromConclusion = (conclusion) => {
  const phishingIndicators = [];
  const legitimateIndicators = [];
  
  if (!conclusion) return { phishingIndicators, legitimateIndicators };
  
  // Extract phishing influence score
  const phishingMatch = conclusion.match(/phishing influence score was ([-\d.]+)/i);
  if (phishingMatch) {
    phishingIndicators.push(`Phishing influence score: ${phishingMatch[1]}`);
  }
  
  // Extract legitimate influence score
  const legitimateMatch = conclusion.match(/legitimate influence score was ([-\d.]+)/i);
  if (legitimateMatch) {
    legitimateIndicators.push(`Legitimate influence score: ${legitimateMatch[1]}`);
  }
  
  // Try to extract individual indicators from the conclusion
  // The conclusion might contain bullet points or numbered lists
  const lines = conclusion.split(/[.\n\r]+/).filter(line => line.trim().length > 0);
  
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip lines that contain score information (already extracted)
    if (trimmed.match(/phishing influence score/i) || trimmed.match(/legitimate influence score/i)) {
      continue;
    }
    // Skip the "In this explanation" line
    if (trimmed.match(/In this explanation/i)) {
      continue;
    }
    // If line contains "phishing" or "legitimate" context, add it
    if (trimmed.length > 10) {
      if (trimmed.match(/phishing/i) && !trimmed.match(/legitimate/i)) {
        phishingIndicators.push(trimmed);
      } else if (trimmed.match(/legitimate/i) && !trimmed.match(/phishing/i)) {
        legitimateIndicators.push(trimmed);
      }
    }
  }
  
  return { phishingIndicators, legitimateIndicators };
};

/**
 * Generate the report HTML — aligned with the web (jsPDF) layout and content.
 */
const generatePDFHTML = (scanData, type) => {
  const prediction = scanData.prediction || scanData.overallPrediction || 'UNKNOWN';
  const isMessage = type === 'message';

  // Determine badge color based on prediction
  const getBadgeClass = (pred) => {
    const upperPred = String(pred).toUpperCase().trim();
    if (['PHISHING', 'DANGEROUS', 'MALICIOUS', 'SCAM'].includes(upperPred)) {
      return 'badge-high';
    } else if (['SUSPICIOUS', 'WARNING'].includes(upperPred)) {
      return 'badge-medium';
    } else if (['SAFE', 'LEGITIMATE'].includes(upperPred)) {
      return 'badge-low';
    }
    return 'badge-medium';
  };

  const badgeClass = getBadgeClass(prediction);

  // Extract phishing and legitimate reasons - check all possible locations
  let phishingReasons = [];
  let legitimateReasons = [];
  let urlsFound = [];
  let urlResults = [];

  // First try to get from the data directly
  if (scanData._raw) {
    phishingReasons = scanData._raw.phishingReasons || 
                      scanData._raw.messagePhishingReasons || 
                      scanData.phishingReasons || 
                      scanData.messagePhishingReasons || 
                      [];
    
    legitimateReasons = scanData._raw.legitimateReasons || 
                        scanData._raw.messageLegitimateReasons || 
                        scanData.legitimateReasons || 
                        scanData.messageLegitimateReasons || 
                        [];
    
    urlsFound = scanData._raw.urlsFound || scanData.urlsFound || [];
    urlResults = scanData._raw.urlResults || scanData.urlResults || [];
  } else {
    phishingReasons = scanData.phishingReasons || scanData.messagePhishingReasons || [];
    legitimateReasons = scanData.legitimateReasons || scanData.messageLegitimateReasons || [];
    urlsFound = scanData.urlsFound || [];
    urlResults = scanData.urlResults || [];
  }

  // If no phishing reasons found, try to extract from conclusion
  if (phishingReasons.length === 0 && legitimateReasons.length === 0) {
    const conclusion = scanData.conclusion || scanData.explanation || '';
    const extracted = extractIndicatorsFromConclusion(conclusion);
    
    // Only use extracted indicators if we have some meaningful data
    if (extracted.phishingIndicators.length > 0 || extracted.legitimateIndicators.length > 0) {
      phishingReasons = extracted.phishingIndicators;
      legitimateReasons = extracted.legitimateIndicators;
      console.log('[PDF] Extracted from conclusion - Phishing:', phishingReasons);
      console.log('[PDF] Extracted from conclusion - Legitimate:', legitimateReasons);
    }
  }

  console.log('[PDF] Final Phishing Reasons:', phishingReasons);
  console.log('[PDF] Final Legitimate Reasons:', legitimateReasons);

  // A message scan sometimes stored the message text into `url`
  const showUrl = Boolean(scanData.url) && scanData.url !== scanData.message;
  const showMessage = Boolean(scanData.message);
  const scanTypeLabel = isMessage ? 'Message Scan' : 'URL Scan';

  const indicatorTitle = isMessage ? 'MESSAGE PHISHING INDICATORS' : 'PHISHING INDICATORS';
  const legitTitle = isMessage ? 'MESSAGE LEGITIMATE INDICATORS' : 'LEGITIMATE INDICATORS';

  const reference = scanData.reference || 'N/A';
  const generatedAt = new Date().toLocaleString();

  let html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Security Report</title>
      <style>
        /* ===== RESET ===== */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
          background: #ffffff;
          color: #1e293b;
          font-family: Helvetica, Arial, sans-serif;
        }
        body { padding: 24px; }
        .container {
          max-width: 100%;
          width: 100%;
          background: white;
          padding: 20px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        }

        /* ===== HEADER ===== */
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 24px 20px;
          border-radius: 10px;
          margin-bottom: 20px;
        }
        .header-title {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: 1px;
        }
        .header-subtitle {
          font-size: 12px;
          opacity: 0.85;
          margin-top: 3px;
        }
        .header-meta {
          margin-top: 12px;
          font-size: 11px;
          line-height: 1.7;
          opacity: 0.9;
        }

        /* ===== SECTIONS ===== */
        .section {
          margin: 14px 0;
          padding: 14px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #fafbfc;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .section h2 {
          color: #1e293b;
          font-size: 15px;
          font-weight: 700;
          padding-bottom: 10px;
          border-bottom: 2px solid #e2e8f0;
          margin-bottom: 12px;
        }

        /* ===== FIELDS ===== */
        .field {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 8px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .field:last-child { border-bottom: none; }
        .label {
          color: #64748b;
          font-weight: 600;
          font-size: 13px;
          flex-shrink: 0;
          min-width: 120px;
        }
        .value {
          font-weight: 600;
          color: #1e293b;
          word-break: break-all;
          text-align: right;
          font-size: 13px;
          flex: 1;
          margin-left: 14px;
        }

        /* ===== BADGES ===== */
        .badge {
          display: inline-block;
          padding: 3px 12px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 600;
        }
        .badge-high { background: #fef2f2; color: #dc2626; }
        .badge-medium { background: #fffbeb; color: #d97706; }
        .badge-low { background: #f0fdf4; color: #16a34a; }

        /* ===== LISTS ===== */
        ul {
          padding-left: 20px;
          color: #475569;
          line-height: 1.8;
          margin: 4px 0;
        }
        li { margin-bottom: 3px; font-size: 13px; }

        /* ===== MESSAGE / URL BOXES ===== */
        .message-content {
          background: #f8fafc;
          padding: 12px;
          border-radius: 8px;
          border-left: 4px solid #667eea;
          font-style: italic;
          font-size: 13px;
          line-height: 1.6;
          color: #334155;
          margin-top: 4px;
        }
        .url-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 10px;
          background: white;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          margin-bottom: 6px;
        }
        .url-text {
          font-family: monospace;
          font-size: 12px;
          word-break: break-all;
          flex: 1;
        }
        .url-pred {
          padding: 2px 10px;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 600;
          margin-left: 10px;
          flex-shrink: 0;
        }
        .url-pred-safe { background: #dcfce7; color: #16a34a; }
        .url-pred-phishing { background: #fee2e2; color: #dc2626; }
        .url-pred-unknown { background: #f1f5f9; color: #64748b; }

        /* ===== RECOMMENDATION BOX ===== */
        .recommendation-box {
          padding: 12px 16px;
          border-radius: 8px;
          margin: 10px 0 0;
          font-weight: 600;
          font-size: 14px;
          line-height: 1.6;
        }
        .recommendation-high { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }
        .recommendation-medium { background: #fffbeb; color: #d97706; border: 1px solid #fcd34d; }
        .recommendation-low { background: #f0fdf4; color: #16a34a; border: 1px solid #86efac; }

        /* ===== FOOTER ===== */
        .footer {
          text-align: center;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
          color: #94a3b8;
          font-size: 11px;
          line-height: 1.8;
        }
        .footer strong { color: #667eea; font-weight: 700; }

        @page {
          size: 210mm 297mm;
          margin: 10mm;
        }

        @media print {
          body { padding: 0; background: white; }
          .container { border: none; padding: 0; }
          .section, .url-item { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- HEADER -->
        <div class="header">
          <div class="header-title">SECURESHIELD</div>
          <div class="header-subtitle">AI-Powered Security Report</div>
          <div class="header-meta">
            Report ID: ${escapeHtml(reference)}<br />
            Generated: ${escapeHtml(generatedAt)}
          </div>
        </div>

        <!-- SCAN SUMMARY -->
        <div class="section">
          <h2>SCAN SUMMARY</h2>
          <div class="field">
            <span class="label">Scan Type:</span>
            <span class="value">${escapeHtml(scanTypeLabel)}</span>
          </div>
          <div class="field">
            <span class="label">Classification:</span>
            <span class="value"><span class="badge ${badgeClass}">${escapeHtml(prediction)}</span></span>
          </div>
          ${scanData.reference ? `<div class="field"><span class="label">Reference:</span><span class="value" style="font-family: monospace;">${escapeHtml(reference)}</span></div>` : ''}
          ${showUrl ? `<div class="field"><span class="label">URL:</span><span class="value" style="font-family: monospace; font-size: 12px;">${escapeHtml(scanData.url)}</span></div>` : ''}
          ${showMessage ? `<div class="field"><span class="label">Message:</span><span class="value" style="font-family: monospace; font-size: 12px;">${escapeHtml(scanData.message)}</span></div>` : ''}
          ${scanData.overallPrediction ? `<div class="field"><span class="label">Overall Prediction:</span><span class="value"><span class="badge ${badgeClass}">${escapeHtml(scanData.overallPrediction)}</span></span></div>` : ''}
          ${scanData.messagePrediction ? `<div class="field"><span class="label">Message Prediction:</span><span class="value"><span class="badge ${badgeClass}">${escapeHtml(scanData.messagePrediction)}</span></span></div>` : ''}
          ${scanData.scannedAt ? `<div class="field"><span class="label">Scanned At:</span><span class="value">${escapeHtml(new Date(scanData.scannedAt).toLocaleString())}</span></div>` : ''}
        </div>
  `;

  // ============================================================
  // PHISHING INDICATORS - ALWAYS SHOW IF AVAILABLE
  // ============================================================
  if (phishingReasons && phishingReasons.length > 0) {
    html += `
      <div class="section" style="border-color: #fca5a5; background: #fef2f2;">
        <h2>${escapeHtml(indicatorTitle)}</h2>
        <ul>
    `;
    phishingReasons.forEach((reason) => {
      html += `<li>${escapeHtml(reason)}</li>`;
    });
    html += `</ul></div>`;
  }

  // ============================================================
  // LEGITIMATE INDICATORS - ALWAYS SHOW IF AVAILABLE
  // ============================================================
  if (legitimateReasons && legitimateReasons.length > 0) {
    html += `
      <div class="section" style="border-color: #86efac; background: #f0fdf4;">
        <h2>${escapeHtml(legitTitle)}</h2>
        <ul>
    `;
    legitimateReasons.forEach((reason) => {
      html += `<li>${escapeHtml(reason)}</li>`;
    });
    html += `</ul></div>`;
  }

  // ============================================================
  // URLS FOUND IN MESSAGE (message scans only)
  // ============================================================
  if (isMessage && urlsFound && urlsFound.length > 0) {
    html += `
      <div class="section" style="border-color: #fcd34d; background: #fffbeb;">
        <h2>URLS FOUND IN MESSAGE</h2>
    `;
    urlsFound.forEach((url, index) => {
      const result = urlResults && urlResults[index];
      const predClass = result?.prediction === 'LEGITIMATE' ? 'url-pred-safe'
        : result?.prediction === 'PHISHING' ? 'url-pred-phishing'
        : 'url-pred-unknown';
      html += `
        <div class="url-item">
          <span class="url-text">${escapeHtml(url)}</span>
          <span class="url-pred ${predClass}">${escapeHtml(result?.prediction || 'UNKNOWN')}</span>
        </div>
      `;
    });
    html += `</div>`;
  }

  // ============================================================
  // ANALYSIS CONCLUSION - ALWAYS SHOW
  // ============================================================
  const conclusionText = scanData.conclusion || scanData.explanation || 'Analysis completed.';
  html += `
    <div class="section">
      <h2>ANALYSIS CONCLUSION</h2>
      <p style="line-height: 1.7; color: #475569; font-size: 13px;">${escapeHtml(conclusionText)}</p>
    </div>
  `;

  // ============================================================
  // SECURITY RECOMMENDATION
  // ============================================================
  const upperPred = String(prediction).toUpperCase().trim();
  let recommendationText = '';
  let recClass = 'recommendation-low';

  if (['PHISHING', 'DANGEROUS', 'MALICIOUS', 'SCAM'].includes(upperPred)) {
    recClass = 'recommendation-high';
    recommendationText = isMessage
      ? 'DO NOT engage with this message. Block the sender immediately. Never click links, reply, or call any numbers provided. Report this as spam to your carrier.'
      : 'DO NOT proceed to this website. Report this URL to security authorities immediately. This is a confirmed phishing attempt designed to steal your credentials.';
  } else if (['SUSPICIOUS', 'WARNING'].includes(upperPred)) {
    recClass = 'recommendation-medium';
    recommendationText = isMessage
      ? 'Be cautious. Do not share personal information, click suspicious links, or call unknown numbers. Verify the sender through official channels.'
      : 'Exercise extreme caution. Verify the website\'s authenticity through official channels before entering any personal information or credentials.';
  } else {
    recClass = 'recommendation-low';
    recommendationText = isMessage
      ? 'This message appears safe. However, always verify unexpected requests, especially those asking for personal information or money transfers.'
      : 'You can safely proceed. However, always verify the URL matches the official website before entering sensitive information.';
  }

  html += `
    <div class="section" style="border-color: ${recClass === 'recommendation-high' ? '#fca5a5' : recClass === 'recommendation-medium' ? '#fcd34d' : '#86efac'}; background: ${recClass === 'recommendation-high' ? '#fef2f2' : recClass === 'recommendation-medium' ? '#fffbeb' : '#f0fdf4'};">
      <h2>SECURITY RECOMMENDATION</h2>
      <div class="recommendation-box ${recClass}">${escapeHtml(recommendationText)}</div>
    </div>
  `;

  // ============================================================
  // FOOTER
  // ============================================================
  html += `
        <div class="footer">
          <p>Generated by <strong>SecureShield</strong> Security System</p>
          <p>&copy; ${new Date().getFullYear()} SecureShield &bull; All Rights Reserved</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
};

export default { downloadPDF };