import { Auth } from 'aws-amplify';

export interface ChatMessage {
  type: string;
  name: string;
  clientName: string;
  countMessage: number;
  createdAt: string;
  createdBy: string;
  message: string;
  proposalName: string;
}

export interface ChatMessagesResponse {
  success: boolean;
  messages: ChatMessage[];
}

export const fetchChatMessages = async (clientName: string, proposalName: string): Promise<ChatMessage[]> => {
  try {
    // Get the current session to get the ID token
    const session = await Auth.currentSession();
    const idToken = session.getIdToken().getJwtToken();
    
    // Build the URL with query parameters
    const url = new URL('https://u55r2as1ek.execute-api.us-east-1.amazonaws.com/prod/message');
    url.searchParams.append('clientProposal', `${clientName}|${proposalName}`);
    
    // Make the API call
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': idToken,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching chat messages: ${response.statusText}`);
    }
    
    const data: ChatMessagesResponse = await response.json();
    return data.success ? data.messages : [];
    
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return [];
  }
};