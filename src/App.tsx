import { useState, useEffect, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { CONFIG } from './config';
import { useWebSocket } from './hooks/useWebSocket';
import type { Message, UserInfo, CreateRoomData, JoinRoomData, DepositData } from './types';

function App() {
  const [serverUrl, setServerUrl] = useState(CONFIG.WEB_SOCKET_SERVER);
  const [jwtToken, setJwtToken] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Login form
  const [loginUsername, setLoginUsername] = useState('john_doe1');
  const [loginPassword, setLoginPassword] = useState('Secret@123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [autoFillStatus, setAutoFillStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  // Wallet
  const [createWalletStatus, setCreateWalletStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);

  // Deposit
  const [depositAmount, setDepositAmount] = useState(1);
  const [depositUserId, setDepositUserId] = useState('');
  const [depositReferenceId, setDepositReferenceId] = useState('');
  const [depositMetadata, setDepositMetadata] = useState('{}');
  const [depositStatus, setDepositStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isDepositing, setIsDepositing] = useState(false);

  // Room creation
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [betValue, setBetValue] = useState(1000);
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joinPassword, setJoinPassword] = useState('');

  // Custom message
  const [namespace, setNamespace] = useState('room');
  const [event, setEvent] = useState('create_room_request');
  const [customEvent, setCustomEvent] = useState('');
  const [data, setData] = useState('{\n  "max_players": 4,\n  "is_public": true,\n  "bet_value": 1000\n}');

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const { isConnected, status, roomInfo, connect, disconnect, sendMessage } = useWebSocket(addMessage);

  useEffect(() => {
    if (jwtToken) {
      try {
        const tokenParts = jwtToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          setUserInfo({
            userId: payload.user_id || payload.sub || payload.id || 'N/A',
            username: payload.username || payload.name || 'N/A'
          });
        }
      } catch (e) {
        console.log('Could not parse JWT token:', e);
      }
    }
  }, [jwtToken]);

  const handleEventChange = (value: string) => {
    setEvent(value);
    if (value === 'custom') {
      setCustomEvent('');
    } else {
      let defaultData = {};
      switch(value) {
        case 'create_room_request':
          defaultData = { max_players: 4, is_public: true, bet_value: 1000 };
          break;
        case 'join_room_request':
        case 'leave_room_request':
          defaultData = { room_id: '' };
          break;
        case 'get_room_list_request':
          defaultData = {};
          break;
      }
      setData(JSON.stringify(defaultData, null, 2));
    }
  };

  const autoFillAccessToken = async () => {
    if (!loginUsername || !loginPassword) {
      setAutoFillStatus({ message: '❌ Please enter username and password', type: 'error' });
      return;
    }

    setIsAutoFilling(true);
    setAutoFillStatus({ message: '🔄 Logging in...', type: 'info' });

    try {
      const endpoints = [
        `${CONFIG.BASE_API}${CONFIG.LOGIN_ENDPOINT}`,
        `${CONFIG.BASE_API}/iam/login`,
        `${CONFIG.BASE_API}/api/auth/login`,
        `${CONFIG.BASE_API}/auth/login`,
        `${CONFIG.BASE_API}/api/login`,
        `${CONFIG.BASE_API}/login`
      ];

      let accessToken: string | null = null;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: loginUsername,
              password: loginPassword,
              remember_me: rememberMe
            })
          });

          if (response.ok) {
            const data = await response.json();
            accessToken = data.access_token || data.accessToken || data.token || data.data?.access_token || data.data?.token;

            if (accessToken) {
              setJwtToken(accessToken);
              setAutoFillStatus({ message: '✅ Access token retrieved successfully!', type: 'success' });
              toast.success('Access token retrieved successfully!');
              addMessage({
                type: 'received',
                content: {
                  type: 'success',
                  message: 'Auto-filled access token from login',
                  endpoint,
                  username: loginUsername
                },
                timestamp: new Date().toLocaleTimeString()
              });
              break;
            }
          }
        } catch (err) {
          continue;
        }
      }

      if (!accessToken) {
        setAutoFillStatus({ message: '❌ Login failed. Please check credentials and API endpoint.', type: 'error' });
      }
    } catch (error: any) {
      setAutoFillStatus({ message: '❌ Error: ' + error.message, type: 'error' });
    } finally {
      setIsAutoFilling(false);
    }
  };

  const createWallet = async () => {
    if (!jwtToken) {
      setCreateWalletStatus({ message: '❌ Please enter JWT token first!', type: 'error' });
      return;
    }

    setIsCreatingWallet(true);
    setCreateWalletStatus({ message: '🔄 Creating wallet...', type: 'info' });

    try {
      const endpoint = `${CONFIG.BASE_API}/wallet/create-user-balance`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: ''
      });

      if (response.ok) {
        const data = await response.json();
        setCreateWalletStatus({ message: '✅ Wallet created successfully!', type: 'success' });
        toast.success('Wallet created successfully!');
        addMessage({
          type: 'received',
          content: {
            type: 'success',
            message: 'Wallet created successfully',
            endpoint,
            data
          },
          timestamp: new Date().toLocaleTimeString()
        });
      } else {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        setCreateWalletStatus({ message: `❌ Failed to create wallet: ${errorData.message || response.statusText}`, type: 'error' });
      }
    } catch (error: any) {
      setCreateWalletStatus({ message: '❌ Error: ' + error.message, type: 'error' });
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const deposit = async () => {
    if (!jwtToken) {
      setDepositStatus({ message: '❌ Please enter JWT token first!', type: 'error' });
      return;
    }

    if (!depositAmount || depositAmount <= 0) {
      setDepositStatus({ message: '❌ Please enter a valid amount!', type: 'error' });
      return;
    }

    let metadata = {};
    if (depositMetadata) {
      try {
        metadata = JSON.parse(depositMetadata);
      } catch (e: any) {
        setDepositStatus({ message: '❌ Invalid JSON in Metadata field: ' + e.message, type: 'error' });
        return;
      }
    }

    let finalUserId = depositUserId;
    if (!finalUserId) {
      try {
        const tokenParts = jwtToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          finalUserId = payload.user_id || payload.sub || payload.id || '';
        }
      } catch (e) {
        console.log('Could not parse JWT token for user_id:', e);
      }
    }

    setIsDepositing(true);
    setDepositStatus({ message: '🔄 Processing deposit...', type: 'info' });

    try {
      const endpoint = `${CONFIG.BASE_API}/wallet/credit`;
      const requestBody: DepositData = {
        amount: depositAmount,
        metadata,
        reference_id: depositReferenceId || 'string',
        user_id: finalUserId || 'string'
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        setDepositStatus({ message: `✅ Deposit successful! Amount: ${depositAmount}`, type: 'success' });
        toast.success(`Deposit successful! Amount: ${depositAmount}`);
        addMessage({
          type: 'received',
          content: {
            type: 'success',
            message: 'Deposit successful',
            endpoint,
            request: requestBody,
            response: data
          },
          timestamp: new Date().toLocaleTimeString()
        });
      } else {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        setDepositStatus({ message: `❌ Failed to deposit: ${errorData.message || response.statusText}`, type: 'error' });
      }
    } catch (error: any) {
      setDepositStatus({ message: '❌ Error: ' + error.message, type: 'error' });
    } finally {
      setIsDepositing(false);
    }
  };

  const createRoom = () => {
    const roomData: CreateRoomData = {
      max_players: maxPlayers,
      is_public: isPublic,
      bet_value: betValue
    };

    if (!isPublic) {
      const passwordNum = parseInt(password);
      if (!passwordNum || passwordNum < 1000 || passwordNum > 9999) {
        toast.error('Password is required for private room. Password must be 4 digits (1000-9999)');
        return;
      }
      roomData.password = passwordNum;
    }

    sendMessage({
      namespace: 'room',
      event: 'create_room_request',
      data: roomData
    });
    toast.info('Creating room...');
  };

  const createPrivateRoom = () => {
    const passwordNum = parseInt(password);
    if (!passwordNum || passwordNum < 1000 || passwordNum > 9999) {
      toast.error('Password must be 4 digits (1000-9999)');
      return;
    }

    sendMessage({
      namespace: 'room',
      event: 'create_room_request',
      data: {
        max_players: maxPlayers,
        is_public: false,
        password: passwordNum,
        bet_value: betValue
      }
    });
    toast.info('Creating private room...');
  };

  const joinRoom = () => {
    if (!roomId) {
      toast.error('Please enter Room ID!');
      return;
    }

    const joinData: JoinRoomData = {
      room_id: roomId
    };

    if (joinPassword) {
      const passwordNum = parseInt(joinPassword);
      if (passwordNum < 1000 || passwordNum > 9999) {
        toast.error('Password must be 4 digits (1000-9999)');
        return;
      }
      joinData.password = passwordNum;
    }

    sendMessage({
      namespace: 'room',
      event: 'join_room_request',
      data: joinData
    });
    toast.info('Joining room...');
  };

  const leaveRoom = () => {
    if (!roomId) {
      toast.error('Please enter Room ID!');
      return;
    }

    sendMessage({
      namespace: 'room',
      event: 'leave_room_request',
      data: { room_id: roomId }
    });
    toast.info('Leaving room...');
  };

  const getRoomList = () => {
    sendMessage({
      namespace: 'room',
      event: 'get_room_list_request',
      data: {}
    });
    toast.info('Fetching room list...');
  };

  const sendCustomMessage = () => {
    const finalEvent = event === 'custom' ? customEvent.trim() : event;
    if (!finalEvent) {
      toast.error('Please select or enter an event name!');
      return;
    }

    try {
      const parsedData = JSON.parse(data);
      sendMessage({
        namespace,
        event: finalEvent,
        data: parsedData
      }, true);
      toast.success('Custom message sent successfully!');
    } catch (error: any) {
      toast.error('Invalid JSON in Data field: ' + error.message);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const testInvalidNamespace = () => {
    sendMessage({
      namespace: 'invalid',
      event: 'test',
      data: {}
    }, false);
  };

  useEffect(() => {
    if (roomInfo?.id) {
      setRoomId(roomInfo.id);
    }
  }, [roomInfo]);

  return (
    <div className="container">
      <div className="header">
        <h1>🚀 WebSocket Test Client</h1>
        <p>Test Ludo Backend WebSocket API</p>
      </div>

      <div className="content">
        {/* Left Panel */}
        <div className="panel">
          <h2>🔌 Connection</h2>

          <div className="form-group">
            <label htmlFor="serverUrl">Server URL</label>
            <input
              type="text"
              id="serverUrl"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="ws://localhost:3003/ws"
            />
          </div>

          {/* Auto Fill Access Token */}
          <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius)', marginBottom: '20px', border: '1px solid var(--border)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              🔐 Auto Fill Access Token</h3>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label htmlFor="loginUsername">Username</label>
              <select
                id="loginUsername"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
              >
                <option value="john_doe1">john_doe1</option>
                <option value="john_doe2">john_doe2</option>
                <option value="john_doe3">john_doe3</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label htmlFor="loginPassword">Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="loginPassword"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Secret@123"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                {' '}Remember me
              </label>
            </div>
            <button
              onClick={autoFillAccessToken}
              disabled={isAutoFilling}
              className="success"
              style={{ width: '100%', margin: 0 }}
            >
              {isAutoFilling && <span className="spinner" />}
              🔑 {isAutoFilling ? 'Loading...' : 'Auto Fill Access Token'}
            </button>
            {autoFillStatus && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: `var(--${autoFillStatus.type === 'success' ? 'success' : autoFillStatus.type === 'error' ? 'danger' : 'info'})` }}>
                {autoFillStatus.message}
              </div>
            )}
          </div>

          {/* JWT Token */}
          <div className="form-group">
            <label htmlFor="jwtToken">JWT Token</label>
            <textarea
              id="jwtToken"
              value={jwtToken}
              onChange={(e) => setJwtToken(e.target.value)}
              placeholder="Paste your JWT token here..."
            />
            <small>
              💡 Tip: Open multiple tabs (or incognito) to test multiple users. Each tab can use a different JWT token.
            </small>
          </div>

          {/* Create Wallet */}
          <div className="form-group">
            <button
              onClick={createWallet}
              disabled={isCreatingWallet}
              className="success"
              style={{ width: '100%', margin: 0 }}
            >
              {isCreatingWallet && <span className="spinner" />}
              💰 {isCreatingWallet ? 'Creating...' : 'Create Wallet'}
            </button>
            {createWalletStatus && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: `var(--${createWalletStatus.type === 'success' ? 'success' : createWalletStatus.type === 'error' ? 'danger' : 'info'})` }}>
                {createWalletStatus.message}
              </div>
            )}
          </div>

          {/* Deposit */}
          <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius)', marginBottom: '20px', border: '1px solid var(--border)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              💵 Deposit</h3>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label htmlFor="depositAmount">Amount *</label>
              <input
                type="number"
                id="depositAmount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(parseFloat(e.target.value))}
                placeholder="1"
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label htmlFor="depositUserId">User ID <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>(Optional)</span></label>
              <input
                type="text"
                id="depositUserId"
                value={depositUserId}
                onChange={(e) => setDepositUserId(e.target.value)}
                placeholder="Leave empty to use token user_id"
              />
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label htmlFor="depositReferenceId">Reference ID <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>(Optional)</span></label>
              <input
                type="text"
                id="depositReferenceId"
                value={depositReferenceId}
                onChange={(e) => setDepositReferenceId(e.target.value)}
                placeholder="string"
              />
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label htmlFor="depositMetadata">Metadata <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>(Optional - JSON)</span></label>
              <textarea
                id="depositMetadata"
                value={depositMetadata}
                onChange={(e) => setDepositMetadata(e.target.value)}
                placeholder='{"additionalProp1": {}}'
                style={{ minHeight: '60px', fontSize: '12px' }}
              />
            </div>
            <button
              onClick={deposit}
              disabled={isDepositing}
              className="success"
              style={{ width: '100%', margin: 0 }}
            >
              {isDepositing && <span className="spinner" />}
              💵 {isDepositing ? 'Processing...' : 'Deposit'}
            </button>
            {depositStatus && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: `var(--${depositStatus.type === 'success' ? 'success' : depositStatus.type === 'error' ? 'danger' : 'info'})` }}>
                {depositStatus.message}
              </div>
            )}
          </div>

          {/* User Info */}
          {userInfo && (
            <div className="user-info-box">
              <strong>👤 User:</strong> {userInfo.userId} | {userInfo.username}
            </div>
          )}

          {/* Status */}
          <div className={`status ${status.type}`}>
            {status.message}
          </div>

          {/* Troubleshooting */}
          <div className="info-box">
            <strong>⚠️ Troubleshooting:</strong>
            • Server must be running: <code>make dev</code><br />
            • Check browser console (F12) for errors<br />
            • Verify JWT token is valid (not expired)<br />
            • Ensure server URL is correct
          </div>

          {/* Connection Buttons */}
          <div className="quick-actions">
            <button onClick={() => connect(serverUrl, jwtToken)} disabled={isConnected}>
              Connect
            </button>
            <button onClick={disconnect} disabled={!isConnected} className="danger">
              Disconnect
            </button>
          </div>

          <h2 style={{ marginTop: '32px' }}>⚡ Quick Actions</h2>

          <div className="form-group">
            <label htmlFor="maxPlayers">Max Players</label>
            <input
              type="number"
              id="maxPlayers"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
              min="2"
              max="8"
            />
          </div>

          <div className="form-group">
            <label htmlFor="betValue">Bet Value</label>
            <input
              type="number"
              id="betValue"
              value={betValue}
              onChange={(e) => setBetValue(parseInt(e.target.value))}
              min="1"
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              {' '}Public Room
            </label>
          </div>

          {!isPublic && (
            <div className="form-group">
              <label htmlFor="password">Password (4 digits)</label>
              <input
                type="number"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="1234"
                min="1000"
                max="9999"
              />
            </div>
          )}

          <div className="quick-actions">
            <button onClick={createRoom} disabled={!isConnected} className="success">
              Create Room
            </button>
            <button onClick={createPrivateRoom} disabled={!isConnected}>
              Create Private Room
            </button>
          </div>

          <div className="form-group" style={{ marginTop: '24px' }}>
            <label htmlFor="roomId">Room ID (to join)</label>
            <input
              type="text"
              id="roomId"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Paste room_id here"
            />
          </div>

          <div className="form-group">
            <label htmlFor="joinPassword">Password (4 digits) <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>(Optional - required for private rooms)</span></label>
            <input
              type="number"
              id="joinPassword"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
              placeholder="1234"
              min="1000"
              max="9999"
            />
            <small>Required for private rooms. Leave empty for public rooms.</small>
          </div>

          <div className="quick-actions">
            <button onClick={joinRoom} disabled={!isConnected}>
              Join Room
            </button>
            <button onClick={leaveRoom} disabled={!isConnected || !roomId} className="danger">
              Leave Room
            </button>
            <button onClick={getRoomList} disabled={!isConnected}>
              Get Room List
            </button>
          </div>

          {/* Room Info */}
          <div className="room-info-box">
            <h3>🏠 Room Info</h3>
            <div>
              <div>Room ID: <span>{roomInfo?.id ? roomInfo.id.substring(0, 8) + '...' : '-'}</span></div>
              <div>Players: <span style={{ color: roomInfo?.current_players && roomInfo?.max_players && roomInfo.current_players >= roomInfo.max_players ? '#e74c3c' : roomInfo?.current_players && roomInfo.current_players > 0 ? '#f39c12' : '#95a5a6' }}>{roomInfo?.current_players ?? '-'}</span> / <span>{roomInfo?.max_players ?? '-'}</span></div>
              <div>Status: <span style={{ color: roomInfo?.is_active ? '#27ae60' : '#e74c3c' }}>{roomInfo?.is_active ? 'Active' : 'Inactive'}</span></div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="panel">
          <h2>📨 Messages</h2>

          <div className="quick-actions">
            <button onClick={clearMessages} className="danger">
              Clear
            </button>
            <button onClick={testInvalidNamespace} disabled={!isConnected}>
              Test Error
            </button>
          </div>

          <div className="messages">
            {messages.length === 0 ? (
              <div className="message">
                <span className="timestamp">[Ready]</span>
                <span>Enter JWT token and click Connect to start</span>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.type}`}>
                  <span className="timestamp">[{msg.timestamp}]</span>
                  <pre>{JSON.stringify(msg.content, null, 2)}</pre>
                </div>
              ))
            )}
          </div>

          <h2 style={{ marginTop: '32px' }}>📝 Send Custom Message</h2>

          <div className="form-group">
            <label htmlFor="namespace">Namespace</label>
            <input
              type="text"
              id="namespace"
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
              placeholder="room"
            />
          </div>

          <div className="form-group">
            <label htmlFor="event">Event</label>
            <select
              id="event"
              value={event}
              onChange={(e) => handleEventChange(e.target.value)}
            >
              <option value="create_room_request">create_room_request</option>
              <option value="join_room_request">join_room_request</option>
              <option value="leave_room_request">leave_room_request</option>
              <option value="get_room_list_request">get_room_list_request</option>
              <option value="custom">Custom Event...</option>
            </select>
            {event === 'custom' && (
              <input
                type="text"
                value={customEvent}
                onChange={(e) => setCustomEvent(e.target.value)}
                placeholder="Enter custom event name"
                style={{ marginTop: '8px' }}
              />
            )}
          </div>

          <div className="form-group">
            <label htmlFor="data">Data (JSON)</label>
            <textarea
              id="data"
              value={data}
              onChange={(e) => setData(e.target.value)}
              placeholder='{"max_players": 4, "is_public": true, "bet_value": 1000}'
            />
            <small>
              💡 Note: identity_key will be automatically generated for requests unless already provided.
            </small>
          </div>

          <button onClick={sendCustomMessage} disabled={!isConnected}>
            Send Message
          </button>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}

export default App;

