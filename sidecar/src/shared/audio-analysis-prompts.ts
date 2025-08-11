// Audio Analysis System Prompts

export const AUDIO_ANALYSIS_PROMPT = `Listen to this audio and tell me what you hear.

Technical reference from Essentia.js analysis:
{technicalData}

After your analysis, also cover:
1. Identify the chord progressions for each section (verse, chorus, etc.) using the detected chords as reference points - look for patterns that repeat
2. Describe the different sections with their approximate timestamps
3. Describe the stereo field
4. Describe the production style`;

export function buildAudioAnalysisPrompt(technicalData: any): string {
  // Format chord progression if available
  let chordSection = "";
  if (technicalData.chords && technicalData.chords.length > 0) {
    const chordSummary = technicalData.chords
      .slice(0, 20) // First 20 chords to keep it concise
      .map(c => `${c.chord} (${c.timestamp.toFixed(1)}s)`)
      .join(", ");
    chordSection = `\nDetected Chords: ${chordSummary}${technicalData.chords.length > 20 ? ` ... and ${technicalData.chords.length - 20} more` : ""}`;
  }

  // Format technical data simply
  const technicalSection = `
Duration: ${technicalData.duration?.toFixed(1) || "N/A"} seconds
BPM: ${technicalData.bpm?.toFixed(1) || "N/A"}
Key: ${technicalData.key || "N/A"} ${technicalData.scale || ""}
Energy: ${technicalData.energy?.toFixed(2) || "N/A"}
Loudness: ${technicalData.loudness?.toFixed(2) || "N/A"}
Spectral Centroid: ${technicalData.spectralCentroid?.toFixed(2) || "N/A"}
Danceability: ${technicalData.danceability ? (technicalData.danceability * 100).toFixed(1) + "%" : "N/A"}${chordSection}
`.trim();

  return AUDIO_ANALYSIS_PROMPT.replace("{technicalData}", technicalSection);
}
