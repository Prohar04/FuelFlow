import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

// Translation dictionary
const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    pumps: 'Pumps',
    employees: 'Employees',
    prices: 'Prices',
    inventory: 'Inventory',
    orders: 'Orders',
    suppliers: 'Suppliers',
    attendance: 'Attendance',
    shifts: 'Shifts',
    payroll: 'Payroll',
    sales: 'Sales',
    analytics: 'Analytics',
    reports: 'Reports',
    profile: 'Profile',
    logout: 'Logout',
    
    // Common
    welcome: 'Welcome',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    
    // Auth
    login: 'Login',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot Password?',
    signIn: 'Sign In',
  },
  bn: {
    // Navigation
    dashboard: 'ড্যাশবোর্ড',
    pumps: 'পাম্প',
    employees: 'কর্মচারী',
    prices: 'মূল্য',
    inventory: 'জায়',
    orders: 'অর্ডার',
    suppliers: 'সরবরাহকারী',
    attendance: 'উপস্থিতি',
    shifts: 'শিফট',
    payroll: 'বেতন',
    sales: 'বিক্রয়',
    analytics: 'বিশ্লেষণ',
    reports: 'প্রতিবেদন',
    profile: 'প্রোফাইল',
    logout: 'লগআউট',
    
    // Common
    welcome: 'স্বাগতম',
    loading: 'লোড হচ্ছে...',
    save: 'সংরক্ষণ',
    cancel: 'বাতিল',
    delete: 'মুছুন',
    edit: 'সম্পাদনা',
    create: 'তৈরি করুন',
    add: 'যোগ করুন',
    search: 'খুঁজুন',
    filter: 'ফিল্টার',
    export: 'এক্সপোর্ট',
    
    // Auth
    login: 'লগইন',
    email: 'ইমেইল',
    password: 'পাসওয়ার্ড',
    forgotPassword: 'পাসওয়ার্ড ভুলে গেছেন?',
    signIn: 'সাইন ইন',
  },
};

export const LanguageProvider = ({ children }) => {
  const { user, updateUser, isAuthenticated } = useAuth();
  
  const [language, setLanguageState] = useState(() => {
    // Get language from user preferences or localStorage
    if (user?.preferences?.language) {
      return user.preferences.language;
    }
    return localStorage.getItem('language') || 'en';
  });

  // Update language when user changes (e.g., after login)
  useEffect(() => {
    if (user?.preferences?.language && user.preferences.language !== language) {
      setLanguageState(user.preferences.language);
    }
  }, [user?.preferences?.language]);

  const setLanguage = async (newLanguage) => {
    setLanguageState(newLanguage);
    localStorage.setItem('language', newLanguage);

    // If user is authenticated, save to server
    if (isAuthenticated && user) {
      try {
        const response = await api.patch('/preferences/me', { language: newLanguage });
        if (response.data.success) {
          // Update user context with new preferences
          updateUser({ preferences: response.data.data });
        }
      } catch (error) {
        console.error('Failed to save language preference:', error);
      }
    }
  };

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  const value = {
    language,
    setLanguage,
    t, // translate function
    translations: translations[language] || translations.en,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
