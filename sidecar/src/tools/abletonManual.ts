import { createTool } from '@mastra/core';
import { z } from 'zod';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to read the local manual file
async function readManualContent(): Promise<string> {
  const manualPath = join(__dirname, '../../docs/Ableton_Live_12-en.md');
  try {
    return await fs.readFile(manualPath, 'utf-8');
  } catch (error) {
    console.error('Failed to read manual file:', error);
    throw new Error('Manual file not found. Please ensure the Ableton Live 12 manual is downloaded.');
  }
}

// Helper function to search and extract relevant content from markdown
function searchManualContent(content: string, query: string): string {
  const queryWords = query.toLowerCase().split(/\s+/);
  const lines = content.split('\n');
  const relevantSections: string[] = [];
  
  let currentSection = '';
  let sectionContent: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for section headers
    if (line.startsWith('#')) {
      // Process previous section if it had relevant content
      if (currentSection && sectionContent.length > 0) {
        const sectionText = sectionContent.join(' ');
        const lowerSectionText = sectionText.toLowerCase();
        const matchCount = queryWords.filter(word => lowerSectionText.includes(word)).length;
        
        if (matchCount > 0) {
          relevantSections.push(`## ${currentSection}\n${sectionContent.slice(0, 5).join('\n')}`);
          if (relevantSections.length >= 3) break;
        }
      }
      
      // Start new section
      currentSection = line.replace(/^#+\s*/, '');
      sectionContent = [];
    } else if (line.trim()) {
      sectionContent.push(line);
    }
  }
  
  // Process last section
  if (currentSection && sectionContent.length > 0) {
    const sectionText = sectionContent.join(' ');
    const lowerSectionText = sectionText.toLowerCase();
    const matchCount = queryWords.filter(word => lowerSectionText.includes(word)).length;
    
    if (matchCount > 0 && relevantSections.length < 3) {
      relevantSections.push(`## ${currentSection}\n${sectionContent.slice(0, 5).join('\n')}`);
    }
  }
  
  return relevantSections.length > 0
    ? relevantSections.join('\n\n---\n\n')
    : `No specific information found for "${query}" in the Ableton Live 12 manual. Try using different search terms.`;
}

const abletonManual = createTool({
  id: 'ableton-manual',
  description: 'Search and retrieve information from the Ableton Live 12 manual to answer technical questions about Ableton Live features, workflows, and functionality.',
  inputSchema: z.object({
    query: z.string().describe('The technical question or topic you want to search for in the Ableton Live manual'),
    section: z.string().optional().describe('Optional: specific manual section to search in (e.g., "instruments", "effects", "arrangement-view", "session-view", "midi", "audio", "max-for-live")'),
  }),
  execute: async ({ context }) => {
    const { query, section } = context;
    console.log('📖 ABLETON MANUAL TOOL EXECUTING!');
    console.log('Query:', query);
    console.log('Section:', section);

    try {
      console.log('🔍 Searching local Ableton Live 12 manual for:', query);
      
      // Read the local manual content
      const manualContent = await readManualContent();
      
      // Search for relevant content
      const relevantContent = searchManualContent(manualContent, query);
      
      return {
        status: 'success',
        query,
        section: section || 'all sections',
        response: relevantContent,
        source: 'Local Ableton Live 12 Manual (Markdown)',
        searchTerms: query.toLowerCase().split(/\s+/),
        note: 'Searched through the complete Ableton Live 12 manual downloaded locally.',
      };
    } catch (error) {
      console.error('Manual search error:', error);
      return {
        status: 'error',
        query,
        message: `Failed to search Ableton manual: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});

export { abletonManual };