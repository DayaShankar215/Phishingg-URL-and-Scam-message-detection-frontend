import React, { useState } from 'react';
import { scanURL } from '../services/api';
import { validateURL } from '../utils/validators';
import { FaShieldAlt, FaDownload, FaInfoCircle, FaLink, FaExclamationTriangle, FaCheckCircle, FaCopy, FaExternalLinkAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { generatePDFReport } from '../services/pdfGenerator';

const URLScanner = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleScan = async (e) => {
    e.preventDefault();
    
    const validation = validateURL(url);
    if (!validation.isValid) {
      toast.error(validation.error);
      setError(validation.error);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await scanURL(url);
      setResult(response);
      toast.success('Scan completed successfully!');
    } catch (err) {
      const errorMsg = err.message || 'Failed to scan URL';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (result) {
      try {
        await generatePDFReport(result, 'url');
        toast.success('PDF report downloaded successfully!');
      } catch (error) {
        toast.error('Failed to generate PDF report');
      }
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('URL copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const getRiskColor = (score) => {
    if (score > 70) return { bg: '#ef4444', light: '#fee', text: '#dc2626' };
    if (score > 30) return { bg: '#f59e0b', light: '#fff3e0', text: '#ed6c02' };
    return { bg: '#10b981', light: '#e8f5e9', text: '#2e7d32' };
  };

  const riskColor = result ? getRiskColor(result.riskScore) : null;

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 24px',
      minHeight: 'calc(100vh - 200px)'
    }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
          padding: '8px 20px',
          borderRadius: '100px',
          marginBottom: '20px'
        }}>
          <FaShieldAlt style={{ color: '#667eea' }} />
          <span style={{ fontWeight: '600', color: '#667eea' }}>AI-Powered Security Scanner</span>
        </div>
        <h1 style={{
          fontSize: '48px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          marginBottom: '16px'
        }}>
          URL Security Scanner
        </h1>
        <p style={{ fontSize: '18px', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
          Instantly detect phishing URLs, malicious links, and suspicious websites using advanced machine learning
        </p>
      </div>

      {/* Input Card */}
      <div style={{
        background: 'white',
        borderRadius: '32px',
        padding: '32px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        marginBottom: '32px'
      }}>
        <form onSubmit={handleScan}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '12px',
              fontWeight: '600',
              color: '#1e293b',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Enter Website URL
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <FaLink style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8'
                }} />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com or suspect-website.com"
                  style={{
                    width: '100%',
                    padding: '16px 16px 16px 48px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '16px',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  disabled={loading}
                />
                {url && (
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: copied ? '#10b981' : '#94a3b8'
                    }}
                  >
                    <FaCopy />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: loading ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '16px 32px',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {loading ? (
                  <>
                    <div className="spinner-small"></div>
                    <span>Scanning...</span>
                  </>
                ) : (
                  <>
                    <FaShieldAlt />
                    <span>Scan URL</span>
                  </>
                )}
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '12px' }}>
              Supports HTTP, HTTPS, and all standard URL formats
            </p>
          </div>
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          background: '#fee',
          borderLeft: '4px solid #ef4444',
          padding: '16px 20px',
          borderRadius: '12px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <FaExclamationTriangle style={{ color: '#ef4444', fontSize: '20px' }} />
          <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div style={{ animation: 'slideUp 0.5s ease-out' }}>
          {/* Risk Score Card */}
          <div style={{
            background: `linear-gradient(135deg, ${riskColor.light} 0%, white 100%)`,
            borderRadius: '24px',
            padding: '32px',
            marginBottom: '24px',
            border: `1px solid ${riskColor.bg}40`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '18px', color: '#64748b', marginBottom: '8px' }}>Risk Assessment</h3>
                <div style={{ fontSize: '48px', fontWeight: '800', color: riskColor.text }}>
                  {Math.round(result.riskScore)}%
                </div>
              </div>
              <button
                onClick={handleDownloadPDF}
                style={{
                  background: 'white',
                  border: `2px solid ${riskColor.bg}`,
                  padding: '12px 24px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '600',
                  color: riskColor.text,
                  transition: 'all 0.3s ease'
                }}
              >
                <FaDownload />
                <span>Download Report</span>
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                width: '100%',
                height: '12px',
                background: '#e2e8f0',
                borderRadius: '6px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${result.riskScore}%`,
                  height: '100%',
                  background: riskColor.bg,
                  transition: 'width 1s ease'
                }}></div>
              </div>
            </div>

            <p style={{ fontSize: '16px', color: riskColor.text, fontWeight: '500' }}>
              {result.riskScore > 70 
                ? '⚠️ HIGH RISK: This website appears to be a phishing site! Do not proceed.'
                : result.riskScore > 30
                ? '⚠️ MEDIUM RISK: This website shows suspicious characteristics. Exercise caution.'
                : '✅ LOW RISK: This website appears to be safe.'}
            </p>
          </div>

          {/* Detailed Analysis Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '24px',
            marginBottom: '24px'
          }}>
            {/* Classification Card */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaInfoCircle style={{ color: '#667eea', fontSize: '24px' }} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Classification</h3>
              </div>
              <p style={{ color: '#475569', lineHeight: '1.6', marginBottom: '16px' }}>{result.classification}</p>
              <div style={{
                display: 'inline-block',
                padding: '6px 12px',
                background: `${riskColor.bg}20`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: riskColor.text
              }}>
                Confidence: {((result.confidence || 0.5) * 100).toFixed(1)}%
              </div>
            </div>

            {/* Explanation Card */}
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(135deg, #f093fb20 0%, #f5576c20 100%)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaExclamationTriangle style={{ color: '#f5576c', fontSize: '24px' }} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Why It Was Flagged</h3>
              </div>
              <p style={{ color: '#475569', lineHeight: '1.6' }}>{result.explanation}</p>
            </div>
          </div>

          {/* Features Analyzed */}
          {result.features && (
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>
                Technical Analysis
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '12px'
                }}>
                  <span style={{ color: '#64748b' }}>URL Length:</span>
                  <strong style={{ color: '#1e293b' }}>{result.features.urlLength}</strong>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '12px'
                }}>
                  <span style={{ color: '#64748b' }}>HTTPS Usage:</span>
                  <strong style={{ color: result.features.hasHTTPS ? '#10b981' : '#ef4444' }}>
                    {result.features.hasHTTPS ? '✓ Secure' : '✗ Not Secure'}
                  </strong>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '12px'
                }}>
                  <span style={{ color: '#64748b' }}>Special Characters:</span>
                  <strong>{result.features.specialChars}</strong>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '12px'
                }}>
                  <span style={{ color: '#64748b' }}>IP Address:</span>
                  <strong style={{ color: result.features.hasIP ? '#ef4444' : '#10b981' }}>
                    {result.features.hasIP ? 'Detected' : 'Not Detected'}
                  </strong>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '12px'
                }}>
                  <span style={{ color: '#64748b' }}>Suspicious Keywords:</span>
                  <strong style={{ color: result.features.hasSuspiciousKeywords ? '#ef4444' : '#10b981' }}>
                    {result.features.hasSuspiciousKeywords ? 'Found' : 'Not Found'}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Recommendation */}
          <div style={{
            background: `linear-gradient(135deg, ${riskColor.bg}15 0%, white 100%)`,
            borderRadius: '20px',
            padding: '24px',
            border: `2px solid ${riskColor.bg}30`
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: riskColor.text, marginBottom: '12px' }}>
              Security Recommendation
            </h3>
            <p style={{ color: '#475569', lineHeight: '1.6' }}>
              {result.riskScore > 70
                ? '🚫 DO NOT proceed to this website. Report this URL to security authorities immediately. This is a confirmed phishing attempt designed to steal your credentials.'
                : result.riskScore > 30
                ? '⚠️ Exercise extreme caution. Verify the website\'s authenticity through official channels before entering any personal information or credentials.'
                : '✓ You can safely proceed. However, always verify the URL matches the official website before entering sensitive information.'}
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .spinner-small {
          width: 20px;
          height: 20px;
          border: 2px solid white;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default URLScanner;