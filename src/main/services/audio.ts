import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import axios from 'axios';
import slugify from 'slugify';

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
      
      // Generate clean, slugified filename
      const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const time = Date.now().toString(36); // Short unique ID
      const shortPrompt = prompt.slice(0, 40).trim(); // Limit length
      const slug = slugify(shortPrompt, {
        lower: true,
        strict: true, // Remove special characters
        replacement: '-'
      });
      
      // Format: date-slug-uniqueid.wav (e.g., "2025-01-08-techno-beat-kick-drum-lq3k8.wav")
      const filename = `${date}-${slug}-${time}.wav`;
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