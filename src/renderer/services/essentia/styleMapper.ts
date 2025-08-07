import { EssentiaFeatures } from './types';

export class StyleMapper {
  mapToStyle(features: EssentiaFeatures): string[] {
    const styles: string[] = [];
    const bpm = features.bpm;
    const energy = features.energy;
    const danceability = features.danceability;
    
    // BPM-based genre classification
    if (bpm >= 60 && bpm <= 90) {
      styles.push('downtempo');
      if (energy < 0.4) styles.push('ambient');
    } else if (bpm >= 90 && bpm <= 110) {
      styles.push('hip-hop');
      if (danceability > 0.7) styles.push('trap');
    } else if (bpm >= 110 && bpm <= 130) {
      styles.push('house');
      if (energy > 0.7) styles.push('tech-house');
      if (features.key && features.key.includes('minor')) styles.push('deep-house');
    } else if (bpm >= 130 && bpm <= 140) {
      styles.push('techno');
      if (energy > 0.8) styles.push('hard-techno');
    } else if (bpm >= 140 && bpm <= 150) {
      styles.push('trance');
      if (energy > 0.8) styles.push('psytrance');
    } else if (bpm >= 160 && bpm <= 180) {
      styles.push('drum-and-bass');
      if (energy > 0.7) styles.push('neurofunk');
    } else if (bpm >= 180) {
      styles.push('hardcore');
      styles.push('gabber');
    }
    
    // Energy-based modifiers
    if (energy > 0.8) {
      styles.push('energetic');
      styles.push('intense');
    } else if (energy < 0.3) {
      styles.push('chill');
      styles.push('relaxed');
    }
    
    // Danceability modifiers
    if (danceability > 0.8) {
      styles.push('danceable');
      styles.push('club');
    }
    
    // Key-based mood
    if (features.scale === 'major') {
      styles.push('uplifting');
    } else if (features.scale === 'minor') {
      styles.push('melancholic');
    }
    
    // Spectral characteristics
    if (features.spectralCentroid < 1000) {
      styles.push('bass-heavy');
    } else if (features.spectralCentroid > 3000) {
      styles.push('bright');
    }
    
    // Return unique styles
    return [...new Set(styles)].slice(0, 5); // Limit to 5 most relevant
  }
  
  calculateValence(features: EssentiaFeatures): number {
    // Valence: musical positivity (0 = sad/negative, 1 = happy/positive)
    let valence = 0.5; // Neutral baseline
    
    // Major keys are generally more positive
    if (features.scale === 'major') {
      valence += 0.2;
    } else if (features.scale === 'minor') {
      valence -= 0.2;
    }
    
    // Higher tempo can indicate more positive mood (within reason)
    if (features.bpm >= 120 && features.bpm <= 140) {
      valence += 0.1;
    } else if (features.bpm < 80) {
      valence -= 0.1;
    }
    
    // Brighter sounds (higher spectral centroid) are often more positive
    const normalizedSpectralCentroid = Math.min(features.spectralCentroid / 4000, 1);
    valence += (normalizedSpectralCentroid - 0.5) * 0.2;
    
    // Energy can contribute to positivity
    valence += features.energy * 0.1;
    
    // Harmonic content (from chromagram) can indicate complexity and positivity
    const harmonicRichness = features.chromagram.reduce((sum, val) => sum + val, 0) / features.chromagram.length;
    valence += harmonicRichness * 0.1;
    
    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, valence));
  }
}