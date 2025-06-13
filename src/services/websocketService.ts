// WebSocket service for chat functionality
import { Auth } from 'aws-amplify';

const WEBSOCKET_URL = 'wss://4s836a1gdf.execute-api.us-east-1.amazonaws.com/prod';

class WebSocketService {
  private socket: WebSocket | null = null;
  private connectionId: string | null = null;
  private clientName: string | null = null;
  private proposalName: string | null = null;
  private messageCallbacks: ((message: any) => void)[] = [];
  private connectionCallbacks: ((connected: boolean) => void)[] = [];
  private lastPingTime: number = 0;

  // Connect to WebSocket
  async connect(clientName: string, proposalName: string): Promise<boolean> {
    try {
      // If we already have a working connection, keep it
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected, reusing connection');
        return true;
      }
      
      // If socket exists but is not open, close it
      if (this.socket) {
        console.log('Closing existing WebSocket connection before creating a new one');
        this.socket.close();
        this.socket = null;
      }
      
      // Store client and proposal names
      this.clientName = clientName;
      this.proposalName = proposalName;
      
      // Create WebSocket connection with query parameters
      const url = `${WEBSOCKET_URL}?clientName=${encodeURIComponent(clientName)}&proposalName=${encodeURIComponent(proposalName)}`;
      
      console.log('Connecting to WebSocket:', url);
      this.socket = new WebSocket(url);
      
      // Set up event handlers
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      
      // Return a promise that resolves when the connection is established
      return new Promise((resolve) => {
        // Set a timeout in case the connection never establishes (increased to 15 seconds)
        const timeout = setTimeout(() => {
          console.error('WebSocket connection timeout');
          if (this.socket) {
            this.socket.close();
            this.socket = null;
          }
          resolve(false);
        }, 15000);
        
        // Handle successful connection
        const openHandler = () => {
          console.log('WebSocket connection opened successfully');
          clearTimeout(timeout);
          if (this.socket) {
            this.socket.removeEventListener('open', openHandler);
            this.socket.removeEventListener('error', errorHandler);
          }
          resolve(true);
        };
        
        // Handle connection error
        const errorHandler = (event: Event) => {
          console.error('WebSocket connection error during connect:', event);
          clearTimeout(timeout);
          if (this.socket) {
            this.socket.removeEventListener('open', openHandler);
            this.socket.removeEventListener('error', errorHandler);
            this.socket.close();
            this.socket = null;
          }
          resolve(false);
        };
        
        if (this.socket) {
          this.socket.addEventListener('open', openHandler);
          this.socket.addEventListener('error', errorHandler);
        } else {
          resolve(false);
        }
      });
    } catch (error) {
      console.error('WebSocket connection error:', error);
      return false;
    }
  }

  // Disconnect from WebSocket
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.connectionId = null;
      this.notifyConnectionChange(false);
    }
  }

  // Send a message
  async sendMessage(message: string): Promise<boolean> {
    console.log('WebSocket sendMessage called with:', message);
    console.log('Current socket state:', this.socket ? this.socket.readyState : 'null');
    
    // If not connected, try to reconnect
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.log('Socket not connected, attempting to reconnect...');
      if (this.clientName && this.proposalName) {
        const connected = await this.connect(this.clientName, this.proposalName);
        console.log('Reconnection result:', connected);
        if (!connected) {
          console.error('Failed to reconnect WebSocket');
          return false;
        }
      } else {
        console.error('Cannot reconnect: missing clientName or proposalName');
        return false;
      }
    }

    try {
      // Get the current session to get the email from ID token
      const session = await Auth.currentSession();
      const idToken = session.getIdToken();
      const userEmail = idToken.payload.email || "anonymous@user.com";
      console.log('Using email from ID token:', userEmail);
      
      const payload = {
        action: "message",
        clientName: this.clientName || "",
        proposalName: this.proposalName || "",
        body: message,
        createdBy: userEmail
      };
      
      console.log('Sending message with payload:', payload);
      
      // Check again to make sure socket is still valid after async operations
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(payload));
        console.log('Message sent successfully');
        return true;
      } else {
        console.error('WebSocket not open when trying to send, readyState:', this.socket ? this.socket.readyState : 'null');
        return false;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  // Register a callback for incoming messages
  onMessage(callback: (message: any) => void) {
    this.messageCallbacks.push(callback);
  }

  // Register a callback for connection status changes
  onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionCallbacks.push(callback);
  }

  // Handle WebSocket open event
  private handleOpen(event: Event) {
    console.log('WebSocket connection opened');
    this.notifyConnectionChange(true);
  }

  // Handle WebSocket message event
  private handleMessage(event: MessageEvent) {
    try {
      console.log('WebSocket message received:', event.data);
      const data = JSON.parse(event.data);
      
      // Extract connection ID if available
      if (data.connectionId) {
        this.connectionId = data.connectionId;
        console.log('Connection ID set:', this.connectionId);
      }
      
      // Notify all registered callbacks
      this.messageCallbacks.forEach(callback => callback(data));
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  // Handle WebSocket close event
  private handleClose(event: CloseEvent) {
    console.log('WebSocket connection closed:', event.code, event.reason);
    this.socket = null;
    this.connectionId = null;
    this.notifyConnectionChange(false);
  }

  // Handle WebSocket error event
  private handleError(event: Event) {
    console.error('WebSocket error:', event);
    this.notifyConnectionChange(false);
  }

  // Notify all connection callbacks
  private notifyConnectionChange(connected: boolean) {
    this.connectionCallbacks.forEach(callback => callback(connected));
  }

  // Check connection to keep it alive
  async ping(): Promise<boolean> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    try {
      // Only check if it's been at least 20 seconds since the last check
      const now = Date.now();
      if (now - this.lastPingTime < 20000) {
        return true;
      }
      
      this.lastPingTime = now;
      
      // Just check the connection state
      console.log('Connection check: WebSocket is open');
      return true;
    } catch (error) {
      console.error('Error during connection check:', error);
      return false;
    }
  }
  
  // Check if WebSocket is connected
  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();
export default websocketService;