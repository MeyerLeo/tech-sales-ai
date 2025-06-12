import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider, createTheme, CircularProgress } from '@mui/material';
import { Amplify, Auth } from 'aws-amplify';

import { ChatProvider } from './context/ChatContext';
import { ClientProvider } from './context/ClientContext';
import { awsConfig } from './config/aws-config';
import { CognitoUser } from './types';

import Login from './components/auth/Login';
import Header from './components/layout/Header';
import ChatInterface from './components/chat/ChatInterface';

// Configure Amplify
Amplify.configure(awsConfig);

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#4caf50',
    },
  },
});

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<CognitoUser | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const cognitoUser = await Auth.currentAuthenticatedUser();
        setUser(cognitoUser);
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, []);

  // Show loading while checking auth
  if (isAuthenticated === null) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ClientProvider>
        <ChatProvider>
          <Router>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
              {isAuthenticated && <Header user={user} />}
              <Box component="main" sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <Routes>
                  <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
                  <Route path="/" element={isAuthenticated ? <ChatInterface /> : <Navigate to="/login" />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </Box>
            </Box>
          </Router>
        </ChatProvider>
      </ClientProvider>
    </ThemeProvider>
  );
};

export default App;