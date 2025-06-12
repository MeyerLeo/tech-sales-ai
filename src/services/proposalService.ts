import { Auth } from 'aws-amplify';

export interface Proposal {
  clientName: string;
  proposalName: string;
  createdAt: string;
  message: string;
  createdBy: string;
  name: string;
  type: string;
}

export const fetchProposals = async (clientName?: string): Promise<Proposal[]> => {
  try {
    // Get the current session to get the ID token
    const session = await Auth.currentSession();
    const idToken = session.getIdToken().getJwtToken();
    
    // Build the URL with query parameters
    const url = new URL('https://u55r2as1ek.execute-api.us-east-1.amazonaws.com/prod/proposal');
    url.searchParams.append('type', 'proposal');
    
    // Only add clientName if provided
    if (clientName) {
      url.searchParams.append('clientName', clientName);
    }
    
    // Make the API call
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': idToken,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching proposals: ${response.statusText}`);
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [];
    
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return [];
  }
};