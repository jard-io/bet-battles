export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  wins: number;
  losses: number;
  created_at: Date;
  updated_at: Date;
}

export interface Pick {
  id: string;
  user_id: string;
  projection_id: string;
  pick_type: 'OVER' | 'UNDER';
  player_name: string;
  stat_type: string;
  line_score: number;
  outcome?: 'WIN' | 'LOSS';
  is_resolved: boolean;
  created_at: Date;
}

export interface CustomBet {
  id: string;
  creator_id: string;
  player: string;
  stat: string;
  line: number;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED';
  outcome?: 'WIN' | 'LOSS';
  created_at: Date;
  updated_at: Date;
}

export interface CustomBetParticipant {
  id: string;
  bet_id: string;
  user_id: string;
  pick_type: 'OVER' | 'UNDER';
  outcome?: 'WIN' | 'LOSS';
  joined_at: Date;
}

import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export interface JWTPayload {
  id: string;
  username: string;
  email: string;
}
