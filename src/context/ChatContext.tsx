import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Chat, Message, ProposalFormData } from '../types';
import { useClient } from './ClientContext';
import websocketService from '../services/websocketService';
import { fetchProposals, Proposal } from '../services/proposalService';

interface ChatContextType {
  chats: Chat[];
  currentChat: Chat | null;
  setCurrentChat: (chat: Chat | null) => void;
  createChat: (proposalData: ProposalFormData) => void;
  deleteChat: (id: string) => void;
  sendMessage: (content: string) => void;
  isConnected: boolean;
  loadProposals: (clientName?: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const { getClient } = useClient();

  // Load all proposals on initial mount
  useEffect(() => {
    // Only load proposals once on initial mount
    const initialLoad = async () => {
      await loadProposals();
    };
    initialLoad();
  }, []);

  // Set up WebSocket message handler
  useEffect(() => {
    // Create a function to handle messages that can be removed later
    const handleWebSocketMessage = (data: any) => {
      console.log('Received message in ChatContext:', data);
      
      if (data.message && currentChat) {
        // Check if the message matches the advisor pattern "!!!message!!!"
        const advisorPattern = /^!!!(.*?)!!!$/;
        const advisorMatch = data.message.match(advisorPattern);
        
        if (advisorMatch) {
          // Don't add advisor messages to chat history
          // They will be handled by the ChatWindow component
          return;
        }
        
        // Format message content as markdown if it's a document
        let messageContent = data.message;
        if (data.message.startsWith('# ') || data.message.includes('\n## ')) {
          // This looks like a markdown document, keep it as is
          messageContent = data.message;
        }
        
        // Create AI message from WebSocket response
        const aiMessage: Message = {
          id: uuidv4(),
          content: messageContent,
          timestamp: new Date().toISOString(),
          sender: 'ai'
        };

        // Update current chat with the new message
        const updatedChat: Chat = {
          ...currentChat,
          messages: [...currentChat.messages, aiMessage],
          updatedAt: new Date().toISOString()
        };

        // Update state
        setCurrentChat(updatedChat);
        setChats(chats.map(chat => 
          chat.id === currentChat.id ? updatedChat : chat
        ));
      }
    };
    
    // Register the message handler
    websocketService.onMessage(handleWebSocketMessage);

    // Handle connection status changes
    websocketService.onConnectionChange((connected) => {
      console.log('WebSocket connection status changed:', connected);
      setIsConnected(connected);
    });

    // Clean up on unmount
    return () => {
      websocketService.disconnect();
    };
  }, [currentChat, chats]);

  // Connect to WebSocket when current chat changes and send initial message if it's a new chat
  useEffect(() => {
    const connectToWebSocket = async () => {
      if (currentChat && currentChat.clientName) {
        console.log('Connecting to WebSocket for chat:', currentChat.title);
        
        // Wait for connection to be established
        const connected = await websocketService.connect(
          currentChat.clientName,
          currentChat.title
        );
        console.log('WebSocket connection result:', connected);
        
        // Send the initial message only if this chat was just created
        if (connected && currentChat.isNew) {
          // Add a small delay to ensure connection is fully established
          setTimeout(async () => {
            console.log('Sending initial "Create Proposal" message');
            await websocketService.sendMessage("Create Proposal");

            // Mark the chat as no longer new so this doesn't fire again
            const updatedChat = { ...currentChat, isNew: false };
            setCurrentChat(updatedChat);
            setChats(prev => prev.map(c => c.id === updatedChat.id ? updatedChat : c));
          }, 500);
        }
      }
    };
    
    connectToWebSocket();
    
    // Set up a connection check interval to keep the connection alive
    const connectionCheckInterval = setInterval(() => {
      if (websocketService.isConnected()) {
        console.log('WebSocket connection is active');
        websocketService.ping();
      } else if (currentChat && currentChat.clientName) {
        console.log('WebSocket disconnected, attempting to reconnect...');
        websocketService.connect(currentChat.clientName, currentChat.title);
      }
    }, 45000); // Check connection every 45 seconds
    
    return () => {
      clearInterval(connectionCheckInterval);
    };
  }, [currentChat]);

  const createChat = async (proposalData: ProposalFormData) => {
    const client = getClient(proposalData.clientId);
    
    if (!client) {
      console.error('Client not found');
      return;
    }
    
    const newChat: Chat = {
      id: uuidv4(),
      title: proposalData.proposalName,
      clientId: client.id,
      clientName: client.name,
      clientDescription: client.description,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      context: client.description,
      // Mark this chat as new so we know to send the
      // initial "Create Proposal" message only once
      isNew: true
    };
    
    setChats([newChat, ...chats]);
    setCurrentChat(newChat);
  };

  const deleteChat = (id: string) => {
    const updatedChats = chats.filter(chat => chat.id !== id);
    setChats(updatedChats);
    
    if (currentChat && currentChat.id === id) {
      setCurrentChat(updatedChats.length > 0 ? updatedChats[0] : null);
    }
  };

  const loadProposals = async (clientName?: string) => {
    try {
      const proposals = await fetchProposals(clientName);
      console.log('Fetched proposals:', proposals);
      
      if (proposals.length > 0) {
        // Convert proposals to chat objects
        const newProposals: Chat[] = proposals.map(proposal => ({
          id: uuidv4(),
          title: proposal.proposalName,
          clientId: '', // We don't have this from the API
          clientName: proposal.clientName,
          clientDescription: '', // We don't have this from the API
          messages: [],
          createdAt: proposal.createdAt,
          updatedAt: proposal.createdAt,
          context: '',
          // These proposals already exist on the server, so we
          // shouldn't send the "Create Proposal" message again
          isNew: false
        }));
        
        // If clientName is provided, only replace proposals for that client
        if (clientName) {
          const existingChats = chats.filter(chat => chat.clientName !== clientName);
          setChats([...existingChats, ...newProposals]);
        } else {
          // If no clientName, replace all chats with the new proposals
          setChats(newProposals);
        }
      }
    } catch (error) {
      console.error('Error loading proposals:', error);
    }
  };

  const sendMessage = async (content: string) => {
    if (!currentChat) return;

    console.log('ChatContext sendMessage called with:', content);
    
    // Create user message
    const userMessage: Message = {
      id: uuidv4(),
      content,
      timestamp: new Date().toISOString(),
      sender: 'user'
    };

    // Update chat with user message immediately
    const updatedChat: Chat = {
      ...currentChat,
      messages: [...currentChat.messages, userMessage],
      updatedAt: new Date().toISOString()
    };

    // Update state
    setCurrentChat(updatedChat);
    setChats(chats.map(chat => 
      chat.id === currentChat.id ? updatedChat : chat
    ));

    // Send message using existing connection if possible
    if (currentChat.clientName) {
      try {
        // Check if we need to connect
        if (!websocketService.isConnected()) {
          console.log('WebSocket not connected, connecting before sending...');
          const connected = await websocketService.connect(
            currentChat.clientName,
            currentChat.title
          );
          
          console.log('WebSocket connection result:', connected);
          
          if (!connected) {
            console.error('Failed to connect WebSocket, message not sent');
            return;
          }
          
          // Wait for connection to stabilize
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // Send the message
        console.log('Sending message to WebSocket:', content);
        const sent = await websocketService.sendMessage(content);
        console.log('Message sent result:', sent);
        
        if (!sent) {
          // If sending failed, try one more time with a fresh connection
          console.log('Message sending failed, trying again with fresh connection...');
          await websocketService.connect(currentChat.clientName, currentChat.title);
          await new Promise(resolve => setTimeout(resolve, 300));
          await websocketService.sendMessage(content);
        }
      } catch (error) {
        console.error('Error in WebSocket connection/send process:', error);
      }
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        currentChat,
        setCurrentChat,
        createChat,
        deleteChat,
        sendMessage,
        isConnected,
        loadProposals
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};