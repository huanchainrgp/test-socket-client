# WebSocket Test Client

A React + TypeScript WebSocket test client for testing Ludo Backend WebSocket API.

## Features

- 🔌 WebSocket connection management
- 🔐 Auto-fill JWT access token from login API
- 💰 Wallet creation and deposit functionality
- 🏠 Room management (create, join, leave, get list)
- 📨 Real-time message logging
- 📝 Custom message sending
- 💅 Modern, professional UI

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Yarn** - Package manager

## Installation

```bash
yarn install
```

## Development

Start the development server (runs on port 5000):

```bash
yarn dev
# or
yarn start
```

## Build

Build for production:

```bash
yarn build
```

Preview production build:

```bash
yarn preview
```

## Configuration

Edit `src/config.ts` to configure API endpoints:

```typescript
export const CONFIG: Config = {
  BASE_API: 'https://your-api-server.com',
  WEB_SOCKET_SERVER: 'wss://your-websocket-server.com/ws',
  LOGIN_ENDPOINT: '/iam/login'
};
```

## Usage

1. Enter JWT token or use "Auto Fill Access Token" to login
2. Click "Connect" to establish WebSocket connection
3. Use quick actions to create/join rooms
4. Monitor messages in the Messages panel
5. Send custom messages using the custom message form

## Project Structure

```
src/
  ├── App.tsx              # Main application component
  ├── main.tsx             # React entry point
  ├── index.css            # Global styles
  ├── config.ts            # Configuration
  ├── types.ts             # TypeScript type definitions
  └── hooks/
      └── useWebSocket.ts  # WebSocket hook
```
