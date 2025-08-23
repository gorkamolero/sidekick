const axios = require('axios');
require('dotenv').config({ path: '../.env' });

async function testSunoAPI() {
  const apiKey = process.env.SUNO_API_KEY;
  
  if (!apiKey) {
    console.error('SUNO_API_KEY not found in environment');
    return;
  }

  const axiosInstance = axios.create({
    baseURL: 'https://api.sunoapi.org',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: 30000
  });

  try {
    // Step 1: Initiate generation
    console.log('Step 1: Initiating generation...');
    const generateResponse = await axiosInstance.post('/api/v1/generate', {
      prompt: 'Test: A simple drum loop',
      model: 'V4',
      customMode: false,
      instrumental: true,
      callBackUrl: 'http://localhost:3001/api/suno/callback'
    });

    console.log('Generate Response:');
    console.log(JSON.stringify(generateResponse.data, null, 2));

    if (!generateResponse.data.data?.taskId) {
      throw new Error('No taskId received');
    }

    const taskId = generateResponse.data.data.taskId;
    console.log('\nTask ID:', taskId);

    // Step 2: Poll for completion
    console.log('\nStep 2: Polling for completion...');
    let attempts = 0;
    const maxAttempts = 60;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await axiosInstance.get(`/api/v1/generate/record-info?taskId=${taskId}`);
      
      console.log(`\nAttempt ${attempts + 1}:`);
      console.log('Full Response Structure:');
      console.log('=========================');
      console.log(JSON.stringify(statusResponse.data, null, 2));
      console.log('=========================');
      
      if (statusResponse.data.data?.status === 'SUCCESS' || statusResponse.data.data?.status === 'TEXT_SUCCESS') {
        console.log('\n✅ SUCCESS! Here is the final structure:');
        console.log(JSON.stringify(statusResponse.data, null, 2));
        
        // Try to find the audio URL in different possible locations
        console.log('\n🔍 Looking for audio URL in different paths:');
        console.log('data.audioUrl:', statusResponse.data.data?.audioUrl);
        console.log('data.audio_url:', statusResponse.data.data?.audio_url);
        console.log('data.response:', statusResponse.data.data?.response);
        
        if (statusResponse.data.data?.response) {
          console.log('data.response keys:', Object.keys(statusResponse.data.data.response));
          console.log('data.response.data:', statusResponse.data.data.response.data);
          console.log('data.response.sunoData:', statusResponse.data.data.response.sunoData);
        }
        
        break;
      }
      
      if (statusResponse.data.data?.status === 'FAILED') {
        throw new Error('Generation failed');
      }
      
      attempts++;
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testSunoAPI();