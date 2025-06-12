// Types for the application

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender: 'user' | 'ai';
}

export interface Client {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  context?: string;
  clientId?: string;
  clientName?: string;
  clientDescription?: string;
  /**
   * Indicates whether this proposal has just been created locally and
   * still needs to be created on the server. If true, the application
   * will send the "Create Proposal" message once and then toggle this
   * flag off so it isn't sent again when reopening the chat.
   */
  isNew?: boolean;
}

export interface ProposalFormData {
  clientId: string;
  proposalName: string;
}

export interface ClientFormData {
  name: string;
  description: string;
}

export interface CognitoUser {
  username: string;
  attributes: {
    email: string;
    name?: string;
    picture?: string;
    [key: string]: any;
  };
  [key: string]: any;
}