import {
  Mastra,
  createWorkflow,
  createStep,
} from "@mastra/core";
import { z } from "zod";
import * as fs from "fs";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { buildAudioAnalysisPrompt } from "../shared/audio-analysis-prompts";
import { audioUploadService } from "../services/audioUploadService";
import { essentiaService } from "../services/essentiaService";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

// We'll create the workflow first, then add it to Mastra later

// Step 1: Prepare audio buffer
const prepareAudioStep = createStep({
  id: "prepare-audio",
  description: "Load and prepare audio buffer",
  inputSchema: z.object({
    filePath: z.string(),
    fileName: z.string().optional(),
  }),
  outputSchema: z.object({
    filePath: z.string(),
    fileName: z.string().optional(),
    message: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { filePath, fileName } = inputData;
    console.log("🎧 Preparing audio:", fileName || "Unknown");

    return {
      filePath,
      fileName,
      message: "📁 Audio file loaded successfully",
    };
  },
});

// Step 2A: Technical analysis
const technicalAnalysisStep = createStep({
  id: "technical-analysis",
  description: "Run Essentia technical analysis",
  inputSchema: z.object({
    filePath: z.string(),
    fileName: z.string().optional(),
  }),
  outputSchema: z.object({
    analysis: z.any(),
    fileName: z.string().optional(),
    message: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { filePath, fileName } = inputData;
    console.log("🎧 Running technical analysis...");

    // Read the audio buffer from file
    const audioBuffer = fs.readFileSync(filePath);

    const analysis = await essentiaService.analyzeAudio(audioBuffer);

    return {
      analysis,
      fileName,
      message: `✅ Technical Analysis Complete:
• BPM: ${analysis.bpm?.toFixed(1)}
• Key: ${analysis.key} ${analysis.scale}
• Energy: ${analysis.energy > 100000 ? "High" : analysis.energy > 50000 ? "Medium" : "Low"}
• Danceability: ${(analysis.danceability * 100)?.toFixed(0)}%`,
    };
  },
});

// Step 2B: Upload audio
const uploadAudioStep = createStep({
  id: "upload-audio",
  description: "Upload audio for AI analysis",
  inputSchema: z.object({
    filePath: z.string(),
    fileName: z.string().optional(),
  }),
  outputSchema: z.object({
    audioUrl: z.string().nullable(),
    fileName: z.string().optional(),
    message: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { filePath, fileName } = inputData;
    console.log("📤 Uploading audio...");

    if (filePath && fs.existsSync(filePath)) {
      try {
        const result = await audioUploadService.uploadTemporary(filePath, "1h");
        return {
          audioUrl: result.url,
          fileName,
          message: "✅ Audio uploaded successfully",
        };
      } catch (error) {
        console.warn("Upload failed:", error);
        return {
          audioUrl: null,
          fileName,
          message: "⚠️ Upload failed, proceeding without AI analysis",
        };
      }
    }

    return {
      audioUrl: null,
      fileName,
      message: "⚠️ No file path available for upload",
    };
  },
});

// Step 3: Creative analysis (depends on parallel results)
const creativeAnalysisStep = createStep({
  id: "creative-analysis",
  description: "Get creative AI analysis",
  inputSchema: z.object({
    "technical-analysis": z.object({
      analysis: z.any(),
      fileName: z.string().optional(),
      message: z.string(),
    }),
    "upload-audio": z.object({
      audioUrl: z.string().nullable(),
      fileName: z.string().optional(),
      message: z.string(),
    }),
  }),
  outputSchema: z.object({
    analysis: z.any(),
    creative: z.string().nullable(),
    fileName: z.string().optional(),
    message: z.string(),
  }),
  execute: async ({ inputData }) => {
    // After parallel steps, inputData contains results from both
    const technicalResult = inputData['technical-analysis'];
    const uploadResult = inputData['upload-audio'];
    const { analysis } = technicalResult;
    const { audioUrl } = uploadResult;
    const fileName = technicalResult.fileName || uploadResult.fileName;

    if (!audioUrl) {
      return {
        analysis,
        creative: null,
        fileName,
        message: "⚠️ Skipping creative analysis (no audio URL)",
      };
    }

    console.log("🎨 Getting creative analysis...");

    const technicalPrompt = buildAudioAnalysisPrompt(analysis as any);
    const messageContent = `Audio: ${audioUrl}\n\n${technicalPrompt}`;

    try {
      const result = await generateText({
        model: openrouter("google/gemini-2.5-pro"),
        messages: [
          {
            role: "user",
            content: messageContent,
          },
        ],
        temperature: 0.7,
        maxTokens: 1500,
      });

      return {
        analysis,
        creative: result.text,
        fileName,
        message: "✨ Creative analysis complete!",
      };
    } catch (error) {
      console.error("Creative analysis failed:", error);
      return {
        analysis,
        creative: null,
        fileName,
        message: "⚠️ Creative analysis failed",
      };
    }
  },
});

// Step 4: Compile final results
const compileResultsStep = createStep({
  id: "compile-results",
  description: "Compile final analysis results",
  inputSchema: z.object({
    analysis: z.any(),
    creative: z.string().nullable(),
    fileName: z.string().optional(),
  }),
  outputSchema: z.object({
    status: z.string(),
    fileName: z.string().optional(),
    technical: z.any(),
    creative: z.string().nullable(),
    message: z.string(),
    finalMessage: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { analysis, creative, fileName } = inputData;
    console.log("📊 Compiling results...");

    let message = `**Complete Analysis: ${fileName}**\n\n`;
    message += `**Technical Analysis:**\n`;
    message += `• **Tempo**: ${analysis.bpm?.toFixed(1)} BPM (${analysis.tempo})\n`;
    message += `• **Key**: ${analysis.key} ${analysis.scale}\n`;
    message += `• **Duration**: ${analysis.duration?.toFixed(1)} seconds\n`;
    message += `• **Energy**: ${analysis.energy?.toFixed(0)} (${analysis.energy > 100000 ? "High" : analysis.energy > 50000 ? "Medium" : "Low"})\n`;
    message += `• **Danceability**: ${(analysis.danceability * 100)?.toFixed(0)}%\n`;
    message += `• **Loudness**: ${analysis.loudness?.toFixed(1)} dB\n`;
    message += `• **Spectral Centroid**: ${analysis.spectralCentroid?.toFixed(0)} Hz (brightness)\n`;
    message += `• **Spectral Rolloff**: ${analysis.spectralRolloff?.toFixed(0)} Hz\n`;
    message += `• **Zero Crossing Rate**: ${(analysis.zeroCrossingRate * 1000)?.toFixed(1)} (texture)\n`;
    message += `• **Onset Rate**: ${analysis.onsetRate?.toFixed(2)} events/sec\n\n`;

    if (creative) {
      message += `**Creative Analysis:**\n${creative}`;
    } else {
      message += `*Creative analysis unavailable - using technical data only.*`;
    }

    return {
      status: "success",
      fileName,
      technical: analysis,
      creative,
      message,
      finalMessage: "🎉 Audio analysis complete!",
    };
  },
});

// Create the workflow with PARALLEL execution
export const audioAnalysisWorkflow = createWorkflow({
  id: "audio-analysis-workflow",
  description:
    "Analyzes audio files with parallel processing and streaming updates",
  inputSchema: z.object({
    filePath: z.string(),
    fileName: z.string().optional(),
  }),
  outputSchema: z.object({
    status: z.string(),
    fileName: z.string().optional(),
    technical: z.any(),
    creative: z.string().nullable(),
    message: z.string(),
    finalMessage: z.string(),
  }),
})
  .then(prepareAudioStep)
  .parallel([technicalAnalysisStep, uploadAudioStep]) // Run these TWO steps in PARALLEL
  .then(creativeAnalysisStep) // This uses results from both parallel steps
  .then(compileResultsStep)
  .commit();

// Create Mastra instance with the workflow
export const workflowMastra = new Mastra({
  workflows: { 
    "audio-analysis-workflow": audioAnalysisWorkflow 
  },
});
