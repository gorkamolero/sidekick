import { agent } from './agent';

export async function handleChatRequest(body: any) {
  let { messages } = body;
  
  console.log('🔍 Request body keys:', Object.keys(body));
  console.log('🔍 Data field:', body.data);
  
  // Extract file paths from data and add to message for agent
  const lastMessage = messages[messages.length - 1];
  
  // Extract selected service
  const selectedService = body.service || 'musicgen';
  console.log('🎵 Selected music service:', selectedService);
  
  // Extract generation mode
  const generationMode = body.mode || 'default';
  console.log('🎯 Generation mode:', generationMode);
  
  // Extract project info
  const projectInfo = body.projectInfo;
  console.log('🎵 Project info:', projectInfo);
  
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
  
  // Add service, mode, and project info to the message if user is asking for music generation
  if (lastMessage.parts && Array.isArray(lastMessage.parts)) {
    const textPart = lastMessage.parts.find((p: any) => p.type === 'text');
    if (textPart && textPart.text && 
        (textPart.text.toLowerCase().includes('generate') || 
         textPart.text.toLowerCase().includes('make') || 
         textPart.text.toLowerCase().includes('create') ||
         textPart.text.toLowerCase().includes('loop') ||
         textPart.text.toLowerCase().includes('beat'))) {
      
      // Add generation mode
      if (generationMode) {
        textPart.text += `\n[Generation mode: ${generationMode}]`;
        console.log('🎯 Added generation mode to message');
      }
      
      // Add service preference
      if (selectedService) {
        textPart.text += `\n[Use service: ${selectedService}]`;
        console.log('🎵 Added service preference to message');
      }
      
      // Add project context
      if (projectInfo) {
        const contextParts = [];
        if (projectInfo.bpm) contextParts.push(`BPM: ${projectInfo.bpm}`);
        if (projectInfo.key) contextParts.push(`Key: ${projectInfo.key}`);
        if (projectInfo.timeSignature) contextParts.push(`Time: ${projectInfo.timeSignature}`);
        
        if (contextParts.length > 0) {
          textPart.text += `\n[Project context: ${contextParts.join(', ')}]`;
          console.log('🎵 Added project context to message');
        }
      }
    }
  }
  
  // Extract chatId from the request body (sent by useChat)
  const chatId = body.chatId || "default";

  const stream = await agent.stream(messages, {
    threadId: chatId,
    resourceId: "sidekick-chat",
  });

  return stream;
}