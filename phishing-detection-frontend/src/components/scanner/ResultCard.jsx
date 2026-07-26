import React from 'react';
import RiskBadge from './RiskBadge';

const ResultCard = ({ result, type }) => {
  if (!result) return null;

  return (
    <div className="result-card">
      <div className="result-header">
        <h3>Scan Result</h3>
        <RiskBadge score={result.riskScore} />
      </div>
      <div className="result-body">
        <p><strong>Type:</strong> {type}</p>
        <p><strong>Prediction:</strong> {result.prediction}</p>
        <p><strong>Confidence:</strong> {((result.confidence || 0.5) * 100).toFixed(1)}%</p>
        <p><strong>Explanation:</strong> {result.explanation}</p>
      </div>
    </div>
  );
};

export default ResultCard;