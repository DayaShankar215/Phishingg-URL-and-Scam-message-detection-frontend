// src/services/api.js
import axios from 'axios';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';

// ============================================
// CONDITIONALLY IMPORT MEDIA LIBRARY
// ============================================
let MediaLibrary = null;
if (Platform.OS !== 'web') {
  try {
    MediaLibrary = require('expo-media-library');
  } catch (error) {
    console.log('⚠️ MediaLibrary not available:', error.message);
  }
}

// ============================================
// API CONFIGURATION
// ============================================

// CHANGE THIS TO YOUR COMPUTER'S IP ADDRESS
const API_BASE_URL = 'http://192.168.1.78:8080/api';

console.log('🚀 API Base URL:', API_BASE_URL);
console.log('📱 Platform:', Platform.OS);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  config => {
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  response => {
    console.log(`📥 ${response.status} ${response.config.url}`);
    return response;
  },
  error => {
    console.error('❌ API Error:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      throw { message: 'Request timeout. Please check your connection.' };
    }
    if (error.message === 'Network Error') {
      throw { 
        message: 'Cannot connect to server',
        details: `Failed to reach ${API_BASE_URL}\n\nPlease check:\n✅ Backend is running\n✅ Phone/Computer on same network\n✅ Firewall allows port 8080\n✅ IP address is correct`
      };
    }
    throw error.response?.data || { message: 'An unexpected error occurred' };
  }
);

// ============================================
// API FUNCTIONS
// ============================================

export const scanURL = async (url) => {
  try {
    const response = await api.post('/scan/url', { url });
    return response.data;
  } catch (error) {
    throw error.data || error;
  }
};

export const scanMessage = async (message) => {
  try {
    const response = await api.post('/scan/message', { message });
    return response.data;
  } catch (error) {
    throw error.data || error;
  }
};

export const getScanHistory = async (type = null) => {
  try {
    const params = type ? { type } : {};
    const response = await api.get('/scans', { params });
    return response.data;
  } catch (error) {
    throw error.data || error;
  }
};

export const getScanById = async (id, type) => {
  try {
    const response = await api.get(`/scans/${type}/${id}`);
    return response.data;
  } catch (error) {
    throw error.data || error;
  }
};

export const getDashboardStats = async () => {
  try {
    const response = await api.get('/dashboard/stats');
    return response.data;
  } catch (error) {
    throw error.data || error;
  }
};

export const submitFeedback = async (scanId, type, isAccurate, comments, rating = null) => {
  try {
    const body = { 
      scanId, 
      type, 
      isAccurate, 
      comments,
      rating: rating || (isAccurate ? 5 : 1)
    };
    const response = await api.post('/feedback', body);
    return response.data;
  } catch (error) {
    throw error.data || error;
  }
};

// ============================================
// PDF REPORT - FIXED FOR EXPO GO
// ============================================

