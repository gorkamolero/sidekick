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
          let { messages } = body;
          
          console.log('🔍 Request body keys:', Object.keys(body));
          console.log('🔍 Data field:', body.data);
          
          // Extract file paths from data and add to message for agent
          const lastMessage = messages[messages.length - 1];
          if (body.data?.attachments && body.data.attachments.length > 0) {
            const filePaths = body.data.attachments
              .map((att: any) => `${att.name} at ${att.url}`)
              .join(', ');
            
            // Modify the text part in the message's parts array
            messages = [...messages];
            if (lastMessage.parts && Array.isArray(lastMessage.parts)) {
              const textPart = lastMessage.parts.find((p: any) => p.type === 'text');
              if (textPart) {
                textPart.text += `\n[Attached files: ${filePaths}]`;
              }
            }
            
            console.log('📎 Added file paths to message for agent:', filePaths);
            console.log('📎 Modified message parts:', messages[messages.length - 1].parts);
          } else {
            console.log('📎 No attachments found in data');
          }
          
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
