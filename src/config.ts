// WebSocket Test Client Configuration
// Edit these values to match your server configuration

export interface Config {
  // Base API URL for REST endpoints (e.g., http://localhost:3003)
  BASE_API: string;
  
  // WebSocket Server URL (e.g., ws://localhost:3003/ws or wss://your-domain.com/ws)
  WEB_SOCKET_SERVER: string;
  
  // Login API endpoint (e.g., /iam/login, /api/auth/login)
  LOGIN_ENDPOINT: string;
}

export const CONFIG: Config = {
  BASE_API: 'https://screwlike-milan-murmuringly.ngrok-free.dev',
  WEB_SOCKET_SERVER: 'wss://screwlike-milan-murmuringly.ngrok-free.dev/ws',
  LOGIN_ENDPOINT: '/iam/login'
};

