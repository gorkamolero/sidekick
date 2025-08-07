import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import axios from 'axios';

export class AudioService {
  private audioDir: string;

  constructor() {
    // Create audio directory in user's documents
    this.audioDir = path.join(os.homedir(), 'Documents', 'Sidekick', 'Generated Audio');
    this.ensureAudioDirectory();
  }

  private ensureAudioDirectory() {
    if (!fs.existsSync(this.audioDir)) {
      fs.mkdirSync(this.audioDir, { recursive: true });
    }
  }

  async downloadAndSave(audioUrl: string, prompt: string): Promise<string> {
    try {
      console.log('📁 Downloading audio file...');
      
      // Generate filename from prompt
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const cleanPrompt = prompt.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 50);
      const filename = `${timestamp}_${cleanPrompt}.wav`;
      const filepath = path.join(this.audioDir, filename);

      // Download the audio file
      const response = await axios.get(audioUrl, { responseType: 'stream' });
      const writer = fs.createWriteStream(filepath);

      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log('📁 Audio saved to:', filepath);
          resolve(filepath);
        });
        writer.on('error', reject);
      });

    } catch (error) {
      console.error('📁 Failed to save audio:', error);
      throw new Error(`Failed to save audio file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}