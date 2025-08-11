import decode from 'audio-decode';

export interface ChordResult {
  chord: string;
  confidence: number;
  timestamp: number;
}

export interface ChordProgression {
  chords: ChordResult[];
  key?: string;
  tempo?: number;
}

export class ChordDetectionService {
  private essentia: any;
  private isInitialized = false;
  private frameSize = 4096;
  private hopSize = 2048;
  private sampleRate = 44100;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      const EssentiaModule = await import('essentia.js');
      const { Essentia, EssentiaWASM } = EssentiaModule;
      this.essentia = new Essentia(EssentiaWASM);
      this.isInitialized = true;
      console.log('✅ Essentia.js initialized for chord detection');
    } catch (error) {
      console.error('Failed to initialize Essentia.js:', error);
      throw new Error('Chord detection service initialization failed');
    }
  }

  private mixToMono(channelData: Float32Array[]): Float32Array {
    const length = channelData[0].length;
    const mono = new Float32Array(length);
    
    for (let i = 0; i < length; i++) {
      mono[i] = (channelData[0][i] + channelData[1][i]) / 2;
    }
    return mono;
  }

  async analyzeAudioBuffer(audioBuffer: ArrayBuffer): Promise<ChordProgression> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Decode audio buffer
      const audioData = await decode(audioBuffer);
      
      // Convert to mono if stereo
      const monoData = audioData.numberOfChannels > 1
        ? this.mixToMono([audioData.getChannelData(0), audioData.getChannelData(1)])
        : audioData.getChannelData(0);
      
      // Convert to Essentia vector
      const audioVector = this.essentia.arrayToVector(monoData);
      
      // Detect chords
      const chords = this.detectChords(audioVector);
      
      // Detect key
      const key = this.detectKey(audioVector);
      
      // Calculate tempo
      const tempo = this.calculateTempo(audioVector);
      
      // Clean up
      audioVector.delete();
      
      return {
        chords,
        key,
        tempo
      };
    } catch (error) {
      console.error('Chord analysis failed:', error);
      throw new Error('Failed to analyze audio for chord progression');
    }
  }

  private detectChords(audioVector: any): ChordResult[] {
    const results: ChordResult[] = [];
    const timeStep = this.hopSize / this.sampleRate;
    
    // Convert vector to array for manual frame processing
    const signalArray = this.essentia.vectorToArray(audioVector);
    const numFrames = Math.floor((signalArray.length - this.frameSize) / this.hopSize) + 1;
    
    // Collect HPCP vectors for all frames
    const hpcpSequence = [];
    
    for (let i = 0; i < numFrames; i++) {
      const startIdx = i * this.hopSize;
      const endIdx = startIdx + this.frameSize;
      
      if (endIdx > signalArray.length) break;
      
      // Extract frame and convert to vector
      const frameArray = signalArray.slice(startIdx, endIdx);
      const frame = this.essentia.arrayToVector(frameArray);
      
      try {
        // Apply Blackman-Harris window for better frequency resolution
        const windowed = this.essentia.Windowing(frame);

        // Compute spectrum
        const spectrum = this.essentia.Spectrum(windowed.frame);

        // Extract spectral peaks for HPCP computation
        const peaks = this.essentia.SpectralPeaks(spectrum.spectrum);

        // Compute HPCP directly from peaks
        const hpcp = this.essentia.HPCP(
          peaks.frequencies,
          peaks.magnitudes
        );
        
        // Convert HPCP to array and store
        const hpcpArray = this.essentia.vectorToArray(hpcp.hpcp);
        hpcpSequence.push(hpcpArray);

        // Clean up frame resources
        frame.delete();
        windowed.frame.delete();
        spectrum.spectrum.delete();
        peaks.frequencies.delete();
        peaks.magnitudes.delete();
        hpcp.hpcp.delete();
      } catch (frameError) {
        console.warn(`Frame ${i} HPCP extraction failed:`, frameError);
        frame.delete();
      }
    }
    
    // Process chords frame by frame instead
    // Since ChordsDetection needs accumulated frames, let's use a simpler approach
    for (let i = 0; i < hpcpSequence.length; i++) {
      const hpcpVector = this.essentia.arrayToVector(hpcpSequence[i]);
      
      try {
        // Use ChordsDescriptors for single frame analysis
        const chordResult = this.essentia.ChordsDescriptors(hpcpVector);
        
        if (chordResult.chords && chordResult.chords !== 'N') {
          results.push({
            chord: chordResult.chords,
            confidence: chordResult.chordsStrength || 0,
            timestamp: i * timeStep
          });
        }
        
        hpcpVector.delete();
      } catch (error) {
        // If ChordsDescriptors doesn't exist, try Key detection as fallback
        try {
          const keyResult = this.essentia.Key(hpcpVector);
          const chord = `${keyResult.key} ${keyResult.scale}`;
          results.push({
            chord: chord,
            confidence: keyResult.strength || 0,
            timestamp: i * timeStep
          });
        } catch (keyError) {
          // Skip this frame
        }
        hpcpVector.delete();
      }
    }

    return this.smoothChordProgression(results);
  }

  private detectKey(audioVector: any): string {
    try {
      // Use Essentia's Key extractor
      const keyResult = this.essentia.KeyExtractor(audioVector);
      return `${keyResult.key} ${keyResult.scale}`;
    } catch (error) {
      console.warn('Key detection failed:', error);
      return 'C major';
    }
  }

  private calculateTempo(audioVector: any): number {
    try {
      // Use Essentia's rhythm extractor
      const rhythmResult = this.essentia.RhythmExtractor2013(audioVector);
      return Math.round(rhythmResult.bpm);
    } catch (error) {
      console.warn('Tempo detection failed:', error);
      return 120;
    }
  }

  private smoothChordProgression(chords: ChordResult[]): ChordResult[] {
    if (chords.length <= 2) return chords;

    const smoothed: ChordResult[] = [];
    let currentChord = chords[0];
    let chordStart = currentChord.timestamp;
    let confidenceSum = currentChord.confidence;
    let count = 1;

    for (let i = 1; i < chords.length; i++) {
      if (chords[i].chord === currentChord.chord) {
        confidenceSum += chords[i].confidence;
        count++;
      } else {
        // Only keep chord if it appears for more than 3 frames or is the first
        if (count >= 3 || smoothed.length === 0) {
          smoothed.push({
            chord: currentChord.chord,
            confidence: confidenceSum / count,
            timestamp: chordStart
          });
        }
        
        currentChord = chords[i];
        chordStart = currentChord.timestamp;
        confidenceSum = currentChord.confidence;
        count = 1;
      }
    }

    // Add the last chord if significant
    if (count >= 3) {
      smoothed.push({
        chord: currentChord.chord,
        confidence: confidenceSum / count,
        timestamp: chordStart
      });
    }

    return smoothed;
  }

  async analyzeFile(filePath: string): Promise<ChordProgression> {
    try {
      const response = await fetch(filePath);
      const arrayBuffer = await response.arrayBuffer();
      return this.analyzeAudioBuffer(arrayBuffer);
    } catch (error) {
      console.error('Failed to analyze file:', error);
      throw new Error('Failed to load and analyze audio file');
    }
  }

  dispose(): void {
    this.isInitialized = false;
    this.essentia = null;
  }
}

export const chordDetectionService = new ChordDetectionService();