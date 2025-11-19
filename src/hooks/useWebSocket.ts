import { useRef, useState, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import type { Message, RoomInfo } from '../types';

export const useWebSocket = (onMessage?: (message: Message) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<{ type: 'connected' | 'disconnected' | 'connecting'; message: string }>({
    type: 'disconnected',
    message: 'Disconnected'
  });
  const wsRef = useRef<WebSocket | null>(null);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);

  const addMessage = useCallback((type: Message['type'], content: any) => {
    const message: Message = {
      type,
      content,
      timestamp: new Date().toLocaleTimeString()
    };
    onMessage?.(message);
  }, [onMessage]);

  const connect = useCallback((serverUrl: string, token: string) => {
    if (!token) {
      toast.error('Please enter JWT token!');
      return;
    }

    if (!serverUrl.startsWith('ws://') && !serverUrl.startsWith('wss://')) {
      toast.error('Server URL must start with ws:// or wss://');
      return;
    }

    setStatus({ type: 'connecting', message: 'Connecting...' });
    addMessage('received', { type: 'system', message: 'Attempting to connect to ' + serverUrl });

    try {
      const urlWithToken = serverUrl + (serverUrl.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(token);
      console.log('Connecting to:', urlWithToken.replace(token, 'TOKEN_HIDDEN'));
      const ws = new WebSocket(urlWithToken);

      ws.onopen = () => {
        setIsConnected(true);
        setStatus({ type: 'connected', message: '✅ Connected' });
        addMessage('received', { type: 'system', message: '✅ Successfully connected to WebSocket server' });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'error') {
            addMessage('error', data);
          } else if (data.event === 'user_joined' || data.event === 'user_left') {
            addMessage('broadcast', data);
            if (data.data && data.data.room_id) {
              updateRoomInfoFromBroadcast(data.data);
            }
          } else if (data.event && data.event.includes('broadcast')) {
            addMessage('broadcast', data);
          } else {
            addMessage('received', data);

            if (data.event === 'create_room_response' && data.type === 'success' && data.data?.id) {
              setRoomInfo(data.data);
            } else if (data.event === 'join_room_response' && data.type === 'success' && data.data) {
              setRoomInfo(data.data);
            } else if (data.event === 'leave_room_response' && data.type === 'success') {
              setRoomInfo(null);
            } else if (data.event === 'get_room_list_response' && data.type === 'success' && data.data) {
              if (data.data.rooms && data.data.rooms.length > 0) {
                addMessage('received', {
                  type: 'info',
                  message: `Found ${data.data.count} room(s)`,
                  rooms: data.data.rooms
                });
              } else {
                addMessage('received', {
                  type: 'info',
                  message: 'No open rooms available'
                });
              }
            }
          }
        } catch (e) {
          addMessage('received', { raw: event.data });
        }
      };

      ws.onerror = (error) => {
        setStatus({ type: 'disconnected', message: '❌ Connection Error' });
        addMessage('error', {
          type: 'error',
          message: 'WebSocket error occurred',
          details: 'Check browser console (F12) for details. Make sure server is running and token is valid.'
        });
        console.error('WebSocket error:', error);
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setStatus({ type: 'disconnected', message: '❌ Disconnected' });

        let closeMessage = 'Disconnected from server';
        if (event.code !== 1000) {
          closeMessage += ` (Code: ${event.code}, Reason: ${event.reason || 'Unknown'})`;
          if (event.code === 1006) {
            closeMessage += ' - Connection closed abnormally. Check if server is running.';
          } else if (event.code === 1002) {
            closeMessage += ' - Protocol error. Check server logs.';
          } else if (event.code === 1008) {
            closeMessage += ' - Policy violation. Check authentication.';
          }
        }

        addMessage('received', { type: 'system', message: closeMessage, code: event.code });
      };

      wsRef.current = ws;
    } catch (error: any) {
      setStatus({ type: 'disconnected', message: '❌ Connection Failed' });
      addMessage('error', { type: 'error', message: error.message });
    }
  }, [addMessage]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: any, includeIdentityKey = true) => {
    if (!wsRef.current || !isConnected) {
      toast.error('Not connected! Please connect first.');
      return;
    }

    try {
      if (includeIdentityKey && !message.identity_key) {
        message.identity_key = 'req-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      }
      
      const messageStr = JSON.stringify(message);
      wsRef.current.send(messageStr);
      addMessage('sent', message);
    } catch (error: any) {
      addMessage('error', { type: 'error', message: error.message });
    }
  }, [isConnected, addMessage]);

  const updateRoomInfoFromBroadcast = useCallback((broadcastData: any) => {
    setRoomInfo(prev => {
      if (!prev) {
        return {
          id: broadcastData.room_id,
          current_players: broadcastData.current_players,
          max_players: broadcastData.max_players,
          is_active: true
        };
      }
      return {
        ...prev,
        current_players: broadcastData.current_players,
        max_players: broadcastData.max_players
      };
    });
  }, []);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    isConnected,
    status,
    roomInfo,
    setRoomInfo,
    connect,
    disconnect,
    sendMessage
  };
};

