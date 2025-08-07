import { useMutation } from '@tanstack/react-query';
import { useStore } from '../lib/store';
import { KimiK2Provider } from '../lib/api/providers';

export function useAudioGeneration() {
  const { addGeneration, currentProject } = useStore();
  const provider = new KimiK2Provider();

  return useMutation({
    mutationFn: async (prompt: string) => {
      const result = await provider.generate(prompt, {
        bpm: currentProject?.bpm,
        key: currentProject?.key,
      });

      // Download audio
      const response = await fetch(result.audioUrl);
      const buffer = await response.arrayBuffer();
      
      // Save locally
      const filename = `sidekick_${Date.now()}.wav`;
      const filePath = await window.electron.saveAudioFile(buffer, filename);

      // Add to history
      const generation = {
        id: crypto.randomUUID(),
        prompt,
        timestamp: new Date(),
        audioUrl: result.audioUrl,
        filePath,
        duration: result.duration,
        bpm: currentProject?.bpm || 120,
        key: currentProject?.key || 'C',
        tags: [],
      };

      addGeneration(generation);
      return generation;
    },
  });
}