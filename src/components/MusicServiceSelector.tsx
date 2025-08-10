import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface MusicService {
  id: 'musicgen' | 'suno' | 'udio';
  name: string;
  available: boolean;
}

export const MusicServiceSelector: React.FC = () => {
  const [activeService, setActiveService] = useState<string>('musicgen');
  const [isOpen, setIsOpen] = useState(false);
  const [services, setServices] = useState<MusicService[]>([
    { id: 'musicgen', name: 'MUSICGEN', available: true },
    { id: 'suno', name: 'SUNO', available: false },
    { id: 'udio', name: 'UDIO', available: false },
  ]);

  useEffect(() => {
    // Load saved preference
    const saved = localStorage.getItem('preferredMusicService');
    if (saved && services.find(s => s.id === saved && s.available)) {
      setActiveService(saved);
    }

    // Check service availability
    checkServiceAvailability();
  }, []);

  const checkServiceAvailability = async () => {
    // Check if Suno API key exists
    const hasSunoKey = !!process.env.SUNO_API_KEY || !!localStorage.getItem('suno_api_key');
    
    setServices(prev => prev.map(service => ({
      ...service,
      available: service.id === 'musicgen' || (service.id === 'suno' && hasSunoKey)
    })));
  };

  const handleServiceChange = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service?.available) return;

    setActiveService(serviceId);
    localStorage.setItem('preferredMusicService', serviceId);
    setIsOpen(false);

    // Notify the music generation manager
    // TODO: Implement service switching in Tauri
    // await invoke('set_music_service', { serviceId });
  };

  const activeServiceData = services.find(s => s.id === activeService);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-widest text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <span>{activeServiceData?.name}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-32 bg-[var(--color-surface)] border border-[var(--color-text-dim)] z-50">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => handleServiceChange(service.id)}
                disabled={!service.available}
                className={`w-full px-3 py-2 text-xs uppercase tracking-widest text-left transition-colors ${
                  service.id === activeService
                    ? 'bg-[var(--color-accent)] text-black'
                    : service.available
                    ? 'hover:bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                    : 'opacity-30 cursor-not-allowed text-[var(--color-text-dim)]'
                }`}
              >
                {service.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};