// Download PDF Report from backend
export const downloadPDFReport = async (scanId, type) => {
  try {
    console.log(`📥 Downloading PDF for ${type} with ID: ${scanId}`);
    
    const response = await api.get(`/reports/${type}/${scanId}/pdf`, {
      responseType: 'arraybuffer',
    });

    const timestamp = new Date().getTime();
    const fileName = `security_report_${scanId}_${timestamp}.pdf`;
    
    let fileUri;
    
    // ===== WEB =====
    if (Platform.OS === 'web') {
      const blob = new Blob([response.data], { type: 'application/pdf' });
      fileUri = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = fileUri;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('🌐 PDF downloaded on Web');
      return { fileUri, fileName, size: response.data.byteLength };
    }
    
    // ===== ANDROID & iOS =====
    // Use cache directory for Expo Go (more reliable)
    const cacheDir = FileSystem.cacheDirectory;
    const docDir = FileSystem.documentDirectory;
    
    // Try document directory first, fallback to cache
    try {
      fileUri = docDir + fileName;
      console.log('💾 Saving PDF to document directory:', fileUri);
    } catch (e) {
      fileUri = cacheDir + fileName;
      console.log('💾 Saving PDF to cache directory:', fileUri);
    }

    // Convert arraybuffer to base64
    const base64Data = btoa(
      new Uint8Array(response.data).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    console.log('📄 File saved, size:', fileInfo.size, 'bytes');
    
    if (!fileInfo.exists || fileInfo.size === 0) {
      throw new Error('PDF file was not created successfully');
    }

    return { fileUri, fileName, size: fileInfo.size };
  } catch (error) {
    console.error('❌ PDF Download Error:', error);
    throw error;
  }
};

// ============================================
// SAVE AND SHARE PDF - EXPO GO FRIENDLY
// ============================================

export const downloadAndSharePDF = async (scanId, type) => {
  try {
    const result = await downloadPDFReport(scanId, type);
    
    // For web, download is already handled
    if (Platform.OS === 'web') {
      return result;
    }
    
    // Try to save to MediaLibrary if available (not in Expo Go)
    if (MediaLibrary) {
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          const asset = await MediaLibrary.createAssetAsync(result.fileUri);
          const albumName = 'PhishGuard Reports';
          await MediaLibrary.createAlbumAsync(albumName, asset, false);
          console.log('✅ PDF saved to device storage');
          result.saved = true;
        }
      } catch (mediaError) {
        console.log('⚠️ Could not save to MediaLibrary:', mediaError.message);
        result.saved = false;
      }
    } else {
      // In Expo Go, we can't save to MediaLibrary, but file is in app directory
      console.log('📁 PDF saved in app directory:', result.fileUri);
      result.saved = false;
    }
    
    // Share the PDF
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(result.fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Security Report',
        UTI: 'com.adobe.pdf',
      });
      console.log('✅ PDF shared successfully');
    } else {
      console.log('📁 Sharing not available, file saved at:', result.fileUri);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Share Error:', error);
    throw error;
  }
};

// ============================================
// GENERATE LOCAL PDF (Fallback)
// ============================================

