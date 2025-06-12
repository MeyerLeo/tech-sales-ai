import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  IconButton, 
  Typography, 
  Paper,
  InputAdornment,
  Chip,
  Badge,
  Tooltip,
  CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';
import SignalWifiStatusbar4BarIcon from '@mui/icons-material/SignalWifiStatusbar4Bar';
import { useChat } from '../../context/ChatContext';
import ChatMessage from './ChatMessage';
import websocketService from '../../services/websocketService';

const ChatWindow: React.FC = () => {
  const { currentChat, sendMessage, isConnected } = useChat();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && currentChat) {
      sendMessage(message);
      setMessage('');
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat?.messages]);
  
  // Set up WebSocket message handler for advisor messages
  const [advisorMessage, setAdvisorMessage] = useState<string | null>(null);
  
  useEffect(() => {
    const handleMessage = (data: any) => {
      if (data.message) {
        // Check if the message matches the advisor pattern "!!!message!!!"
        const advisorPattern = /^!!!(.*?)!!!$/;
        const advisorMatch = data.message.match(advisorPattern);
        
        if (advisorMatch) {
          // Extract the message inside the !!! markers
          setAdvisorMessage(advisorMatch[1]);
        } else {
          // Regular message, clear the advisor
          setAdvisorMessage(null);
        }
      }
    };
    
    // Register the message handler
    websocketService.onMessage(handleMessage);
    
    return () => {
      // No clean up method available for onMessage, but this is fine for this component
    };
  }, []);

  if (!currentChat) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          p: 3
        }}
      >
        <Paper elevation={0} sx={{ p: 3, textAlign: 'center', maxWidth: 400 }}>
          <Typography variant="h5" gutterBottom>
            No proposal selected
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Select a proposal from the sidebar or create a new one to start chatting.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      {/* Chat header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box>
          <Typography variant="h6">{currentChat.title}</Typography>
          {currentChat.clientName && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Chip 
                label={`Client: ${currentChat.clientName}`} 
                size="small" 
                color="primary" 
                variant="outlined" 
                sx={{ mr: 1 }}
              />
              {currentChat.clientDescription && (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {currentChat.clientDescription.substring(0, 60)}
                  {currentChat.clientDescription.length > 60 ? '...' : ''}
                </Typography>
              )}
            </Box>
          )}
        </Box>
        <Tooltip title={isConnected ? "Connected" : "Disconnected"}>
          <Badge color={isConnected ? "success" : "error"} variant="dot">
            {isConnected ? 
              <SignalWifiStatusbar4BarIcon color="success" /> : 
              <SignalWifiOffIcon color="error" />
            }
          </Badge>
        </Tooltip>
      </Box>

      {/* Messages area */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2
        }}
      >
        {currentChat.messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        
        {/* Advisor message indicator */}
        {advisorMessage && (
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mt: 2,
              p: 1,
              borderRadius: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
              width: 'fit-content'
            }}
          >
            <CircularProgress size={16} sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {advisorMessage}
            </Typography>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>

      {/* Input area */}
      <Box
        component="form"
        onSubmit={handleSendMessage}
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider'
        }}
      >
        <TextField
          fullWidth
          placeholder={advisorMessage ? "AI is working..." : "Type your message..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          variant="outlined"
          disabled={!isConnected || advisorMessage !== null}
          helperText={!isConnected ? "Connecting to server..." : advisorMessage ? "Please wait while AI is working" : ""}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton 
                  type="submit" 
                  color="primary" 
                  disabled={!message.trim() || !isConnected || advisorMessage !== null}
                >
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>
    </Box>
  );
};

export default ChatWindow;