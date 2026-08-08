// services/pdfGenerator.js
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { printToFileAsync } from 'expo-print';

/**
 * Download PDF from scan data
 */
export const downloadPDF = async (scanData, type) => {
  try {
    const html = generatePDFHTML(scanData, type);
    
    if (Platform.OS === 'web') {
      // Web: Download as HTML file
      const blob = new Blob([html], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `security_report_${scanData.reference || Date.now()}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { success: true };
    }

    // Mobile: Use expo-print to generate PDF
    try {
      const { uri } = await printToFileAsync({
        html: html,
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
      // Fallback: Save and share as HTML using legacy API
      const htmlUri = await saveAndShareHTML(html, scanData.reference);
      return { success: true, uri: htmlUri };
    }
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw new Error('Failed to generate PDF report: ' + error.message);
  }
};

/**
 * ✅ FIXED: Save and share HTML using LEGACY FileSystem API
 */
const saveAndShareHTML = async (html, reference) => {
  try {
    const fileName = `security_report_${reference || Date.now()}.html`;
    
    // ✅ Use legacy API with proper file URI
    const directory = FileSystem.documentDirectory || FileSystem.cacheDirectory;
    const fileUri = `${directory}${fileName}`;
    
    console.log('[PDF] Saving HTML to:', fileUri);
    
    // ✅ Write using legacy API
    await FileSystem.writeAsStringAsync(fileUri, html, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    // Verify file exists
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
 * Generate PDF HTML - Replicates web version style
 */
const generatePDFHTML = (scanData, type) => {
  const riskScore = getRiskScore(scanData.prediction || scanData.overallPrediction);
  const riskInfo = getRiskInfo(riskScore);
  
  const riskClass = riskScore > 70 ? 'risk-high' : riskScore > 30 ? 'risk-medium' : 'risk-low';
  const badgeClass = riskScore > 70 ? 'badge-high' : riskScore > 30 ? 'badge-medium' : 'badge-low';

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Security Report</title>
      <style>
        /* ===== RESET ===== */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, Helvetica, sans-serif; 
          padding: 20px; 
          max-width: 1000px; 
          margin: 0 auto; 
          background: #f1f5f9; 
          color: #1e293b;
        }
        .container { 
          background: white; 
          padding: 40px; 
          border-radius: 16px; 
          box-shadow: 0 4px 24px rgba(0,0,0,0.08); 
        }
        
        /* ===== HEADER ===== */
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          padding: 32px 28px; 
          border-radius: 12px; 
          margin-bottom: 28px; 
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .header-icon {
          width: 48px;
          height: 48px;
          background: rgba(255,255,255,0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        .header h1 { 
          margin: 0; 
          font-size: 24px; 
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .header-subtitle {
          font-size: 12px;
          opacity: 0.8;
          margin-top: 2px;
        }
        .header-right {
          text-align: right;
          font-size: 11px;
          opacity: 0.85;
          line-height: 1.6;
        }
        
        /* ===== SECTIONS ===== */
        .section { 
          margin: 20px 0; 
          padding: 20px 24px; 
          border: 1px solid #e2e8f0; 
          border-radius: 12px; 
          background: #fafbfc;
        }
        .section h2 { 
          color: #1e293b; 
          margin-top: 0; 
          font-size: 17px; 
          font-weight: 700;
          border-bottom: 2px solid #e2e8f0; 
          padding-bottom: 12px; 
          margin-bottom: 16px; 
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section h2 span {
          font-size: 20px;
        }
        
        /* ===== FIELDS ===== */
        .field { 
          display: flex; 
          justify-content: space-between; 
          padding: 10px 0; 
          border-bottom: 1px solid #f1f5f9; 
          align-items: flex-start;
        }
        .field:last-child { border-bottom: none; }
        .label { 
          color: #64748b; 
          font-weight: 500; 
          font-size: 14px;
          flex-shrink: 0;
          min-width: 120px;
        }
        .value { 
          font-weight: 600; 
          color: #1e293b; 
          word-break: break-all; 
          text-align: right;
          font-size: 14px;
          flex: 1;
          margin-left: 16px;
        }
        
        /* ===== RISK BOX ===== */
        .risk-box { 
          padding: 16px 20px; 
          border-radius: 10px; 
          margin: 14px 0 0; 
          text-align: center; 
          font-weight: 600; 
          font-size: 16px; 
          line-height: 1.6;
        }
        .risk-high { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }
        .risk-medium { background: #fffbeb; color: #d97706; border: 1px solid #fcd34d; }
        .risk-low { background: #f0fdf4; color: #16a34a; border: 1px solid #86efac; }
        
        /* ===== BADGES ===== */
        .badge { 
          display: inline-block; 
          padding: 4px 14px; 
          border-radius: 100px; 
          font-size: 12px; 
          font-weight: 600; 
        }
        .badge-high { background: #fef2f2; color: #dc2626; }
        .badge-medium { background: #fffbeb; color: #d97706; }
        .badge-low { background: #f0fdf4; color: #16a34a; }
        
        /* ===== PROGRESS BAR ===== */
        .progress-container {
          margin: 12px 0 6px;
        }
        .progress-bar { 
          width: 100%; 
          height: 8px; 
          background: #f1f5f9; 
          border-radius: 4px; 
          overflow: hidden; 
        }
        .progress-fill { 
          height: 100%; 
          border-radius: 4px; 
          background: ${riskInfo.color}; 
          width: ${Math.min(riskScore, 100)}%; 
          transition: width 0.8s ease;
        }
        .progress-labels {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #94a3b8;
          margin-top: 4px;
        }
        
        /* ===== RISK SCORE DISPLAY ===== */
        .risk-score-row {
          display: flex;
          align-items: baseline;
          gap: 16px;
          margin: 4px 0 8px;
          flex-wrap: wrap;
        }
        .risk-score-value {
          font-size: 44px;
          font-weight: 800;
          line-height: 1;
        }
        .risk-score-label {
          font-size: 18px;
          font-weight: 600;
        }
        
        /* ===== LISTS ===== */
        ul { 
          padding-left: 24px; 
          color: #475569; 
          line-height: 1.9; 
          margin: 4px 0;
        }
        li { margin-bottom: 4px; font-size: 14px; }
        
        /* ===== MESSAGE CONTENT ===== */
        .message-content {
          background: #f8fafc;
          padding: 16px;
          border-radius: 10px;
          border-left: 4px solid ${riskInfo.color};
          font-style: italic;
          font-size: 14px;
          line-height: 1.7;
          color: #334155;
          margin-top: 4px;
        }
        
        /* ===== URL ITEMS ===== */
        .url-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          margin-bottom: 8px;
        }
        .url-item:last-child { margin-bottom: 0; }
        .url-text {
          font-family: monospace;
          font-size: 13px;
          word-break: break-all;
          flex: 1;
        }
        .url-pred {
          padding: 2px 12px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 600;
          margin-left: 12px;
          flex-shrink: 0;
        }
        .url-pred-safe { background: #dcfce7; color: #16a34a; }
        .url-pred-phishing { background: #fee2e2; color: #dc2626; }
        .url-pred-unknown { background: #f1f5f9; color: #64748b; }
        
        /* ===== FOOTER ===== */
        .footer { 
          text-align: center; 
          margin-top: 32px; 
          padding-top: 20px; 
          border-top: 1px solid #e2e8f0; 
          color: #94a3b8; 
          font-size: 12px; 
          line-height: 1.8;
        }
        .footer span {
          color: #667eea;
          font-weight: 600;
        }
        
        /* ===== RESPONSIVE ===== */
        @media print {
          body { padding: 12px; background: white; }
          .container { box-shadow: none; padding: 24px; }
          .section { break-inside: avoid; }
        }
        @media (max-width: 600px) {
          body { padding: 12px; }
          .container { padding: 16px; }
          .header { flex-direction: column; text-align: center; }
          .header-right { text-align: center; }
          .header-left { flex-direction: column; }
          .field { flex-direction: column; gap: 4px; align-items: flex-start; }
          .value { text-align: left; margin-left: 0; max-width: 100%; }
          .risk-score-row { flex-wrap: wrap; }
          .risk-score-value { font-size: 32px; }
          .section { padding: 16px; }
          .url-item { flex-direction: column; gap: 6px; align-items: flex-start; }
          .url-pred { margin-left: 0; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- HEADER -->
        <div class="header">
          <div class="header-left">
            <div class="header-icon">🛡️</div>
            <div>
              <h1>SECURESHIELD</h1>
              <div class="header-subtitle">AI-Powered Security Report</div>
            </div>
          </div>
          <div class="header-right">
            <div>Report ID: ${scanData.reference || 'N/A'}</div>
            <div>Generated: ${new Date().toLocaleString()}</div>
          </div>
        </div>
  `;

  // ============================================================
  // SCAN SUMMARY
  // ============================================================
  html += `
    <div class="section">
      <h2><span>📊</span> SCAN SUMMARY</h2>
      <div class="field">
        <span class="label">Scan Type:</span>
        <span class="value">${type === 'url' ? 'URL Scan' : 'Message Scan'}</span>
      </div>
      <div class="field">
        <span class="label">Classification:</span>
        <span class="value"><span class="badge ${badgeClass}">${scanData.prediction || scanData.overallPrediction || 'Unknown'}</span></span>
      </div>
      <div class="field">
        <span class="label">Risk Score:</span>
        <span class="value" style="color: ${riskInfo.color}; font-size: 20px; font-weight: 800;">${riskScore}%</span>
      </div>
      <div class="risk-score-row">
        <span class="risk-score-value" style="color: ${riskInfo.color};">${riskScore}%</span>
        <span class="risk-score-label" style="color: ${riskInfo.color};">${riskInfo.label}</span>
      </div>
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
        <div class="progress-labels">
          <span>Low Risk (0%)</span>
          <span>Medium (50%)</span>
          <span>High Risk (100%)</span>
        </div>
      </div>
      <div class="field">
        <span class="label">Risk Level:</span>
        <span class="value"><span class="badge ${badgeClass}">${riskInfo.label}</span></span>
      </div>
    </div>
  `;

  // ============================================================
  // SCAN DETAILS
  // ============================================================
  html += `
    <div class="section">
      <h2><span>📋</span> SCAN DETAILS</h2>
  `;
  
  if (scanData.url) {
    html += `
      <div class="field">
        <span class="label">URL:</span>
        <span class="value" style="font-family: monospace; font-size: 13px;">${scanData.url}</span>
      </div>
    `;
  }
  if (scanData.message) {
    html += `
      <div class="field">
        <span class="label">Message:</span>
        <span class="value" style="font-family: monospace; font-size: 13px;">${scanData.message}</span>
      </div>
    `;
  }
  if (scanData.overallPrediction) {
    html += `
      <div class="field">
        <span class="label">Overall Prediction:</span>
        <span class="value"><span class="badge ${badgeClass}">${scanData.overallPrediction}</span></span>
      </div>
    `;
  }
  if (scanData.messagePrediction) {
    html += `
      <div class="field">
        <span class="label">Message Prediction:</span>
        <span class="value"><span class="badge ${badgeClass}">${scanData.messagePrediction}</span></span>
      </div>
    `;
  }
  if (scanData.scannedAt) {
    html += `
      <div class="field">
        <span class="label">Scanned At:</span>
        <span class="value">${new Date(scanData.scannedAt).toLocaleString()}</span>
      </div>
    `;
  }
  
  html += `</div>`;

  // ============================================================
  // MESSAGE PHISHING REASONS
  // ============================================================
  const messagePhishing = scanData.messagePhishingReasons || [];
  if (messagePhishing.length > 0) {
    html += `
      <div class="section" style="border-color: #fca5a5; background: #fef2f2;">
        <h2><span>🚨</span> MESSAGE PHISHING INDICATORS</h2>
        <ul>
    `;
    messagePhishing.forEach(reason => {
      html += `<li>${reason}</li>`;
    });
    html += `</ul></div>`;
  }

  // ============================================================
  // URL PHISHING REASONS
  // ============================================================
  const phishingReasons = scanData.phishingReasons || [];
  if (phishingReasons.length > 0) {
    html += `
      <div class="section" style="border-color: #fca5a5; background: #fef2f2;">
        <h2><span>🚨</span> PHISHING INDICATORS</h2>
        <ul>
    `;
    phishingReasons.forEach(reason => {
      html += `<li>${reason}</li>`;
    });
    html += `</ul></div>`;
  }

  // ============================================================
  // LEGITIMATE REASONS
  // ============================================================
  const legitimateReasons = scanData.legitimateReasons || scanData.messageLegitimateReasons || [];
  if (legitimateReasons.length > 0) {
    html += `
      <div class="section" style="border-color: #86efac; background: #f0fdf4;">
        <h2><span>✅</span> LEGITIMATE INDICATORS</h2>
        <ul>
    `;
    legitimateReasons.forEach(reason => {
      html += `<li>${reason}</li>`;
    });
    html += `</ul></div>`;
  }

  // ============================================================
  // URLS FOUND (for message scans)
  // ============================================================
  const urlsFound = scanData.urlsFound || [];
  if (urlsFound.length > 0) {
    html += `
      <div class="section" style="border-color: #fcd34d; background: #fffbeb;">
        <h2><span>🔗</span> URLS FOUND IN MESSAGE</h2>
    `;
    urlsFound.forEach((url, index) => {
      const result = scanData.urlResults?.[index];
      const predClass = result?.prediction === 'LEGITIMATE' ? 'url-pred-safe' 
        : result?.prediction === 'PHISHING' ? 'url-pred-phishing' 
        : 'url-pred-unknown';
      html += `
        <div class="url-item">
          <span class="url-text">${url}</span>
          <span class="url-pred ${predClass}">${result?.prediction || 'UNKNOWN'}</span>
        </div>
      `;
    });
    html += `</div>`;
  }

  // ============================================================
  // CONCLUSION
  // ============================================================
  if (scanData.conclusion) {
    html += `
      <div class="section">
        <h2><span>📝</span> ANALYSIS CONCLUSION</h2>
        <p style="line-height: 1.8; color: #475569; font-size: 14px;">${scanData.conclusion}</p>
      </div>
    `;
  }

  // ============================================================
  // SECURITY RECOMMENDATION
  // ============================================================
  let recommendationText = '';
  if (riskScore > 70) {
    if (type === 'message') {
      recommendationText = '🚫 DO NOT engage with this message. Block the sender immediately. Never click links, reply, or call any numbers provided. Report this as spam to your carrier.';
    } else {
      recommendationText = '🚫 DO NOT proceed to this website. Report this URL to security authorities immediately. This is a confirmed phishing attempt designed to steal your credentials.';
    }
  } else if (riskScore > 30) {
    if (type === 'message') {
      recommendationText = '⚠️ Be cautious. Do not share personal information, click suspicious links, or call unknown numbers. Verify the sender through official channels.';
    } else {
      recommendationText = '⚠️ Exercise extreme caution. Verify the website\'s authenticity through official channels before entering any personal information or credentials.';
    }
  } else {
    if (type === 'message') {
      recommendationText = '✓ This message appears safe. However, always verify unexpected requests, especially those asking for personal information or money transfers.';
    } else {
      recommendationText = '✓ You can safely proceed. However, always verify the URL matches the official website before entering sensitive information.';
    }
  }

  html += `
    <div class="section" style="border-color: ${riskInfo.color}40; background: ${riskScore > 70 ? '#fef2f2' : riskScore > 30 ? '#fffbeb' : '#f0fdf4'};">
      <h2><span>🛡️</span> SECURITY RECOMMENDATION</h2>
      <div class="risk-box ${riskClass}">${recommendationText}</div>
    </div>
  `;

  // ============================================================
  // FOOTER
  // ============================================================
  html += `
        <div class="footer">
          <p>Generated by <span>SecureShield</span> Security System</p>
          <p>© ${new Date().getFullYear()} SecureShield • All Rights Reserved</p>
          <p style="font-size: 10px; color: #cbd5e1; margin-top: 6px;">This is an automated security report. Please verify information independently.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
};

/**
 * Get risk score based on prediction
 */
const getRiskScore = (prediction) => {
  if (!prediction) return 50;
  switch (prediction.toUpperCase()) {
    case 'PHISHING':
    case 'DANGEROUS':
    case 'MALICIOUS':
      return 85;
    case 'SCAM':
    case 'SUSPICIOUS':
    case 'WARNING':
      return 55;
    case 'SAFE':
    case 'LEGITIMATE':
      return 15;
    default:
      return 50;
  }
};

/**
 * Get risk info based on score
 */
const getRiskInfo = (score) => {
  if (score > 70) {
    return {
      label: 'HIGH RISK',
      color: '#dc2626',
      message: '🚫 HIGH RISK: This is a confirmed threat! Do not proceed.'
    };
  } else if (score > 30) {
    return {
      label: 'MEDIUM RISK',
      color: '#d97706',
      message: '⚠️ MEDIUM RISK: This shows suspicious characteristics. Exercise caution.'
    };
  } else {
    return {
      label: 'LOW RISK',
      color: '#16a34a',
      message: '✅ LOW RISK: This appears to be safe. Always remain vigilant.'
    };
  }
};

export default { downloadPDF };