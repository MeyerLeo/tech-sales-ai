import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Container, 
  CircularProgress,
  Alert
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { Auth } from 'aws-amplify';
import { CognitoHostedUIIdentityProvider } from '@aws-amplify/auth';

const ALLOWED_EMAILS = [
  'leonardo.meyer@enkel.cloud',
  'lucas.milesi@enkel.cloud',
  'kaue.urias@enkel.cloud',
  'gustavo.maia@enkel.cloud',
  'leonardo.indigesto@gmail.com' // Added for testing
];

const Login: React.FC = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [initialChecking, setInitialChecking] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await Auth.currentAuthenticatedUser();
        const email = user.attributes.email;
        
        if (ALLOWED_EMAILS.includes(email)) {
          window.location.href = '/';
        } else {
          await Auth.signOut();
          setError(`Access denied for ${email}. You are not authorized.`);
        }
      } catch (error) {
        // Not authenticated, just continue
      } finally {
        setInitialChecking(false);
      }
    };
    
    checkAuth();
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await Auth.federatedSignIn({
        provider: CognitoHostedUIIdentityProvider.Google
      });
    } catch (error) {
      setError('Error signing in with Google');
      setIsLoading(false);
    }
  };

  if (initialChecking) {
    return (
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, mt: 8, textAlign: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Checking authentication...</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8, borderRadius: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Tech Sales AI
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Sign in to your account
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Button
          variant="contained"
          fullWidth
          size="large"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          disabled={isLoading}
          sx={{ 
            py: 1.5,
            borderRadius: 1.5,
            textTransform: 'none',
            fontSize: '1rem'
          }}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign in with Google'}
        </Button>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Only authorized users can access this application
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;