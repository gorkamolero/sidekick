import { 
  MusicGenerationService, 
  MusicGenerationParams, 
  GeneratedMusic,
  ServiceName,
  MusicServiceConfig,
  ServiceCapabilities,
  ValidationResult
} from './types';

export class MusicGenerationManager {
  private currentService: MusicGenerationService | null = null;
  private services: Map<ServiceName, MusicGenerationService> = new Map();
  private config: MusicServiceConfig;

  constructor(config?: MusicServiceConfig) {
    this.config = config || {
      activeService: 'musicgen',
      serviceConfigs: {}
    };
  }

  registerService(name: ServiceName, service: MusicGenerationService): void {
    this.services.set(name, service);
    
    if (!this.currentService && name === this.config.activeService) {
      this.currentService = service;
    }
  }

  setActiveService(serviceName: ServiceName): void {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service "${serviceName}" is not registered`);
    }
    
    this.currentService = service;
    this.config.activeService = serviceName;
  }

  getActiveService(): ServiceName | null {
    if (!this.currentService) return null;
    
    for (const [name, service] of this.services.entries()) {
      if (service === this.currentService) {
        return name;
      }
    }
    return null;
  }

  async generate(params: MusicGenerationParams): Promise<GeneratedMusic> {
    if (!this.currentService) {
      throw new Error('No music generation service is active');
    }

    const validation = this.currentService.validateParameters(params);
    if (!validation.valid) {
      throw new Error(`Invalid parameters: ${validation.errors?.join(', ')}`);
    }

    const isAvailable = await this.currentService.isAvailable();
    if (!isAvailable) {
      const fallbackService = await this.findAvailableService();
      if (fallbackService) {
        console.warn(`Service ${this.currentService.name} unavailable, falling back to ${fallbackService.name}`);
        this.currentService = fallbackService;
      } else {
        throw new Error('No music generation services are currently available');
      }
    }

    try {
      const result = await this.currentService.generateMusic(params);
      
      result.metadata.service = this.currentService.name;
      result.metadata.timestamp = Date.now();
      
      return result;
    } catch (error) {
      console.error(`Music generation failed with ${this.currentService.name}:`, error);
      
      const fallbackService = await this.findAvailableService(this.currentService.name);
      if (fallbackService) {
        console.warn(`Retrying with fallback service: ${fallbackService.name}`);
        this.currentService = fallbackService;
        return this.generate(params);
      }
      
      throw error;
    }
  }

  listAvailableServices(): ServiceName[] {
    return Array.from(this.services.keys());
  }

  async getServiceCapabilities(serviceName?: ServiceName): Promise<ServiceCapabilities | null> {
    const service = serviceName 
      ? this.services.get(serviceName) 
      : this.currentService;
    
    if (!service) return null;
    
    return service.getSupportedParameters();
  }

  validateParameters(params: MusicGenerationParams, serviceName?: ServiceName): ValidationResult {
    const service = serviceName 
      ? this.services.get(serviceName) 
      : this.currentService;
    
    if (!service) {
      return {
        valid: false,
        errors: ['No service available for validation']
      };
    }
    
    return service.validateParameters(params);
  }

  private async findAvailableService(excludeService?: string): Promise<MusicGenerationService | null> {
    for (const service of this.services.values()) {
      if (service.name === excludeService) continue;
      
      try {
        const isAvailable = await service.isAvailable();
        if (isAvailable) {
          return service;
        }
      } catch (error) {
        console.error(`Error checking availability for ${service.name}:`, error);
      }
    }
    
    return null;
  }

  async healthCheck(): Promise<Record<ServiceName, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [name, service] of this.services.entries()) {
      try {
        results[name] = await service.isAvailable();
      } catch (error) {
        console.error(`Health check failed for ${name}:`, error);
        results[name] = false;
      }
    }
    
    return results as Record<ServiceName, boolean>;
  }

  getConfig(): MusicServiceConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<MusicServiceConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.activeService && config.activeService !== this.getActiveService()) {
      this.setActiveService(config.activeService);
    }
  }
}