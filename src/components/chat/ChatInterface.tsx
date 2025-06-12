import React from 'react';
import { Box } from '@mui/material';
import Sidebar from '../layout/Sidebar';
import ChatWindow from './ChatWindow';

const ChatInterface: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        height: 'calc(100vh - 64px)', // Subtract AppBar height
        overflow: 'hidden'
      }}
    >
      <Sidebar />
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <ChatWindow />
      </Box>
    </Box>
  );
};

export default ChatInterface;