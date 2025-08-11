import { createTool } from '@mastra/core';
import { z } from 'zod';
import { workflowMastra } from '../workflows/audioAnalysisWorkflow';

export const analyzeAudioStreaming = createTool({
  id: 'analyze-audio',
  description: 'Analyze an audio file to extract BPM, key, instruments, style, and other musical features',
  inputSchema: z.object({
    filePath: z.string().describe('The absolute file path to the audio file to analyze'),
    fileName: z.string().optional().describe('Original filename for reference'),
  }),
  execute: async ({ context, writer }) => {
    console.log('🔍 Tool received context:', context);
    const { filePath, fileName } = context || {};
    
    if (!filePath) {
      throw new Error('No file path provided. Please provide filePath parameter.');
    }
    
    console.log('🎧 Starting audio analysis workflow:', fileName || 'Unknown');
    
    try {
      // Get the workflow from the mastra instance
      const workflow = workflowMastra.getWorkflow('audio-analysis-workflow');
      if (!workflow) {
        throw new Error('Workflow not found in Mastra instance');
      }
      
      // Create the workflow run
      console.log('Starting workflow with:', { filePath, fileName });
      const run = await workflow.createRunAsync();
      
      // Use streamVNext for real-time updates
      const stream = await run.streamVNext({
        inputData: { filePath, fileName }
      });
      
      const finalResult = null;
      
      // Process stream chunks
      for await (const chunk of stream) {
        console.log('🔄 Workflow chunk:', chunk);
        
        // Send progress updates based on chunk type
        if (chunk.type === 'step-start' && chunk.payload?.stepName) {
          const stepName = chunk.payload.stepName;
          let message = '⏳ Processing...';
          
          if (stepName === 'prepare-audio') {
            message = '📁 Loading audio file...';
          } else if (stepName === 'technical-analysis') {
            message = '🎵 Analyzing technical features (BPM, key, energy)...';
          } else if (stepName === 'upload-audio') {
            message = '📤 Uploading audio for AI analysis...';
          } else if (stepName === 'creative-analysis') {
            message = '🎨 Getting creative AI insights from Gemini...';
          } else if (stepName === 'compile-results') {
            message = '📊 Compiling final analysis...';
          }
          
          // Write progress update to stream (this goes to the agent/UI)
          try {
            await writer?.write({
              type: 'progress',
              message,
              stepName
            });
          } catch (e) {
            // If writer is locked, just log it
            console.log(message);
          }
        } else if (chunk.type === 'step-result' && chunk.payload?.result?.message) {
          // Send step completion messages
          try {
            await writer?.write({
              type: 'progress',
              message: chunk.payload.result.message,
              stepName: chunk.payload.stepName,
              status: 'complete'
            });
          } catch (e) {
            console.log(chunk.payload.result.message);
          }
        }
      }
      
      // Get the final result from the stream
      const result = stream.result;
      
      // Return the result
      writer?.write({
        type: 'analyze-audio',
        args: { fileName },
        status: 'success',
        result: result.result || result
      });
      return result.result || result;
      
    } catch (error) {
      console.error('Audio analysis workflow error:', error);
      
      const errorResult = {
        status: 'error',
        fileName,
        message: `Failed to analyze audio: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
      
      writer?.write({
        type: 'analyze-audio',
        args: { fileName },
        status: 'error',
        result: errorResult
      });
      
      return errorResult;
    }
  },
});