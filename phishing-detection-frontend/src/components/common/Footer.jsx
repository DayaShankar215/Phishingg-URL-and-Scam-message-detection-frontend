import React, { useState, useEffect } from "react";
import { FaShieldAlt, FaArrowUp, FaHeart } from "react-icons/fa";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      <footer className="sleek-footer">
        <div className="footer-glow" />
        <div className="footer-container">
          <div className="footer-content">
            
            {/* Brand Logo & Name */}
            <div className="footer-brand">
              <div className="logo-box">
                <FaShieldAlt />
              </div>
              <span className="brand-title">SecureShield</span>
            </div>

            {/* Made with Love & Copyright */}
            <div className="footer-info">
              <p className="love-text">
                Crafted with <FaHeart className="heart-icon" /> by <span className="team-name">Team SecureShield</span>
              </p>
              <span className="dot">•</span>
              <p className="copyright">© {currentYear}</p>
            </div>

          </div>
        </div>
      </footer>

      {showScrollTop && (
        <button onClick={scrollToTop} className="scroll-top" aria-label="Scroll to top">
          <FaArrowUp />
        </button>
      )}

      <style>{`
        .sleek-footer {
          background: linear-gradient(180deg, #090d16 0%, #05080e 100%);
          color: #94a3b8;
          border-top: 1px solid rgba(99, 102, 241, 0.15);
          font-family: system-ui, -apple-system, sans-serif;
          width: 100%;
          margin-top: auto;
          position: relative;
          overflow: hidden;
        }

        .footer-glow {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 250px;
          height: 40px;
          background: linear-gradient(90deg, rgba(99, 102, 241, 0), rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0));
          filter: blur(15px);
          pointer-events: none;
        }

        .footer-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 24px 20px;
          position: relative;
          z-index: 1;
        }

        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .logo-box {
          width: 34px;
          height: 34px;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 15px;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .brand-title {
          font-size: 15px;
          font-weight: 700;
          background: linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.3px;
        }

        .footer-info {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
        }

        .footer-info p {
          margin: 0;
        }

        .love-text {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #94a3b8;
        }

        .team-name {
          color: #cbd5e1;
          font-weight: 500;
        }

        .heart-icon {
          color: #f43f5e;
          font-size: 11px;
          animation: heartbeat 1.5s infinite ease-in-out;
        }

        .dot {
          color: #475569;
        }

        .copyright {
          color: #64748b;
        }

        .scroll-top {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 38px;
          height: 38px;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          color: #fff;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
          transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          z-index: 1000;
          font-size: 13px;
        }

        .scroll-top:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.6);
        }

        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          15% { transform: scale(1.2); }
          30% { transform: scale(1); }
          45% { transform: scale(1.2); }
        }

        @media (max-width: 600px) {
          .footer-content {
            flex-direction: column;
            text-align: center;
            justify-content: center;
            gap: 12px;
          }
          .footer-info {
            justify-content: center;
            flex-wrap: wrap;
          }
        }
      `}</style>
    </>
  );
};

export default Footer;