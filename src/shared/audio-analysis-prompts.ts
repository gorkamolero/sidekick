// Audio Analysis System Prompts

export const AUDIO_ANALYSIS_PROMPT = `Listen to this audio and tell me what you hear.

Technical reference from Essentia.js analysis:
{technicalData}

After your analysis, also cover:
1. Based on the bass you hear and the key, what's the chord progression?
2. Describe the different sections (if any)
3. Describe the stereo field
4. Describe the production style`;

export function buildAudioAnalysisPrompt(technicalData: any): string {
  // Format technical data simply
  const technicalSection = `
Duration: ${technicalData.duration?.toFixed(1) || "N/A"} seconds
BPM: ${technicalData.bpm?.toFixed(1) || "N/A"}
Key: ${technicalData.key || "N/A"} ${technicalData.scale || ""}
Energy: ${technicalData.energy?.toFixed(2) || "N/A"}
Loudness: ${technicalData.loudness?.toFixed(2) || "N/A"}
Spectral Centroid: ${technicalData.spectralCentroid?.toFixed(2) || "N/A"}
Danceability: ${technicalData.danceability ? (technicalData.danceability * 100).toFixed(1) + "%" : "N/A"}
`.trim();

  return AUDIO_ANALYSIS_PROMPT.replace("{technicalData}", technicalSection);
}
