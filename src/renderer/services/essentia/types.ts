export interface EssentiaFeatures {
  bpm: number;
  key: string;
  scale: string;
  energy: number;
  danceability: number;
  loudness: number;
  spectralCentroid: number;
  mfcc: Float32Array;
  spectralRolloff: number;
  zeroCrossingRate: number;
  spectralContrast: Float32Array;
  chromagram: Float32Array;
  onset: Float32Array;
  tempo: number;
  beats: Float32Array;
  ticks: Float32Array;
}

export interface AudioAnalysisResult {
  instruments: InstrumentTag[];
  style: string[];
  bpm: number;
  key: string;
  scale: string;
  energy: number;
  valence: number;
  danceability: number;
  loudness: number;
  spectralCentroid: number;
  tempo: number;
  beats: Float32Array;
  onset: Float32Array;
  mfcc: Float32Array;
  chromagram: Float32Array;
}

export interface InstrumentTag {
  label: string;
  confidence: number;
}