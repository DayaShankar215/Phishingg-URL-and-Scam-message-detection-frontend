import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TrendChart = ({ data }) => {
  return (
    <div className="card" style={{ marginTop: '20px' }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Weekly Detection Trend</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="day" stroke="#666" />
          <YAxis stroke="#666" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              padding: '10px'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="phishing" 
            stroke="#ef4444" 
            name="Phishing URLs"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="scam" 
            stroke="#f59e0b" 
            name="Scam Messages"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="safe" 
            stroke="#10b981" 
            name="Safe"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;