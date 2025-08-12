import { MusicGenerationManager } from './MusicGenerationManager';
import { MusicGenAdapter } from './adapters/MusicGenAdapter';
import { SunoAdapter } from './adapters/SunoAdapter';
import { MusicGenConfig, SunoConfig } from './types';

let managerInstance: MusicGenerationManager | null = null;

export function getMusicGenerationManager(): MusicGenerationManager {
  if (!managerInstance) {
    managerInstance = new MusicGenerationManager({
      activeService: 'suno',
      serviceConfigs: {}
    });

    const musicGenConfig: MusicGenConfig = {
      apiKey: process.env.REPLICATE_API_TOKEN,
      baseUrl: 'https://api.replicate.com',
      defaultModel: 'stereo-large',
      defaultDuration: 8,
      temperature: 1.0,
      topK: 250,
      topP: 0.95
    };

    const musicGenAdapter = new MusicGenAdapter(musicGenConfig);
    managerInstance.registerService('musicgen', musicGenAdapter);

    const sunoConfig: SunoConfig = {
      apiKey: '656c27545ccf303dfdc5e5d82bb302c3',
      baseUrl: 'https://api.sunoapi.org',
      defaultModel: 'V4',
      streamingEnabled: true,
      pollingInterval: 2000,
      maxPollingAttempts: 120
    };

    const sunoAdapter = new SunoAdapter(sunoConfig);
    managerInstance.registerService('suno', sunoAdapter);
    managerInstance.setActiveService('suno');

  }

  return managerInstance;
}