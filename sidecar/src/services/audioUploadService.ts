import fs from 'fs';
import path from 'path';
import https from 'https';
import FormData from 'form-data';

export class AudioUploadService {
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB - litterbox can handle it
  
  /**
   * Upload audio file to temporary hosting service (file.io)
   * Files automatically expire after specified time
   */
  async uploadTemporary(
    filePath: string,
    expiresIn = '1h'
  ): Promise<{ url: string; expires: string }> {
    try {
      // Check file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      // Check file size
      const stats = fs.statSync(filePath);
      if (stats.size > this.MAX_FILE_SIZE) {
        throw new Error(`File too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB (max 50MB)`);
      }
      
      console.log(`📤 Uploading ${path.basename(filePath)} (${(stats.size / 1024 / 1024).toFixed(2)}MB) to temporary storage...`);
      
      // Use litterbox as primary service - it's more reliable
      const url = await this.uploadToLitterbox(filePath, expiresIn);
      return {
        url,
        expires: expiresIn
      };
      
    } catch (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }
  }
  
  /**
   * Upload audio buffer directly (for generated audio)
   */
  async uploadBuffer(
    buffer: Buffer,
    filename: string,
    expiresIn = '1h'
  ): Promise<{ url: string; expires: string }> {
    try {
      // Check buffer size
      if (buffer.length > this.MAX_FILE_SIZE) {
        throw new Error(`Buffer too large: ${(buffer.length / 1024 / 1024).toFixed(2)}MB (max 10MB)`);
      }
      
      console.log(`📤 Uploading ${filename} buffer (${(buffer.length / 1024 / 1024).toFixed(2)}MB) to temporary storage...`);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', buffer, filename);
      
      // Upload to file.io
      const response = await fetch(`https://file.io/?expires=${expiresIn}`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const result = await response.json() as any;
      
      if (!result.success || !result.link) {
        throw new Error(`Upload failed: ${result.message || 'Unknown error'}`);
      }
      
      console.log(`✅ Upload complete: ${result.link}`);
      
      return {
        url: result.link,
        expires: result.expires || expiresIn
      };
      
    } catch (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }
  }
  
  /**
   * Upload to litterbox (catbox.moe temporary storage)
   * Reliable temporary file hosting with customizable expiration
   */
  async uploadToLitterbox(filePath: string, expiresIn = '1h'): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log('📤 Uploading to litterbox.catbox.moe...');
      
      const formData = new FormData();
      
      // Add fields in exact order as curl
      formData.append('reqtype', 'fileupload');
      formData.append('time', expiresIn); // 1h, 12h, 24h, 72h
      
      // Add file
      const fileStream = fs.createReadStream(filePath);
      const fileName = path.basename(filePath);
      formData.append('fileToUpload', fileStream, fileName);
      
      // Use form-data's submit method which properly handles the request
      formData.submit('https://litterbox.catbox.moe/resources/internals/api.php', (err, res) => {
        if (err) {
          console.error('❌ Litterbox upload failed:', err);
          reject(err);
          return;
        }
        
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', () => {
          const url = data.trim();
          
          if (!url.startsWith('http')) {
            console.error('Invalid response:', url);
            reject(new Error(`Invalid URL returned: ${url}`));
            return;
          }
          
          console.log(`✅ Upload complete: ${url}`);
          resolve(url);
        });
        
        res.on('error', (error) => {
          console.error('❌ Response error:', error);
          reject(error);
        });
      });
    });
  }
  
  /**
   * Alternative: Upload to 0x0.st (backup option)
   * Fallback option if other services are down
   */
  async uploadTo0x0(filePath: string): Promise<string> {
    return this.uploadToLitterbox(filePath, '1h');
  }
}

export const audioUploadService = new AudioUploadService();