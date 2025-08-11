import { agent } from './agent';

export async function handleChatRequest(body: any) {
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

  return stream;
}