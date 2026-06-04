import React, { useState } from 'react';
import { scanURL, submitFeedback } from '../services/api';
import { validateURL } from '../utils/validators';
import { FaShieldAlt, FaDownload, FaInfoCircle, FaLink, FaExclamationTriangle, FaCopy, FaStar, FaRegStar, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { generatePDFReport } from '../services/pdfGenerator';

const URLScanner = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState({
    scanId: '',
    type: 'url',
    isAccurate: true,
    rating: 0,
    comments: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

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
    setShowFeedback(false);
    setFeedbackSubmitted(false);
    
    try {
      const response = await scanURL(url);
      setResult(response);
      setShowFeedback(true);
      // Set the scan ID for feedback
      setFeedback(prev => ({ ...prev, scanId: response.id }));
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

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    
    if (!feedback.scanId) {
      toast.error('Scan ID not found');
      return;
    }

    if (feedback.rating === 0) {
      toast.error('Please rate the detection accuracy');
      return;
    }

    setSubmitting(true);
    try {
      await submitFeedback(
        feedback.scanId,
        feedback.type,
        feedback.isAccurate,
        feedback.comments,
        feedback.rating
      );
      setFeedbackSubmitted(true);
      toast.success('Thank you for your feedback!');
      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackSubmitted(false);
      }, 3000);
    } catch (error) {
      toast.error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => setFeedback({ ...feedback, rating: star })}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '30px',
          transition: 'transform 0.2s',
          padding: '0 4px'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {star <= feedback.rating ? (
          <FaStar style={{ color: '#ffc107' }} />
        ) : (
          <FaRegStar style={{ color: '#ddd' }} />
        )}
      </button>
    ));
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

          {/* Feedback Section - Same as Feedback Page */}
          {showFeedback && !feedbackSubmitted && (
            <div className="card" style={{ marginTop: '24px', marginBottom: '24px' }}>
              <form onSubmit={handleFeedbackSubmit}>
                <div className="input-group">
                  <label className="label">Scan ID</label>
                  <input
                    type="text"
                    value={feedback.scanId}
                    disabled
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      background: '#f5f5f5'
                    }}
                  />
                  <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                    This Scan ID is automatically taken from your scan
                  </p>
                </div>

                <div className="input-group">
                  <label className="label">Was the detection accurate?</label>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <button
                      type="button"
                      onClick={() => setFeedback({ ...feedback, isAccurate: true })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        background: feedback.isAccurate === true ? '#e8f5e9' : '#f5f5f5',
                        border: feedback.isAccurate === true ? '2px solid #4caf50' : '2px solid transparent',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: feedback.isAccurate === true ? '#2e7d32' : '#666',
                        fontWeight: feedback.isAccurate === true ? '600' : '400'
                      }}
                    >
                      <FaThumbsUp />
                      <span>Yes, accurate</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedback({ ...feedback, isAccurate: false })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        background: feedback.isAccurate === false ? '#ffebee' : '#f5f5f5',
                        border: feedback.isAccurate === false ? '2px solid #f44336' : '2px solid transparent',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: feedback.isAccurate === false ? '#c62828' : '#666',
                        fontWeight: feedback.isAccurate === false ? '600' : '400'
                      }}
                    >
                      <FaThumbsDown />
                      <span>No, inaccurate</span>
                    </button>
                  </div>
                </div>

                <div className="input-group">
                  <label className="label">Rate the detection quality *</label>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {renderStars()}
                    {feedback.rating > 0 && (
                      <span style={{ marginLeft: '10px', color: '#666', fontSize: '14px' }}>
                        {feedback.rating === 5 ? 'Excellent!' : 
                         feedback.rating === 4 ? 'Good' : 
                         feedback.rating === 3 ? 'Average' : 
                         feedback.rating === 2 ? 'Poor' : 'Very Poor'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="input-group">
                  <label className="label" htmlFor="comments">
                    Additional Comments
                  </label>
                  <textarea
                    id="comments"
                    rows="4"
                    value={feedback.comments}
                    onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
                    placeholder="Tell us more about your experience..."
                    className="input-field"
                    style={{ resize: 'vertical' }}
                  />
                  <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                    {feedback.comments.length}/500 characters
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{ width: '100%' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </form>
            </div>
          )}

          {/* Thank You Message */}
          {feedbackSubmitted && (
            <div style={{
              marginTop: '24px',
              marginBottom: '24px',
              padding: '20px',
              background: '#e8f5e9',
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid #4caf50'
            }}>
              <FaThumbsUp style={{ fontSize: '40px', color: '#4caf50', marginBottom: '10px' }} />
              <h3 style={{ color: '#2e7d32', marginBottom: '8px' }}>Thank You for Your Feedback!</h3>
              <p style={{ color: '#666' }}>Your feedback helps us improve our detection accuracy.</p>
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

        .input-field {
          width: 100%;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s;
        }

        .input-field:focus {
          outline: none;
          border-color: #667eea;
        }

        .label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }

        .input-group {
          margin-bottom: 20px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default URLScanner;