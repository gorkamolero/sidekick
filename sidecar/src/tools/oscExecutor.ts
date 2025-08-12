import { createTool } from '@mastra/core';
import { z } from 'zod';
import { Client } from 'node-osc';

/**
 * OSC Executor Tool - Executes OSC commands that the agent decides to send
 */
export const oscExecutor = createTool({
  id: 'osc-executor',
  description: `Execute OSC commands to control Ableton Live. This tool sends the actual OSC messages.`,
  
  inputSchema: z.object({
    commands: z.array(z.object({
      path: z.string().describe('OSC path like /live/song/create_audio_track'),
      args: z.array(z.union([z.string(), z.number(), z.boolean()])).optional().default([]).describe('Arguments for the command'),
    })).describe('Array of OSC commands to execute'),
    description: z.string().describe('Description of what these commands will do'),
  }),
  
  execute: async ({ context }) => {
    const { commands, description } = context;
    
    console.log('🎛️ OSC Executor: Executing commands for:', description);
    console.log('Commands to execute:', commands);
    
    const results = [];
    
    if (commands.length === 0) {
      return {
        status: 'success',
        message: 'No commands to execute',
        commands: [],
        results: [],
      };
    }
    
    try {
      const client = new Client('127.0.0.1', 11000);
      
      for (const cmd of commands) {
        console.log('🎛️ Sending OSC command:', cmd.path, cmd.args || []);
        
        try {
          // Send the OSC message
          await new Promise((resolve, reject) => {
            const args = cmd.args || [];
            client.send(cmd.path, ...args, (err) => {
              if (err) {
                console.error('OSC send error:', err);
                results.push({ 
                  command: cmd, 
                  status: 'error', 
                  error: err.message 
                });
                reject(err);
              } else {
                console.log('✅ OSC command sent successfully');
                results.push({ 
                  command: cmd, 
                  status: 'success' 
                });
                resolve(true);
              }
            });
          });
          
          // Small delay between commands
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (cmdError) {
          // Continue with next command even if one fails
          console.error('Command failed, continuing:', cmdError);
        }
      }
      
      client.close();
      console.log('🎛️ All OSC commands processed');
      
      const successCount = results.filter(r => r.status === 'success').length;
      const failCount = results.filter(r => r.status === 'error').length;
      
      return {
        status: failCount === 0 ? 'success' : 'partial',
        message: `✅ Executed ${successCount}/${commands.length} commands successfully`,
        description,
        commands,
        results,
        summary: {
          total: commands.length,
          success: successCount,
          failed: failCount,
        }
      };
    } catch (error) {
      console.error('🎛️ OSC execution error:', error);
      return {
        status: 'error',
        message: `Error executing commands: ${error}`,
        description,
        commands,
        results,
      };
    }
  },
});