export const generatePDFReport = async (scanData, type) => {
  try {
    console.log('📄 Generating local PDF report...');
    
    const htmlContent = generateHTMLReport(scanData, type);
    const timestamp = new Date().getTime();
    const fileName = `security_report_${scanData.id || timestamp}_${timestamp}.html`;
    
    let fileUri;
    
    // ===== WEB =====
    if (Platform.OS === 'web') {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      fileUri = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = fileUri;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return { fileUri, fileName, size: htmlContent.length };
    }
    
    // ===== ANDROID & iOS =====
    const docDir = FileSystem.documentDirectory;
    fileUri = docDir + fileName;
    await FileSystem.writeAsStringAsync(fileUri, htmlContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    console.log('📄 Local report saved, size:', fileInfo.size, 'bytes');
    
    return { fileUri, fileName, size: fileInfo.size };
  } catch (error) {
    console.error('❌ Local PDF generation failed:', error);
    throw { message: 'Failed to generate local report' };
  }
};

// ============================================
// HELPER: GENERATE HTML REPORT
// ============================================

const generateHTMLReport = (scanData, type) => {
  const riskColor = scanData.riskScore > 70 ? '#dc2626' : scanData.riskScore > 30 ? '#ed6c02' : '#2e7d32';
  const riskBg = scanData.riskScore > 70 ? '#fee' : scanData.riskScore > 30 ? '#fff3e0' : '#e8f5e9';
  const riskText = scanData.riskScore > 70 
    ? '🚫 DO NOT proceed. Report this immediately.' 
    : scanData.riskScore > 30 
    ? '⚠️ Exercise caution. Verify before proceeding.' 
    : '✅ Safe to proceed. Always remain vigilant.';

  const content = scanData.content || scanData.message || 'N/A';
  const explanation = scanData.explanation || 'No explanation available';
  const classification = scanData.classification || scanData.result || 'N/A';
  const confidence = ((scanData.confidence || 0.5) * 100).toFixed(1);

  let featuresHtml = '';
  if (scanData.features) {
    featuresHtml = Object.entries(scanData.features)
      .slice(0, 8)
      .map(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;
        return `<div class="field"><span class="label">${label}:</span><span class="value">${displayValue}</span></div>`;
      })
      .join('');
  }

  let urlsHtml = '';
  if (scanData.extractedUrls && scanData.extractedUrls.length > 0) {
    urlsHtml = `
      <div class="section">
        <h2>🔗 Extracted URLs</h2>
        ${scanData.extractedUrls.map(url => 
          `<div class="field"><span class="value" style="color: #dc2626;">${url}</span></div>`
        ).join('')}
      </div>
    `;
  }

  return `
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 30px; border-radius: 12px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .header p { margin: 8px 0 0; opacity: 0.9; }
          .section { margin: 20px 0; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; }
          .section h2 { color: #667eea; margin-top: 0; font-size: 18px; }
          .field { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
          .field:last-child { border-bottom: none; }
          .label { color: #64748b; }
          .value { font-weight: 600; color: #1e293b; }
          .risk-box { padding: 16px; border-radius: 8px; margin: 16px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
          .badge-high { background: #fee2e2; color: #dc2626; }
          .badge-medium { background: #fef3c7; color: #d97706; }
          .badge-low { background: #dcfce7; color: #16a34a; }
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
          <div class="field"><span class="label">Content:</span><span class="value" style="word-break: break-all;">${content.substring(0, 200)}${content.length > 200 ? '...' : ''}</span></div>
        </div>
        
        <div class="section">
          <h2>🎯 Risk Assessment</h2>
          <div class="field"><span class="label">Risk Score:</span><span class="value" style="color: ${riskColor}; font-size: 20px;">${scanData.riskScore || 0}%</span></div>
          <div class="field"><span class="label">Classification:</span><span class="value"><span class="badge badge-${scanData.riskScore > 70 ? 'high' : scanData.riskScore > 30 ? 'medium' : 'low'}">${classification}</span></span></div>
          <div class="field"><span class="label">Confidence:</span><span class="value">${confidence}%</span></div>
          <div class="risk-box" style="background: ${riskBg}; color: ${riskColor};">
            ${riskText}
          </div>
        </div>
        
        <div class="section">
          <h2>📝 Analysis Explanation</h2>
          <p style="line-height: 1.6; color: #475569;">${explanation}</p>
        </div>
        
        ${featuresHtml ? `
        <div class="section">
          <h2>🔍 Features Analyzed</h2>
          ${featuresHtml}
        </div>
        ` : ''}
        
        ${urlsHtml}
        
        <div class="section">
          <h2>🛡️ Security Recommendation</h2>
          <p style="font-weight: 600; padding: 12px; background: ${riskBg}; color: ${riskColor}; border-radius: 8px;">
            ${riskText}
          </p>
        </div>
        
        <div class="footer">
          <p>Generated by PhishGuard Security System • ${new Date().toLocaleDateString()}</p>
          <p style="color: #cbd5e1;">This is an automated security report. Please verify information independently.</p>
        </div>
      </body>
    </html>
  `;
};

// ============================================
// HISTORY MANAGEMENT
// ============================================

export const clearScanHistory = async () => {
  try {
    const response = await api.delete("/scans/clear");
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw { message: error.message || "Failed to clear scan history" };
  }
};

export const deleteScanById = async (id, type) => {
  try {
    const response = await api.delete(`/scans/${type}/${id}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw { message: error.message || "Failed to delete scan" };
  }
};

export const deleteMultipleScans = async (ids, type) => {
  try {
    const response = await api.delete("/scans/bulk", { 
      data: { ids, type } 
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data;
    }
    throw { message: error.message || "Failed to delete scans" };
  }
};

export default api;