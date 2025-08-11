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

    if (process.env.SUNO_API_KEY) {
      const sunoConfig: SunoConfig = {
        apiKey: process.env.SUNO_API_KEY,
        baseUrl: process.env.SUNO_API_URL || 'https://api.sunoapi.org',
        defaultModel: 'V4',
        streamingEnabled: true,
        pollingInterval: 2000,
        maxPollingAttempts: 120
      };

      const sunoAdapter = new SunoAdapter(sunoConfig);
      managerInstance.registerService('suno', sunoAdapter);
      managerInstance.setActiveService('suno');
      console.log('✅ Suno service registered and set as active');
    }
  }

  return managerInstance;
}