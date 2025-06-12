import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Avatar, 
  Box, 
  IconButton, 
  Menu, 
  MenuItem 
} from '@mui/material';
import { Auth } from 'aws-amplify';
import { CognitoUser } from '../../types';

interface HeaderProps {
  user: CognitoUser | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [displayName, setDisplayName] = useState('User');
  
  useEffect(() => {
    const getNameFromToken = async () => {
      try {
        // Get the current session which contains the JWT tokens
        const session = await Auth.currentSession();
        // Get the ID token which contains user information
        const idToken = session.getIdToken();
        // Get the payload which contains the claims (including name)
        const payload = idToken.decodePayload();
        
        if (payload.name) {
          setDisplayName(payload.name);
        } else if (user?.attributes?.email) {
          // Fallback to email
          const namePart = user.attributes.email.split('@')[0];
          setDisplayName(namePart
            .split('.')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' '));
        }
      } catch (error) {
        console.error('Error getting name from token:', error);
      }
    };
    
    if (user) {
      getNameFromToken();
    }
  }, [user]);
  
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    try {
      await Auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const avatar = user?.attributes?.picture;

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Tech Sales AI
        </Typography>
        
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" sx={{ mr: 2 }}>
              {displayName}
            </Typography>
            
            <IconButton
              size="large"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar 
                alt={displayName} 
                src={avatar} 
                sx={{ width: 32, height: 32 }}
              />
            </IconButton>
            
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;