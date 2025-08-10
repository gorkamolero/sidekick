import { Mastra } from "@mastra/core";
import { ConsoleLogger } from "@mastra/core/logger";
import { registerApiRoute } from "@mastra/core/server";
import { createV4CompatibleResponse } from "@mastra/core/agent";
import * as dotenv from "dotenv";
import { agent } from "../agent";

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
          const { messages } = body;
          
          // Extract chatId from the request body (sent by useChat)
          const chatId = body.chatId || "default";

          const stream = await agent.stream(messages, {
            threadId: chatId,
            resourceId: "sidekick-chat",
          });

          // Return the v5 stream directly
          return stream.toUIMessageStreamResponse();
        },
      }),
    ],
  },
});
