import React, { useState, useMemo, useEffect } from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  Divider, 
  Button, 
  Typography,
  IconButton,
  Collapse,
  CircularProgress
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useChat } from '../../context/ChatContext';
import { useClient } from '../../context/ClientContext';
import ProposalModal from './ProposalModal';
import { ProposalFormData, Chat } from '../../types';

const Sidebar: React.FC = () => {
  const { chats, currentChat, setCurrentChat, createChat, deleteChat, loadProposals } = useChat();
  const { clients, loading, error } = useClient();
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});
  const [loadingProposals, setLoadingProposals] = useState<Record<string, boolean>>({});

  // Group chats by client
  const clientGroups = useMemo(() => {
    // Create a map of all clients first
    const groups: Record<string, {
      clientId: string,
      clientName: string,
      proposals: Chat[]
    }> = {};
    
    // Initialize with all clients, even those without proposals
    if (Array.isArray(clients)) {
      clients.forEach(client => {
        groups[client.name] = {
          clientId: client.id,
          clientName: client.name,
          proposals: []
        };
      });
    }
    
    // Add proposals to their respective clients
    chats.forEach(chat => {
      if (chat.clientName) {
        // Use clientName as the key instead of clientId
        if (!groups[chat.clientName]) {
          groups[chat.clientName] = {
            clientId: chat.clientId || chat.clientName, // Use clientName as ID if no clientId
            clientName: chat.clientName,
            proposals: []
          };
        }
        groups[chat.clientName].proposals.push(chat);
      } else {
        // Handle proposals without a clientName
        const groupKey = 'Ungrouped';
        if (!groups[groupKey]) {
          groups[groupKey] = {
            clientId: 'ungrouped',
            clientName: groupKey,
            proposals: []
          };
        }
        groups[groupKey].proposals.push(chat);
      }
    });
    
    return Object.values(groups);
  }, [chats, clients]);

  const handleChatSelect = (chat: Chat) => {
    setCurrentChat(chat);
  };

  const handleOpenProposalModal = () => {
    setProposalModalOpen(true);
  };

  const handleCloseProposalModal = () => {
    setProposalModalOpen(false);
  };

  const handleCreateProposal = (data: ProposalFormData) => {
    createChat(data);
    setProposalModalOpen(false);
    
    // Auto-expand the client group
    setExpandedClients(prev => ({
      ...prev,
      [data.clientId]: true
    }));
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    deleteChat(chatId);
  };

  const toggleClientExpand = (clientId: string, clientName: string) => {
    const isExpanding = !expandedClients[clientId];
    
    setExpandedClients(prev => ({
      ...prev,
      [clientId]: isExpanding
    }));
    
    // No need to load proposals when expanding since we already have all proposals
  };
  
  // Load all proposals
  const loadAllProposals = async () => {
    try {
      setLoadingProposals(prev => ({ ...prev, all: true }));
      await loadProposals(); // No clientName means load all proposals
    } finally {
      setLoadingProposals(prev => ({ ...prev, all: false }));
    }
  };

  // This function is no longer used but kept for reference
  // We now only load all proposals at once

  return (
    <Box sx={{ 
      width: 250, 
      height: '100%', 
      borderRight: 1, 
      borderColor: 'divider',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box sx={{ p: 2 }}>
        <Button 
          variant="contained" 
          startIcon={<DescriptionIcon />} 
          fullWidth
          onClick={handleOpenProposalModal}
        >
          New Proposal
        </Button>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          fullWidth
          onClick={loadAllProposals}
          disabled={loadingProposals.all}
          sx={{ mt: 1 }}
        >
          {loadingProposals.all ? 'Loading...' : 'Refresh All'}
        </Button>
      </Box>
      
      <Divider />
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </Box>
        ) : (
          <List>
            {clientGroups.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No clients yet
                </Typography>
              </Box>
            ) : (
              clientGroups.map((group) => (
                <React.Fragment key={group.clientId}>
                  {/* Client group header */}
                  <ListItemButton 
                    onClick={() => toggleClientExpand(group.clientId, group.clientName)}
                    sx={{ bgcolor: 'action.hover' }}
                  >
                    <ListItemText 
                      primary={group.clientName} 
                      primaryTypographyProps={{ fontWeight: 'bold' }}
                      secondary={`${group.proposals.length} proposal(s)`}
                    />
                    {expandedClients[group.clientId] && (
                      <IconButton 
                        size="small" 
                        sx={{ mr: 1 }}
                        disabled={true}
                      >
                        <RefreshIcon fontSize="small" color="disabled" />
                      </IconButton>
                    )}
                    {expandedClients[group.clientId] ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                  
                  {/* Proposals under this client */}
                  <Collapse in={expandedClients[group.clientId] || false} timeout="auto">
                    <List component="div" disablePadding>
                      {group.proposals.length === 0 ? (
                        <ListItem sx={{ pl: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No proposals yet
                          </Typography>
                        </ListItem>
                      ) : (
                        group.proposals.map((chat) => (
                          <ListItem 
                            key={chat.id} 
                            disablePadding
                            secondaryAction={
                              <IconButton 
                                edge="end" 
                                size="small"
                                onClick={(e) => handleDeleteChat(e, chat.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            }
                            sx={{ pl: 2 }}
                          >
                            <ListItemButton 
                              selected={currentChat?.id === chat.id}
                              onClick={() => handleChatSelect(chat)}
                              sx={{ pl: 2 }}
                            >
                              <ListItemText 
                                primary={chat.title} 
                                primaryTypographyProps={{
                                  noWrap: true,
                                  style: { 
                                    fontWeight: currentChat?.id === chat.id ? 'bold' : 'normal' 
                                  }
                                }}
                                secondary={`${chat.messages.length} messages`}
                              />
                            </ListItemButton>
                          </ListItem>
                        ))
                      )}
                    </List>
                  </Collapse>
                </React.Fragment>
              ))
            )}
          </List>
        )}
      </Box>

      <ProposalModal 
        open={proposalModalOpen}
        onClose={handleCloseProposalModal}
        onSubmit={handleCreateProposal}
      />
    </Box>
  );
};

export default Sidebar;