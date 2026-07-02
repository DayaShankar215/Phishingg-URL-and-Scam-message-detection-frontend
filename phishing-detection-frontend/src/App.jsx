import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./context/ThemeContext";
import { useTheme } from "./context/ThemeContext";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import ErrorBoundary from "./components/common/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import URLScanner from "./pages/URLScanner";
import MessageScanner from "./pages/MessageScanner";
import History from "./pages/History";
import { lightTheme, darkTheme } from "./styles/theme";

const AppContent = () => {
  const { currentTheme, isDark } = useTheme();
  const theme = currentTheme === "dark" ? darkTheme : lightTheme;

  return (
    <div
      style={{
        background: theme.background,
        color: theme.text,
        minHeight: "100vh",
        transition: "all 0.3s ease",
      }}
    >
      <Router>
        <div
          className="app"
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
          }}
        >
          <Navbar />
          <main style={{ flex: 1 }}>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/url-scan" element={<URLScanner />} />
                <Route path="/message-scan" element={<MessageScanner />} />
                <Route path="/history" element={<History />} />
              </Routes>
            </ErrorBoundary>
          </main>
          <Footer />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: theme.backgroundCard,
                color: theme.text,
                borderRadius: "8px",
              },
            }}
          />
        </div>
      </Router>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
