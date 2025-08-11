import { Mastra } from "@mastra/core";
import { ConsoleLogger } from "@mastra/core/logger";
import { registerApiRoute } from "@mastra/core/server";
import * as dotenv from "dotenv";
import { handleChatRequest } from "../chat-handler";

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
    ],
  },
});
