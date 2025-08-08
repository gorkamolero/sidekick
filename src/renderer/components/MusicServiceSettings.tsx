import React, { useState, useEffect } from 'react';
import { getMusicGenerationManager } from '../../services/music-generation/manager';
import type { ServiceName } from '../../services/music-generation/types';

export const MusicServiceSettings: React.FC = () => {
  const [activeService, setActiveService] = useState<ServiceName>('musicgen');
  const [availableServices, setAvailableServices] = useState<ServiceName[]>([]);
  const [serviceHealth, setServiceHealth] = useState<Record<ServiceName, boolean>>({} as Record<ServiceName, boolean>);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const manager = getMusicGenerationManager();
      const services = manager.listAvailableServices();
      setAvailableServices(services);
      
      const current = manager.getActiveService();
      if (current) {
        setActiveService(current);
      }
      
      const health = await manager.healthCheck();
      setServiceHealth(health);
    } catch (error) {
      console.error('Failed to load music service settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceChange = async (service: ServiceName) => {
    try {
      const manager = getMusicGenerationManager();
      manager.setActiveService(service);
      setActiveService(service);
      
      localStorage.setItem('preferredMusicService', service);
    } catch (error) {
      console.error('Failed to change music service:', error);
    }
  };

  const refreshHealth = async () => {
    setLoading(true);
    try {
      const manager = getMusicGenerationManager();
      const health = await manager.healthCheck();
      setServiceHealth(health);
    } catch (error) {
      console.error('Failed to check service health:', error);
    } finally {
      setLoading(false);
    }
  };

  const getServiceDetails = (service: ServiceName) => {
    const details = {
      musicgen: {
        name: 'MusicGen (Meta)',
        description: 'High-quality music generation by Meta',
        features: ['30s max duration', 'Melody continuation', 'Multiple models'],
      },
      suno: {
        name: 'Suno AI',
        description: 'Advanced music generation with lyrics support',
        features: ['120s max duration', 'Lyrics generation', 'Stem separation', 'Multiple versions'],
      },
      udio: {
        name: 'Udio',
        description: 'Professional music generation platform',
        features: ['Coming soon'],
      },
    };
    return details[service];
  };

  return (
    <div className="music-service-settings p-4 bg-gray-900 rounded-lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">Music Generation Service</h3>
        <p className="text-sm text-gray-400">
          Choose which AI service to use for generating music
        </p>
      </div>

      <div className="space-y-3">
        {availableServices.map((service) => {
          const details = getServiceDetails(service);
          const isHealthy = serviceHealth[service];
          const isActive = service === activeService;

          return (
            <div
              key={service}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                isActive
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
              }`}
              onClick={() => handleServiceChange(service)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-white">{details.name}</h4>
                    {isActive && (
                      <span className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded">
                        Active
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        isHealthy === undefined
                          ? 'bg-gray-600 text-gray-300'
                          : isHealthy
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {isHealthy === undefined
                        ? 'Unknown'
                        : isHealthy
                        ? 'Available'
                        : 'Unavailable'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{details.description}</p>
                  <ul className="mt-2 space-y-1">
                    {details.features.map((feature, idx) => (
                      <li key={idx} className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="text-blue-400">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="ml-3">
                  <input
                    type="radio"
                    checked={isActive}
                    onChange={() => handleServiceChange(service)}
                    className="w-4 h-4 text-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={refreshHealth}
          disabled={loading}
          className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Checking...' : 'Check Availability'}
        </button>
        
        {!availableServices.includes('suno' as ServiceName) && (
          <p className="text-xs text-gray-500">
            Add SUNO_API_KEY to enable Suno
          </p>
        )}
      </div>
    </div>
  );
};