import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../apiClient';

// --- TYPE DEFINITIONS ---
// Defining the shape of our user and context for TypeScript
interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthLoading: boolean; // <-- THE NEW "TRAFFIC LIGHT" STATE
  login: (token: string, user: User) => void;
  logout: () => void;
}

// --- CONTEXT CREATION ---
// Creating the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
// This component will wrap our app and provide the auth state
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true); // <-- START WITH THE LIGHT RED

  // This useEffect runs ONLY ONCE when the app starts.
  // Its job is to check for an existing session in localStorage.
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        const userData: User = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
        // Important: We also need to tell our apiClient to use this token for future requests
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }
    } catch (error) {
      console.error("Failed to initialize auth state from localStorage", error);
      // Clear out any corrupted stored data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      // Whether we found a token or not, the initial check is complete.
      setIsAuthLoading(false); // <-- TURN THE LIGHT GREEN
    }
  }, []); // The empty array [] means this effect runs only once on mount.

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    // Set the authorization header for all future apiClient requests
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    // Persist the session in localStorage
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    // Remove the authorization header
    delete apiClient.defaults.headers.common['Authorization'];
    // Clear the session from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // The value provided to all children components
  const value = { user, token, isAuthLoading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- CUSTOM HOOK ---
// A helper hook to easily access the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};