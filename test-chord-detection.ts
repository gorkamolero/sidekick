import { chordDetectionService } from './src/services/chordDetection';
import * as fs from 'fs';

async function testChordDetection() {
  const audioFile = 'public/QELQQDM.mp3';
  
  console.log('🎵 Testing Chord Detection Service\n');
  console.log(`📁 Audio file: ${audioFile}\n`);
  
  try {
    // Load the audio file
    const audioBuffer = fs.readFileSync(audioFile);
    
    // Analyze the audio
    console.log('🔍 Analyzing audio...');
    const startTime = Date.now();
    
    const result = await chordDetectionService.analyzeAudioBuffer(audioBuffer.buffer);
    
    const analysisTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Analysis complete in ${analysisTime} seconds\n`);
    
    // Display results
    console.log('📊 Results:');
    console.log('===========');
    console.log(`🎼 Key: ${result.key}`);
    console.log(`🥁 Tempo: ${result.tempo} BPM`);
    console.log(`🎸 Chords detected: ${result.chords.length}`);
    
    if (result.chords.length > 0) {
      console.log('\n🎵 Chord Progression:');
      console.log('--------------------');
      
      // Show first 10 chords
      const chordsToShow = Math.min(10, result.chords.length);
      for (let i = 0; i < chordsToShow; i++) {
        const { chord, timestamp, confidence } = result.chords[i];
        const time = timestamp.toFixed(2);
        const conf = (confidence * 100).toFixed(1);
        console.log(`  [${time}s] ${chord.padEnd(8)} (${conf}% confidence)`);
      }
      
      if (result.chords.length > 10) {
        console.log(`  ... and ${result.chords.length - 10} more chords`);
      }
    }
    
    console.log('\n✨ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    chordDetectionService.dispose();
    console.log('🧹 Cleaned up resources');
  }
}

// Run the test
testChordDetection();