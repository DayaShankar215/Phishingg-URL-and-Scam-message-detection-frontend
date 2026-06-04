import React, { useState } from 'react';
import { scanMessage } from '../services/api';
import { validateMessage } from '../utils/validators';
import { FaEnvelope,  FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaCopy, FaWhatsapp, FaSms, FaMailBulk } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { generatePDFReport } from '../services/pdfGenerator';

const MessageScanner = () => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [charCount, setCharCount] = useState(0);

  const handleScan = async (e) => {
    e.preventDefault();
    
    const validation = validateMessage(message);
    if (!validation.isValid) {
      toast.error(validation.error);
      setError(validation.error);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await scanMessage(message);
      setResult(response);
      toast.success('Message analysis completed!');
    } catch (err) {
      const errorMsg = err.message || 'Failed to scan message';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageChange = (e) => {
    const text = e.target.value;
    setMessage(text);
    setCharCount(text.length);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message);
    toast.success('Message copied to clipboard!');
  };

  const getRiskColor = (score) => {
    if (score > 70) return { bg: '#ef4444', light: '#fee', text: '#dc2626', icon: '🚨' };
    if (score > 30) return { bg: '#f59e0b', light: '#fff3e0', text: '#ed6c02', icon: '⚠️' };
    return { bg: '#10b981', light: '#e8f5e9', text: '#2e7d32', icon: '✅' };
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
          background: 'linear-gradient(135deg, #f093fb20 0%, #f5576c20 100%)',
          padding: '8px 20px',
          borderRadius: '100px',
          marginBottom: '20px'
        }}>
          <FaWhatsapp style={{ color: '#f5576c' }} />
          <span style={{ fontWeight: '600', color: '#f5576c' }}>SMS & Message Security</span>
        </div>
        <h1 style={{
          fontSize: '48px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          marginBottom: '16px'
        }}>
          Scam Message Detector
        </h1>
        <p style={{ fontSize: '18px', color: '#64748b', maxWidth: '600px', margin: '0 auto' }}>
          AI-powered scam detection for SMS, WhatsApp, and instant messages
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
              Paste Suspicious Message
            </label>
            <div style={{ position: 'relative' }}>
              <textarea
                rows="8"
                value={message}
                onChange={handleMessageChange}
                placeholder="Paste the suspicious message here...&#10;&#10;Example:&#10;'Congratulations! You've won $1000! Click here to claim your prize: http://bit.ly/fake-link'"
                style={{
                  width: '100%',
                  padding: '20px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '20px',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  lineHeight: '1.6'
                }}
                onFocus={(e) => e.target.style.borderColor = '#f5576c'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                disabled={loading}
              />
              {message && (
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  style={{
                    position: 'absolute',
                    bottom: '16px',
                    right: '16px',
                    background: '#f8fafc',
                    border: 'none',
                    padding: '8px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#64748b'
                  }}
                >
                  <FaCopy />
                </button>
              )}
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '12px',
              fontSize: '12px',
              color: '#94a3b8'
            }}>
              <span>Characters: {charCount}</span>
              <span>Minimum 10 characters recommended</span>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              padding: '18px',
              border: 'none',
              borderRadius: '16px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {loading ? (
              <>
                <div className="spinner-small"></div>
                <span>Analyzing Message...</span>
              </>
            ) : (
              <>
                <span>Analyze Message</span>
              </>
            )}
          </button>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', color: '#64748b', marginBottom: '8px' }}>Scam Risk Score</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                  <span style={{ fontSize: '48px', fontWeight: '800', color: riskColor.text }}>
                    {Math.round(result.riskScore)}%
                  </span>
                  <span style={{ fontSize: '32px' }}>{riskColor.icon}</span>
                </div>
              </div>
              <button
                onClick={() => generatePDFReport(result, 'message')}
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
                ? '🚨 HIGH RISK: This is likely a scam! Do not respond or click any links.'
                : result.riskScore > 30
                ? '⚠️ MEDIUM RISK: This message shows scam indicators. Exercise caution.'
                : '✅ LOW RISK: This message appears legitimate.'}
            </p>
          </div>

          {/* Message Content Display */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaEnvelope style={{ color: '#f5576c' }} />
              Analyzed Message
            </h3>
            <div style={{
              background: '#f8fafc',
              padding: '20px',
              borderRadius: '16px',
              fontStyle: 'italic',
              color: '#475569',
              lineHeight: '1.6',
              borderLeft: `4px solid ${riskColor.bg}`
            }}>
              "{result.message || result.content}"
            </div>
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
                  background: 'linear-gradient(135deg, #f093fb20 0%, #f5576c20 100%)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaInfoCircle style={{ color: '#f5576c', fontSize: '24px' }} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>AI Classification</h3>
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

            {/* Red Flags Card */}
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
                  background: 'linear-gradient(135deg, #fa709a20 0%, #fee14020 100%)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FaExclamationTriangle style={{ color: '#fa709a', fontSize: '24px' }} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Red Flags Detected</h3>
              </div>
              <p style={{ color: '#475569', lineHeight: '1.6' }}>{result.explanation}</p>
            </div>
          </div>

          {/* Message Features */}
          {result.features && (
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>
                Message Analysis Details
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
                  <span style={{ color: '#64748b' }}>Message Length:</span>
                  <strong>{result.features.length} chars</strong>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '12px'
                }}>
                  <span style={{ color: '#64748b' }}>Uppercase Ratio:</span>
                  <strong>{(result.features.uppercaseRatio * 100).toFixed(1)}%</strong>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '12px'
                }}>
                  <span style={{ color: '#64748b' }}>Contains URL:</span>
                  <strong style={{ color: result.features.hasURL ? '#ef4444' : '#10b981' }}>
                    {result.features.hasURL ? '⚠️ Yes' : '✓ No'}
                  </strong>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '12px'
                }}>
                  <span style={{ color: '#64748b' }}>Contains Phone:</span>
                  <strong style={{ color: result.features.hasPhone ? '#ef4444' : '#10b981' }}>
                    {result.features.hasPhone ? '⚠️ Yes' : '✓ No'}
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
                  <strong style={{ color: result.features.suspiciousKeywordCount > 0 ? '#ef4444' : '#10b981' }}>
                    {result.features.suspiciousKeywordCount} found
                  </strong>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '12px'
                }}>
                  <span style={{ color: '#64748b' }}>Special Symbols:</span>
                  <strong>{result.features.specialCharCount}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Detected URLs */}
          {result.extractedUrls && result.extractedUrls.length > 0 && (
            <div style={{
              background: '#fff3e0',
              borderRadius: '20px',
              padding: '24px',
              marginBottom: '24px',
              border: '1px solid #ffe0b2'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#ed6c02', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaExclamationTriangle />
                Suspicious URLs Detected
              </h3>
              {result.extractedUrls.map((url, index) => (
                <div key={index} style={{
                  padding: '12px',
                  background: 'white',
                  borderRadius: '12px',
                  marginBottom: '8px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  wordBreak: 'break-all'
                }}>
                  🔗 {url}
                </div>
              ))}
              <p style={{ fontSize: '13px', color: '#ed6c02', marginTop: '12px' }}>
                These URLs have been automatically analyzed and contributed to the risk score.
              </p>
            </div>
          )}

          {/* Final Recommendation */}
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
                ? '🚫 DO NOT engage with this message. Block the sender immediately. Never click links, reply, or call any numbers provided. Report this as spam to your carrier.'
                : result.riskScore > 30
                ? '⚠️ Be cautious. Do not share personal information, click suspicious links, or call unknown numbers. Verify the sender through official channels.'
                : '✓ This message appears safe. However, always verify unexpected requests, especially those asking for personal information or money transfers.'}
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

export default MessageScanner;