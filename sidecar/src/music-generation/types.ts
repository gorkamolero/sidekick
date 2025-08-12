export interface MusicGenerationParams {
  prompt: string;
  duration?: number;
  temperature?: number;
  mode?: 'default' | 'loop' | 'sample' | 'inspiration';
  model?: string;
  lyrics?: string;
  extendAudio?: string;
  makeInstrumental?: boolean;
  [key: string]: any;
}

export interface GeneratedMusic {
  audioUrl: string;
  duration: number;
  format: string;
  metadata: {
    service: string;
    timestamp: number;
    parameters: MusicGenerationParams;
    taskId?: string;
    model?: string;
  };
}

export interface ServiceCapabilities {
  maxDuration: number;
  minDuration: number;
  supportedModes: Array<'loop' | 'sample' | 'inspiration'>;
  supportedFormats: string[];
  hasLyricsSupport: boolean;
  hasExtensionSupport: boolean;
  hasStemSeparation: boolean;
  models?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface MusicGenerationService {
  name: string;
  generateMusic(params: MusicGenerationParams): Promise<GeneratedMusic>;
  getSupportedParameters(): ServiceCapabilities;
  validateParameters(params: MusicGenerationParams): ValidationResult;
  isAvailable(): Promise<boolean>;
}

export type ServiceName = 'musicgen' | 'suno' | 'udio';

export interface MusicServiceConfig {
  activeService: ServiceName;
  serviceConfigs: {
    musicgen?: MusicGenConfig;
    suno?: SunoConfig;
    udio?: UdioConfig;
  };
}

export interface MusicGenConfig {
  apiKey?: string;
  baseUrl: string;
  defaultModel: string;
  defaultDuration: number;
  temperature: number;
  topK: number;
  topP: number;
}

export interface SunoConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: 'v3.5' | 'v4' | 'v4.5';
  streamingEnabled: boolean;
  pollingInterval: number;
  maxPollingAttempts: number;
}

export interface UdioConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
}