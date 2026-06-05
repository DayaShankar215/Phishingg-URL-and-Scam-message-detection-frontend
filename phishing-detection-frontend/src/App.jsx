import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Dashboard from './pages/Dashboard';
import URLScanner from './pages/URLScanner';
import MessageScanner from './pages/MessageScanner';
import History from './pages/History';
// import Feedback from './pages/Feedback';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/url-scan" element={<URLScanner />} />
            <Route path="/message-scan" element={<MessageScanner />} />
            <Route path="/history" element={<History />} />
            {/* <Route path="/feedback" element={<Feedback />} /> */}
          </Routes>
        </main>
        <Footer />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '8px',
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;