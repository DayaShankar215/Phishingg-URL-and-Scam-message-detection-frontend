import React, { useState } from 'react';
import { submitFeedback } from '../services/api';
import { FaStar, FaRegStar, FaThumbsUp, FaThumbsDown, FaInfoCircle, FaCheckCircle, FaGift, FaChartBar } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Feedback = () => {
  const [feedback, setFeedback] = useState({
    scanId: '',
    type: 'url',
    isAccurate: true,
    rating: 0,
    comments: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!feedback.scanId) {
      toast.error('Please enter a scan ID');
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
        feedback.comments
      );
      setSubmitted(true);
      toast.success('Thank you for your feedback! 🎉');
      setTimeout(() => {
        setFeedback({
          scanId: '',
          type: 'url',
          isAccurate: true,
          rating: 0,
          comments: ''
        });
        setSubmitted(false);
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
          fontSize: '40px',
          transition: 'all 0.2s ease',
          transform: star <= feedback.rating ? 'scale(1.1)' : 'scale(1)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = star <= feedback.rating ? 'scale(1.1)' : 'scale(1)'}
      >
        {star <= feedback.rating ? (
          <FaStar style={{ color: '#ffc107', filter: 'drop-shadow(0 0 4px rgba(255,193,7,0.5))' }} />
        ) : (
          <FaRegStar style={{ color: '#cbd5e1' }} />
        )}
      </button>
    ));
  };

  if (submitted) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '80px 24px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          background: 'linear-gradient(135deg, #10b98120 0%, #05966920 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <FaCheckCircle style={{ fontSize: '60px', color: '#10b981' }} />
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', marginBottom: '12px' }}>
          Thank You!
        </h2>
        <p style={{ fontSize: '16px', color: '#64748b' }}>
          Your feedback helps us improve our AI models and make the internet safer for everyone.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
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
          <FaGift style={{ color: '#667eea' }} />
          <span style={{ fontWeight: '600', color: '#667eea' }}>Share Your Experience</span>
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
          We Value Your Feedback
        </h1>
        <p style={{ fontSize: '18px', color: '#64748b' }}>
          Your insights help us improve detection accuracy and protect more users
        </p>
      </div>

      {/* Feedback Form Card */}
      <div style={{
        background: 'white',
        borderRadius: '32px',
        padding: '40px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        marginBottom: '32px'
      }}>
        <form onSubmit={handleSubmit}>
          {/* Scan ID Field */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#1e293b',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Scan ID *
            </label>
            <input
              type="text"
              value={feedback.scanId}
              onChange={(e) => setFeedback({ ...feedback, scanId: e.target.value })}
              placeholder="e.g., 12345"
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '16px',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
              You can find the Scan ID in your scan history
            </p>
          </div>

          {/* Scan Type */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#1e293b',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Scan Type
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                type="button"
                onClick={() => setFeedback({ ...feedback, type: 'url' })}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: feedback.type === 'url' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8fafc',
                  color: feedback.type === 'url' ? 'white' : '#64748b',
                  border: 'none',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>🔗</span>
                URL Scan
              </button>
              <button
                type="button"
                onClick={() => setFeedback({ ...feedback, type: 'message' })}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: feedback.type === 'message' ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : '#f8fafc',
                  color: feedback.type === 'message' ? 'white' : '#64748b',
                  border: 'none',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>💬</span>
                Message Scan
              </button>
            </div>
          </div>

          {/* Detection Accuracy */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block',
              marginBottom: '12px',
              fontWeight: '600',
              color: '#1e293b',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Was the detection accurate?
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                type="button"
                onClick={() => setFeedback({ ...feedback, isAccurate: true })}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: feedback.isAccurate === true ? '#10b981' : '#f8fafc',
                  color: feedback.isAccurate === true ? 'white' : '#64748b',
                  border: 'none',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <FaThumbsUp />
                Yes, accurate
              </button>
              <button
                type="button"
                onClick={() => setFeedback({ ...feedback, isAccurate: false })}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: feedback.isAccurate === false ? '#ef4444' : '#f8fafc',
                  color: feedback.isAccurate === false ? 'white' : '#64748b',
                  border: 'none',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <FaThumbsDown />
                No, inaccurate
              </button>
            </div>
          </div>

          {/* Rating Stars */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block',
              marginBottom: '12px',
              fontWeight: '600',
              color: '#1e293b',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Rate Detection Quality *
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {renderStars()}
              {feedback.rating > 0 && (
                <span style={{
                  marginLeft: '16px',
                  padding: '6px 12px',
                  background: '#f1f5f9',
                  borderRadius: '20px',
                  fontSize: '14px',
                  color: '#64748b'
                }}>
                  {feedback.rating === 5 ? '🌟 Excellent!' :
                   feedback.rating === 4 ? '😊 Good' :
                   feedback.rating === 3 ? '😐 Average' :
                   feedback.rating === 2 ? '😕 Poor' : '😞 Very Poor'}
                </span>
              )}
            </div>
          </div>

          {/* Comments */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#1e293b',
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Additional Comments
            </label>
            <textarea
              rows="5"
              value={feedback.comments}
              onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
              placeholder="Tell us more about your experience... What could we improve?"
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e2e8f0',
                borderRadius: '16px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', textAlign: 'right' }}>
              {feedback.comments.length}/500 characters
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '18px',
              border: 'none',
              borderRadius: '16px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {submitting ? 'Submitting Feedback...' : 'Submit Feedback'}
          </button>
        </form>
      </div>

      {/* Why Feedback Matters */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea10 0%, #764ba210 100%)',
        borderRadius: '24px',
        padding: '32px',
        border: '1px solid #667eea20'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FaChartBar style={{ fontSize: '30px', color: 'white' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
              Why Your Feedback Matters
            </h3>
            <p style={{ color: '#475569', lineHeight: '1.6', marginBottom: '16px' }}>
              Your feedback is crucial for improving our AI detection models. When you report inaccurate detections, 
              we retrain our models to become more accurate. Every submission helps protect thousands of users 
              from potential cyber threats.
            </p>
            <div style={{
              display: 'flex',
              gap: '20px',
              flexWrap: 'wrap',
              marginTop: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Improves Model Accuracy</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', background: '#667eea', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Enhances User Protection</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', background: '#f59e0b', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Reduces False Positives</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Counter */}
      <div style={{
        marginTop: '32px',
        display: 'flex',
        justifyContent: 'center',
        gap: '40px',
        flexWrap: 'wrap',
        padding: '24px',
        background: 'white',
        borderRadius: '24px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#667eea' }}>10K+</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Users Protected</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#f093fb' }}>95%</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Detection Rate</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#10b981' }}>24/7</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Real-time Scanning</div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;