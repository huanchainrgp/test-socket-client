// WebSocket Test Client Configuration
// Edit these values to match your server configuration

const CONFIG = {
    // Base API URL for REST endpoints (e.g., http://localhost:3003)
    BASE_API: 'https://screwlike-milan-murmuringly.ngrok-free.dev',
    
    // WebSocket Server URL (e.g., ws://localhost:3003/ws or wss://your-domain.com/ws)
    WEB_SOCKET_SERVER: 'wss://screwlike-milan-murmuringly.ngrok-free.dev/ws',
    
    // Login API endpoint (e.g., /iam/login, /api/auth/login)
    LOGIN_ENDPOINT: '/iam/login'
};

// Make config available globally
window.CONFIG = CONFIG;

