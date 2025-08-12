import { Mastra } from "@mastra/core";
import { ConsoleLogger } from "@mastra/core/logger";
import { registerApiRoute } from "@mastra/core/server";
import * as dotenv from "dotenv";
import { handleChatRequest } from "../chat-handler";
import { agent } from "../agent";
import fetch from "node-fetch";

// Load environment variables
dotenv.config({ path: "../.env", debug: false });

export const mastra = new Mastra({
  agents: [agent],
  logger: new ConsoleLogger(),
  aiSdkCompat: "v5",
  server: {
    port: parseInt(process.env.SIDECAR_PORT || "3001"),
    cors: {
      origin: "*",
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization", "x-metadata"],
      credentials: false,
    },
    apiRoutes: [
      registerApiRoute("/chat", {
        method: "POST",
        handler: async (c) => {
          const body = await c.req.json();
          
          // Process each request independently without blocking
          // Use Promise.race to ensure immediate response
          const streamPromise = handleChatRequest(body);
          
          // Don't block - return stream immediately
          const stream = await streamPromise;
          
          // Return the v5 stream directly
          return stream.toUIMessageStreamResponse();
        },
      }),
      registerApiRoute("/ableton/execute", {
        method: "POST",
        handler: async (c) => {
          try {
            const body = await c.req.json();
            const { code, context } = body;
            
            if (!code) {
              return c.json({ 
                success: false, 
                error: 'No code provided' 
              }, 400);
            }
            
            console.log('🎛️ Mastra: Forwarding Ableton execution to Tauri...');
            
            // Call the Tauri backend through localhost
            // The frontend runs on a port and can access Tauri commands
            // But we need to use the Tauri HTTP API or a different approach
            
            // Since we can't directly call Tauri from here, we'll return the code
            // and let the frontend handle the execution
            return c.json({
              success: true,
              code,
              context,
              message: 'Code ready for execution. Frontend should execute via Tauri.',
              needsFrontendExecution: true
            });
          } catch (error) {
            console.error('🎛️ Mastra: Ableton execution error:', error);
            return c.json({ 
              success: false, 
              error: error.toString() 
            }, 500);
          }
        },
      }),
    ],
  },
});
