export interface Message {
  type: 'sent' | 'received' | 'error' | 'broadcast';
  content: any;
  timestamp?: string;
}

export interface RoomInfo {
  id?: string;
  owner_id?: string;
  max_players?: number;
  current_players?: number;
  is_public?: boolean;
  bet_value?: number;
  minimum_amount?: number;
  is_active?: boolean;
  match_id?: string;
  created_at?: number;
  updated_at?: number;
  seat_index?: number;
}

export interface UserInfo {
  userId: string;
  username: string;
}

export interface WebSocketMessage {
  namespace: string;
  event: string;
  data: any;
  identity_key?: string;
}

export interface CreateRoomData {
  max_players: number;
  is_public: boolean;
  bet_value: number;
  password?: number;
}

export interface JoinRoomData {
  room_id: string;
  password?: number;
}

export interface DepositData {
  amount: number;
  user_id?: string;
  reference_id?: string;
  metadata?: Record<string, any>;
}

