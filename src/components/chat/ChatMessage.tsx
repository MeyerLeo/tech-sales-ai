import React from 'react';
import { Box, Typography, Avatar, Paper } from '@mui/material';
import { Message } from '../../types';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAI = message.sender === 'ai';
  
  // Function to render markdown-like content with basic HTML
  const renderFormattedContent = (content: string) => {
    if (!isAI) {
      return <Typography variant="body1">{content}</Typography>;
    }

    // Convert markdown-like content to HTML
    const formattedContent = content
      // Replace headers (h1-h4)
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
      // Replace bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Replace lists
      .replace(/^\- (.*$)/gm, '<li>$1</li>')
      // Wrap consecutive list items in ul tags
      .replace(/(<li>.*<\/li>\n*)+/g, '<ul>$&</ul>')
      // Replace paragraphs with double line breaks
      .split('\n\n').join('</p><p>')
      // Wrap in paragraph tags (but not headers, lists, etc.)
      .replace(/^(?!<h[1-4]|<li|<ul|<\/p>)(.*$)/gm, '<p>$1</p>');

    return (
      <Box 
        sx={{ 
          '& h1': { 
            fontSize: '1.5rem', 
            fontWeight: 'bold',
            marginTop: '0.5rem',
            marginBottom: '0.5rem'
          },
          '& h2': { 
            fontSize: '1.3rem', 
            fontWeight: 'bold',
            marginTop: '0.5rem',
            marginBottom: '0.5rem'
          },
          '& h3': { 
            fontSize: '1.1rem', 
            fontWeight: 'bold',
            marginTop: '0.5rem',
            marginBottom: '0.5rem'
          },
          '& h4': { 
            fontSize: '1rem', 
            fontWeight: 'bold',
            marginTop: '0.5rem',
            marginBottom: '0.5rem'
          },
          '& p': { marginBottom: '0.5rem' },
          '& ul': { marginLeft: '1rem', marginBottom: '0.5rem' },
          '& li': { marginLeft: '1rem' },
          '& strong': { fontWeight: 'bold' }
        }}
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
    );
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        mb: 2,
        flexDirection: isAI ? 'row' : 'row-reverse'
      }}
    >
      <Avatar
        sx={{
          bgcolor: isAI ? 'primary.main' : 'secondary.main',
          mr: isAI ? 1 : 0,
          ml: isAI ? 0 : 1
        }}
      >
        {isAI ? <SmartToyIcon /> : <PersonIcon />}
      </Avatar>
      
      <Paper
        elevation={1}
        sx={{
          p: 2,
          maxWidth: '70%',
          bgcolor: isAI ? 'grey.100' : 'primary.light',
          color: isAI ? 'text.primary' : 'primary.contrastText',
          borderRadius: 2
        }}
      >
        {renderFormattedContent(message.content)}
        <Typography variant="caption" color={isAI ? 'text.secondary' : 'inherit'} sx={{ opacity: 0.8 }}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </Typography>
      </Paper>
    </Box>
  );
};

export default ChatMessage;