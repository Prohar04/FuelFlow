import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const { user, updateUser, isAuthenticated } = useAuth();
  
  const [theme, setThemeState] = useState(() => {
    // Check user preferences first, then localStorage
    if (user?.preferences?.theme) {
      return user.preferences.theme;
    }
    return localStorage.getItem('theme') || 'system';
  });

  // Update theme when user changes (e.g., after login)
  useEffect(() => {
    if (user?.preferences?.theme && user.preferences.theme !== theme) {
      setThemeState(user.preferences.theme);
    }
  }, [user?.preferences?.theme]);

  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.setAttribute('data-theme', systemTheme);
    } else {
      root.setAttribute('data-theme', theme);
    }
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  const setTheme = async (newTheme) => {
    setThemeState(newTheme);
    
    // If user is authenticated, save to server
    if (isAuthenticated) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/preferences/me`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify({ theme: newTheme }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Update user context with new preferences
            updateUser({ preferences: data.data });
          }
        }
      } catch (error) {
        console.error('Failed to save theme preference:', error);
      }
    }
  };

  const value = {
    theme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
