import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the shape of the context data
interface AuthContextType {
  token: string | null;
  user: { 
    id: string; 
    email: string 
  } | null;
  login: (
    token: string, 
    userData: { 
        id: string; 
        email: string 
    }
  ) => void;
  // Log out the user by clearing their authentication token and user info from the context and localStorage.
  logout: () => void; 
  isLoading: boolean;
}

// 1. Create the "Wi-Fi Network" (the Context)
// We provide a default value for better autocompletion.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define props for the provider component
interface AuthProviderProps {
  children: ReactNode;
}

// 2. Create the "Wi-Fi Router" (the Provider Component)
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true); // To handle initial load

  // This effect runs once when the app starts
  useEffect(() => {
    // Check localStorage for an existing token to keep the user logged in
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false); // Finished loading persisted state
  }, []);

  // Function to handle user login
  const login = (newToken: string, userData: { id: string; email: string }) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('authUser', JSON.stringify(userData));
  };

  // Function to handle user logout
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  };
  
  // The value that will be broadcast to all consuming components
  const value = {
    token,
    user,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Don't render children until we've checked for a token */}
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

// 3. Create the "Wi-Fi Receiver" (a custom hook for easy consumption)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
