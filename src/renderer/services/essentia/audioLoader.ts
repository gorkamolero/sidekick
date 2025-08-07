export class AudioLoader {
  async loadAudio(input: File | ArrayBuffer | Float32Array): Promise<Float32Array> {
    if (input instanceof Float32Array) {
      return input;
    }
    
    let arrayBuffer: ArrayBuffer;
    if (input instanceof File) {
      arrayBuffer = await input.arrayBuffer();
    } else {
      arrayBuffer = input;
    }
    
    return this.decodeAudioData(arrayBuffer);
  }
  
  private async decodeAudioData(arrayBuffer: ArrayBuffer): Promise<Float32Array> {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // For now, just use the first channel
    const channelData = audioBuffer.getChannelData(0);
    
    // Return as Float32Array
    return new Float32Array(channelData);
  }
}