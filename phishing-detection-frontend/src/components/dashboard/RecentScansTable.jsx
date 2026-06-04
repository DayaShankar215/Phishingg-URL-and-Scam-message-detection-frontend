import React from 'react';
import RiskBadge from '../common/RiskBadge';
import { formatDate, truncateText } from '../../utils/formatters';

const RecentScansTable = ({ scans }) => {
  return (
    <div className="card" style={{ marginTop: '20px' }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Recent Scans</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Content</th>
              <th>Risk</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {scans.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                  No scans yet
                </td>
              </tr>
            ) : (
              scans.map((scan, index) => (
                <tr key={index}>
                  <td>
                    <span className={`badge ${scan.type === 'url' ? 'badge-url' : 'badge-message'}`}>
                      {scan.type === 'url' ? 'URL' : 'Message'}
                    </span>
                  </td>
                  <td title={scan.content}>{truncateText(scan.content, 50)}</td>
                  <td><RiskBadge score={scan.riskScore} size="small" /></td>
                  <td>{formatDate(scan.date)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentScansTable;