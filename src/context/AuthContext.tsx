import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Auth, Hub } from 'aws-amplify';
import { CognitoHostedUIIdentityProvider } from '@aws-amplify/auth';
import { User } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// List of allowed email addresses
const ALLOWED_EMAILS = [
  'leonardo.meyer@enkel.cloud',
  'lucas.milesi@enkel.cloud',
  'kaue.urias@enkel.cloud',
  'gustavo.maia@enkel.cloud'
];

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to check authentication and set user
  const checkUser = async () => {
    try {
      // Check if user is authenticated with Cognito
      const cognitoUser = await Auth.currentAuthenticatedUser();
      
      // Get user email
      const email = cognitoUser.attributes.email;
      
      // Check if user is in allowed list
      if (!ALLOWED_EMAILS.includes(email)) {
        // If not allowed, sign out
        await Auth.signOut();
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      // Set user data
      setUser({
        id: cognitoUser.username,
        username: cognitoUser.attributes.name || cognitoUser.username,
        email: cognitoUser.attributes.email,
        avatar: cognitoUser.attributes.picture || undefined
      });
      setIsAuthenticated(true);
      setIsLoading(false);
    } catch (error) {
      // No authenticated user found
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
    }
  };

  // Check if user is already authenticated on mount
  useEffect(() => {
    checkUser();
  }, []);

  // Listen for auth events
  useEffect(() => {
    const listener = Hub.listen('auth', ({ payload: { event, data } }) => {
      switch (event) {
        case 'signIn':
          checkUser();
          break;
        case 'signOut':
          setIsAuthenticated(false);
          setUser(null);
          break;
      }
    });

    return () => {
      listener();
    };
  }, []);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      // Trigger Google federated sign-in
      await Auth.federatedSignIn({
        provider: CognitoHostedUIIdentityProvider.Google
      });
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Sign out from Cognito
      await Auth.signOut();
      
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isLoading,
        loginWithGoogle,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};