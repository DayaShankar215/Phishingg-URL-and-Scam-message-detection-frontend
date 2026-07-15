// services/pdfGenerator.js
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/**
 * Download PDF from scan data (JSON format) - Same as Web
 */
export const downloadPDF = (scanData, type) => {
  const doc = generatePDFReport(scanData, type);
  const fileName = `security_report_${scanData.reference || Date.now()}.html`;
  
  // For Web
  if (Platform.OS === 'web') {
    const blob = new Blob([doc], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { success: true };
  }
  
  // For Mobile - Share as HTML
  return sharePDFAsHTML(doc, fileName);
};

/**
 * Generate clean PDF report from scan data - Same as Web Version
 */
const generatePDFReport = (scanData, type) => {
  const riskScore = getRiskScore(scanData.prediction);
  const riskInfo = getRiskInfo(riskScore);
  
  const riskClass = riskScore > 70 ? 'risk-high' : riskScore > 30 ? 'risk-medium' : 'risk-low';
  const badgeClass = riskScore > 70 ? 'badge-high' : riskScore > 30 ? 'badge-medium' : 'badge-low';

  // Build HTML exactly like web version
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Security Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; background: #f8fafc; }
        .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 8px 0 0; opacity: 0.9; }
        .section { margin: 20px 0; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; }
        .section h2 { color: #667eea; margin-top: 0; font-size: 18px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; }
        .field { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
        .field:last-child { border-bottom: none; }
        .label { color: #64748b; font-weight: 500; }
        .value { font-weight: 600; color: #1e293b; word-break: break-all; }
        .risk-box { padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center; font-weight: bold; font-size: 18px; }
        .risk-high { background: #fee2e2; color: #dc2626; }
        .risk-medium { background: #fef3c7; color: #d97706; }
        .risk-low { background: #dcfce7; color: #16a34a; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .badge-high { background: #fee2e2; color: #dc2626; }
        .badge-medium { background: #fef3c7; color: #d97706; }
        .badge-low { background: #dcfce7; color: #16a34a; }
        .progress-bar { width: 100%; height: 10px; background: #f1f5f9; border-radius: 5px; overflow: hidden; margin: 10px 0; }
        .progress-fill { height: 100%; border-radius: 5px; transition: width 1s ease; background: ${riskInfo.color}; width: ${riskScore}%; }
        .url-list { background: #f8fafc; padding: 10px; border-radius: 8px; margin: 10px 0; }
        .url-item { padding: 8px; font-family: monospace; color: #dc2626; border-bottom: 1px solid #e2e8f0; }
        .url-item:last-child { border-bottom: none; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; }
        ul { padding-left: 20px; color: #475569; line-height: 1.8; }
        li { margin-bottom: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛡️ SecureShield Security Report</h1>
          <p>AI-Powered Threat Detection</p>
        </div>
  `;

  // Scan Summary
  html += `
    <div class="section">
      <h2>📊 Scan Summary</h2>
      <div class="field"><span class="label">Report ID:</span><span class="value">${scanData.reference || 'N/A'}</span></div>
      <div class="field"><span class="label">Type:</span><span class="value">${type === 'url' ? 'URL Scan' : 'Message Scan'}</span></div>
      <div class="field"><span class="label">Date:</span><span class="value">${new Date().toLocaleString()}</span></div>
      <div class="field"><span class="label">Risk Score:</span><span class="value" style="color: ${riskInfo.color}; font-size: 24px;">${riskScore}%</span></div>
      <div class="progress-bar"><div class="progress-fill"></div></div>
      <div class="field"><span class="label">Risk Level:</span><span class="value"><span class="badge ${badgeClass}">${riskInfo.label}</span></span></div>
      <div class="field"><span class="label">Classification:</span><span class="value">${scanData.prediction || 'Unknown'}</span></div>
      <div class="risk-box ${riskClass}">${riskInfo.message}</div>
    </div>
  `;

  // Scan Details
  html += `
    <div class="section">
      <h2>📋 Scan Details</h2>
  `;
  
  if (scanData.url) {
    html += `<div class="field"><span class="label">URL:</span><span class="value">${scanData.url}</span></div>`;
  }
  if (scanData.message) {
    html += `<div class="field"><span class="label">Message:</span><span class="value">${scanData.message}</span></div>`;
  }
  
  html += `</div>`;

  // Phishing Reasons
  if (scanData.phishingReasons && scanData.phishingReasons.length > 0) {
    html += `
      <div class="section">
        <h2>🚨 Phishing Indicators</h2>
        <ul>
    `;
    const reasons = Array.isArray(scanData.phishingReasons) 
      ? scanData.phishingReasons 
      : [scanData.phishingReasons];
    reasons.forEach(reason => {
      html += `<li>${reason}</li>`;
    });
    html += `</ul></div>`;
  }

  // Legitimate Reasons
  if (scanData.legitimateReasons && scanData.legitimateReasons.length > 0) {
    html += `
      <div class="section">
        <h2>✅ Legitimate Indicators</h2>
        <ul>
    `;
    const reasons = Array.isArray(scanData.legitimateReasons) 
      ? scanData.legitimateReasons 
      : [scanData.legitimateReasons];
    reasons.forEach(reason => {
      html += `<li>${reason}</li>`;
    });
    html += `</ul></div>`;
  }

  // Conclusion
  if (scanData.conclusion) {
    html += `
      <div class="section">
        <h2>📝 Conclusion</h2>
        <p style="line-height: 1.8; color: #475569;">${scanData.conclusion}</p>
      </div>
    `;
  }

  // Recommendation
  html += `
    <div class="section">
      <h2>🛡️ Security Recommendation</h2>
      <div class="risk-box ${riskClass}">
        ${riskScore > 70 
          ? '🚫 DO NOT proceed. Report this immediately. This is a confirmed threat.'
          : riskScore > 30
          ? '⚠️ Exercise caution. Verify through official channels before proceeding.'
          : '✅ You can safely proceed. Always remain vigilant.'}
      </div>
    </div>
  `;

  // Footer
  html += `
        <div class="footer">
          <p>Generated by SecureShield Security System • ${new Date().toLocaleDateString()}</p>
          <p style="color: #cbd5e1;">This is an automated security report. Please verify information independently.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
};

/**
 * Share PDF as HTML on mobile - Using legacy API to avoid deprecation warning
 */
const sharePDFAsHTML = async (htmlContent, fileName) => {
  try {
    const docDir = FileSystem.documentDirectory;
    const fileUri = docDir + fileName;
    
    // Using writeAsStringAsync from legacy import
    await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/html',
        dialogTitle: 'Security Report',
      });
    }
    return { success: true, fileUri };
  } catch (error) {
    console.error('PDF Sharing Error:', error);
    // Fallback: If sharing fails, at least the file is saved
    return { success: false, error: error.message };
  }
};

/**
 * Get risk score based on prediction - Same as Web
 */
const getRiskScore = (prediction) => {
  switch (prediction?.toUpperCase()) {
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
 * Get risk info based on score - Same as Web
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

export default {
  downloadPDF,
};