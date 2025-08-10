import { generateObject } from 'ai';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { z } from 'zod';
import type { Message } from 'ai';

export async function generateConversationTitle(messages: Message[]): Promise<string> {
  // Get the last 3 messages for context
  const recentMessages = messages.slice(-3);
  
  if (recentMessages.length === 0) {
    return 'New Conversation';
  }

  const messageContext = recentMessages
    .map(msg => {
      const textParts = msg.parts?.filter(part => part.type === 'text') || [];
      const content = textParts.map(part => part.text).join(' ');
      return `${msg.role}: ${content}`;
    })
    .join('\n');

  try {
    const { object } = await generateObject({
      model: openrouter('deepseek/deepseek-r1:free'),
      schema: z.object({
        title: z.string().max(50).describe('A concise title for the music production conversation')
      }),
      prompt: `This is a conversation in Sidekick, a music production assistant app. Generate a concise title:

${messageContext}`,
      maxTokens: 50,
      temperature: 0.3,
    });

    const title = object.title.trim();
    
    // Fallback to first user message if generation fails or is too generic
    if (!title || title.length < 3 || title.toLowerCase().includes('untitled')) {
      const firstUserMessage = messages.find(m => m.role === 'user');
      if (firstUserMessage?.parts) {
        const content = firstUserMessage.parts.filter(p => p.type === 'text').map(p => p.text).join(' ').substring(0, 50);
        return content.length > 0 ? content : 'New Conversation';
      }
      return 'New Conversation';
    }

    return title;
  } catch (error) {
    console.error('Error generating title:', error);
    
    // Fallback to first user message
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (firstUserMessage?.parts) {
      const content = firstUserMessage.parts.filter(p => p.type === 'text').map(p => p.text).join(' ').substring(0, 50);
      return content.length > 0 ? content : 'New Conversation';
    }
    
    return 'New Conversation';
  }
}