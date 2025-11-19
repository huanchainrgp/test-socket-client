// WebSocket Test Client Configuration
// Edit these values to match your server configuration

const CONFIG = {
    // Base API URL for REST endpoints (e.g., http://localhost:3003)
    BASE_API: 'http://localhost:3003',
    
    // WebSocket Server URL (e.g., ws://localhost:3003/ws or wss://your-domain.com/ws)
    WEB_SOCKET_SERVER: 'ws://localhost:3003/ws'
};

// Make config available globally
window.CONFIG = CONFIG;

