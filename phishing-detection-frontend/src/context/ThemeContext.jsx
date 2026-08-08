import React, { createContext, useState, useContext, useEffect } from "react";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage for saved theme
    const saved = localStorage.getItem("appTheme");
    return saved || "system";
  });
  const [currentTheme, setCurrentTheme] = useState("light");

  // Detect system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e) => {
      if (theme === "system") {
        setCurrentTheme(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);

    // Initial check
    if (theme === "system") {
      setCurrentTheme(mediaQuery.matches ? "dark" : "light");
    } else {
      setCurrentTheme(theme);
    }

    // Save to localStorage
    localStorage.setItem("appTheme", theme);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const toggleTheme = (mode) => {
    setTheme(mode);
  };

  const value = {
    theme,
    currentTheme,
    toggleTheme,
    isDark: currentTheme === "dark",
    isLight: currentTheme === "light",
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
