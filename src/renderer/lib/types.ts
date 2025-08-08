export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface Generation {
  id: string;
  prompt: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: {
    url?: string;
    audioData?: ArrayBuffer;
    lyrics?: string;
    title?: string;
    style?: string;
    tags?: string[];
  };
  error?: string;
  timestamp: Date;
  provider?: string;
}

export interface ProjectInfo {
  name: string;
  tempo: number;
  key?: string;
  timeSignature?: string;
}

export interface AudioAnalysis {
  tempo?: number;
  key?: string;
  energy?: number;
  danceability?: number;
  valence?: number;
  acousticness?: number;
  instrumentalness?: number;
  loudness?: number;
  spectralCentroid?: number[];
}

export type MusicProvider = 'suno' | 'udio' | 'google';

export interface ApiKey {
  suno?: string;
  udio?: string;
  google?: string;
}