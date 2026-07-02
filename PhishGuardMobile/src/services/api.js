import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// CHANGE THIS TO YOUR COMPUTER'S IP ADDRESS
// Run 'ipconfig' in CMD to find your IP
const API_BASE_URL = 'http://192.168.1.80/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// URL Scan
export const scanURL = async (url) => {
  try {
    const response = await api.post('/scan/url', { url });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to scan URL' };
  }
};

// Message Scan
export const scanMessage = async (message) => {
  try {
    const response = await api.post('/scan/message', { message });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to scan message' };
  }
};

// Get Scan History
export const getScanHistory = async (type = null) => {
  try {
    const params = type ? { type } : {};
    const response = await api.get('/scans', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch history' };
  }
};

// Get Scan by ID
export const getScanById = async (id, type) => {
  try {
    const response = await api.get(`/scans/${type}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch scan details' };
  }
};

// Get Dashboard Stats
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/dashboard/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch statistics' };
  }
};

// Submit Feedback
export const submitFeedback = async (scanId, type, isAccurate, comments, rating = null) => {
  try {
    const body = { scanId, type, isAccurate, comments };
    if (rating !== null) body.rating = rating;
    const response = await api.post('/feedback', body);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to submit feedback' };
  }
};

// ==================== PDF REPORT ENDPOINTS ====================

// Generate PDF Report (Mobile - Creates PDF from scan data)
export const generatePDFReport = async (scanData, type) => {
  try {
    // Create HTML content for PDF
    const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { background: #667eea; color: white; padding: 20px; border-radius: 10px; text-align: center; }
            .header h1 { margin: 0; }
            .section { margin: 20px 0; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; }
            .section h2 { color: #667eea; margin-top: 0; }
            .risk-high { color: #ef4444; }
            .risk-medium { color: #f59e0b; }
            .risk-low { color: #10b981; }
            .field { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
            .label { color: #64748b; }
            .value { font-weight: 600; color: #1e293b; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🛡️ PhishGuard Security Report</h1>
            <p>AI-Powered Threat Detection</p>
          </div>
          
          <div class="section">
            <h2>📋 Scan Information</h2>
            <div class="field"><span class="label">Report ID:</span><span class="value">${scanData.id || 'N/A'}</span></div>
            <div class="field"><span class="label">Generated:</span><span class="value">${new Date().toLocaleString()}</span></div>
            <div class="field"><span class="label">Scan Type:</span><span class="value">${type === 'url' ? 'URL Scan' : 'Message Scan'}</span></div>
            <div class="field"><span class="label">Content:</span><span class="value">${(scanData.content || scanData.message || 'N/A').substring(0, 100)}${(scanData.content || '').length > 100 ? '...' : ''}</span></div>
          </div>
          
          <div class="section">
            <h2>🎯 Risk Assessment</h2>
            <div class="field"><span class="label">Risk Score:</span><span class="value risk-${scanData.riskScore > 70 ? 'high' : scanData.riskScore > 30 ? 'medium' : 'low'}">${scanData.riskScore}%</span></div>
            <div class="field"><span class="label">Classification:</span><span class="value">${scanData.classification || 'N/A'}</span></div>
            <div class="field"><span class="label">Confidence:</span><span class="value">${((scanData.confidence || 0.5) * 100).toFixed(1)}%</span></div>
          </div>
          
          <div class="section">
            <h2>📝 Analysis Explanation</h2>
            <p style="line-height: 1.6; color: #475569;">${scanData.explanation || 'No explanation available'}</p>
          </div>
          
          ${scanData.features ? `
          <div class="section">
            <h2>🔍 Features Analyzed</h2>
            ${Object.entries(scanData.features).slice(0, 8).map(([key, value]) => `
              <div class="field"><span class="label">${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span><span class="value">${typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}</span></div>
            `).join('')}
          </div>
          ` : ''}
          
          <div class="section">
            <h2>🛡️ Security Recommendation</h2>
            <p style="color: ${scanData.riskScore > 70 ? '#dc2626' : scanData.riskScore > 30 ? '#ed6c02' : '#2e7d32'}; font-weight: 600; padding: 12px; background: ${scanData.riskScore > 70 ? '#fee' : scanData.riskScore > 30 ? '#fff3e0' : '#e8f5e9'}; border-radius: 8px;">
              ${scanData.riskScore > 70 
                ? '🚫 DO NOT proceed. Report this immediately to security authorities.'
                : scanData.riskScore > 30
                ? '⚠️ Exercise caution. Verify before proceeding.'
                : '✅ Safe to proceed. Always remain vigilant.'}
            </p>
          </div>
          
          <div class="footer">
            <p>Generated by PhishGuard Security System • ${new Date().toLocaleDateString()}</p>
            <p style="color: #cbd5e1;">This is an automated security report. Please verify information independently.</p>
          </div>
        </body>
      </html>
    `;

    // For mobile, we'll use the existing download method with HTML content
    const fileName = `security_report_${scanData.id || Date.now()}.html`;
    const fileUri = FileSystem.documentDirectory + fileName;
    
    await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    return fileUri;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to generate PDF report' };
  }
};

// Download PDF Report
export const downloadPDFReport = async (scanId, type) => {
  try {
    const response = await api.get(`/reports/${type}/${scanId}/pdf`, {
      responseType: 'arraybuffer',
    });

    const fileName = `security_report_${scanId}.pdf`;
    const fileUri = FileSystem.documentDirectory + fileName;

    await FileSystem.writeAsStringAsync(fileUri, response.data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return fileUri;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to download PDF report' };
  }
};

// Download and Share PDF Report
export const downloadAndSharePDF = async (scanId, type) => {
  try {
    const fileUri = await downloadPDFReport(scanId, type);
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Security Report',
        UTI: 'com.adobe.pdf',
      });
    } else {
      throw new Error('Sharing is not available on this device');
    }
    
    return fileUri;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to share PDF' };
  }
};

export default api;