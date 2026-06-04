import React, { useState, useEffect } from 'react';
import { getScanHistory, getScanById, downloadPDFReport } from '../services/api';
import RiskBadge from '../components/common/RiskBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate, truncateText } from '../utils/formatters';
import { FaSearch, FaDownload, FaFilter, FaEye, FaChartLine, FaCalendar, FaShieldAlt, FaLink, FaEnvelope } from 'react-icons/fa';
import toast from 'react-hot-toast';

const History = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScan, setSelectedScan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({ total: 0, url: 0, message: 0, avgRisk: 0 });

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  useEffect(() => {
    calculateStats();
  }, [scans]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getScanHistory(filter === 'all' ? null : filter);
      setScans(data);
    } catch (error) {
      toast.error('Failed to load scan history');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = scans.length;
    const url = scans.filter(s => s.type === 'url').length;
    const message = scans.filter(s => s.type === 'message').length;
    const avgRisk = scans.reduce((sum, s) => sum + s.riskScore, 0) / total || 0;
    setStats({ total, url, message, avgRisk });
  };

  const handleViewDetails = async (id, type) => {
    try {
      const scan = await getScanById(id, type);
      setSelectedScan(scan);
      setShowModal(true);
    } catch (error) {
      toast.error('Failed to load scan details');
    }
  };

  const handleDownloadPDF = async (id, type) => {
    try {
      const response = await downloadPDFReport(id, type);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security_report_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('PDF report downloaded!');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const filteredScans = scans.filter(scan => 
    scan.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    scan.id?.toString().includes(searchTerm)
  );

  if (loading) {
    return <LoadingSpinner text="Loading security history..." />;
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Header Stats */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            marginBottom: '12px'
          }}>
            Scan History
          </h1>
          <p style={{ fontSize: '18px', color: '#64748b' }}>
            Track and review all your security scans
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '20px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
          }}>
            <FaChartLine style={{ fontSize: '32px', color: '#667eea', marginBottom: '12px' }} />
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b' }}>{stats.total}</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Total Scans</div>
          </div>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '20px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
          }}>
            <FaLink style={{ fontSize: '32px', color: '#3b82f6', marginBottom: '12px' }} />
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b' }}>{stats.url}</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>URL Scans</div>
          </div>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '20px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
          }}>
            <FaEnvelope style={{ fontSize: '32px', color: '#f5576c', marginBottom: '12px' }} />
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b' }}>{stats.message}</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Message Scans</div>
          </div>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '20px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
          }}>
            <FaShieldAlt style={{ fontSize: '32px', color: '#10b981', marginBottom: '12px' }} />
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b' }}>{stats.avgRisk.toFixed(1)}%</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Avg Risk Score</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '10px 24px',
              background: filter === 'all' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
              color: filter === 'all' ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
          >
            All Scans
          </button>
          <button
            onClick={() => setFilter('url')}
            style={{
              padding: '10px 24px',
              background: filter === 'url' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'white',
              color: filter === 'url' ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            URL Scans
          </button>
          <button
            onClick={() => setFilter('message')}
            style={{
              padding: '10px 24px',
              background: filter === 'message' ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 'white',
              color: filter === 'message' ? 'white' : '#64748b',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Message Scans
          </button>
        </div>

        <div style={{ position: 'relative', width: '300px' }}>
          <FaSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by ID or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 48px',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Scans Table */}
      <div style={{
        background: 'white',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '20px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>ID</th>
                <th style={{ padding: '20px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Type</th>
                <th style={{ padding: '20px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Content</th>
                <th style={{ padding: '20px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Risk Score</th>
                <th style={{ padding: '20px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Date</th>
                <th style={{ padding: '20px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredScans.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '80px', color: '#94a3b8' }}>
                    <FaShieldAlt style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
                    <p>No scans found. Start scanning to see results here.</p>
                  </td>
                </tr>
              ) : (
                filteredScans.map((scan) => (
                  <tr key={scan.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.3s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                    <td style={{ padding: '16px 20px', fontWeight: '600', color: '#667eea' }}>#{scan.id}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: scan.type === 'url' ? '#e3f2fd' : '#f3e5f5',
                        color: scan.type === 'url' ? '#1976d2' : '#7b1fa2'
                      }}>
                        {scan.type === 'url' ? <FaLink size={12} /> : <FaEnvelope size={12} />}
                        {scan.type === 'url' ? 'URL' : 'Message'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', maxWidth: '400px' }}>
                      <div style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: '#475569'
                      }} title={scan.content}>
                        {truncateText(scan.content, 60)}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flex: 1, width: '100px' }}>
                          <div style={{
                            width: '100%',
                            height: '6px',
                            background: '#e2e8f0',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${scan.riskScore}%`,
                              height: '100%',
                              background: scan.riskScore > 70 ? '#ef4444' : scan.riskScore > 30 ? '#f59e0b' : '#10b981'
                            }}></div>
                          </div>
                        </div>
                        <span style={{ fontWeight: '600', minWidth: '45px' }}>{scan.riskScore}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaCalendar size={12} />
                        {formatDate(scan.date)}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={() => handleViewDetails(scan.id, scan.type)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#667eea',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '8px',
                            transition: 'background 0.3s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(scan.id, scan.type)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '8px',
                            transition: 'background 0.3s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <FaDownload />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showModal && selectedScan && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '32px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '85vh',
              overflow: 'auto',
              position: 'relative',
              animation: 'slideUp 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              position: 'sticky',
              top: 0,
              background: 'white',
              padding: '24px 32px',
              borderBottom: '2px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Scan Details</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '20px',
                  transition: 'all 0.3s'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ padding: '32px' }}>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Content
                </h3>
                <div style={{
                  background: '#f8fafc',
                  padding: '16px',
                  borderRadius: '16px',
                  color: '#1e293b',
                  lineHeight: '1.6',
                  wordBreak: 'break-all'
                }}>
                  {selectedScan.content}
                </div>
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Risk Assessment
                </h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  background: '#f8fafc',
                  borderRadius: '16px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${selectedScan.riskScore}%`,
                        height: '100%',
                        background: selectedScan.riskScore > 70 ? '#ef4444' : selectedScan.riskScore > 30 ? '#f59e0b' : '#10b981'
                      }}></div>
                    </div>
                  </div>
                  <span style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>{selectedScan.riskScore}%</span>
                </div>
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
                  AI Analysis
                </h3>
                <div style={{
                  padding: '16px',
                  background: '#e3f2fd',
                  borderRadius: '16px',
                  color: '#1e293b',
                  lineHeight: '1.6'
                }}>
                  {selectedScan.explanation}
                </div>
              </div>
              
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Timestamp
                </h3>
                <div style={{
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FaCalendar />
                  {formatDate(selectedScan.date)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default History;