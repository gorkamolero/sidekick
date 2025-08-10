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
          const { messages } = await c.req.json();

          const stream = await agent.stream(messages, {
            threadId: "user-session",
            resourceId: "sidekick-chat",
          });

          // Return the v5 stream directly
          return stream.toUIMessageStreamResponse();
        },
      }),
    ],
  },
});
