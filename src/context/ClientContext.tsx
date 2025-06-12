import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Auth } from 'aws-amplify';
import { Client, ClientFormData } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Empty array for clients
const initialClients: Client[] = [];

interface ClientContextType {
  clients: Client[];
  loading: boolean;
  error: string | null;
  addClient: (clientData: ClientFormData) => Promise<Client | null>;
  getClient: (id: string) => Client | undefined;
  refreshClients: () => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

interface ClientProviderProps {
  children: ReactNode;
}

export const ClientProvider: React.FC<ClientProviderProps> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the current session to get the ID token
      const session = await Auth.currentSession();
      const idToken = session.getIdToken().getJwtToken();
      
      const response = await fetch('https://u55r2as1ek.execute-api.us-east-1.amazonaws.com/prod/client', {
        method: 'GET',
        headers: {
          'Authorization': idToken,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching clients: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Handle the actual API response format
      if (data && data.clients && Array.isArray(data.clients)) {
        // Map API response to our Client type
        const mappedClients = data.clients.map((client: any) => ({
          id: client.id || uuidv4(), // Generate ID if not provided
          name: client.name,
          description: client.description || '',
          createdAt: client.createdAt || new Date().toISOString()
        }));
        setClients(mappedClients);
      } else {
        console.error('API returned unexpected data format:', data);
        setClients([]); // Use empty array instead of mock data
        setError('Invalid data format received from API');
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Failed to load clients');
      setClients([]); // Use empty array instead of mock data
    } finally {
      setLoading(false);
    }
  };

  // Fetch clients on mount
  useEffect(() => {
    fetchClients();
  }, []);

  const refreshClients = async () => {
    await fetchClients();
  };

  const addClient = async (clientData: ClientFormData): Promise<Client | null> => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the current session to get the ID token
      const session = await Auth.currentSession();
      const idToken = session.getIdToken().getJwtToken();
      
      const response = await fetch('https://u55r2as1ek.execute-api.us-east-1.amazonaws.com/prod/client', {
        method: 'PUT',
        headers: {
          'Authorization': idToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: clientData.name,
          description: clientData.description
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error creating client: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Handle the actual API response format
      if (data && data.message && data.client) {
        // Create a client object from the response
        const newClient: Client = {
          id: data.client.id || uuidv4(), // Generate ID if not provided
          name: data.client.name,
          description: clientData.description, // Use the description from the form since it might not be in the response
          createdAt: new Date().toISOString()
        };
        
        // Update local state with the new client
        setClients(prevClients => [newClient, ...prevClients]);
        
        // Refresh clients to get the latest data
        refreshClients();
        
        return newClient;
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (err) {
      console.error('Error creating client:', err);
      setError('Failed to create client');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getClient = (id: string): Client | undefined => {
    return clients.find(client => client.id === id);
  };

  return (
    <ClientContext.Provider
      value={{
        clients,
        loading,
        error,
        addClient,
        getClient,
        refreshClients
      }}
    >
      {children}
    </ClientContext.Provider>
  );
};

export const useClient = () => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
};