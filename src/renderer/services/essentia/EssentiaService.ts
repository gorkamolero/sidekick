import { Essentia, EssentiaWASM } from 'essentia.js';
import { AudioAnalysisResult } from './types';
import { AudioLoader } from './audioLoader';
import { FeatureExtractor } from './featureExtractor';
import { InstrumentDetector } from './instrumentDetector';
import { StyleMapper } from './styleMapper';

export class EssentiaService {
  private essentia: any;
  private isInitialized = false;
  private audioLoader: AudioLoader;
  private featureExtractor: FeatureExtractor | null = null;
  private instrumentDetector: InstrumentDetector;
  private styleMapper: StyleMapper;
  
  constructor() {
    this.audioLoader = new AudioLoader();
    this.instrumentDetector = new InstrumentDetector();
    this.styleMapper = new StyleMapper();
    this.initialize();
  }
  
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Initialize Essentia.js
      this.essentia = new Essentia(EssentiaWASM);
      this.featureExtractor = new FeatureExtractor(this.essentia);
      
      this.isInitialized = true;
      console.log('✅ Essentia.js initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Essentia.js:', error);
      throw new Error(`Essentia.js initialization failed: ${error}`);
    }
  }
  
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
  
  async analyze(audioInput: File | ArrayBuffer | Float32Array): Promise<AudioAnalysisResult> {
    await this.ensureInitialized();
    
    if (!this.featureExtractor) {
      throw new Error('Feature extractor not initialized');
    }
    
    try {
      // Convert input to Float32Array
      const audioSignal = await this.audioLoader.loadAudio(audioInput);
      
      // Extract all features using Essentia.js
      const features = this.featureExtractor.extractFeatures(audioSignal);
      
      // Detect instruments using spectral features
      const instruments = this.instrumentDetector.detectInstruments(features);
      
      // Map features to musical style
      const style = this.styleMapper.mapToStyle(features);
      
      // Calculate valence from features
      const valence = this.styleMapper.calculateValence(features);
      
      return {
        bpm: features.bpm,
        tempo: features.tempo,
        key: features.key,
        scale: features.scale,
        energy: features.energy,
        valence,
        danceability: features.danceability,
        loudness: features.loudness,
        spectralCentroid: features.spectralCentroid,
        beats: features.beats,
        onset: features.onset,
        mfcc: features.mfcc,
        chromagram: features.chromagram,
        instruments,
        style
      };
    } catch (error) {
      console.error('Audio analysis failed:', error);
      throw new Error(`Failed to analyze audio: ${error}`);
    }
  }
  
  async detectBPM(audioFile: File | ArrayBuffer | Float32Array): Promise<number> {
    await this.ensureInitialized();
    
    if (!this.featureExtractor) {
      throw new Error('Feature extractor not initialized');
    }
    
    const audioSignal = await this.audioLoader.loadAudio(audioFile);
    const features = this.featureExtractor.extractFeatures(audioSignal);
    
    return features.bpm;
  }
  
  async detectKey(audioFile: File | ArrayBuffer | Float32Array): Promise<string> {
    await this.ensureInitialized();
    
    if (!this.featureExtractor) {
      throw new Error('Feature extractor not initialized');
    }
    
    const audioSignal = await this.audioLoader.loadAudio(audioFile);
    const features = this.featureExtractor.extractFeatures(audioSignal);
    
    return `${features.key} ${features.scale}`;
  }
  
  dispose(): void {
    // Clean up resources if needed
    this.essentia = null;
    this.isInitialized = false;
    this.featureExtractor = null;
  }
}